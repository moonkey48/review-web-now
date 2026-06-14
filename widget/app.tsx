import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { buildAnchor, pickElement, resolveAnchor, scrollToAnchor } from "./anchor";
import { CSS_TEXT } from "./styles";
import * as store from "./store";
import { buildMarkdown } from "./markdown";
import type { Anchor, RvComment } from "./types";

export interface AppProps {
  // "위젯 숨기기" / 북마클릿 끄기 — 호스트를 완전히 제거한다.
  onHide: () => void;
}

const SITE_TITLE = document.title || location.host;

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${h}:${m}`;
}

function clampPos(x: number, y: number, w: number, h: number) {
  return {
    left: Math.min(Math.max(8, x), Math.max(8, window.innerWidth - w - 8)),
    top: Math.min(Math.max(8, y), Math.max(8, window.innerHeight - h - 8)),
  };
}

function fileStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 비보안(http) 컨텍스트 등 — 아래 폴백으로
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function App({ onHide }: AppProps) {
  const [path, setPath] = useState(location.pathname);
  const [rev, setRev] = useState(0); // 데이터 변경 버전 — 올리면 목록 재계산
  const [panelOpen, setPanelOpen] = useState(false);
  const [tab, setTab] = useState<"page" | "all">("page");
  const [mode, setMode] = useState(false);
  const [sticky, setSticky] = useState(false); // 연속 코멘트 모드 — 한 건 남겨도 계속 켜둔다
  const [draft, setDraft] = useState<{ x: number; y: number; anchor: Anchor } | null>(
    null,
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setNameState] = useState(store.getName());
  const [hideResolved, setHideResolved] = useState(false);
  const [, setTick] = useState(0); // 레이아웃 변화 시 핀 재배치용
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const pathRef = useRef(path);
  pathRef.current = path;

  const setName = useCallback((n: string) => {
    setNameState(n);
    store.setName(n);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const bumpData = useCallback(() => setRev((r) => r + 1), []);

  const comments = useMemo(() => store.list(path), [path, rev]);
  const allComments = useMemo(() => store.listAll(), [rev]);

  // SPA 내비게이션 감지 (pushState/replaceState 훅 + popstate)
  useEffect(() => {
    const onNav = () => {
      if (location.pathname !== pathRef.current) {
        setPath(location.pathname);
        setActiveId(null);
        setDraft(null);
        setMode(false);
        setSticky(false);
      }
    };
    window.addEventListener("reviewer:nav", onNav);
    window.addEventListener("popstate", onNav);
    return () => {
      window.removeEventListener("reviewer:nav", onNav);
      window.removeEventListener("popstate", onNav);
    };
  }, []);

  // 다른 탭에서의 변경을 반영 (같은 origin localStorage 공유)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "rv:comments" || e.key === null) bumpData();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [bumpData]);

  // 레이아웃 변화 → 핀 재배치 (스크롤/리사이즈는 rAF, DOM 변경은 디바운스)
  useEffect(() => {
    let raf = 0;
    const bump = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setTick((t) => t + 1));
    };
    let timer: number | undefined;
    const debounced = () => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(bump, 250);
    };
    window.addEventListener("scroll", bump, true);
    window.addEventListener("resize", bump);
    const mo = new MutationObserver(debounced);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener("scroll", bump, true);
      window.removeEventListener("resize", bump);
      mo.disconnect();
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, []);

  // ESC: 모드/작성/스레드 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMode(false);
      setSticky(false);
      setDraft(null);
      setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const startMode = () => {
    setPanelOpen(false);
    setActiveId(null);
    setDraft(null);
    setSticky(true); // 연속 모드로 시작 — 종료 전까지 계속 핀을 찍을 수 있다
    setMode(true);
  };

  // 코멘트(핀) 모드 완전 종료 — 연속 모드 플래그까지 해제한다
  const exitMode = () => {
    setMode(false);
    setSticky(false);
  };

  const onPick = (x: number, y: number) => {
    const el = pickElement(x, y);
    if (!el) return;
    const anchor: Anchor =
      el === document.body ? { type: "page" } : buildAnchor(el, x, y);
    setDraft({ x, y, anchor });
    setMode(false);
  };

  const submitDraft = (text: string, author: string) => {
    if (!draft) return;
    const an = author.trim() || "익명";
    if (an !== name) setName(an);
    store.create({
      pagePath: pathRef.current,
      pageUrl: location.href,
      body: text,
      authorName: an,
      anchor: draft.anchor,
    });
    setDraft(null);
    bumpData();
    // 연속 코멘트 모드: 한 건 남겨도 곧장 다음 위치를 찍을 수 있게 모드를 되살린다
    if (sticky) setMode(true);
  };

  // 작성 폼 취소 — 연속 모드면 오버레이로 돌아가 다시 위치를 고를 수 있게 한다
  const cancelDraft = () => {
    setDraft(null);
    if (sticky) setMode(true);
  };

  const openPageComposer = () => {
    setPanelOpen(false);
    setSticky(false); // 페이지 코멘트는 연속 핀 모드와 무관 — 끄고 시작
    setDraft({
      x: window.innerWidth - 320,
      y: window.innerHeight - 330,
      anchor: { type: "page" },
    });
  };

  const goTo = (c: RvComment) => {
    if (c.pagePath === pathRef.current) {
      setPanelOpen(false);
      setActiveId(c.id);
      scrollToAnchor(c.anchor);
    } else {
      // 다른 경로의 코멘트 — 전체 로드로 이동(북마클릿은 거기서 다시 켠다)
      location.assign(c.pageUrl);
    }
  };

  const exportStatus: "all" | "open" = hideResolved ? "open" : "all";

  const copyMd = async () => {
    const md = buildMarkdown(SITE_TITLE, store.listAll(), { status: exportStatus });
    const ok = await copyText(md);
    showToast(ok ? "MD를 클립보드에 복사했어요" : "복사 실패 — 다운로드를 사용하세요");
  };

  const downloadMd = () => {
    const md = buildMarkdown(SITE_TITLE, store.listAll(), { status: exportStatus });
    downloadText(`review-${fileStamp()}.md`, md);
    showToast("review-*.md 다운로드를 시작했어요");
  };

  const clearAll = () => {
    if (!window.confirm("이 사이트의 모든 코멘트를 삭제할까요? 되돌릴 수 없습니다.")) {
      return;
    }
    store.clear();
    setActiveId(null);
    bumpData();
    showToast("모든 코멘트를 삭제했어요");
  };

  const unresolved = comments.filter((c) => !c.resolved).length;
  const pins = comments
    .map((c, i) => ({ c, n: i + 1 }))
    .filter(({ c }) => c.anchor?.type === "pin" && (!hideResolved || !c.resolved))
    .map((item) => ({ ...item, pos: resolveAnchor(item.c.anchor as Anchor) }))
    .filter(
      (item): item is { c: RvComment; n: number; pos: { x: number; y: number } } =>
        item.pos !== null,
    );

  const active = activeId ? (comments.find((c) => c.id === activeId) ?? null) : null;
  const activeNumber = active ? comments.indexOf(active) + 1 : 0;
  const activePos =
    active && active.anchor?.type === "pin" ? resolveAnchor(active.anchor) : null;

  return (
    <div className="rv-root">
      <style>{CSS_TEXT}</style>

      {mode ? <Overlay onPick={onPick} onCancel={exitMode} /> : null}

      {pins.map(({ c, n, pos }) => (
        <button
          key={c.id}
          className={`rv-pin${c.resolved ? " rv-pin-resolved" : ""}${
            c.id === activeId ? " rv-pin-active" : ""
          }`}
          // 코멘트 모드 중에는 핀이 클릭을 가로채지 않게 투과시킨다
          style={{
            left: pos.x + "px",
            top: pos.y + "px",
            pointerEvents: mode ? "none" : "auto",
          }}
          onClick={() => setActiveId(c.id === activeId ? null : c.id)}
        >
          {n}
        </button>
      ))}

      {draft ? (
        <Composer
          x={draft.x}
          y={draft.y}
          isPage={draft.anchor.type === "page"}
          name={name}
          onSubmit={submitDraft}
          onCancel={cancelDraft}
        />
      ) : null}

      {active ? (
        <Detail
          comment={active}
          number={activeNumber}
          pos={activePos}
          onClose={() => setActiveId(null)}
          onChanged={bumpData}
        />
      ) : null}

      {toast ? <div className="rv-toast">{toast}</div> : null}

      <button
        className="rv-fab"
        title={`${location.host} 리뷰`}
        onClick={() => {
          setPanelOpen((o) => !o);
          setMode(false);
          setSticky(false);
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        {unresolved > 0 ? <span className="rv-fab-badge">{unresolved}</span> : null}
      </button>

      {panelOpen ? (
        <Panel
          tab={tab}
          setTab={setTab}
          comments={comments}
          allComments={allComments}
          hideResolved={hideResolved}
          setHideResolved={setHideResolved}
          currentPath={path}
          name={name}
          setName={setName}
          onStart={startMode}
          onPageComment={openPageComposer}
          onGoTo={goTo}
          onCopyMd={copyMd}
          onDownloadMd={downloadMd}
          onClearAll={clearAll}
          onClose={() => setPanelOpen(false)}
          onHide={() => {
            if (
              window.confirm(
                "위젯을 닫습니다. 코멘트는 그대로 저장돼 있어요. 다시 보려면 초대 링크(?review=1)로 들어오거나 북마클릿을 클릭하세요. 계속할까요?",
              )
            ) {
              onHide();
            }
          }}
        />
      ) : null}
    </div>
  );
}

/* ── 코멘트 모드 오버레이 ─────────────────────── */
function Overlay({
  onPick,
  onCancel,
}: {
  onPick: (x: number, y: number) => void;
  onCancel: () => void;
}) {
  const [box, setBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  return (
    <>
      <div
        className="rv-overlay"
        onMouseMove={(e: MouseEvent) => {
          const el = pickElement(e.clientX, e.clientY);
          if (!el || el === document.body) {
            setBox(null);
            return;
          }
          const r = el.getBoundingClientRect();
          setBox({ left: r.left, top: r.top, width: r.width, height: r.height });
        }}
        onClick={(e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          onPick(e.clientX, e.clientY);
        }}
        onContextMenu={(e: MouseEvent) => {
          e.preventDefault();
          onCancel();
        }}
      />
      {box ? (
        <div
          className="rv-highlight"
          style={{
            left: box.left + "px",
            top: box.top + "px",
            width: box.width + "px",
            height: box.height + "px",
          }}
        />
      ) : null}
      <div className="rv-mode-hint">
        코멘트할 위치를 클릭하세요 · 계속 추가됩니다 · ESC로 종료
      </div>
    </>
  );
}

/* ── 작성 폼 ──────────────────────────────────── */
function Composer({
  x,
  y,
  isPage,
  name,
  onSubmit,
  onCancel,
}: {
  x: number;
  y: number;
  isPage: boolean;
  name: string;
  onSubmit: (text: string, author: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState(name);
  const place = clampPos(x + 10, y + 10, 290, 230);

  const submit = () => {
    const t = text.trim();
    const a = author.trim();
    if (!t || !a) return;
    onSubmit(t, a);
  };

  return (
    <div
      className="rv-card rv-composer"
      style={{ left: place.left + "px", top: place.top + "px" }}
    >
      <div className="rv-card-title">
        {isPage ? "이 페이지에 코멘트" : "이 위치에 코멘트"}
      </div>
      {!name ? (
        <input
          className="rv-input"
          style={{ marginTop: "8px" }}
          placeholder="이름"
          value={author}
          onInput={(e: Event) =>
            setAuthor((e.currentTarget as HTMLInputElement).value)
          }
        />
      ) : null}
      <textarea
        className="rv-textarea"
        placeholder="코멘트를 입력하세요… (⌘/Ctrl+Enter 등록)"
        value={text}
        autoFocus
        onInput={(e: Event) =>
          setText((e.currentTarget as HTMLTextAreaElement).value)
        }
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="rv-row-end">
        <button className="rv-btn rv-btn-ghost" onClick={onCancel}>
          취소
        </button>
        <button
          className="rv-btn rv-btn-primary"
          disabled={!text.trim() || !author.trim()}
          onClick={submit}
        >
          등록
        </button>
      </div>
    </div>
  );
}

/* ── 코멘트 상세 팝업 (수정·삭제·해결) ─────────── */
function Detail({
  comment,
  number,
  pos,
  onClose,
  onChanged,
}: {
  comment: RvComment;
  number: number;
  pos: { x: number; y: number } | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.body);

  const place = pos
    ? clampPos(pos.x + 16, pos.y - 12, 320, 300)
    : {
        left: Math.max(8, window.innerWidth - 348),
        top: Math.max(8, window.innerHeight - 360),
      };

  const toggleResolve = () => {
    store.update(comment.id, { resolved: !comment.resolved });
    onChanged();
  };

  const saveEdit = () => {
    const t = text.trim();
    if (!t) return;
    store.update(comment.id, { body: t });
    setEditing(false);
    onChanged();
  };

  const del = () => {
    if (window.confirm("이 코멘트를 삭제할까요?")) {
      store.remove(comment.id);
      onClose();
      onChanged();
    }
  };

  return (
    <div
      className="rv-card rv-thread"
      style={{ left: place.left + "px", top: place.top + "px" }}
    >
      <div className="rv-card-head">
        <span className="rv-card-title">
          #{number} {comment.anchor?.type === "pin" ? "핀 코멘트" : "페이지 코멘트"}
        </span>
        <div className="rv-row">
          <button
            className={`rv-resolve-btn${comment.resolved ? " rv-on" : ""}`}
            onClick={toggleResolve}
          >
            ✓ {comment.resolved ? "해결됨" : "해결"}
          </button>
          <button className="rv-icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
      <div className="rv-thread-body">
        <div className="rv-msg">
          <div className="rv-msg-meta">
            <span className="rv-msg-author">{comment.authorName}</span>
            <span>{timeLabel(comment.createdAt)}</span>
            {!editing ? (
              <span className="rv-msg-actions">
                <button
                  onClick={() => {
                    setText(comment.body);
                    setEditing(true);
                  }}
                >
                  수정
                </button>
                <button onClick={del}>삭제</button>
              </span>
            ) : null}
          </div>
          {editing ? (
            <div>
              <textarea
                className="rv-textarea"
                value={text}
                autoFocus
                onInput={(e: Event) =>
                  setText((e.currentTarget as HTMLTextAreaElement).value)
                }
              />
              <div className="rv-row-end" style={{ marginTop: "6px" }}>
                <button
                  className="rv-btn rv-btn-ghost"
                  onClick={() => setEditing(false)}
                >
                  취소
                </button>
                <button
                  className="rv-btn rv-btn-primary"
                  disabled={!text.trim()}
                  onClick={saveEdit}
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <div className="rv-msg-text">{comment.body}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 패널 ─────────────────────────────────────── */
function Panel({
  tab,
  setTab,
  comments,
  allComments,
  hideResolved,
  setHideResolved,
  currentPath,
  name,
  setName,
  onStart,
  onPageComment,
  onGoTo,
  onCopyMd,
  onDownloadMd,
  onClearAll,
  onClose,
  onHide,
}: {
  tab: "page" | "all";
  setTab: (t: "page" | "all") => void;
  comments: RvComment[];
  allComments: RvComment[];
  hideResolved: boolean;
  setHideResolved: (v: boolean) => void;
  currentPath: string;
  name: string;
  setName: (n: string) => void;
  onStart: () => void;
  onPageComment: () => void;
  onGoTo: (c: RvComment) => void;
  onCopyMd: () => void;
  onDownloadMd: () => void;
  onClearAll: () => void;
  onClose: () => void;
  onHide: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);

  const items = tab === "page" ? comments : allComments;
  const filtered = hideResolved ? items.filter((c) => !c.resolved) : items;
  const totalForExport = hideResolved
    ? allComments.filter((c) => !c.resolved).length
    : allComments.length;

  return (
    <div className="rv-card rv-panel">
      <div className="rv-card-head">
        <span className="rv-card-title">{location.host} 리뷰</span>
        <button className="rv-icon-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <button className="rv-mode-btn" onClick={onStart}>
        📍 코멘트 모드 시작
      </button>

      <div className="rv-tabs">
        <button
          className={`rv-tab${tab === "page" ? " rv-active" : ""}`}
          onClick={() => setTab("page")}
        >
          이 페이지 ({comments.length})
        </button>
        <button
          className={`rv-tab${tab === "all" ? " rv-active" : ""}`}
          onClick={() => setTab("all")}
        >
          전체 ({allComments.length})
        </button>
      </div>

      <div className="rv-panel-toolbar">
        <label className="rv-check">
          <input
            type="checkbox"
            checked={hideResolved}
            onChange={(e: Event) =>
              setHideResolved((e.currentTarget as HTMLInputElement).checked)
            }
          />
          해결됨 숨기기
        </label>
        <button className="rv-foot-link" onClick={onPageComment}>
          + 페이지 코멘트
        </button>
      </div>

      <div className="rv-list">
        {filtered.length === 0 ? (
          <div className="rv-empty">코멘트가 없습니다</div>
        ) : (
          filtered.map((c) => {
            const lost =
              tab === "page" &&
              c.anchor?.type === "pin" &&
              c.pagePath === currentPath &&
              resolveAnchor(c.anchor) === null;
            return (
              <button
                key={c.id}
                className={`rv-item${c.resolved ? " rv-resolved" : ""}`}
                onClick={() => onGoTo(c)}
              >
                <span className="rv-item-num">
                  {tab === "page" ? comments.indexOf(c) + 1 : "•"}
                </span>
                <span style={{ minWidth: "0", flex: "1", display: "block" }}>
                  <span className="rv-item-text">{c.body}</span>
                  <span className="rv-item-meta" style={{ display: "block" }}>
                    {c.authorName} · {timeLabel(c.createdAt)}
                    {tab === "all" ? ` · ${c.pagePath}` : ""}
                    {c.anchor?.type !== "pin" ? (
                      <span className="rv-badge rv-badge-page">페이지</span>
                    ) : null}
                    {lost ? (
                      <span className="rv-badge rv-badge-lost">위치 유실</span>
                    ) : null}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="rv-export">
        <div className="rv-export-row">
          <button className="rv-btn rv-btn-primary" onClick={onCopyMd}>
            📋 MD 복사
          </button>
          <button className="rv-btn rv-btn-ghost" onClick={onDownloadMd}>
            ⬇ 다운로드
          </button>
          <span className="rv-export-hint">
            {totalForExport}개{hideResolved ? " · 미해결만" : ""}
          </span>
        </div>
      </div>

      {editingName ? (
        <div className="rv-name-form">
          <input
            className="rv-input"
            placeholder="이름"
            value={nameInput}
            onInput={(e: Event) =>
              setNameInput((e.currentTarget as HTMLInputElement).value)
            }
          />
          <button
            className="rv-btn rv-btn-primary"
            onClick={() => {
              const n = nameInput.trim();
              if (n) {
                setName(n);
                setEditingName(false);
              }
            }}
          >
            저장
          </button>
        </div>
      ) : (
        <div className="rv-panel-foot">
          <button
            className="rv-foot-link"
            onClick={() => {
              setNameInput(name);
              setEditingName(true);
            }}
          >
            {name ? `이름: ${name} (변경)` : "이름 설정"}
          </button>
          <div className="rv-row">
            <button className="rv-foot-link rv-danger" onClick={onClearAll}>
              전체 삭제
            </button>
            <button className="rv-foot-link" onClick={onHide}>
              위젯 닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

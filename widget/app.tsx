import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { buildAnchor, pickElement, resolveAnchor, scrollToAnchor } from "./anchor";
import { CSS_TEXT } from "./styles";
import * as store from "./store";
import { buildMarkdown } from "./markdown";
import { captureElement } from "./capture";
import { clearShots, deleteShot, getShot, getShots, putShot } from "./shots";
import { downloadZip, fsSupported, saveToFolder } from "./exportFiles";
import { currentPageKey, legacyPathFromKey, pageUrlFromHref, samePageKey } from "./routeKey";
import type { Anchor, RvComment } from "./types";

export interface AppProps {
  // "위젯 숨기기" / 북마클릿 끄기 — 호스트를 완전히 제거한다.
  onHide: () => void;
  // ?review=<이름>에서 읽은 이름. 있으면 작성자 이름으로 우선 사용한다.
  initialName: string;
}

const SITE_TITLE = document.title || location.host;
type ExportMethod = "copy" | "zip" | "folder" | "json";

interface ExportRunOptions {
  includeResolved: boolean;
  allowMarkdown: boolean;
}

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

// 단축키 가드 — 입력 요소에 포커스가 있으면 단축키를 발동하지 않는다(Shadow DOM 관통).
function isEditableFocused(): boolean {
  let el: Element | null = document.activeElement;
  while (el && (el as any).shadowRoot && (el as any).shadowRoot.activeElement) {
    el = (el as any).shadowRoot.activeElement;
  }
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (el as HTMLElement).isContentEditable === true
  );
}

function downloadFile(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadText(filename: string, text: string) {
  downloadFile(filename, text, "text/markdown;charset=utf-8");
}

function downloadJson(filename: string, value: unknown) {
  downloadFile(
    filename,
    JSON.stringify(value, null, 2),
    "application/json;charset=utf-8",
  );
}

function jsonPayload(comments: RvComment[], includeResolved: boolean) {
  return {
    schema: 1,
    exportedAt: new Date().toISOString(),
    source: "reviewer",
    includeResolved,
    note: "Screenshot image blobs are not included in JSON exports.",
    comments: comments.map((c) => ({ ...c, shot: null })),
  };
}

function commentsFromJsonPayload(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) return payload;
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { comments?: unknown }).comments)
  ) {
    return (payload as { comments: unknown[] }).comments;
  }
  return null;
}

export function App({ onHide, initialName }: AppProps) {
  const [path, setPath] = useState(currentPageKey());
  const [rev, setRev] = useState(0); // 데이터 변경 버전 — 올리면 목록 재계산
  const [panelOpen, setPanelOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false); // 내보내기 모달
  const [mode, setMode] = useState(false);
  const [sticky, setSticky] = useState(false); // 연속 코멘트 모드 — 한 건 남겨도 계속 켜둔다
  const [draft, setDraft] = useState<{ x: number; y: number; anchor: Anchor } | null>(
    null,
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setNameState] = useState(
    () => initialName.trim() || store.getName(),
  );
  const [hideResolved, setHideResolved] = useState(false);
  const [, setTick] = useState(0); // 레이아웃 변화 시 핀 재배치용
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const captureJobs = useRef<Promise<void>[]>([]);
  const [pendingShots, setPendingShots] = useState(0);
  const [curVer, setCurVerState] = useState(() => store.getVersion()); // 현재(스탬프) 버전
  const [visRaw, setVisRaw] = useState<string[] | null>(() => store.readVisibleRaw()); // null=전체 센티넬, []=모두 끔
  const [storeBroken, setStoreBroken] = useState(() => !store.commentsReadable());

  const pathRef = useRef(path);
  pathRef.current = path;
  const legacyPath = useMemo(() => legacyPathFromKey(path), [path]);

  const setName = useCallback((n: string) => {
    setNameState(n);
    store.setName(n);
  }, []);

  useEffect(() => {
    const n = initialName.trim();
    if (n) store.setName(n);
  }, [initialName]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const bumpData = useCallback(() => setRev((r) => r + 1), []);

  const refreshStoreHealth = useCallback(() => {
    setStoreBroken(!store.commentsReadable());
    bumpData();
  }, [bumpData]);

  const downloadCorruptComments = useCallback(() => {
    const raw = store.rawComments() ?? "";
    downloadText(`reviewer-comments-backup-${fileStamp()}.json`, raw);
  }, []);

  const resetCorruptComments = useCallback(() => {
    if (
      !window.confirm(
        "손상된 로컬 리뷰 데이터를 백업 파일로 받은 뒤 이 브라우저의 리뷰 데이터를 초기화할까요?",
      )
    ) {
      return;
    }
    downloadCorruptComments();
    store.clear();
    void clearShots();
    setActiveId(null);
    setDraft(null);
    setCurVerState(store.getVersion());
    setVisRaw(store.readVisibleRaw());
    setStoreBroken(!store.commentsReadable());
    bumpData();
    showToast("로컬 리뷰 데이터를 초기화했어요");
  }, [bumpData, downloadCorruptComments, showToast]);

  const trackCapture = useCallback((job: Promise<void>) => {
    captureJobs.current = [...captureJobs.current, job];
    setPendingShots(captureJobs.current.length);
    void job.finally(() => {
      captureJobs.current = captureJobs.current.filter((j) => j !== job);
      setPendingShots(captureJobs.current.length);
    });
  }, []);

  const waitForCaptures = useCallback(async () => {
    while (captureJobs.current.length) {
      const jobs = [...captureJobs.current];
      showToast(`스크린샷 ${jobs.length}장 처리 중…`);
      await Promise.allSettled(jobs);
    }
  }, [showToast]);

  const comments = useMemo(() => store.list(path, legacyPath), [path, legacyPath, rev]);
  const allComments = useMemo(() => store.listAll(), [rev]);

  // 버전별 코멘트 수(전체 서비스 기준).
  const verCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of allComments) {
      const v = store.verOf(c);
      m.set(v, (m.get(v) ?? 0) + 1);
    }
    return m;
  }, [allComments]);
  // 표시 후보 버전 목록 = 레지스트리(고정 색·순서) ∪ 현재 ∪ 코멘트 실재.
  const allVersions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    const push = (v: string) => {
      if (v && !seen.has(v)) {
        seen.add(v);
        out.push(v);
      }
    };
    for (const v of store.getKnownVersions()) push(v);
    push(curVer);
    for (const v of verCounts.keys()) push(v);
    return out;
  }, [curVer, verCounts, rev]);
  // 가시 집합 1회 계산(핀마다 localStorage 읽지 않음). null 센티넬=전체.
  const visibleSet = useMemo(
    () => (visRaw === null ? new Set(allVersions) : new Set(visRaw)),
    [visRaw, allVersions],
  );

  // 현재 버전 선택/생성 — 그 버전만 보이게(포커스). 여러 버전 동시 보기는 아래 멀티선택으로.
  const setCurVer = useCallback(
    (v: string) => {
      const t = v.trim();
      if (!t) return;
      if (!store.setVersion(t)) {
        showToast("버전 저장 실패 — 저장 공간/프라이빗 모드를 확인하세요");
        return;
      }
      setCurVerState(t);
      if (!store.setVisibleVersions([t])) {
        showToast("표시 버전 저장 실패");
      }
      setVisRaw([t]);
      bumpData();
    },
    [bumpData, showToast],
  );
  // 버전 표시 토글 — 첫 토글 시 전체 센티넬을 구체 집합으로 구체화.
  const toggleVisible = useCallback(
    (v: string) => {
      setVisRaw((prev) => {
        const base = prev === null ? allVersions : prev;
        const n = base.includes(v) ? base.filter((x) => x !== v) : [...base, v];
        if (!store.setVisibleVersions(n)) {
          showToast("표시 버전 저장 실패");
          return prev;
        }
        return n;
      });
    },
    [allVersions, showToast],
  );
  const showAllVersions = useCallback(() => {
    if (!store.clearVisible()) {
      showToast("표시 설정 저장 실패");
      return;
    }
    setVisRaw(null);
  }, [showToast]);
  const showOnlyCurrent = useCallback(() => {
    if (!store.setVisibleVersions([curVer])) {
      showToast("표시 버전 저장 실패");
      return;
    }
    setVisRaw([curVer]);
  }, [curVer, showToast]);

  // SPA 내비게이션 감지 (pushState/replaceState 훅 + popstate)
  useEffect(() => {
    const onNav = () => {
      const nextPath = currentPageKey();
      if (nextPath !== pathRef.current) {
        setPath(nextPath);
        setActiveId(null);
        setDraft(null);
        setMode(false);
        setSticky(false);
      }
    };
    window.addEventListener("reviewer:nav", onNav);
    window.addEventListener("popstate", onNav);
    window.addEventListener("hashchange", onNav);
    return () => {
      window.removeEventListener("reviewer:nav", onNav);
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("hashchange", onNav);
    };
  }, []);

  // 다른 탭에서의 변경을 반영 (같은 origin localStorage 공유)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "rv:comments" || e.key === null) refreshStoreHealth();
      if (
        e.key === "rv:version" ||
        e.key === "rv:visibleVersions" ||
        e.key === "rv:versions" ||
        e.key === null
      ) {
        setCurVerState(store.getVersion());
        setVisRaw(store.readVisibleRaw());
        bumpData();
      }
      if (e.key === "rv:name" || e.key === null) {
        setNameState(store.getName());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [bumpData, refreshStoreHealth]);

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

  // Alt+C: 코멘트 모드 토글 (안 쓰는 단축키). 입력 중·작성·내보내기·패널 열림 시엔 무시.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (e.code !== "KeyC" && e.key.toLowerCase() !== "c") return;
      if (draft || exportOpen || panelOpen || isEditableFocused()) return;
      e.preventDefault();
      if (sticky) {
        setMode(false);
        setSticky(false);
      } else {
        setActiveId(null);
        setDraft(null);
        setSticky(true);
        setMode(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft, exportOpen, panelOpen, sticky]);

  // 활성 코멘트의 버전을 숨기면(또는 해결됨 필터로 빠지면) 상세 팝업도 함께 닫는다.
  useEffect(() => {
    if (!activeId) return;
    const c = comments.find((x) => x.id === activeId);
    if (!c) return;
    if (!visibleSet.has(store.verOf(c)) || (hideResolved && c.resolved)) {
      setActiveId(null);
    }
  }, [activeId, comments, visibleSet, hideResolved]);

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

  const submitDraft = async (text: string, author: string, shoot: boolean) => {
    if (!draft) return;
    const an = author.trim() || "익명";
    if (an !== name) setName(an);
    const anchor = draft.anchor;
    // 캡처 대상 요소는 draft를 비우기 전에 미리 잡아둔다(핀 모드일 때만).
    let target: Element | null = null;
    if (shoot && anchor.type === "pin") {
      try {
        target = document.querySelector(anchor.selector);
      } catch {
        target = null;
      }
    }
    const c = store.create({
      pagePath: pathRef.current,
      pageUrl: pageUrlFromHref(location.href),
      body: text,
      authorName: an,
      anchor,
    });
    if (!c) {
      setStoreBroken(!store.commentsReadable());
      showToast("저장 실패 — 저장 공간/프라이빗 모드 또는 손상된 데이터를 확인하세요");
      return;
    }
    setDraft(null);
    bumpData();
    // 연속 코멘트 모드: 한 건 남겨도 곧장 다음 위치를 찍을 수 있게 모드를 되살린다
    if (sticky) setMode(true);
    // 스크린샷은 등록 후 비동기로 첨부(html2canvas 지연 로드 → IndexedDB)
    const captureTarget = target;
    if (captureTarget) {
      // 캡처 시작 시점의 경로·배지 번호를 고정(await 중 SPA 이동 대비)
      const capturePath = pathRef.current;
      const badge = store.list(capturePath).length; // 작성 순번 — 스크린샷 배지
      const captureJob = (async () => {
        showToast("스크린샷 캡처 중…");
        try {
          const cap = await captureElement(captureTarget, { badge });
          if (pathRef.current !== capturePath || !captureTarget.isConnected) {
            // 캡처 도중 SPA 이동/요소 분리 — 엉뚱한 페이지에 첨부하지 않고 조용히 스킵
          } else if (!cap) {
            showToast("스크린샷 캡처 실패");
          } else if (await putShot(c.id, cap.blob)) {
            if (!store.setShot(c.id, { id: c.id, w: cap.w, h: cap.h })) {
              showToast("스크린샷 메타 저장 실패 — 저장 공간/데이터 상태를 확인하세요");
              return;
            }
            bumpData();
            showToast("스크린샷을 첨부했어요");
          } else {
            showToast("스크린샷 저장 실패 — 저장 공간/프라이빗 모드를 확인하세요");
          }
        } catch {
          showToast("스크린샷 캡처 실패 — 네트워크/CSP를 확인하세요");
        }
      })();
      trackCapture(captureJob);
    }
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
    if (samePageKey(c.pagePath, pathRef.current)) {
      setPanelOpen(false);
      setActiveId(c.id);
      scrollToAnchor(c.anchor);
    } else {
      // 다른 경로의 코멘트 — 전체 로드로 이동(북마클릿은 거기서 다시 켠다)
      location.assign(c.pageUrl);
    }
  };

  // 통합 내보내기 — 모달이 고른 리뷰 부분집합을 method별로 내보낸다.
  const runExport = useCallback(
    async (
      method: ExportMethod,
      selected: RvComment[],
      options: ExportRunOptions,
    ): Promise<"ok" | "cancel" | "fail"> => {
      const { includeResolved, allowMarkdown } = options;
      if (method === "json") {
        try {
          downloadJson(
            `review-data-${fileStamp()}.json`,
            jsonPayload(selected, includeResolved),
          );
          showToast(`JSON 다운로드를 시작했어요 · ${selected.length}개`);
          return "ok";
        } catch {
          showToast("JSON 내보내기 실패");
          return "fail";
        }
      }
      await waitForCaptures();
      const status: "all" | "open" = includeResolved ? "all" : "open";
      const shots = await getShots(
        selected.filter((c) => c.shot).map((c) => c.shot!.id),
      );
      // IndexedDB blob이 사라진 깨진 메타는 MD에서 이미지 참조를 만들지 않는다.
      const commentsForMd = selected.map((c) =>
        c.shot && !shots.has(c.shot.id) ? { ...c, shot: null } : c,
      );
      const md = buildMarkdown(SITE_TITLE, commentsForMd, {
        status,
        escapeUserText: !allowMarkdown,
      });
      try {
        if (method === "copy") {
          const ok = await copyText(md);
          showToast(ok ? "MD를 클립보드에 복사했어요" : "복사 실패 — 다운로드를 사용하세요");
          return ok ? "ok" : "fail";
        }
        if (method === "zip") {
          if (shots.size) {
            await downloadZip(`review-${fileStamp()}.zip`, "review.md", md, shots);
            showToast(`ZIP 다운로드를 시작했어요 · 이미지 ${shots.size}장`);
          } else {
            downloadText(`review-${fileStamp()}.md`, md);
            showToast("MD 다운로드를 시작했어요");
          }
          return "ok";
        }
        // folder — FS Access 폴더 저장(미지원/실패 시 zip 폴백)
        if (fsSupported()) {
          showToast("저장할 폴더를 선택하세요…");
          const r = await saveToFolder("review.md", md, shots);
          if (r === "ok") {
            showToast(shots.size ? `폴더에 저장했어요 · 이미지 ${shots.size}장` : "폴더에 review.md를 저장했어요");
            return "ok";
          }
          if (r === "cancel") return "cancel";
        }
        await downloadZip(`review-${fileStamp()}.zip`, "review.md", md, shots);
        showToast(`zip으로 내보냈어요 · 이미지 ${shots.size}장`);
        return "ok";
      } catch {
        showToast("내보내기 실패");
        return "fail";
      }
    },
    [waitForCaptures, showToast],
  );

  const importJson = useCallback(
    async (file: File) => {
      try {
        const payload = JSON.parse(await file.text()) as unknown;
        const incoming = commentsFromJsonPayload(payload);
        if (!incoming) {
          showToast("JSON 형식이 맞지 않습니다");
          return;
        }
        const result = store.importMany(incoming);
        if (!result) {
          setStoreBroken(!store.commentsReadable());
          showToast("JSON 가져오기 실패 — 저장 공간/데이터 상태를 확인하세요");
          return;
        }
        setCurVerState(store.getVersion());
        setVisRaw(store.readVisibleRaw());
        bumpData();
        showToast(`JSON 가져오기 완료 · 추가 ${result.added}개 · 건너뜀 ${result.skipped}개`);
      } catch {
        showToast("JSON 파일을 읽지 못했습니다");
      }
    },
    [bumpData, showToast],
  );

  const clearAll = () => {
    if (!window.confirm("이 사이트의 모든 코멘트를 삭제할까요? 되돌릴 수 없습니다.")) {
      return;
    }
    store.clear();
    void clearShots(); // IndexedDB 스크린샷도 함께 정리
    setActiveId(null);
    setCurVerState(store.getVersion());
    setVisRaw(store.readVisibleRaw());
    setStoreBroken(!store.commentsReadable());
    bumpData();
    showToast("모든 코멘트를 삭제했어요");
  };

  // 전체 서비스 기준 미해결 카운트
  const unresolved = allComments.filter((c) => !c.resolved).length;
  const pins = comments
    // 번호는 버전 필터 전에 per-page 인덱스로 매긴다 — 버전을 토글해도 번호가 흔들리지 않고 MD/스레드와 일치.
    .map((c, i) => ({ c, n: i + 1 }))
    .filter(
      ({ c }) =>
        c.anchor?.type === "pin" &&
        (!hideResolved || !c.resolved) &&
        visibleSet.has(store.verOf(c)),
    )
    .map((item) => ({
      ...item,
      pos: resolveAnchor(item.c.anchor as Anchor),
      color: store.colorFor(store.verOf(item.c), curVer),
    }))
    .filter(
      (
        item,
      ): item is {
        c: RvComment;
        n: number;
        pos: { x: number; y: number };
        color: string;
      } => item.pos !== null,
    );

  const active = activeId ? (comments.find((c) => c.id === activeId) ?? null) : null;
  const activeNumber = active ? comments.indexOf(active) + 1 : 0;
  const activePos =
    active && active.anchor?.type === "pin" ? resolveAnchor(active.anchor) : null;

  return (
    <div className="rv-root">
      <style>{CSS_TEXT}</style>

      {storeBroken ? (
        <StorageRecovery
          onBackup={() => {
            downloadCorruptComments();
            showToast("손상 데이터 백업 파일을 내려받았어요");
          }}
          onReset={resetCorruptComments}
          onHide={onHide}
        />
      ) : null}

      {mode ? <Overlay onPick={onPick} onCancel={exitMode} /> : null}

      {/* 중앙 하단 컨트롤: 평소엔 "시작", 코멘트 모드 중엔 상태바+종료 */}
      {sticky ? (
        <ModeBar picking={mode} onExit={exitMode} />
      ) : (
        <StartBar onStart={startMode} />
      )}

      {/* 작성 중인 핀 대상 요소를 테두리로 강조 */}
      {draft && draft.anchor.type === "pin" ? (
        <DraftHighlight anchor={draft.anchor} />
      ) : null}

      {pins.map(({ c, n, pos, color }) => (
        <button
          key={c.id}
          className={`rv-pin${c.resolved ? " rv-pin-resolved" : ""}${
            c.id === activeId ? " rv-pin-active" : ""
          }`}
          // 코멘트 모드 중에는 핀이 클릭을 가로채지 않게 투과시킨다
          style={{
            ["--rv-c" as any]: color, // 버전별 색(해결됨 회색·활성 outline은 CSS 후순위 규칙으로 유지)
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
          needsShot={draft.anchor.type === "pin" && !!draft.anchor.needsShot}
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
          onError={showToast}
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
          comments={comments}
          allComments={allComments}
          hideResolved={hideResolved}
          setHideResolved={setHideResolved}
          currentPath={path}
          name={name}
          setName={setName}
          onPageComment={openPageComposer}
          onGoTo={goTo}
          onOpenExport={() => {
            setPanelOpen(false);
            setExportOpen(true);
          }}
          onImportJson={importJson}
          onClearAll={clearAll}
          pendingShots={pendingShots}
          ver={{
            current: curVer,
            setCurrent: setCurVer,
            all: allVersions,
            counts: verCounts,
            visible: visibleSet,
            toggle: toggleVisible,
            showAll: showAllVersions,
            showOnlyCurrent,
            colorFor: (v: string) => store.colorFor(v, curVer),
            known: store.getKnownVersions(),
          }}
          onClose={() => setPanelOpen(false)}
          onHide={() => {
            if (
              window.confirm(
                "위젯을 닫습니다. 코멘트는 그대로 저장돼 있어요. 다시 보려면 초대 링크(?review=이름)로 들어오거나 북마클릿을 클릭하세요. 계속할까요?",
              )
            ) {
              onHide();
            }
          }}
        />
      ) : null}

      {exportOpen ? (
        <ExportModal
          comments={allComments}
          colorFor={(v) => store.colorFor(v, curVer)}
          initialVisible={visibleSet}
          initialIncludeResolved={!hideResolved}
          onRun={runExport}
          onClose={() => setExportOpen(false)}
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
    </>
  );
}

/* ── 코멘트 모드 상태바 (상시 표시 + 종료 버튼) ── */
function ModeBar({ picking, onExit }: { picking: boolean; onExit: () => void }) {
  return (
    <div className="rv-modebar">
      <span className="rv-modebar-dot" />
      <span>
        코멘트 모드 · {picking ? "요소를 클릭해 남기세요" : "작성 중…"}
      </span>
      <button className="rv-modebar-exit" onClick={onExit}>
        종료
      </button>
    </div>
  );
}

/* ── 코멘트 모드 시작 바 (중앙 하단, 비활성 시) ── */
function StartBar({ onStart }: { onStart: () => void }) {
  return (
    <button className="rv-startbar" onClick={onStart}>
      📍 코멘트 모드 시작 <span className="rv-kbd">Alt+C</span>
    </button>
  );
}

/* ── 작성 중인 핀 대상 요소 강조 박스 ── */
function DraftHighlight({ anchor }: { anchor: Anchor }) {
  if (anchor.type !== "pin") return null;
  let el: Element | null = null;
  try {
    el = document.querySelector(anchor.selector);
  } catch {
    return null;
  }
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return (
    <div
      className="rv-draft-box"
      style={{
        left: r.left + "px",
        top: r.top + "px",
        width: r.width + "px",
        height: r.height + "px",
      }}
    />
  );
}

/* ── 손상된 localStorage 복구 ───────────────────── */
function StorageRecovery({
  onBackup,
  onReset,
  onHide,
}: {
  onBackup: () => void;
  onReset: () => void;
  onHide: () => void;
}) {
  return (
    <div className="rv-modal-backdrop">
      <div className="rv-recovery">
        <div className="rv-modal-title">로컬 리뷰 데이터를 읽을 수 없습니다</div>
        <p className="rv-modal-desc">
          이 브라우저의 `rv:comments` 값이 손상되어 새 코멘트를 안전하게 저장하지
          않습니다. 원본을 백업한 뒤 초기화하세요.
        </p>
        <div className="rv-row-end">
          <button className="rv-btn rv-btn-ghost" onClick={onHide}>
            닫기
          </button>
          <button className="rv-btn rv-btn-ghost" onClick={onBackup}>
            백업 다운로드
          </button>
          <button className="rv-btn rv-btn-primary" onClick={onReset}>
            백업 후 초기화
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 작성 폼 ──────────────────────────────────── */
function Composer({
  x,
  y,
  isPage,
  needsShot,
  name,
  onSubmit,
  onCancel,
}: {
  x: number;
  y: number;
  isPage: boolean;
  needsShot: boolean;
  name: string;
  onSubmit: (text: string, author: string, shoot: boolean) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState(name);
  // 스크린샷 첨부 — 기본 OFF. 단 빈 요소(텍스트·이름 없음)는 스크린샷이 사실상 유일한 단서라 기본 ON(자동 캡처는 아님 — 등록 시 동의된 캡처만).
  const [shoot, setShoot] = useState(needsShot);
  const place = clampPos(x + 10, y + 10, 290, 230);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Shadow DOM에선 autoFocus 속성이 신뢰성이 낮아, 마운트 후 코멘트 입력칸에 명시적으로 포커스한다.
  useEffect(() => {
    textRef.current?.focus();
  }, []);

  const submit = () => {
    const t = text.trim();
    const a = author.trim();
    if (!t || !a) return;
    onSubmit(t, a, !isPage && shoot);
  };

  return (
    <div
      className="rv-card rv-composer"
      style={{ left: place.left + "px", top: place.top + "px" }}
      onKeyDown={(e: KeyboardEvent) => {
        // 폼 어디에 포커스가 있든(스크린샷 체크박스 포함) ⌘/Ctrl+Enter로 등록되게 컨테이너에서 처리.
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          submit();
        }
      }}
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
        ref={textRef}
        className="rv-textarea"
        placeholder="코멘트를 입력하세요… (⌘/Ctrl+Enter 등록)"
        value={text}
        onInput={(e: Event) =>
          setText((e.currentTarget as HTMLTextAreaElement).value)
        }
      />
      {!isPage ? (
        <>
          <label className="rv-shot-check">
            <input
              type="checkbox"
              checked={shoot}
              onChange={(e: Event) =>
                setShoot((e.currentTarget as HTMLInputElement).checked)
              }
            />
            📷 스크린샷 첨부
          </label>
          {needsShot ? (
            <div className="rv-shot-hint">
              텍스트가 없는 요소예요 — 스크린샷을 권장합니다
            </div>
          ) : null}
        </>
      ) : null}
      <div className="rv-row-end">
        <button className="rv-btn rv-btn-ghost" onClick={onCancel}>
          취소
        </button>
        <button
          className="rv-btn rv-btn-primary"
          disabled={!text.trim() || !author.trim()}
          onClick={submit}
        >
          등록 <span className="rv-kbd">⌘↵</span>
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
  onError,
}: {
  comment: RvComment;
  number: number;
  pos: { x: number; y: number } | null;
  onClose: () => void;
  onChanged: () => void;
  onError: (msg: string) => void;
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
    if (!store.update(comment.id, { resolved: !comment.resolved })) {
      onError("저장 실패 — 해결 상태를 바꾸지 못했어요");
      return;
    }
    onChanged();
  };

  const saveEdit = () => {
    const t = text.trim();
    if (!t) return;
    if (!store.update(comment.id, { body: t })) {
      onError("저장 실패 — 수정 내용을 저장하지 못했어요");
      return;
    }
    setEditing(false);
    onChanged();
  };

  const del = () => {
    if (window.confirm("이 코멘트를 삭제할까요?")) {
      if (!store.remove(comment.id)) {
        onError("삭제 실패 — 저장 공간/데이터 상태를 확인하세요");
        return;
      }
      if (comment.shot) deleteShot(comment.id); // IndexedDB 스크린샷도 정리
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
          <button className="rv-del-btn" onClick={del} title="이 코멘트 삭제">
            🗑 삭제
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
          {!editing && comment.shot ? <ShotThumb id={comment.shot.id} /> : null}
        </div>
      </div>
    </div>
  );
}

/* ── 스크린샷 썸네일 (IndexedDB에서 blob 로드) ── */
function ShotThumb({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    let made: string | null = null;
    getShot(id).then((blob) => {
      if (blob && alive) {
        made = URL.createObjectURL(blob);
        setUrl(made);
      }
    });
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [id]);
  if (!url) return null;
  return <img className="rv-shot-thumb" src={url} alt="첨부된 스크린샷" />;
}

/* ── 버전 바 (현재 선택 + 범례겸 표시 멀티선택) ── */
interface VerProps {
  current: string;
  setCurrent: (v: string) => void;
  all: string[];
  counts: Map<string, number>;
  visible: Set<string>;
  toggle: (v: string) => void;
  showAll: () => void;
  showOnlyCurrent: () => void;
  colorFor: (v: string) => string;
  known: string[];
}

function VersionBar({ ver }: { ver: VerProps }) {
  const [open, setOpen] = useState(false); // 가시성 목록만 접힘 — 스위치/생성은 항상 보임
  const shown = ver.all.filter((v) => ver.visible.has(v)).length;

  return (
    <div className={`rv-verbar${open ? " rv-open" : ""}`}>
      {/* ZONE 1 — 항상 보임: 스위치(select) + 생성(버튼) + 표시 토글 */}
      <div className="rv-ver-bar1">
        <span
          className="rv-ver-swatch"
          style={{ ["--rv-c" as any]: ver.colorFor(ver.current) }}
        />
        {/* 현재 작성 버전 스위치 — 버전 단위(vN), 날짜 입력 없음 */}
        <select
          className="rv-ver-select"
          value={ver.current}
          aria-label="현재 작성 버전"
          onChange={(e: Event) =>
            ver.setCurrent((e.currentTarget as HTMLSelectElement).value)
          }
        >
          {ver.all.map((v) => (
            <option key={v} value={v}>{`■ ${v}`}</option>
          ))}
        </select>
        {/* 새 버전 생성 — 버튼으로 자동 증가(v0→v1→v2…), 텍스트 입력 없음 */}
        <button
          className="rv-btn rv-btn-ghost rv-ver-newbtn"
          title="다음 버전을 만들고 현재로 전환"
          onClick={() => ver.setCurrent(store.nextVersion(ver.all))}
        >
          + 새 버전
        </button>
        {/* 표시(가시성) 목록 펼치기/접기 — 이것만 접힘 */}
        <button
          className="rv-ver-vistog"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          여러 버전 표시 <b>{shown}</b>/{ver.all.length}{" "}
          <span className="rv-ver-caret">▾</span>
        </button>
      </div>

      {/* ZONE 2 — 접이식: 표시할 버전 멀티선택(여러 버전 동시 보기) */}
      {open ? (
        <div className="rv-ver-body">
          <div className="rv-ver-toolbar">
            <span className="rv-ver-hint">표시할 버전</span>
            <button className="rv-ver-mini" onClick={ver.showAll}>
              전체
            </button>
            <button className="rv-ver-mini" onClick={ver.showOnlyCurrent}>
              현재만
            </button>
          </div>
          <div className="rv-verlist">
            {ver.all.map((v) => {
              const on = ver.visible.has(v);
              return (
                <label
                  key={v}
                  className={`rv-ver-row${on ? "" : " rv-ver-off"}`}
                  title={v}
                >
                  <input
                    type="checkbox"
                    className="rv-ver-cb"
                    checked={on}
                    onChange={() => ver.toggle(v)}
                  />
                  <span
                    className="rv-ver-swatch"
                    style={{ ["--rv-c" as any]: ver.colorFor(v) }}
                  />
                  <span className="rv-ver-name">{v}</span>
                  <span className="rv-ver-count">{ver.counts.get(v) ?? 0}</span>
                  {v === ver.current ? (
                    <span className="rv-ver-now">현재</span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── 내보내기 모달 (방식·버전선택·미리보기·경고 통합) ── */
function ExportModal({
  comments,
  colorFor,
  initialVisible,
  initialIncludeResolved,
  onRun,
  onClose,
}: {
  comments: RvComment[];
  colorFor: (v: string) => string;
  initialVisible: Set<string>;
  initialIncludeResolved: boolean;
  onRun: (
    method: ExportMethod,
    selected: RvComment[],
    options: ExportRunOptions,
  ) => Promise<"ok" | "cancel" | "fail">;
  onClose: () => void;
}) {
  // 코멘트에 실제 존재하는 버전 + 카운트
  const versions = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of comments) {
      const v = store.verOf(c);
      m.set(v, (m.get(v) ?? 0) + 1);
    }
    return [...m.entries()].map(([version, count]) => ({ version, count }));
  }, [comments]);

  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(versions.filter((v) => initialVisible.has(v.version)).map((v) => v.version)),
  );
  const [includeResolved, setIncludeResolved] = useState(initialIncludeResolved);
  const [allowMarkdown, setAllowMarkdown] = useState(true);
  const [method, setMethod] = useState<ExportMethod>("copy");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"" | "ok" | "fail">("");

  const selected = useMemo(
    () =>
      comments.filter(
        (c) =>
          checked.has(store.verOf(c)) && (includeResolved || !c.resolved),
      ),
    [comments, checked, includeResolved],
  );
  const shotCount = selected.filter((c) => c.shot).length;
  const warn = method === "copy" && shotCount > 0;
  const jsonWarn = method === "json" && shotCount > 0;

  const toggleVer = (v: string) =>
    setChecked((prev) => {
      const n = new Set(prev);
      n.has(v) ? n.delete(v) : n.add(v);
      return n;
    });

  const go = async () => {
    if (!selected.length || busy) return;
    setBusy(true);
    setResult("");
    const r = await onRun(method, selected, { includeResolved, allowMarkdown });
    setBusy(false);
    if (r === "ok") {
      setResult("ok");
      window.setTimeout(onClose, 700);
    } else if (r === "fail") {
      setResult("fail");
    }
    // cancel → 모달 유지
  };

  const METHODS = [
    ["copy", "📋", "MD 복사"],
    ["zip", "⬇", "ZIP 다운로드"],
    ["folder", "🗂", "폴더 저장"],
    ["json", "{}", "JSON"],
  ] as const;
  const goLabel = busy
    ? "처리 중…"
    : result === "ok"
      ? "완료 ✓"
      : result === "fail"
        ? "실패 — 다시"
        : {
            copy: "MD 복사",
            zip: "ZIP 다운로드",
            folder: "폴더에 저장",
            json: "JSON 다운로드",
          }[method];

  return (
    <div className="rv-modal-backdrop">
      <div className="rv-card rv-exmodal">
        <div className="rv-card-head">
          <span className="rv-card-title">내보내기</span>
          <button className="rv-icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="rv-exmodal-body">
          {/* 방식 */}
          <div>
            <div className="rv-ex-label">방식</div>
            <div className="rv-ex-methods" role="radiogroup" aria-label="내보내기 방식">
              {METHODS.map(([m, ico, lbl]) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={method === m}
                  className={`rv-ex-method${method === m ? " rv-on" : ""}`}
                  onClick={() => setMethod(m)}
                >
                  <span className="rv-ex-method-ico">{ico}</span>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* 버전 선택 */}
          <div>
            <div className="rv-ex-label">내보낼 버전</div>
            <div className="rv-ex-scope">현재 패널 표시 조건을 기본으로 사용합니다.</div>
            <div className="rv-ex-vers">
              {versions.map(({ version, count }) => {
                const on = checked.has(version);
                return (
                  <label
                    key={version}
                    className={`rv-ex-ver${on ? "" : " rv-off"}`}
                    title={version}
                  >
                    <input
                      type="checkbox"
                      className="rv-ver-cb"
                      checked={on}
                      onChange={() => toggleVer(version)}
                    />
                    <span
                      className="rv-ver-swatch"
                      style={{ ["--rv-c" as any]: colorFor(version) }}
                    />
                    <span className="rv-ex-ver-name">{version}</span>
                    <span className="rv-ex-ver-count">{count}</span>
                  </label>
                );
              })}
            </div>
            <label className="rv-check" style={{ marginTop: "8px" }}>
              <input
                type="checkbox"
                checked={!includeResolved}
                onChange={(e: Event) =>
                  setIncludeResolved(
                    !(e.currentTarget as HTMLInputElement).checked,
                  )
                }
              />
              해결됨 제외
            </label>
            {method !== "json" ? (
              <label className="rv-check" style={{ marginTop: "8px", marginLeft: "10px" }}>
                <input
                  type="checkbox"
                  checked={allowMarkdown}
                  onChange={(e: Event) =>
                    setAllowMarkdown((e.currentTarget as HTMLInputElement).checked)
                  }
                />
                본문 Markdown 허용
              </label>
            ) : null}
          </div>

          {/* 스크린샷 경고 (MD 복사 + 샷 있을 때만) */}
          {warn ? (
            <div className="rv-ex-warn">
              <span aria-hidden="true">⚠</span>
              <span>
                스크린샷 <b>{shotCount}개</b>는 클립보드 복사에 안 담겨 깨질 수 있어요.
                이미지까지 포함하려면{" "}
                <button
                  type="button"
                  className="rv-ex-warn-fix"
                  onClick={() => setMethod("zip")}
                >
                  ZIP으로 받기
                </button>
                를 권장해요.
              </span>
            </div>
          ) : null}
          {jsonWarn ? (
            <div className="rv-ex-warn">
              <span aria-hidden="true">⚠</span>
              <span>
                JSON에는 스크린샷 이미지 파일이 포함되지 않습니다. 이미지까지 보관하려면{" "}
                <button
                  type="button"
                  className="rv-ex-warn-fix"
                  onClick={() => setMethod("zip")}
                >
                  ZIP으로 받기
                </button>
                를 사용하세요.
              </span>
            </div>
          ) : null}

          {/* 미리보기 */}
          <div>
            <div className="rv-ex-label">포함될 리뷰 {selected.length}개</div>
            <div className="rv-ex-preview">
              {selected.length === 0 ? (
                <div className="rv-ex-empty">선택된 리뷰가 없어요</div>
              ) : (
                <div className="rv-ex-preview-list">
                  {selected.map((c, i) => (
                    <div key={c.id} className="rv-ex-prow">
                      <span
                        className="rv-ex-pnum"
                        style={{ ["--rv-c" as any]: colorFor(store.verOf(c)) }}
                      >
                        {i + 1}
                      </span>
                      <span className="rv-ex-pbody">
                        <span className="rv-ex-ptext">{c.body}</span>
                        <span className="rv-ex-pmeta">
                          {c.authorName} · {c.pagePath}
                          {c.shot ? " · 📷" : ""}
                          {c.resolved ? " · ✓해결" : ""}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rv-exmodal-foot">
          <button className="rv-btn rv-btn-ghost" onClick={onClose}>
            취소
          </button>
          <button
            className="rv-btn rv-btn-primary rv-ex-go"
            disabled={!selected.length || busy}
            onClick={go}
          >
            {goLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 패널 ─────────────────────────────────────── */
function Panel({
  comments,
  allComments,
  hideResolved,
  setHideResolved,
  currentPath,
  name,
  setName,
  onPageComment,
  onGoTo,
  onOpenExport,
  onImportJson,
  onClearAll,
  pendingShots,
  ver,
  onClose,
  onHide,
}: {
  comments: RvComment[];
  allComments: RvComment[];
  hideResolved: boolean;
  setHideResolved: (v: boolean) => void;
  currentPath: string;
  name: string;
  setName: (n: string) => void;
  onPageComment: () => void;
  onGoTo: (c: RvComment) => void;
  onOpenExport: () => void;
  onImportJson: (file: File) => void;
  onClearAll: () => void;
  pendingShots: number;
  ver: VerProps;
  onClose: () => void;
  onHide: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const importRef = useRef<HTMLInputElement>(null);

  // 전체 서비스 기준 — 모든 페이지의 코멘트를 한 목록으로 본다(해결됨 + 버전 가시성 필터).
  const filtered = allComments.filter(
    (c) => (!hideResolved || !c.resolved) && ver.visible.has(store.verOf(c)),
  );
  const totalForExport = hideResolved
    ? allComments.filter((c) => !c.resolved).length
    : allComments.length;
  const shotCount = filtered.filter((c) => c.shot).length;
  const exportHint =
    pendingShots > 0
      ? `스크린샷 ${pendingShots}장 처리 중`
      : shotCount > 0
        ? `이미지 ${shotCount}장 포함`
        : `${totalForExport}개${hideResolved ? " · 미해결만" : ""}`;

  return (
    <div className="rv-card rv-panel">
      <div className="rv-card-head">
        <span className="rv-card-title">{location.host} 리뷰</span>
        <button className="rv-icon-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="rv-panel-sub">전체 서비스 리뷰 · {allComments.length}개</div>

      <VersionBar ver={ver} />

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
              c.anchor?.type === "pin" &&
              samePageKey(c.pagePath, currentPath) &&
              resolveAnchor(c.anchor) === null;
            return (
              <button
                key={c.id}
                className={`rv-item${c.resolved ? " rv-resolved" : ""}`}
                onClick={() => onGoTo(c)}
              >
                <span
                  className="rv-item-num"
                  style={{ ["--rv-c" as any]: ver.colorFor(store.verOf(c)) }}
                >
                  {samePageKey(c.pagePath, currentPath) ? comments.indexOf(c) + 1 : "•"}
                </span>
                <span style={{ minWidth: "0", flex: "1", display: "block" }}>
                  <span className="rv-item-text">{c.body}</span>
                  <span className="rv-item-meta" style={{ display: "block" }}>
                    {c.authorName} · {timeLabel(c.createdAt)} · {c.pagePath}
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
          <button
            className="rv-btn rv-btn-primary"
            style={{ flex: "1" }}
            onClick={onOpenExport}
          >
            📤 내보내기
          </button>
          <span className="rv-export-hint">{exportHint}</span>
        </div>
        <div className="rv-import-row">
          <input
            ref={importRef}
            className="rv-file-input"
            type="file"
            accept="application/json,.json"
            onChange={(e: Event) => {
              const input = e.currentTarget as HTMLInputElement;
              const file = input.files?.[0];
              input.value = "";
              if (file) onImportJson(file);
            }}
          />
          <button className="rv-foot-link" onClick={() => importRef.current?.click()}>
            JSON 가져오기
          </button>
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

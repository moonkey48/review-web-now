// localStorage 코멘트 → 페이지별로 그루핑된 MD 리포트. 전부 브라우저 네이티브 API.
import type { Anchor, RvComment } from "./types";

const TZ = "Asia/Seoul";

function tzParts(
  date: Date,
  opts: Intl.DateTimeFormatOptions,
): Record<string, string> {
  const map: Record<string, string> = {};
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    ...opts,
  });
  for (const p of fmt.formatToParts(date)) map[p.type] = p.value;
  return map;
}

export function fullStamp(iso: string | Date): string {
  const p = tzParts(new Date(iso), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

export function shortStamp(iso: string | Date): string {
  const p = tzParts(new Date(iso), {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${p.month}/${p.day} ${p.hour}:${p.minute}`;
}

// 페이지/사용자 파생 텍스트의 마크다운 메타문자를 무력화(링크·이미지·강조·코드·표 인젝션 방지).
// 리포트는 Claude Code/Codex나 MD 뷰어가 소비하므로, 핀한 페이지 콘텐츠가 링크/이미지로 해석되면 안 된다.
function escMd(s: string): string {
  return s.replace(/[\\`*_[\]()<>~|!]/g, "\\$&");
}

// 마크다운 인라인 링크 URL에서 괄호/꺾쇠/공백을 인코딩 — `)`로 링크가 조기 종료되는 것을 막는다.
function escUrl(url: string): string {
  return url.replace(
    /[()<> ]/g,
    (m) => "%" + m.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"),
  );
}

function anchorLabel(anchor: Anchor | null): string {
  if (anchor?.type === "pin") return `핀: \`${anchor.selector.replace(/`/g, "'")}\``;
  return "페이지 코멘트";
}

export interface MarkdownOptions {
  status: "all" | "open";
  generatedAt?: Date;
  escapeUserText?: boolean;
}

// 페이지(경로)별 섹션 → 문서 전체 연속 번호 → [x]/[ ] 체크박스 → 메타(작성자·일시·위치)
export function buildMarkdown(
  title: string,
  comments: RvComment[],
  opts: MarkdownOptions,
): string {
  const total = comments.length;
  const openCount = comments.filter((c) => !c.resolved).length;
  const visible =
    opts.status === "open" ? comments.filter((c) => !c.resolved) : comments;

  const byPage = new Map<string, RvComment[]>();
  for (const c of visible) {
    const arr = byPage.get(c.pagePath);
    if (arr) arr.push(c);
    else byPage.set(c.pagePath, [c]);
  }
  const pages = [...byPage.keys()].sort();

  const lines: string[] = [];
  lines.push(`# 리뷰 리포트 — ${title}`);
  lines.push("");
  lines.push(
    `> ${fullStamp(opts.generatedAt ?? new Date())} (KST) 기준 · 총 ${total}개 (미해결 ${openCount})` +
      (opts.status === "open" ? " · 미해결만 표시" : ""),
  );
  lines.push(">");
  lines.push(
    "> 각 핀은 우선순위 순으로 `소스`(컴포넌트·file:line)·`인용`(텍스트 grep)·`요소(역할/이름)`·`셀렉터`·`뷰포트`·`섹션`을 표기합니다. 위에서부터 신뢰하세요 — 소스/인용만 맞으면 셀렉터 없이 바로 찾습니다.",
  );

  let seq = 0;
  for (const page of pages) {
    const items = byPage.get(page)!;
    lines.push("");
    lines.push(`## ${page} (${items.length}개)`);
    for (const c of items) {
      seq += 1;
      const body = c.body.split(/\r?\n/).map((line) =>
        opts.escapeUserText ? escMd(line) : line,
      );
      lines.push("");
      // 제목 없이 본문을 체크박스 항목으로 바로 싣는다 (첫 줄 → 나머지 줄은 들여쓰기)
      lines.push(`${seq}. [${c.resolved ? "x" : " "}] ${body[0] ?? ""}`);
      for (const l of body.slice(1)) lines.push(`   ${l}`);
      // 우선순위 순으로 위치를 표기 — 소스 → 인용 → 역할/이름 → 셀렉터 → 뷰포트 → 섹션 → needsShot.
      const a = c.anchor;
      if (a?.type === "pin") {
        // ① 소스 포인터 — 최우선(있으면 추적 0)
        if (a.source && (a.source.component || a.source.file)) {
          const comp = a.source.component ? `\`${a.source.component.replace(/`/g, "")}\`` : "";
          const loc = a.source.file
            ? escMd(a.source.file + (a.source.line ? `:${a.source.line}` : ""))
            : "";
          lines.push(`   - 소스: ${[comp, loc].filter(Boolean).join(" · ")}`);
        }
        // ② 인용(OWN 텍스트 grep) — unique면 grep 1줄 기대 힌트
        if (a.quote?.exact) {
          const ex = escMd(a.quote.exact);
          let line: string;
          if (a.quote.prefix || a.quote.suffix) {
            const pre = a.quote.prefix ? `…${escMd(a.quote.prefix.trim())} ` : "…";
            const suf = a.quote.suffix ? ` ${escMd(a.quote.suffix.trim())}…` : "…";
            line = `   - 인용: ${pre}**[${ex}]**${suf}`;
          } else {
            line = `   - 인용: "${ex}"`;
          }
          if (a.quote.unique === true) line += " · grep 1줄 기대";
          else if (a.quote.unique === false) line += " · 중복 — 맥락/셀렉터 확인";
          lines.push(line);
        }
        // ③ 역할 + 접근가능한 이름
        if (a.a11y && (a.a11y.role || a.a11y.name)) {
          const role = a.a11y.role ? `\`${a.a11y.role.replace(/`/g, "")}\`` : "";
          const name = a.a11y.name ? `"${escMd(a.a11y.name)}"` : "";
          lines.push(`   - 요소(역할/이름): ${[role, name].filter(Boolean).join(" / ")}`);
        }
      }
      // ④ 셀렉터(최후수단 톤) — 경로 + 핀 셀렉터
      lines.push(`   - 위치: \`${page.replace(/`/g, "'")}\` · ${anchorLabel(c.anchor)}`);
      if (a?.type === "pin") {
        if (a.vw) lines.push(`   - 뷰포트: ${a.vw}${a.vh ? `×${a.vh}` : ""}`);
        if (a.heading) lines.push(`   - 섹션: ${escMd(a.heading)}`); // 약한 보조 컨텍스트(보이는 heading만)
        if (a.needsShot && !c.shot) lines.push("   - ⚠ 빈 요소 — 스크린샷 권장");
      }
      if (a?.type === "pin" && a.deepLink) {
        lines.push(`   - 딥링크: [위치 열기](${escUrl(a.deepLink)}) (새 탭·SPA/origin 주의)`);
      }
      if (c.shot) {
        lines.push(`   - 스크린샷: ![#${seq}](images/${c.shot.id}.png)`);
      }
      if (c.version) lines.push(`   - 버전: \`${escMd(c.version)}\``);
      const author = opts.escapeUserText ? escMd(c.authorName) : c.authorName;
      lines.push(`   - ${author} · ${shortStamp(c.createdAt)}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

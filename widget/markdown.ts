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
    "> 각 핀은 `인용`(텍스트 grep용)·`요소(역할/이름)`(빈 요소 식별)·`셀렉터`·`딥링크`·`스크린샷`으로 위치를 중복 표기합니다. 인용/이름으로 소스를 검색해 해당 위치를 찾으세요.",
  );

  let seq = 0;
  for (const page of pages) {
    const items = byPage.get(page)!;
    lines.push("");
    lines.push(`## ${page} (${items.length}개)`);
    for (const c of items) {
      seq += 1;
      const body = c.body.split(/\r?\n/);
      lines.push("");
      // 제목 없이 본문을 체크박스 항목으로 바로 싣는다 (첫 줄 → 나머지 줄은 들여쓰기)
      lines.push(`${seq}. [${c.resolved ? "x" : " "}] ${body[0] ?? ""}`);
      for (const l of body.slice(1)) lines.push(`   ${l}`);
      // 같은 위치를 여러 방식으로 중복 표기 — 항상 채워지는 의미·내용 키를 먼저, 셀렉터/딥링크/샷은 보조.
      const a = c.anchor;
      if (a?.type === "pin") {
        if (a.heading) lines.push(`   - 섹션: ${escMd(a.heading)}`);
        if (a.a11y && (a.a11y.role || a.a11y.name)) {
          const role = a.a11y.role ? `\`${a.a11y.role.replace(/`/g, "")}\`` : "";
          const name = a.a11y.name ? `"${escMd(a.a11y.name)}"` : "";
          lines.push(`   - 요소(역할/이름): ${[role, name].filter(Boolean).join(" / ")}`);
        }
        if (a.quote?.exact) {
          const ex = escMd(a.quote.exact);
          if (a.quote.prefix || a.quote.suffix) {
            const pre = a.quote.prefix ? `…${escMd(a.quote.prefix.trim())} ` : "…";
            const suf = a.quote.suffix ? ` ${escMd(a.quote.suffix.trim())}…` : "…";
            lines.push(`   - 인용: ${pre}**[${ex}]**${suf}`);
          } else {
            lines.push(`   - 인용: "${ex}"`);
          }
        }
      }
      lines.push(`   - 위치: \`${page.replace(/`/g, "'")}\` · ${anchorLabel(c.anchor)}`);
      if (a?.type === "pin" && a.deepLink) {
        lines.push(`   - 딥링크: [위치 열기](${escUrl(a.deepLink)}) (새 탭·SPA/origin 주의)`);
      }
      if (c.shot) {
        lines.push(`   - 스크린샷: ![#${seq}](images/${c.shot.id}.png)`);
      }
      lines.push(`   - ${c.authorName} · ${shortStamp(c.createdAt)}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

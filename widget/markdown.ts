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

function firstLine(body: string): string {
  const line = (body.split(/\r?\n/)[0] ?? "").trim() || "(내용 없음)";
  return line.length > 80 ? `${line.slice(0, 80)}…` : line;
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

  let seq = 0;
  for (const page of pages) {
    const items = byPage.get(page)!;
    lines.push("");
    lines.push(`## ${page} (${items.length}개)`);
    for (const c of items) {
      seq += 1;
      const headline = firstLine(c.body);
      lines.push("");
      lines.push(`### ${seq}. [${c.resolved ? "x" : " "}] ${headline}`);
      if (c.body.trim() !== headline) {
        lines.push("");
        for (const l of c.body.split(/\r?\n/)) lines.push(`> ${l}`);
      }
      lines.push("");
      lines.push(`- ${c.authorName} · ${shortStamp(c.createdAt)} · ${anchorLabel(c.anchor)}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

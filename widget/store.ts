// localStorage 단일 저장소. 대상 사이트 origin 기준으로 코멘트가 쌓인다.
// 서버/네트워크 없음 — 모든 읽기/쓰기는 동기.
import type { Anchor, RvComment, Shot } from "./types";

const KEY = "rv:comments";
const KEY_NAME = "rv:name";

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // private 모드 / 용량 초과 — 이번 세션 한정으로만 메모리에 남는다(저장 실패 무시)
  }
}

function uuid(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // http(비보안) 컨텍스트 등에서 randomUUID 미지원 → 폴백
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function nowIso(): string {
  return new Date().toISOString();
}

export function loadAll(): RvComment[] {
  const raw = readRaw(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RvComment[]) : [];
  } catch {
    return [];
  }
}

function persist(list: RvComment[]) {
  writeRaw(KEY, JSON.stringify(list));
}

function byCreated(a: RvComment, b: RvComment): number {
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

export function list(path: string): RvComment[] {
  return loadAll()
    .filter((c) => c.pagePath === path)
    .sort(byCreated);
}

export function listAll(): RvComment[] {
  return loadAll().sort(byCreated);
}

export function create(input: {
  pagePath: string;
  pageUrl: string;
  body: string;
  authorName: string;
  anchor: Anchor | null;
}): RvComment {
  const ts = nowIso();
  const c: RvComment = {
    id: uuid(),
    pagePath: input.pagePath,
    pageUrl: input.pageUrl,
    anchor: input.anchor,
    body: input.body,
    authorName: input.authorName,
    resolved: false,
    resolvedAt: null,
    createdAt: ts,
    updatedAt: ts,
  };
  persist([...loadAll(), c]);
  return c;
}

export function update(
  id: string,
  patch: { body?: string; resolved?: boolean },
): void {
  const all = loadAll();
  const i = all.findIndex((c) => c.id === id);
  if (i < 0) return;
  const next: RvComment = { ...all[i], updatedAt: nowIso() };
  if (patch.body !== undefined) next.body = patch.body;
  if (patch.resolved !== undefined) {
    next.resolved = patch.resolved;
    next.resolvedAt = patch.resolved ? nowIso() : null;
  }
  all[i] = next;
  persist(all);
}

// 스크린샷 메타만 갱신(실제 blob은 IndexedDB). null이면 첨부 해제.
export function setShot(id: string, shot: Shot | null): void {
  const all = loadAll();
  const i = all.findIndex((c) => c.id === id);
  if (i < 0) return;
  all[i] = { ...all[i], shot, updatedAt: nowIso() };
  persist(all);
}

export function remove(id: string): void {
  persist(loadAll().filter((c) => c.id !== id));
}

export function clear(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // noop
  }
}

export function getName(): string {
  return readRaw(KEY_NAME) ?? "";
}

export function setName(name: string): void {
  writeRaw(KEY_NAME, name);
}

// localStorage 단일 저장소. 대상 사이트 origin 기준으로 코멘트가 쌓인다.
// 서버/네트워크 없음 — 모든 읽기/쓰기는 동기.
import type { Anchor, RvComment, Shot } from "./types";

const KEY = "rv:comments";
const KEY_NAME = "rv:name";
const KEY_VERSION = "rv:version"; // 현재(스탬프) 버전 — 새 리뷰에만 찍힘
const KEY_VISIBLE = "rv:visibleVersions"; // 표시 멀티선택(JSON string[]); 부재=전체보기 센티넬, []=모두 끔
const KEY_VERSIONS = "rv:versions"; // 알려진 버전 레지스트리(append-only) = 색 인덱스+범례 단일 소스
const KEY_SCHEMA = "rv:schema"; // 마이그레이션 가드(스키마 에폭)

const SCHEMA = 1;
export const SEED_VERSION = "v0"; // 마이그레이션 시작 버전 + 초기 현재 버전
const SIGNATURE = "#6366f1"; // 현재 버전 시그니처(인디고)
// 현재 외 버전 팔레트 — 흰 텍스트 대비(amber는 #d97706로 어둡게), 시각적으로 구분되게.
const PALETTE = [
  "#0ea5e9", "#16a34a", "#d97706", "#ec4899",
  "#8b5cf6", "#ef4444", "#14b8a6", "#a16207",
];

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

// JSON string[] 안전 읽기 — 파싱 실패/형식 불일치 시 빈 배열(loadAll과 동일 톤).
function readStrArr(key: string): string[] {
  const raw = readRaw(key);
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
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

// ── 버전 ──────────────────────────────────────────────────────────────
// 모든 읽기 지점 공통 코얼레스 — 빈 문자열도 v0(별도 버킷 방지). undefined도 v0.
export function verOf(c: RvComment): string {
  return c.version && c.version.trim() ? c.version : SEED_VERSION;
}

// 현재(스탬프) 버전 — 새 리뷰에만 찍힘. 미설정이면 SEED_VERSION으로 안전 동작.
export function getVersion(): string {
  const v = readRaw(KEY_VERSION);
  return v && v.trim() ? v : SEED_VERSION;
}

// 레지스트리는 append-only — 절대 정렬/삭제하지 않는다(색 인덱스 고정의 근거).
function register(name: string): void {
  const reg = readStrArr(KEY_VERSIONS);
  if (!reg.includes(name)) writeRaw(KEY_VERSIONS, JSON.stringify([...reg, name]));
}

// 현재 버전 변경 + 처음 보는 라벨이면 레지스트리 등록. 명시적 가시성 집합이 있으면 새 버전을 켠다(센티넬 보존).
export function setVersion(v: string): void {
  const name = v.trim();
  if (!name) return;
  writeRaw(KEY_VERSION, name);
  register(name);
  const visRaw = readRaw(KEY_VISIBLE);
  if (visRaw !== null) {
    const vis = readStrArr(KEY_VISIBLE);
    if (!vis.includes(name)) writeRaw(KEY_VISIBLE, JSON.stringify([...vis, name]));
  }
}

export function getKnownVersions(): string[] {
  return readStrArr(KEY_VERSIONS);
}

// 가시성: 센티넬 보존. null=전체보기(키 부재), []=모두 끔(명시).
export function readVisibleRaw(): string[] | null {
  const raw = readRaw(KEY_VISIBLE);
  return raw === null ? null : readStrArr(KEY_VISIBLE);
}
export function setVisibleVersions(arr: string[]): void {
  writeRaw(KEY_VISIBLE, JSON.stringify(arr)); // []도 그대로 — 명시적 "모두 끔"
}
export function clearVisible(): void {
  try {
    localStorage.removeItem(KEY_VISIBLE); // 센티넬 복원(전체보기)
  } catch {
    // noop
  }
}

// 색상: 현재=인디고(렌더타임 오버레이), 그 외=레지스트리 삽입순 고정 팔레트(append-only라 bump해도 불변).
export function colorFor(version: string, current = getVersion()): string {
  if (version === current) return SIGNATURE;
  const i = readStrArr(KEY_VERSIONS).indexOf(version);
  return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
}

// 일회성 마이그레이션 — 버전 없는(undefined/"") 코멘트를 SEED_VERSION으로 스탬프.
// 멱등(rv:schema 가드) · write→verify→guard 순서(사생활 모드 부분실패 시 가드 미기록·다음 부팅 재시도).
// 2탭 동시는 benign: 변환이 멱등이고 persist는 whole-array atomic.
export function migrate(): void {
  let schema = 0;
  const s = readRaw(KEY_SCHEMA);
  if (s) {
    const n = parseInt(s, 10);
    if (!Number.isNaN(n)) schema = n;
  }
  if (schema >= SCHEMA) return; // 이미 마이그레이션됨 — 재스탬프 없음
  const all = loadAll();
  let changed = false;
  const next = all.map((c) => {
    if (c.version === undefined || c.version === "") {
      changed = true;
      return { ...c, version: SEED_VERSION };
    }
    return c;
  });
  if (changed) {
    persist(next);
    // 재읽기로 검증 — 쓰기가 조용히 실패했으면 가드를 세우지 않고 다음 부팅에 재시도.
    if (loadAll().some((c) => c.version === undefined || c.version === "")) return;
  }
  if (!readRaw(KEY_VERSION)) writeRaw(KEY_VERSION, SEED_VERSION);
  register(SEED_VERSION);
  writeRaw(KEY_SCHEMA, String(SCHEMA)); // 마지막에 가드
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
    version: getVersion(), // 현재 버전 스탬프(update/setShot은 {...all[i]} 전개라 보존)
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
    // 코멘트뿐 아니라 버전 키도 함께 정리 — 안 그러면 "전체 삭제" 후 stale 빈 visible-set이 새 핀을 숨긴다.
    for (const k of [KEY, KEY_VERSION, KEY_VISIBLE, KEY_VERSIONS, KEY_SCHEMA]) {
      localStorage.removeItem(k);
    }
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

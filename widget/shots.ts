// 스크린샷 PNG blob 전용 저장소 — IndexedDB(localStorage보다 용량이 훨씬 큼).
// 코멘트 메타(id·w·h)는 localStorage(store.ts)에, 무거운 blob만 여기에 둔다.
// 모든 작업은 실패해도 조용히 흘려보낸다(프라이빗 모드·미지원 등).

const DB_NAME = "rv-shots";
const STORE = "shots";
const VERSION = 1;

let dbp: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise<IDBDatabase>((resolve, reject) => {
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, VERSION);
    } catch (e) {
      reject(e);
      return;
    }
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const t = d.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

// 성공 여부를 반환 — 실패(프라이빗 모드·용량 초과) 시 메타를 저장하지 않아 깨진 이미지 참조를 막는다.
export function putShot(id: string, blob: Blob): Promise<boolean> {
  return tx("readwrite", (s) => s.put(blob, id))
    .then(() => true)
    .catch(() => false);
}

export function getShot(id: string): Promise<Blob | null> {
  return tx<Blob | undefined>("readonly", (s) => s.get(id) as IDBRequest<Blob | undefined>)
    .then((b) => b ?? null)
    .catch(() => null);
}

export function deleteShot(id: string): Promise<void> {
  return tx("readwrite", (s) => s.delete(id))
    .then(() => undefined)
    .catch(() => undefined);
}

export function clearShots(): Promise<void> {
  return tx("readwrite", (s) => s.clear())
    .then(() => undefined)
    .catch(() => undefined);
}

// 여러 id의 blob을 모아 Map으로. 없는 건 건너뛴다(내보내기용).
export async function getShots(ids: string[]): Promise<Map<string, Blob>> {
  const map = new Map<string, Blob>();
  for (const id of ids) {
    const b = await getShot(id);
    if (b) map.set(id, b);
  }
  return map;
}

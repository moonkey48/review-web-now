// 스크린샷 포함 내보내기.
//  1) File System Access(Chromium) — 폴더 1회 선택 후 그 폴더에 review.md + images/<id>.png.
//     세션 동안 폴더 핸들을 유지해 다음 내보내기는 추가 선택 없이 같은 폴더로 저장.
//  2) 미지원 브라우저 — 의존성 0 store-only ZIP을 한 파일로 다운로드.
// 둘 다 네트워크 0.

/* eslint-disable @typescript-eslint/no-explicit-any */
type DirHandle = any;

let dir: DirHandle | null = null; // 세션 동안 선택한 폴더 유지

export function fsSupported(): boolean {
  return typeof (window as any).showDirectoryPicker === "function";
}

async function writeOne(
  d: DirHandle,
  name: string,
  data: Blob | string,
): Promise<void> {
  const fh = await d.getFileHandle(name, { create: true });
  const ws = await fh.createWritable();
  await ws.write(data);
  await ws.close();
}

export type SaveResult = "ok" | "cancel" | "unsupported" | "error";

// FS Access: 고른 폴더에 mdName + images/<id>.png 기록.
export async function saveToFolder(
  mdName: string,
  md: string,
  shots: Map<string, Blob>,
): Promise<SaveResult> {
  if (!fsSupported()) return "unsupported";
  try {
    if (!dir) dir = await (window as any).showDirectoryPicker({ mode: "readwrite" });
    if (dir.requestPermission) {
      const perm = await dir.requestPermission({ mode: "readwrite" });
      if (perm !== "granted") {
        dir = null;
        return "error";
      }
    }
    await writeOne(dir, mdName, md);
    if (shots.size) {
      const img = await dir.getDirectoryHandle("images", { create: true });
      for (const [id, blob] of shots) await writeOne(img, id + ".png", blob);
    }
    return "ok";
  } catch (e: any) {
    if (e && (e.name === "AbortError" || e.name === "NotAllowedError")) {
      dir = null; // 사용자가 선택/권한을 취소 → 다음에 다시 묻기
      return "cancel";
    }
    return "error";
  }
}

/* ── 의존성 0 store-only ZIP (압축 없음) ───────────────────── */

interface ZipEntry {
  name: string;
  data: Uint8Array<ArrayBuffer>;
}

function crc32(buf: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function dosStamp(): { time: number; date: number } {
  const d = new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date =
    (((d.getFullYear() - 1980) & 0x7f) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

function buildZip(entries: ZipEntry[]): Blob {
  const enc = new TextEncoder();
  const { time, date } = dosStamp();
  const parts: BlobPart[] = [];
  const central: BlobPart[] = [];
  let offset = 0;

  for (const e of entries) {
    const nameBytes = enc.encode(e.name);
    const crc = crc32(e.data);
    const size = e.data.length;

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // version needed
    local.setUint16(6, 0x0800, true); // UTF-8 파일명
    local.setUint16(8, 0, true); // method: store
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true);
    local.setUint32(22, size, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);
    const localBytes = new Uint8Array(local.buffer);
    parts.push(localBytes, nameBytes, e.data);

    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true); // version made by
    cen.setUint16(6, 20, true); // version needed
    cen.setUint16(8, 0x0800, true);
    cen.setUint16(10, 0, true);
    cen.setUint16(12, time, true);
    cen.setUint16(14, date, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, size, true);
    cen.setUint32(24, size, true);
    cen.setUint16(28, nameBytes.length, true);
    cen.setUint16(30, 0, true);
    cen.setUint16(32, 0, true);
    cen.setUint16(34, 0, true);
    cen.setUint16(36, 0, true);
    cen.setUint32(38, 0, true);
    cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), nameBytes);

    offset += localBytes.length + nameBytes.length + size;
  }

  let centralSize = 0;
  for (const c of central) centralSize += (c as Uint8Array).length;

  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], {
    type: "application/zip",
  });
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// review.md + images/<id>.png 를 한 zip으로 다운로드(FS Access 폴백).
export async function downloadZip(
  zipName: string,
  mdName: string,
  md: string,
  shots: Map<string, Blob>,
): Promise<void> {
  const enc = new TextEncoder();
  const entries: ZipEntry[] = [{ name: mdName, data: enc.encode(md) }];
  for (const [id, blob] of shots) {
    entries.push({
      name: `images/${id}.png`,
      data: new Uint8Array(await blob.arrayBuffer()),
    });
  }
  triggerDownload(buildZip(entries), zipName);
}

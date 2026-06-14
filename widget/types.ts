// 위젯이 다루는 단일 데이터 모델. 서버/DB 없음 — 전부 localStorage에 평평하게 저장된다.

export type Anchor =
  | { type: "pin"; selector: string; xPercent: number; yPercent: number }
  | { type: "page" };

export interface RvComment {
  id: string;
  pagePath: string; // location.pathname — 페이지 그루핑 키
  pageUrl: string; // 작성 시점의 전체 href
  anchor: Anchor | null; // pin | page (null은 들어오지 않지만 안전하게 허용)
  body: string;
  authorName: string; // MD 리포트 표기용
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// 위젯이 다루는 단일 데이터 모델. 서버/DB 없음 — 전부 localStorage에 평평하게 저장된다.

// W3C Web Annotation TextQuoteSelector — exact + 앞뒤 맥락으로 텍스트 위치를 기술.
// DOM 구조와 무관해 셀렉터가 깨져도 grep/검색으로 복원된다.
export interface TextQuote {
  exact: string; // 핀 요소 텍스트(공백 정리·≤160자)
  prefix?: string; // 직전 ≤32자
  suffix?: string; // 직후 ≤32자
}

// 접근성 로케이터 — 텍스트 없는 요소(아이콘 버튼 등)도 role+이름으로 식별.
export interface A11yLocator {
  role?: string;
  name?: string; // accessible name (aria-label / alt / label / 텍스트)
}

export type Anchor =
  | {
      type: "pin";
      selector: string;
      xPercent: number;
      yPercent: number;
      // 핸드오프 정확도용 — 같은 위치를 여러 방식으로 중복 기술(하나가 깨져도 복구).
      quote?: TextQuote; // ① 텍스트 인용(exact+앞뒤 맥락)
      a11y?: A11yLocator; // ② 역할+접근가능한 이름
      heading?: string; // 가장 가까운 상위/앞선 heading 텍스트(섹션)
      deepLink?: string; // ④ Text Fragment 딥링크(#:~:text=)
    }
  | { type: "page" };

// 스크린샷 메타. 실제 PNG blob은 IndexedDB(shots.ts)에, 여기엔 키·크기만.
export interface Shot {
  id: string; // IndexedDB 키 (= 코멘트 id)
  w: number;
  h: number;
}

export interface RvComment {
  id: string;
  pagePath: string; // location.pathname — 페이지 그루핑 키
  pageUrl: string; // 작성 시점의 전체 href
  anchor: Anchor | null; // pin | page (null은 들어오지 않지만 안전하게 허용)
  body: string;
  authorName: string; // MD 리포트 표기용
  shot?: Shot | null; // opt-in 스크린샷 메타 (blob은 IndexedDB)
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

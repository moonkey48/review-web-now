// 위젯이 다루는 단일 데이터 모델. 서버/DB 없음 — 전부 localStorage에 평평하게 저장된다.

// W3C Web Annotation TextQuoteSelector — exact + 앞뒤 맥락으로 텍스트 위치를 기술.
// DOM 구조와 무관해 셀렉터가 깨져도 grep/검색으로 복원된다.
export interface TextQuote {
  exact: string; // 클릭 요소의 OWN 텍스트(직속 Text 노드, 공백 정리·≤80자)
  prefix?: string; // 직전 ≤32자
  suffix?: string; // 직후 ≤32자
  // 섹션 내에서 exact가 유일하면 true(grep 1줄 기대), 중복이면 false, 판별 불가/측정불가면 undefined.
  // 힌트일 뿐 — DOM 유일성 ≠ 소스 grep 유일성. exact는 절대 이 값으로 변형하지 않는다.
  unique?: boolean;
}

// 접근성 로케이터 — 텍스트 없는 요소(아이콘 버튼 등)도 role+이름으로 식별.
export interface A11yLocator {
  role?: string;
  name?: string; // accessible name (aria-label / alt / label / 텍스트)
}

// 소스 포인터 — 최우선 앵커. data-* 속성(prod-safe) 또는 React fiber(dev)에서 best-effort 추출.
// MD 핸드오프 텍스트 전용 — 절대 buildSelector/resolveAnchor에 쓰지 않는다(휘발성/비셀렉터).
export interface SourceRef {
  component?: string; // 컴포넌트 이름 (예: "QueueItem")
  file?: string; // 소스 파일 경로 (예: "src/queue-item.tsx")
  line?: number; // 1-based 라인
}

export type Anchor =
  | {
      type: "pin";
      selector: string;
      xPercent: number;
      yPercent: number;
      // 핸드오프 정확도용 — 우선순위 순으로 같은 위치를 여러 방식으로 중복 기술(하나가 깨져도 복구).
      source?: SourceRef; // ① 소스 포인터(컴포넌트명/file:line) — best-effort, 최우선
      quote?: TextQuote; // ② 텍스트 인용(OWN 텍스트 exact+앞뒤 맥락)
      a11y?: A11yLocator; // ③ 역할+접근가능한 이름
      heading?: string; // 가장 가까운 보이는 상위/앞선 heading 텍스트(섹션, 약한 보조)
      deepLink?: string; // Text Fragment 딥링크(#:~:text=)
      vw?: number; // H4 — 캡처 시점 뷰포트 폭(lg: 분기로 요소 존재가 바뀌므로 필수)
      vh?: number; // H4 — 뷰포트 높이
      needsShot?: boolean; // H5 — 텍스트·접근가능한 이름 전무(빈 요소) → 스크린샷 권장 플래그
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
  pagePath: string; // normalized route key(pathname + query/hash, review query 제외) — 페이지 그루핑 키
  pageUrl: string; // 작성 시점의 전체 href
  anchor: Anchor | null; // pin | page (null은 들어오지 않지만 안전하게 허용)
  body: string;
  authorName: string; // MD 리포트 표기용
  shot?: Shot | null; // opt-in 스크린샷 메타 (blob은 IndexedDB)
  version?: string; // 리뷰 버전 태그(자유 문자열: 날짜·semver·임의 라벨). 구버전 페이로드엔 없어 optional; 읽을 때 "v0" 폴백.
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

# Reviewer — 로컬 전용 북마클릿 리뷰 도구 (재구성)

계획: `/Users/letsur/.claude/plans/squishy-sparking-flute.md` (승인됨)
방향: 백엔드 전면 제거 → localStorage 단일 저장 + MD 내보내기, 자기완결형 북마클릿 1개.

## 1. 서버 스택 제거
- [x] `src/`, `supabase/`, Dockerfile, next/postcss/env, `widget/api.ts` 삭제
- [x] `package.json` 축소 (preact + esbuild + typescript), `.gitignore` 정리

## 2. 위젯 로컬화
- [x] `types.ts` — `Anchor` + `RvComment` (평평한 모델, 답글/리액션/소유권 제거)
- [x] `store.ts` — localStorage CRUD (list/listAll/create/update/remove/clear/name)
- [x] `markdown.ts` — 코멘트 → 페이지 그루핑 MD (답글/리액션 렌더 제거)
- [x] `index.tsx` — bootstrap/토큰/fetch 제거, 북마클릿 토글 마운트, SPA 훅 유지
- [x] `app.tsx` — api 호출 → store, 답글/리액션/mine UI 제거, MD 복사·다운로드·전체삭제 추가
- [x] `styles.ts` — 리액션/답글 CSS 제거 + 내보내기 행 스타일 추가

## 3. 빌드 파이프라인
- [x] `build-widget.mjs` — esbuild(write:false) → dist/{widget.js, bookmarklet.txt, index.html}
- [x] `templates/index.html` — 북마클릿 드래그 + 사용법 + 데모 영역(widget.js 자동 로드)

## 4. 검증
- [x] `pnpm install` (deps: preact + esbuild + typescript 만 남음, sharp/unrs 등 정리)
- [x] `pnpm typecheck` (tsc -p widget) 통과
- [x] `pnpm test` (scripts/selftest.mjs) — store CRUD + MD 22개 단언 전부 통과
- [x] `pnpm build` → dist 3종 생성 (widget.js 41.1KB · bookmarklet 60.3KB)
- [x] 브라우저(Chrome): 위젯 마운트·콘솔 에러 0, 핀(#checkout-btn) + 페이지 코멘트 작성
- [x] 해결 토글(핀 회색·뱃지 갱신), 전체 탭, 페이지 코멘트 뱃지 확인
- [x] 새로고침 후 localStorage에서 코멘트·핀 복원
- [x] 북마클릿 on/off: remove() → 호스트 제거, 재주입 → 재마운트·핀 복원

## 5. 문서
- [x] README 재작성 (북마클릿 설치/사용/주의)
- [x] 리뷰 섹션 작성

## 리뷰

### 한 일
- **백엔드 전면 제거**: `src/`(대시보드·API·서버액션·lib), `supabase/`, Dockerfile, next/postcss/env 삭제.
  의존성 14+6개 → **3개**(preact, esbuild, typescript). 서버·DB·계정·CORS·토큰 0.
- **위젯 로컬화**: `api.ts`(네트워크) → `store.ts`(localStorage). 답글/리액션/소유권(mine) 제거로
  데이터 모델이 평평한 `RvComment[]`. `markdown.ts`를 위젯에 이식해 브라우저에서 MD 생성.
- **북마클릿 빌드**: esbuild(write:false) → `dist/{widget.js, bookmarklet.txt, index.html}`.
  위젯 코드 전체가 들어간 자기완결형 북마클릿(60KB) + 드래그·데모 랜딩 페이지.
- **재클릭 토글**: `window.__REVIEWER__`로 켜짐 감지 → 재주입 시 끄기. SPA 히스토리 훅은 window 플래그로 1회만.

### 결과
- 핀/페이지 코멘트 작성·수정·삭제·해결, 페이지 그루핑 MD 복사·다운로드, 전체 삭제까지 동작.
- 새로고침·다른 탭 간 localStorage 동기화. 네트워크 요청 0.

### 한계/주의 (README에 명시)
- CSP 엄격 사이트는 북마클릿 주입 차단 가능 → 스크립트 태그 대안.
- Safari 북마클릿 URL 길이 제한 가능. http 비보안 페이지 클립보드는 다운로드 폴백.
- MD는 단방향 전달(받는 쪽에서 핀 복원 X) — 사용자가 "전달만"으로 합의한 범위.

## 6. 노출 제어 게이트 (추가 요청)

문제: 스크립트 태그로 배포 시 일반 사용자에게 위젯이 보이면 안 됨.
방식: **C안 — 초대 링크 게이트** (서버 없이 localStorage).

- [x] `index.tsx` `shouldMount()` — 스크립트 태그 경로는 `?review` 또는 `rv:enabled` 있을 때만 마운트.
      `?review` 1회 방문 → `rv:enabled=1` 저장 + URL에서 파라미터 제거.
- [x] 북마클릿/데모는 `window.__RV_FORCE__`로 게이트 건너뜀 (항상 표시).
      빌드가 북마클릿을 `(function(){"use strict";window.__RV_FORCE__=1; …번들… })()`로 래핑.
- [x] "위젯 닫기"(remove) → `rv:enabled` 해제(스크립트 태그 모드에서 영구 끔).
- [x] 데모 index.html: `__RV_FORCE__=1` 인라인으로 항상 표시. README/index.html 팀 배포 안내.
- [x] 브라우저 검증: ①plain=안뜸 ②?review=1→뜸·플래그·파라미터 제거 ③새로고침 유지
      ④닫기→플래그 해제 ④b새로고침=안뜸 ⑤실제 북마클릿 payload 강제 마운트. 전부 통과.

## 7. 범용 배포 — 쉬운 튜토리얼/설치 (추가 요청)

- [x] `templates/index.html` 전면 개편: 드래그 설치 존 + "북마클릿 코드 복사" 폴백 +
      60초 사용법 스텝카드 + 라이브 데모(여기서 바로 핀) + 팀 적용(스니펫 복사) + FAQ.
- [x] `scripts/serve.mjs` (의존성 0, Node http) + `pnpm preview`(빌드+서빙) 추가.
- [x] README 퀵스타트를 `pnpm preview` 중심으로 갱신, dist/index.html = 배포 페이지 안내.
- [x] 브라우저 검증: 플레이스홀더 치환 OK, 위젯 자동표시(__RV_FORCE__),
      복사 버튼 3종이 각각 북마클릿/스크립트태그/초대링크를 정확히 복사(스파이로 확인).

## 8. 설치 쉽게 (README 정정 + AI 프롬프트 + Claude Code 스킬)

문제: README가 북마클릿을 기본처럼 써서 "사이트 접속하면 북마크가 생기나?" 혼란.
- [x] README 전면 정정: **방법 A(스크립트 태그·권장)** vs **방법 B(북마클릿)** 명확히 분리.
      상단에 "웹사이트는 북마크를 못 만든다(자동 생성 X)" 경고 추가. 스크립트 태그 중심으로 재구성.
- [x] **AI 설치 프롬프트** 추가 — 코딩 에이전트에 붙여넣으면 자동 설치(README + 튜토리얼 페이지 복사 버튼).
- [x] **Claude Code 스킬** `.claude/skills/reviewer-install/`(SKILL.md + 동봉 widget.js).
      빌드가 widget.js를 스킬 폴더에 동기화. 다른 프로젝트에선 폴더를 ~/.claude/skills/로 복사해 사용.
- [x] 검증: 빌드→스킬 widget.js 동기화 OK, 프롬프트 복사 버튼이 전체 프롬프트 정확히 복사(스파이).
- [x] 스테일 `pnpm-workspace.yaml` 제거(빌드 승인은 package.json `pnpm.onlyBuiltDependencies`로). clean install 확인.

## 9. `?review=<이름>` 초대 링크 동작 수정

요구사항:
- `review` 쿼리 뒤의 값을 잠금 팝업의 이름 입력칸에 자동 채움.
- 스크립트 태그 모드에서는 URL에 `review` 쿼리가 있을 때만 리뷰 입장 화면을 노출.
- 기존 `rv:enabled` 저장값만으로 일반 URL에서 위젯/입장 화면이 자동 표시되지 않게 함.

계획:
- [x] `widget/index.tsx` 게이트를 `review` 쿼리 존재 여부 중심으로 단순화
- [x] `review` 쿼리 값을 디코딩/정리해 `App` → `Lock` 초기 이름으로 전달
- [x] 잠금 해제 시 `rv:enabled`을 더 이상 쓰지 않도록 정리
- [x] README의 초대 링크/재방문 설명을 새 동작에 맞게 수정
- [x] `pnpm typecheck`, `pnpm test`, `pnpm build` 검증

검토:
- `?review=<이름>` 값을 `parseReviewInvite()`로 읽어 잠금 화면 이름 초기값에 우선 적용.
- 기존 `rv:enabled` 기반 자동 노출을 제거해 스크립트 태그 모드는 URL에 `review` 쿼리가 있을 때만 마운트.
- README, 설치 페이지, Claude Code 설치 스킬 안내를 `?review=<리뷰어이름>` 기준으로 갱신.
- `tasks/lessons.md`에 review 쿼리 기반 노출 규칙과 이름 자동 채움 규칙 기록.
- 검증:
  - `pnpm typecheck` 통과
  - `pnpm test` 통과: 28 passed, 0 failed
  - `pnpm build` 통과: `dist/widget.js`, `dist/index.html`, `.claude/skills/reviewer-install/widget.js` 생성
  - headless Chrome smoke:
    - `file:///private/tmp/reviewer-gate.html` + `rv:enabled=1` → `host=0`
    - `file:///private/tmp/reviewer-gate.html?review=홍길동` → `host=1`, `name=홍길동`

## 10. 핸드오프 정확도 — 텍스트 앵커 + 스크린샷 opt-in (추가 요청)

배경: MD 리포트만 받았을 때 사람/Claude Code/Codex가 핀 위치를 정확히 재인지하도록.
- 셀렉터(렌더 DOM)는 소스 레포에서 환원 불가 → **인용 텍스트 + 섹션 heading**을 같이 실어 grep 가능하게.
- 스크린샷은 **기본 OFF · 작성 시 체크박스로 opt-in**. (사용자 합의)

결정사항:
- 저장: **A안 — File System Access(폴더 1회 선택 후 자동)**. 무팝업 Desktop 자동 저장은 웹 샌드박스 한계로 불가.
- 캡처 라이브러리: **html2canvas CDN 지연 로드 + `window.__RV_H2C_URL__` 오버라이드**(자가호스트 시 네트워크 0).
- blob은 **IndexedDB**(localStorage 용량 초과 사고 방지), 코멘트엔 메타(id·w·h)만.
- 전달: FS Access 폴더에 `review.md` + `images/<id>.png`. 미지원 브라우저는 **의존성 0 store-zip** 다운로드.

작업:
- [x] `types.ts` — `Anchor.pin`에 `text?`/`heading?`, `Shot` 타입, `RvComment.shot?`
- [x] `anchor.ts` — `buildAnchor`가 요소 텍스트(≤160자)+가까운 heading 캡처
- [x] `shots.ts`(신규) — IndexedDB blob CRUD(put/get/delete/clear/getMany)
- [x] `capture.ts`(신규) — html2canvas 지연 로드 + 요소→PNG blob (위젯 host 숨김)
- [x] `exportFiles.ts`(신규) — FS Access 폴더 저장 + store-only zip 폴백
- [x] `store.ts` — `setShot(id, shot)`
- [x] `markdown.ts` — 섹션/인용/스크린샷(`![](images/..)`) 라인 추가
- [x] `app.tsx` — Composer 스크린샷 체크박스(기본 OFF)·async 캡처·Detail 썸네일·Panel 폴더내보내기·삭제 시 blob 정리
- [x] `styles.ts` — 체크박스·썸네일 스타일
- [x] `selftest.mjs` — 섹션/인용/스크린샷 MD 단언 추가
- [x] 검증: typecheck / test / build / 실브라우저 스모크

검토:
- 핸드오프 정확도: 핀에 `text`(인용)+`heading`(섹션)을 같이 저장해 MD에 노출 →
  셀렉터가 깨져도 grep/검색으로 위치 재인지. `markdown.ts`가 `섹션:`/`인용:` 라인 추가.
- 스크린샷(기본 OFF, 작성 폼 체크박스): 등록 후 비동기로 html2canvas 지연 로드 → 핀 요소만 PNG →
  IndexedDB(`rv-shots`)에 blob, localStorage엔 메타(id·w·h)만. 삭제/전체삭제 시 blob도 정리.
- 내보내기: `🖼 스크린샷 포함 내보내기` → FS Access 폴더(`review.md`+`images/<id>.png`) 우선,
  미지원 시 의존성 0 store-zip 다운로드. MD는 `![#n](images/<id>.png)` 상대경로 참조.
- 결정/한계:
  - 무팝업 Desktop 자동 저장은 웹 샌드박스상 불가 → FS Access 폴더 1회 선택(세션 유지)으로 실현.
  - html2canvas는 번들에 넣으면 북마클릿 초과 → CDN 지연 로드(+`__RV_H2C_URL__` 자가호스트 오버라이드).
  - 번들 41.1→54.4KB, 북마클릿 60.3→**79.4KB**(64KB Safari 주의선 초과). 스크립트태그 설치엔 영향 없음.
- 검증:
  - `pnpm typecheck` 통과 (Uint8Array<ArrayBuffer> 제네릭 1건 수정)
  - `pnpm test` 통과: **32 passed, 0 failed** (섹션/인용/스크린샷 단언 포함)
  - `pnpm build` 3종 산출
  - 실브라우저(Chrome) 스모크: 콘솔 에러 0 · 핀 text/heading 캡처 ·
    html2canvas CDN 로드 · 실 PNG(1337B, magic 검증) IndexedDB 저장 ·
    shot 메타 localStorage 반영 · 패널 `스크린샷 포함 내보내기`(이미지 1장) · `showDirectoryPicker` 지원 확인

## 11. 다층 중복 앵커 (즉시·번들 0) — 리서치 권고 도입

배경: 리서치 워크플로(23 에이전트) 권고 — 단일 셀렉터가 아닌 "다층 중복 앵커"로 위치 표현.
북마클릿은 raw 바이트를 싣어 라이브러리 정적 포함 금지 → 순수 DOM/문자열 자체 구현만 "즉시" 채택.

- [x] `types.ts` — `Anchor`에 `quote{exact,prefix,suffix}`·`a11y{role,name}`·`deepLink`, (기존 `text`→`quote` 마이그레이션)
- [x] `anchor.ts` — ① TextQuoteSelector(Range로 앞뒤 ±32자) ② role+accessible name 미니구현 ④ Text Fragment 딥링크. 모두 의존성 0
- [x] `markdown.ts` — 섹션/요소(역할·이름)/인용(exact+맥락)/위치/딥링크/스크린샷 순 + 상단 해석 가이드
- [x] `capture.ts` — ⑧ 부모 contextRoot 캡처 + 빨강 박스·번호 배지 주석(흰 halo 대비)
- [x] `app.tsx` — 캡처 시 핀 번호 배지 전달
- [x] `selftest.mjs` — 요소/인용(맥락)/딥링크/fallback/가이드 단언
- [x] 검증: typecheck · test(37/37) · build · 실브라우저 스모크
  - 실 `<button>`에서 a11y{role:button,name:결제하기}·quote(exact+prefix/suffix)·deepLink·heading 생성 확인
  - 스크린샷이 부모 카드 맥락 + 빨강 박스·"1" 배지로 주석돼 IndexedDB 저장됨(시각 확인)
  - **버그 발견·수정**: html2canvas 반환 캔버스 직접 드로잉이 export에 반영 안 됨 → 새 캔버스 drawImage 복사 후 주석
- [x] 적대적 코드리뷰 워크플로(31 에이전트·4차원→발견별 검증): 발견 27건 중 **검증된 진짜 버그 18건** → 17건 수정

### 리뷰 반영 (수정한 버그)
- **마크다운 인젝션/이스케이프(최다·핵심)**: 페이지 파생 텍스트(인용 exact/prefix/suffix·a11y name·heading)와 page를 `escMd()`로 메타문자 무력화, 딥링크 URL은 `escUrl()`로 괄호 인코딩. → 핀한 콘텐츠가 리포트에서 링크/이미지/구조로 해석되는 것 차단(`markdown.ts`). selftest 인젝션 단언 5건 추가.
- **SPA 캡처 레이스(`app.tsx`)**: 캡처 시작 시점에 path·badge 고정, await 후 `pathRef!==capturePath || !target.isConnected`면 첨부 스킵 → 옛 노드/엉뚱한 페이지 첨부·잘못된 배지 방지.
- **`putShot` 실패 은폐(`shots.ts`/`app.tsx`)**: boolean 반환 → 실패 시 메타 저장 안 하고 토스트 → 깨진 `![](images/..)` 참조 방지.
- **`contextAround`(`anchor.ts`)**: el이 section/article 자체일 때 Range 경계 역전 → 조상에서만 컨테이너 탐색 + 가드.
- **`accName`(`anchor.ts`)**: `input[type=image]` alt 누락 보강, 컨테이너 역할(nav/list 등)은 자손 텍스트를 이름으로 안 씀.
- **`nearestHeading`**: 형제 서브트리에서 핀에 가까운 '마지막' heading 선택.
- **`textFragmentLink`**: exact 말줄임(…) 제거 후 fragment 생성.
- **`contextRoot`/`annotate`(`capture.ts`)**: width/inline/el-꽉참 가드 + 박스 좌표 캔버스 경계 clamp.
- 보류(저영향 엣지): 스크린샷 배지 번호 삭제 후 UI와 드리프트(래스터 고착·본질적), zip64 4GB 한계.
- 검증: typecheck · **selftest 42/42** · build · 실브라우저 재검(앵커 생성·스크린샷 박스·배지 무회귀 확인)

## 12. v0.4.1 CDN 태그 배포

목표: 설치 스크립트에서 `@v0.4.1`로 고정해 쓸 수 있도록 원격 `main` 최신 커밋에 Git 태그를 만들고 jsDelivr 서빙을 검증한다.

- [x] 원격 `main` 최신 커밋과 기존 태그 확인
- [x] `v0.4.1` 태그를 원격 `main` 커밋에 생성
- [x] `v0.4.1` 태그를 origin에 push
- [x] jsDelivr `@v0.4.1/dist/widget.js` 응답 확인

검토:
- `v0.4.1` annotated tag를 PR #4 머지 커밋 `7282a1c0a6bfb1e3a3d94603029272fc1e1d3451`에 생성.
- `git push origin v0.4.1`로 원격 태그 배포 완료.
- jsDelivr 확인: `https://cdn.jsdelivr.net/gh/moonkey48/review-web-now@v0.4.1/dist/widget.js`가 HTTP 200, `x-jsd-version: 0.4.1`, `content-length: 61169`로 응답.
- SRI: `sha384-iYtv/hV7zgzzemTPIps7JgREUYBOWctnaiLCE34zJ5WjeIEhQbiPwXMdzoWeydt0`

## 13. README/CDN 설치 안내 버전 고정

목표: 설치 문서가 `@main` 대신 immutable 버전 태그(`@v0.4.1`)를 안내하도록 바꾸고, 버전 관련 수정 때 README를 함께 갱신하는 규칙을 남긴다.

- [x] README와 설치 페이지 템플릿의 `@main` 안내 확인
- [x] README 설치 스니펫/AI 프롬프트/개발 안내를 버전 태그 기준으로 수정
- [x] `templates/index.html` 복사 스니펫과 AI 프롬프트를 버전 태그 기준으로 수정
- [x] 버전/CDN 변경 시 README 갱신 규칙을 `tasks/lessons.md`에 추가
- [x] 빌드 및 검색으로 `@main` 안내 잔존 여부 검증

검토:
- README 설치 스니펫과 AI 설치 프롬프트를 `@v0.4.1` + SRI(`sha384-iYtv/hV7zgzzemTPIps7JgREUYBOWctnaiLCE34zJ5WjeIEhQbiPwXMdzoWeydt0`) 기준으로 수정.
- 설치 페이지 템플릿(`templates/index.html`)의 복사 스니펫과 AI 프롬프트도 같은 버전 고정 URL로 수정.
- 공개 문서에서는 브랜치 기준 설치 문자열을 제거하고 "브랜치 별칭 대신 버전 태그"로 안내.
- `tasks/lessons.md`에 버전/CDN 변경 시 README와 설치 페이지 템플릿을 함께 갱신하는 규칙 추가.
- 검증: `pnpm build` 통과. `rg -n "review-web-now@main|@main" README.md templates/index.html dist/index.html` 결과 없음.

## 14. 스크린샷 첨부 내보내기 누락 개선

문제:
- 스크린샷 체크 후 캡처가 비동기로 진행되는 동안 바로 MD 복사/다운로드를 누르면, 캡처 메타가 아직 코멘트에 붙지 않아 리포트에서 스크린샷 줄이 빠질 수 있다.
- 일반 `MD 다운로드`는 텍스트 파일만 내려받아 사용자가 스크린샷도 포함된다고 기대하기 어렵다.

계획:
- [x] 진행 중인 스크린샷 캡처 작업을 추적하고, 복사/다운로드/파일 내보내기 전에 완료를 기다린다.
- [x] 다운로드 버튼은 첨부 이미지가 있으면 `review.md + images/*.png` ZIP을 내려받도록 변경한다.
- [x] 패널에 스크린샷 처리 중/이미지 포함 상태를 명확히 표시한다.
- [x] README와 설치 페이지 안내를 새 다운로드 동작에 맞게 수정한다.
- [x] `pnpm typecheck`, `pnpm test`, `pnpm build`로 검증한다.

검토:
- 캡처 작업을 `captureJobs` ref로 추적하고 `pendingShots`를 패널에 표시.
- `copyMd`, `downloadMd`, `exportFilesWithShots`는 내보내기 전에 진행 중인 캡처를 `waitForCaptures()`로 기다린다.
- 일반 다운로드는 첨부 이미지가 있으면 `review-*.zip`을 내려받고, ZIP 안에 `review.md`와 `images/<id>.png`를 함께 넣는다. 이미지가 없으면 기존처럼 `.md` 단일 파일을 내려받는다.
- 폴더 저장 버튼은 이미지가 있을 때 보조 액션으로 유지.
- README와 설치 페이지 템플릿에 "스크린샷이 있으면 다운로드가 ZIP으로 내려받음" 안내 추가.
- 다음 CDN 태그용 새 번들 SRI: `sha384-IPjPyGlrBhgxVG0a9uJ0Xo6yhQPndMM6M0pBhsX8hG6lDPExPOSjltZ94E3eApf0`
- 검증:
  - `pnpm typecheck` 통과
  - `pnpm test` 통과: 42 passed, 0 failed
  - `pnpm build` 통과
  - `rg -n "review-web-now@main|@main" README.md templates/index.html dist/index.html` 결과 없음

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

## 15. v0.4.2 CDN 태그 배포

목표: 스크린샷 내보내기 누락 수정까지 포함한 설치 버전을 `v0.4.2`로 배포하고, 앞으로 배포 시 항상 새 버전 태그 기준으로 안내하는 규칙을 확정한다.

- [x] 원격 태그에 `v0.4.2`가 없는지 확인
- [x] README와 설치 페이지 템플릿을 `@v0.4.2` + 새 SRI로 갱신
- [x] 배포 요청 시 새 SemVer 태그를 만들고 설치 스크립트를 그 태그 기준으로 안내하는 규칙을 `tasks/lessons.md`에 추가
- [x] 빌드/검색 검증
- [x] 문서 갱신 커밋 push
- [x] `v0.4.2` 태그 생성/푸시
- [x] jsDelivr `@v0.4.2/dist/widget.js` 응답 및 SRI 검증

검토:
- `pnpm typecheck` 통과
- `pnpm test` 통과: 42 passed, 0 failed
- `pnpm build` 통과
- `rg -n "review-web-now@main|@main" README.md templates/index.html dist/index.html` 결과 없음
- `dist/widget.js` SRI: `sha384-IPjPyGlrBhgxVG0a9uJ0Xo6yhQPndMM6M0pBhsX8hG6lDPExPOSjltZ94E3eApf0`
- 문서 갱신 커밋 `4015a8e` push 완료.
- `v0.4.2` annotated tag 생성 및 push 완료. 태그 peel 대상: `4015a8e14835e472812f8bac05ff40bfc3607aa4`.
- jsDelivr 확인: `https://cdn.jsdelivr.net/gh/moonkey48/review-web-now@v0.4.2/dist/widget.js`가 HTTP 200, `x-jsd-version: 0.4.2`, `content-length: 62367`로 응답.
- CDN 파일을 내려받아 sha384 계산 결과가 README의 integrity 값과 일치함.

## 16. v0.4.3 — 핸드오프 앵커 정확도 (테스터 피드백 5휴리스틱 + 소스포인터)

배경: 0.4.2로 실측한 리뷰 정확도 피드백 — "DOM을 손으로 풀지 않아도 소스로 바로 가는 앵커가
한 핀에 들어있어야 한다." 앵커 우선순위(best→worst): ①소스포인터(file:line/컴포넌트명)
②최단 유일 보이는 텍스트 ③role+이름 ④작성자 id/data-testid ⑤CSS nth-of-type(최후수단).
프레임워크 자동 id(base-ui-_r_*, react-aria-*)·거대 인용·숨은-heading 섹션은 신뢰 불가 → 제외.

리서치/적대적 검증 결론 (피드백 가정 대비 정정 3건):
- **R19 현실**: 타깃은 React 19.2(`base-ui-_r_3_`가 19.2 useId 형식). React 19가 `_debugSource`를
  제거(PR #28265) → **수동 북마클릿에서 fiber로 진짜 file:line 추출 불가**. prod 빌드에선
  컴포넌트명도 난독화(`a`,`Lh`). ⇒ 소스포인터는 "dev/속성 best-effort"로만, hero 아님.
  진짜 file:line은 타깃 팀이 `data-source="file:line"` 빌드 플러그인을 심어야만 가능.
- **shortestUniquePrefix 컷**: DOM 유일성 ≠ 소스 grep 유일성. 인용을 줄이면 오히려 원본
  리터럴 grep이 나빠짐 → 줄이지 말고 OWN 텍스트 전체(≤80)를 싣되 `unique`는 힌트로만.
- **body.innerText 인덱스 컷**: 임의 큰 페이지에서 매 클릭 full reflow → 잰크. 기존 Range
  기반 `contextAround`로 충분.
- **H5 자동 캡처 컷**: 빈 요소라고 자동 스크린샷하면 html2canvas CDN 강제 fetch + 프라이버시
  → opt-in 기본 ON + 사유 안내(`needsShot` 플래그)로 대체.

마이그레이션: 새 필드 전부 optional·additive. `store.create`가 anchor를 verbatim 직렬화,
`resolveAnchor`/`scrollToAnchor`는 `anchor.selector`만 읽음 → 구버전 핀 무손상. `source`/`vw`는
**절대 buildSelector에 넣지 않음**(셀렉터 재해석 깨짐 방지).

### P0 — must-ship (알려진 타깃의 실 버그 + 5휴리스틱 직접 해결)
- [ ] **P0-1 (H3) `anchor.ts segment()` 생성-id 게이트**: `node.id` 맹신 중단. `isGeneratedId()`
      (useId `:r:/«r»/_r_`·base-ui/mui/radix/react-aria/headlessui·emotion css-*·uuid·40자+ 해시)
      추가. 우선순위 재정렬: 작성자 id(비생성·유일) > data-testid/test/qa/cy(유일) >
      name/aria-label(비생성·유일) > 시맨틱 태그 > nth-of-type(최후수단). 라이브 버그:
      현재 `#base-ui-_r_3_`를 terminal 셀렉터로 방출 → 리로드 시 resolveAnchor 깨짐.
- [ ] **P0-2 (H2) `anchor.ts textQuote()` OWN 텍스트 + 클릭 좁히기**: `el.textContent`(서브트리
      전체→배너+헤더+카드 연결) → `ownText()`(직속 Text 노드만, ≤80자). `narrowToOwnText(el,x,y)`로
      클릭한 leaf 재타깃(보이는 자식 BFS, point-in-rect 최소면적, 노드 2000개 캡). input→placeholder,
      img→alt. `contextAround` 재사용. **인용은 줄이지 않고 전체 방출**(shortener 컷).
- [ ] **P0-3 (H1) `anchor.ts nearestHeading()` 가시성 게이트**: `isHidden()`(display:none/
      visibility:hidden/opacity:0/getClientRects().length===0[lg:hidden 포괄]/[hidden]/
      [aria-hidden]) 통과한 heading만. offsetParent 분기는 fixed/sticky 오판 → 미사용.
      `accName`도 생성-id aria-label/name 거부.
- [ ] **P0-4 (H4) 뷰포트 폭**: Anchor에 `vw?`/`vh?` 추가, `buildAnchor`에서 `window.innerWidth/Height`,
      MD에 `뷰포트: 1440×900` 렌더. lg: 분기로 요소 존재가 바뀌므로 필수.
- [ ] **P0-5 스키마+MD 필드 재정렬**: `types.ts` `SourceRef` + Anchor optional 필드(`source?`,
      `vw?`,`vh?`,`needsShot?`). `markdown.ts` 핀 블록 순서 = 소스 → 인용 → 역할/이름 → 셀렉터 →
      뷰포트 → (게이트된)섹션 → needsShot. 상단 가이드도 새 순서로.

### P1 — nice-to-have (예산 되면, 중복 앵커 뒤에서 best-effort)
- [ ] **P1-1 `react-source.ts`(신규 ~30줄)**: `reactSource(el)` — ①심어둔 data-component/
      data-source/data-locatorjs-id(조상 ≤6, prod-safe 유일경로) ②`_debugSource` file:line(R≤18 dev)
      ③fiber.type 언래핑 컴포넌트명(R19 dev 포함, forwardRef+memo만). `goodName` 잡음 거름. throw 금지,
      prod R19에선 undefined(정상). **buildSelector 절대 미사용.** bippy/captureOwnerStack/_debugOwner/
      lazy 재귀 컷. → 타깃 팀에 dev/preview용 `data-source` 빌드 플러그인 권고 기록.
- [ ] **P1-2 (H5) `needsShot` 플래그(자동 캡처 X)**: `buildAnchor`에서 `!quote && !a11y.name`이면
      `needsShot:true`. `Composer` 스크린샷 체크박스 기본 ON + "빈 요소 — 스크린샷 권장" 안내.
      MD에 ⚠ 라인. **사용자 동의 전 html2canvas fetch 없음.** `capture.ts` 무변경.
- [ ] **P1-3 `quote.unique` 힌트(싸게만)**: MD 인용 줄에 "grep 1줄 기대" vs "중복 — 맥락/셀렉터
      확인". `contextAround` 루트 텍스트 한정 bounded indexOf만(body.innerText reflow 금지).
      `exact` 절대 변형 안 함.

### P2 — defer
- [ ] 진짜 R19 fiber file:line — 수동 북마클릿 불가. 타깃이 data-source 플러그인 심으면 P1-1이 소비.
- [ ] captureOwnerStack/bippy/component-stack 심볼리케이션 — 타깃 빌드 플래그+강제 리렌더 필요.

### 검증 체크리스트
- [ ] 빌드/사이즈: `pnpm build` 통과, 북마클릿 예산 내, html2canvas 정적 import 0,
      `reactSource`/`vw`/`source`가 buildSelector/segment/resolveAnchor에 안 들어감(grep).
- [ ] H3: `id="base-ui-_r_3_"` 요소 → 셀렉터가 `#base-ui-_r_3_` 아님, 리로드 후 resolveAnchor 재발견.
      `isGeneratedId` 단위: `:r0:`/`«r17»`/`_r_8_`/`react-aria-:r4:`/`css-1a2b3c4`/uuid→true,
      `submit-btn`/`main-nav`/`userEmail`→false.
- [ ] H2: 카드 래퍼 클릭→leaf OWN 텍스트만(연결 X)·≤80, 한글 리터럴 grep ~1줄. input→placeholder,
      img→alt, 텍스트 없는 아이콘→quote undefined. body.innerText 호출 0, 2000노드 캡.
- [ ] H1: lg:hidden/aria-hidden 배너 heading 미첨부, 실제 보이는 fixed/sticky heading은 잡힘.
- [ ] H4: 새 핀에 vw/vh 기록, MD에 `뷰포트` 표시.
- [ ] P1-1: dev 빌드→컴포넌트명(≤18은 file:line) MD `소스:` 노출, prod R19→undefined(난독화명 X)·throw X.
      심어둔 `data-source="src/X.tsx:42"`→`{file,line}` 파싱(윈도우 `C:` 보호).
- [ ] H5: 텍스트·이름 없는 아이콘→`needsShot:true`, 체크박스 기본 ON, 취소 시 CDN 요청 0.
- [ ] 구버전 localStorage 로드(소스/vw/needsShot 없음): 핀 resolve·MD 렌더 정상, 마이그레이션 0.
- [ ] selftest 단언 추가(생성-id 거부·OWN 텍스트·뷰포트·필드 순서), 실브라우저 스모크.

파일: `types.ts`(스키마) · `anchor.ts`(P0-1/2/3/4 + P1-1 호출) · `markdown.ts`(필드 재정렬+뷰포트+
소스+needsShot) · `app.tsx`(P1-2 Composer) · **신규** `react-source.ts`(P1-1) · `selftest.mjs`.
`capture.ts` 무변경 · `store.ts` 코드 무변경(스키마 버전 주석만).

### 결과/검토 (v0.4.3)
- **P0 전부 구현**: H3 생성-id 게이트+우선순위(`segment`), H2 OWN 텍스트+클릭 narrow(`textQuote`/`ownText`/
  `narrowToOwnText`), H1 가시성 게이트(`nearestHeading`/`isHidden`/`visibleHeading`), H4 뷰포트(`vw`/`vh`),
  스키마+MD 필드 재정렬(소스→인용→역할/이름→셀렉터→뷰포트→섹션→needsShot). `accName` aria-label 생성-id 거부.
- **P1 전부 구현**: `react-source.ts`(data-* 우선 → `_debugSource`(R≤18 dev) → fiber 컴포넌트명, throw 없음,
  buildSelector 미사용), `needsShot` 플래그+Composer 기본 ON+사유 안내(자동 캡처 X), `quote.unique` 힌트
  (섹션 한정 bounded indexOf, exact 불변).
- **data-source 플러그인(P1+)**: 타깃 앱(/studio/image)이 이 워크스페이스에 없어 직접 주입 불가 →
  적용 레시피 `docs/source-pointer-setup.md`로 전달(Next16 Turbopack 주의 + react-dev-inspector 1안 +
  미니 Babel 플러그인 2안). 위젯은 data-component/data-source/data-inspector-*를 이미 소비.
- **적대적 검증 반영(컷)**: shortestUniquePrefix(역효과), body.innerText 인덱스(reflow 잰크), H5 자동 캡처
  (프라이버시), isVisible offsetParent 분기(fixed/sticky 오판), _debugOwner/lazy 재귀(번들) — 전부 미채택.
- **검증**: `pnpm typecheck` 통과 · `pnpm test` **50 passed / 0 failed**(소스/뷰포트/unique/needsShot/순서 단언 추가)
  · `pnpm build` 통과(widget.js 66.2KB) · 실브라우저(Playwright headless, 1440×900) 크래프트 DOM **13/13 통과**
  (H1 숨은 heading 제외·보이는 heading 채택, H2 OWN 텍스트 연결 X, H3 base-ui/mui id 미사용, H4 vw/vh,
  H5 빈 요소 needsShot, data-source 파싱, input placeholder, non-React 안전). `scripts/anchor-browsertest.mjs`.
- **마이그레이션**: 신규 필드 additive·optional, `resolveAnchor`/`scrollToAnchor`는 selector만 읽어 구버전 핀
  무손상(selftest의 구형 anchor가 그대로 렌더). `source`/`vw`는 buildSelector/resolveAnchor에 미사용.
- **배포**: v0.4.3 — dist SRI `sha384-QG4rehFXJ+Nyy21ybfqqoGTW27wAAmdgK3Mn6ab3dW64fApum54tiC+MZYnV+g1e`,
  README+설치페이지 `@v0.4.3`+새 SRI 갱신, 잔존 `0.4.2` 0건. 태그 생성/푸시 후 jsDelivr 검증.

## 17. 버전 관리 (version management) — 계획 (구현 대기)

요구사항(사용자): 리뷰에 버전(날짜/semver/임의 라벨) 태깅 · 버전별 표시 on/off · 버전별 색 구분
(현재 버전 강조) · 여러 버전 동시 보기. **DB 없음(localStorage 전용)**.

확정 결정: ①컬러=버전별(현재=인디고 시그니처, 그 외 팔레트) ②현재 버전(태그)과 표시(멀티선택)는
**분리** ③기존 v0.4.x 무버전 리뷰는 시작 버전 `v0`로 일괄 마이그레이션.

설계 워크플로(5에이전트 병렬설계+적대적검증) 결과 — **충돌 정리(적대적 검증이 이김)**:
- **색 안정성(최중요)**: 정렬-인덱스(D3)·persisted color map+현재 skip-seed(D2) 둘 다 bump 시 색
  reshuffle 버그. → **단일 `rv:versions` append-only 레지스트리 + `palette[indexOf]` 고정색**,
  **현재=인디고는 렌더타임 오버레이**(레지스트리 소비/변형 안 함). bump해도 다른 버전 색 불변.
- **마이그레이션**: `loadAll` 안(D2) 거부 → **부팅 시 `store.migrate()` 1회**(write→verify→guard,
  사생활 모드 부분실패 시 가드 미기록·다음 부팅 재시도). 2탭 동시는 멱등+whole-array atomic이라 benign.
- **`clear()` 버그(전원 놓침)**: `rv:comments`만 지움 → "전체 삭제" 후 stale 빈 visible-set이 새 핀을
  숨김. → clear()가 버전 키 전부 정리.
- **컷**: 별도 `versions.ts`(비교자는 범례 정렬용 cosmetic, 색에 미사용) · persisted color map ·
  djb2 해시 오버플로 · per-pin `isVersionVisible` localStorage 읽기 · MD 헤더 버전 요약 · 초대 `&v=`.

### 최종 localStorage 스키마
| key | type | 의미 |
|---|---|---|
| `rv:comments` | `RvComment[]` | 불변. 각 항목에 optional `version` 추가. |
| `rv:version` | string | 현재(스탬프) 버전 — 새 리뷰에만 찍힘. init `"v0"`. 자유 텍스트. |
| `rv:visibleVersions` | JSON string[] | 표시 멀티선택. **부재=전체보기 센티넬**, `[]`=모두 끔. |
| `rv:versions` | JSON string[] | **append-only** 레지스트리 = 색 인덱스+범례 멤버십 단일 소스. |
| `rv:schema` | string(int) | 마이그레이션 가드. `<SCHEMA`면 migrate(); 끝나면 기록. |

`SEED_VERSION="v0"`, `SCHEMA=1`, `SIGNATURE="#6366f1"`,
`PALETTE=["#0ea5e9","#16a34a","#d97706","#ec4899","#8b5cf6","#ef4444","#14b8a6","#a16207"]`.
공통 코얼레스: `c.version && c.version.trim() ? c.version : "v0"`(빈 문자열도 v0).

### P0 — 핵심 (must ship)
- [ ] **types.ts**: `RvComment`에 `version?: string` 1개 추가(additive·optional, 구버전 무손상).
- [ ] **store.ts**: 키/`readStrArr`/`verOf` + `getVersion`/`setVersion`(append-only register)/
      `getKnownVersions`/`readVisibleRaw`(센티넬 보존)/`setVisibleVersions`/`colorFor(v,current)`
      (현재=SIGNATURE, 그 외 `PALETTE[indexOf(rv:versions)%len]`). `create()`에 `version:getVersion()`
      1줄. **`migrate()`**(멱등·write→verify→guard). **`clear()` 확장**(버전 키 전부 제거).
- [ ] **index.tsx**: 게이트 통과 후 mount 전에 `store.migrate()` 1회.
- [ ] **app.tsx**: `curVer`/`visRaw(null|[])` state, `verCounts`/`allVersions`/`visibleSet` memo(1회 계산,
      per-pin 읽기 금지), `setCurVer`/`toggleVisible`(센티넬 보존). 핀 memo는 **per-page 번호(index) 매긴
      뒤** 버전 필터(번호 안 흔들림), 핀에 `--rv-c` 주입+`colorFor`. Panel `filtered`에 visibleSet 적용,
      item-num에 `--rv-c`. `.rv-panel-sub` 뒤 **VersionBar**(현재 선택 datalist + 범례겸 멀티선택
      [체크][스와치][라벨+현재태그][카운트]). export(`prepareExport`)는 전체 그대로(표시는 뷰 필터일 뿐).
- [ ] **styles.ts**: `.rv-pin`/`.rv-item-num` `background:var(--rv-c,#6366f1)`(resolved-gray·active-outline는
      뒤 규칙이라 유지), 정적 rgba outline(color-mix 금지), `.rv-verbar`/`.rv-ver-row`/`.rv-ver-swatch` 등.
- [ ] **selftest.mjs**: clear후 version=v0 · create 스탬프 · bump · 마이그레이션(주입→migrate→v0, 재호출 무변)
      · 가시성 persist/센티넬 · **색 안정성(bump 후 colorFor(다른버전) 불변 — 적대적이 잡은 회귀)**.

### P1 — nice
- [ ] **markdown.ts**: 작성자 줄(L154) 앞에 조건부 `- 버전: \`<v>\`` 1줄(escMd, 주입안전). 무버전 fixture는
      줄 없음 → 기존 단언 유지. 버전 fixture + 인젝션 단언 추가.
- [ ] VersionBar 헤더 "전체"/"현재만" 퀵토글, Panel 항목 버전 스와치 점.

### P2 — defer
- [ ] 초대 `?review=&v=` · 크로스탭 라이브 싱크(L162 리스너 확장) · MD 헤더 버전 요약 · `compareVersions`
      범례 정렬(필요 시 store.ts에 ~10줄 인라인) · per-version 이름변경/내보내기필터 · 팔레트>8 해시.

### 검증 체크리스트
- [ ] typecheck(`--rv-c as any` 캐스트+optional version만 신규 타입면) · selftest 50→~62 · build(+몇 KB)
- [ ] 실브라우저(기존 v0.4.x 코멘트 있는 페이지): 마이그레이션 무중복·`rv:schema=1` · v0→0.0.1 bump 시
      **old v0 핀 색 불변·0.0.1만 인디고(2버전 동시 recolor 없음)** · 멀티선택 동시표시·전체해제=빈 캔버스
      · resolved 회색 유지·active outline · per-page 번호 토글에도 불변(Detail #n 일치) · **전체삭제 후 새 핀
      보임(clear 수정)** · 구버전 payload 동일 로드 · export 전체 덤프.

파일: `types.ts`·`store.ts`·`index.tsx`·`app.tsx`·`styles.ts`·`selftest.mjs`(P0) · `markdown.ts`(P1).
`reviewGate.ts` 무변경(초대 param defer). 신규 파일 없음.

> 선행 대기: v0.4.4(Composer 포커스+⌘Enter 수정) 미배포 — 버전 기능과 함께 배포할지 결정 필요.

### 결과/검토 (v0.5.0)
- **P0 전부 구현**: `types.ts` `version?` · `store.ts`(verOf/getVersion/setVersion/register(append-only)/
  getKnownVersions/readVisibleRaw/setVisibleVersions/clearVisible/colorFor + create 스탬프 + migrate +
  **clear() 버전키 정리**) · `index.tsx` mount 시 `migrate()` · `app.tsx`(curVer/visRaw state, verCounts/
  allVersions/visibleSet memo, setCurVer/toggleVisible/showAll/showOnlyCurrent, 핀 memo 버전필터+`--rv-c`,
  Panel 필터+item-num 색, **VersionBar**) · `styles.ts`(`--rv-c` 변수 + verbar).
- **P1 구현**: `markdown.ts` `- 버전:` 줄(escMd, 무버전 fixture는 줄 없음), VersionBar "전체/현재만" 토글,
  패널 item-num이 버전색(별도 점 대신 번호 원을 색칠 — 더 단순).
- **적대적 검증 반영**: 색=레지스트리 삽입순 고정(현재=렌더타임 인디고 오버레이) · migrate는 부팅 1회 ·
  clear() 버전키 정리 · visible 센티넬(null=전체,[]=끔) · per-pin localStorage 읽기 없이 memo 1회 · 컷
  (versions.ts·persisted color map·djb2·invite &v=·MD 헤더요약).
- **검증**: typecheck 통과 · selftest **67 passed/0 failed**(마이그레이션·스탬프·가시성·**색 안정성 bump 회귀**·
  MD 버전줄 인젝션) · build(widget.js 71.4KB) · **실브라우저(Playwright headless, v0.4.x seed)**:
  마운트 마이그레이션 v0×2·schema=1 · 2핀 인디고 · VersionBar(현재 v0·범례 1행·카운트 2) · 토글 off=0/on=2 ·
  bump v0→0.0.1: 범례 2행·**v0 핀이 팔레트색 #0ea5e9(인디고 아님)=색 안정성 통과**·핀 유지. 13항목.
- **마이그레이션 안전**: 멱등(가드)·write→verify→guard·2탭 benign(idempotent+atomic). 구버전 payload 무손상.
- **배포**: v0.5.0(Composer 수정 동반). README/설치페이지 @v0.5.0+새 SRI, jsDelivr 검증.

## 18. 프로젝트 목적/기능/개선 리서치

목표: 현재 구현된 기능과 프로젝트 목적을 코드/문서/검증 결과로 확인하고, 사용성·기능 안정성·확장성 관점의 개선 후보를 도출한다.

### 계획
- [x] README/tasks/docs를 읽고 제품 목적과 사용 시나리오를 정리한다.
- [x] 위젯 진입, 게이트, 앵커, 저장소, 내보내기, 캡처, 버전 기능의 실제 구현 흐름을 확인한다.
- [x] 테스트/빌드/가능한 브라우저 스모크로 현재 안정성 신호를 확인한다.
- [x] 사용성·기능 안정성·확장성 개선점을 우선순위와 근거로 분류한다.
- [x] 조사 결과와 남은 리스크를 리뷰 섹션에 문서화한다.

### 리뷰
- 목적: 서버/DB/로그인 없이 대상 페이지 위에 Shadow DOM 리뷰 위젯을 띄우고, 코멘트를 localStorage·스크린샷 blob을 IndexedDB에 저장한 뒤 Markdown/ZIP/폴더로 전달하는 도구.
- 구현 기능: `?review=` 초대 게이트 + 공용 비밀번호, 북마클릿/데모 강제 마운트, 핀/페이지 코멘트, 다층 앵커(소스·인용·a11y·셀렉터·뷰포트), opt-in 스크린샷, 버전 필터/색상, 내보내기 모달.
- 검증: `pnpm typecheck` 통과, `pnpm test` 71 passed/0 failed, `pnpm build` 통과(widget.js 82.1KB · bookmarklet 120.7KB), headless Chrome 앵커 하니스 13/13 통과.
- P1 개선 후보: pathname-only 라우트 키로 query/hash 화면이 섞임, localStorage 실패/손상 시 저장 성공처럼 보일 수 있음, SVG/아이콘 내부 클릭이 실제 컨트롤 대신 내부 노드에 앵커될 수 있음, 동시 스크린샷 캡처 시 host visibility 경합 가능, 내보내기 모달 기본 범위가 패널 필터와 다름.
- P2 개선 후보: 버전/가시성/name storage 이벤트 동기화 부족, 스크린샷 없는 폴더 저장이 실제로는 다운로드로 동작, 브라우저 하니스가 CI 자동 테스트로 연결되지 않음, README/설치 페이지의 사용법·Markdown 샘플·버전 기능 설명 일부가 현재 UI/출력과 어긋남, 북마클릿 크기가 Safari 호환성에 불리함.

## 19. P1/P2 개선 구현

목표: 18번 리서치의 P1/P2 후보를 실제 구현에 반영한다.

### 계획
- [x] 라우트 키를 query/hash 포함으로 확장하고 legacy pathname 코멘트 호환을 유지한다.
- [x] localStorage 쓰기 실패/손상 데이터를 성공처럼 처리하지 않도록 저장 API를 성공/실패 반환형으로 바꾼다.
- [x] SVG/아이콘 내부 클릭을 실제 interactive ancestor로 승격한다.
- [x] 스크린샷 캡처를 직렬화해 위젯 host visibility 경합을 제거한다.
- [x] 내보내기 모달의 기본 범위를 현재 패널 필터와 맞추고 폴더 저장 동작을 일관화한다.
- [x] 다른 탭의 버전/가시성/name 변경을 현재 탭 UI에 동기화한다.
- [x] 기본 북마클릿을 CDN loader로 축소하고 self-contained 북마클릿은 fallback 산출물로 유지한다.
- [x] README/설치 페이지를 현재 UI·MD 출력·버전 기능·런타임 캡처 의존성과 맞춘다.
- [x] 브라우저 selftest를 자동 실행 가능한 스크립트로 추가한다.
- [x] typecheck/test/browser-test/build로 검증하고 결과를 문서화한다.

### 리뷰
- 라우트 키: `routeKey.ts` 추가. `review` 쿼리는 제외하고 query/hash를 포함하며, 기존 pathname-only 코멘트는 같은 pathname에서 함께 표시한다.
- 저장 안정성: `store.create/update/remove/setShot`이 실패를 반환하고, 손상된 `rv:comments`를 빈 배열로 덮어쓰지 않는다. UI는 실패 토스트를 띄운다.
- 앵커/캡처: `pickElement`가 interactive ancestor를 우선하고, `captureElement`는 직렬 큐로 host visibility 경합을 피한다.
- 내보내기/동기화: ExportModal 기본 선택은 현재 패널 필터를 따르고, 폴더 저장은 이미지 0장이어도 폴더 저장을 시도한다. storage 이벤트는 comments/version/visible/name을 동기화한다.
- 북마클릿: 기본 `bookmarklet.txt`는 CDN loader(0.5KB), `bookmarklet-inline.txt`는 자기완결형 fallback(125KB). `dist`와 Claude 설치 스킬 위젯을 재빌드했다.
- 검증: `pnpm typecheck` 통과, `pnpm test` 78 passed/0 failed, `pnpm test:browser` 하니스 생성 통과, `pnpm build` 통과(widget.js 85.1KB). 현재 로컬 Chrome은 headless 실행 시 SIGABRT(134)로 종료돼 `--run` 자동 브라우저 실행은 완료하지 못했다.

## 20. v1.0.1 이후 목적/기능/개선 리서치

목표: v1.0.1 현재 코드베이스 기준으로 구현된 기능과 프로젝트 목적을 재확인하고, 사용성·기능 안정성·확장성 관점에서 다음 개선 후보를 정리한다.

### 계획
- [x] README/package/scripts/tasks를 기준으로 제품 목적과 배포 상태를 확인한다.
- [x] 위젯 진입, 게이트, 저장소, 라우트 키, 앵커, 캡처, 내보내기 구현을 코드에서 재확인한다.
- [x] 테스트/빌드 스크립트와 현재 검증 한계를 확인한다.
- [x] 사용성·기능 안정성·확장성 개선 후보를 P1/P2로 분류한다.
- [x] 조사 결과를 리뷰 섹션에 문서화한다.

### 리뷰
- 목적: 대상 웹앱 위에 Shadow DOM 리뷰 위젯을 얹어 요소별/페이지별 코멘트를 남기고, 서버·DB·로그인 없이 브라우저 저장소(localStorage/IndexedDB)에서 Markdown/ZIP/폴더 산출물로 넘기는 로컬 전용 리뷰 도구다.
- 현재 구현 기능: `?review=` 초대 게이트와 공용 비밀번호, 북마클릿 강제 마운트, SPA 경로 감지, query/hash 포함 라우트 키(`review` 쿼리 제외), 핀/페이지 코멘트, 다층 앵커(소스·인용·a11y·셀렉터·뷰포트), opt-in 스크린샷, 버전 스탬프/필터/색상, cross-tab storage sync, Markdown/ZIP/폴더 내보내기.
- 검증: `pnpm typecheck` 통과, `pnpm test` 78 passed/0 failed, `pnpm test:browser` 하니스 생성 통과, `pnpm build` 통과(widget.js 85.1KB · loader bookmarklet 0.5KB · inline bookmarklet 125.0KB). 자동 Chrome `--run`은 기본 CI 경로가 아니며 로컬 환경 의존성이 남아 있다.
- P1 사용성: `ACCESS_PASSWORD`가 코드 상수라 설치 팀마다 소스 수정/재빌드가 필요하다. `window.__RV_ACCESS_PASSWORD__`/script data attr 같은 런타임 설정으로 옮기면 설치 UX와 배포 재사용성이 좋아진다.
- P1 기능 안정성: 새 코멘트의 `pageUrl`은 `location.href` 그대로라 초대용 `review` 쿼리가 저장/이동 링크에 남을 수 있다. `pageKeyFromHref`처럼 저장 URL도 `review`를 제거해 리포트/이동 링크를 정리하는 편이 낫다.
- P1 기능 안정성: 손상된 `rv:comments`는 보존하고 쓰기를 막지만, 사용자에게 복구/백업/초기화 선택지를 주는 UI가 없다. 현재는 실패 토스트만 있으므로 raw 백업 다운로드 후 초기화 플로우가 필요하다.
- P2 검증/릴리스: README와 `scripts/build-widget.mjs`에 CDN URL/SRI가 수동으로 중복된다. `package.json` 버전과 빌드 결과에서 SRI를 계산해 템플릿/README를 갱신하는 릴리스 스크립트가 필요하다.
- P2 검증/CI: `test:browser` 기본값은 file:// 하니스 생성이고, 실제 Chrome 실행은 `--run` 옵션과 로컬 Chrome에 묶여 있다. Chrome-for-Testing/Playwright 기반 자동 runner로 고정하면 회귀 검증 신뢰도가 올라간다.
- P2 확장성: 코멘트 공유는 MD 수동 병합뿐이다. 로컬 전용 원칙을 유지하더라도 JSON export/import + merge/dedupe를 추가하면 여러 리뷰어 작업을 합치기 쉬워진다.
- P2 사용성/호환성: 스크린샷은 `html2canvas` CDN 지연 로드가 기본이라 CSP/offline 환경에서 실패한다. 설치 스니펫에서 `__RV_H2C_URL__` 설정 예시를 더 명확히 제공하거나 same-origin helper 파일 산출물을 만들 수 있다.
- P2 규모/성능: 코멘트는 localStorage에 전체 배열로 저장/파싱된다. 수백~수천 건 규모나 긴 세션을 목표로 하면 IndexedDB 메타 저장소 또는 메모리 캐시+증분 쓰기 구조가 필요하다.

## 21. P1 개선 구현 — 비밀번호 제거

목표: 클라이언트 번들에 포함되는 공용 비밀번호를 제거하고, 남은 P1 안정성 이슈를 함께 해결한다.

### 계획
- [x] `?review=` 진입 시 비밀번호 없이 바로 위젯을 열고, 이름은 쿼리/저장값/작성폼으로 처리한다.
- [x] 새 코멘트의 `pageUrl`에서 초대용 `review` 쿼리를 제거한다.
- [x] 손상된 `rv:comments`를 감지했을 때 raw 백업 다운로드와 초기화 UI를 제공한다.
- [x] README와 lessons를 새 보안/초대 모델에 맞춘다.
- [x] selftest/typecheck/browser-harness/build로 검증하고 결과를 문서화한다.

### 리뷰
- 비밀번호 제거: `ACCESS_PASSWORD`와 Lock 화면을 제거했다. 스크립트 태그 모드는 여전히 `?review=`가 있을 때만 마운트되며, review 값은 기본 작성자 이름으로 저장한다. 이름이 없으면 기존 작성폼/패널 이름 설정 흐름을 쓴다.
- 저장 URL 정리: `pageUrlFromHref()`를 추가해 새 코멘트의 `pageUrl`에서 초대용 `review` 쿼리를 제거한다. `pageKeyFromHref()`와 같은 정규화 규칙을 공유한다.
- 손상 데이터 복구: `store.rawComments()`를 추가하고, `rv:comments`가 손상되면 복구 모달을 띄워 raw 백업 다운로드와 백업 후 초기화를 제공한다. 손상 상태에서는 기존처럼 데이터를 덮어쓰지 않는다.
- 문서/설치 스킬: README, 설치 페이지 템플릿, Claude 설치 스킬, lessons를 "위젯 자체 비밀번호 없음 · 실제 접근 제한은 대상 앱 auth" 모델로 갱신했다.
- 검증: `pnpm typecheck` 통과, `pnpm test` 81 passed/0 failed, `pnpm test:browser` 하니스 생성 통과(`?review=t` 초대 경로 포함), `pnpm build` 통과(widget.js 85.6KB · loader 0.5KB · inline 125.7KB). `node scripts/browser-selftest.mjs --run`은 로컬 Chrome SIGABRT로 실패했고 Chrome 로그는 비어 있었다.

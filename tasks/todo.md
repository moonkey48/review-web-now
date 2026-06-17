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

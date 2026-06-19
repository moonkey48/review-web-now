# Reviewer

> 웹페이지 위에 **직접 핀을 찍어 리뷰**하고, 한 번에 **Markdown으로 정리**해 전달하는 도구.
> 서버·DB·로그인 없이 **스크립트 한 줄**로 끝납니다.

## 어떤 문제를 푸나요?

디자인·QA·기획 리뷰는 보통 이렇게 오갑니다:

> "메인 페이지 결제 버튼 있잖아요, 그거 색이 비활성처럼 보여요. 그리고 그 아래 문구도 오타 같은데…"

스크린샷 찍고, 어디인지 말로 설명하고, 캡션 달고… 번거롭고 피드백이 여기저기 흩어집니다.

**Reviewer**는 리뷰어가 화면의 **그 요소를 클릭해서 코멘트를 남기면**, 위치(어떤 버튼인지)까지 같이 기록하고, 버튼 한 번으로 **정리된 Markdown 리포트**를 만들어 줍니다. 복사해서 전달하면 끝.

- 🎯 화면 요소에 **핀**을 찍어 코멘트 (또는 페이지 단위 코멘트)
- 📋 **Markdown 복사 / 다운로드** — 슬랙·노션·이슈에 그대로 붙여넣기
- 🙈 **일반 사용자에겐 안 보임** — 초대 링크를 받은 사람만 위젯이 보임
- 🪶 **서버·DB·계정 없음** — 코멘트는 그 브라우저에만 저장 (의존성: Preact + esbuild뿐)

## 설치 — 한 줄

리뷰받고 싶은 웹앱의 HTML `<body>` 끝에 이 한 줄을 넣으세요:

```html
<script
  src="https://cdn.jsdelivr.net/gh/moonkey48/review-web-now@v0.5.4/dist/widget.js"
  integrity="sha384-J6sC1l0JhHWDGxY9vv0GiMTOj6uwMHmZHUlP1ymqw3brPlGrNYtL2spEUX9wbzEH"
  crossorigin="anonymous"
  defer
></script>
```

현재 권장 버전은 `v0.5.4`입니다. 설치 스크립트는 항상 `@vX.Y.Z`처럼 **버전 태그로 고정**하세요. 브랜치 별칭은 새 머지에 따라 실행 코드가 바뀌어 리뷰 환경을 재현하기 어렵고, CDN 캐시와 섞이면 어떤 코드가 실행 중인지 추적하기 어렵습니다.

넣는 위치(프레임워크별):

| 프레임워크 | 위치 |
|---|---|
| Next.js (App Router) | `app/layout.tsx` 의 `<body>` 안, `{children}` 뒤 |
| Next.js (Pages) | `pages/_document.tsx` 의 `<NextScript />` 뒤 |
| Vite / CRA / 순수 HTML | `index.html` 의 `</body>` 직전 |

이 한 줄을 넣어도 **일반 방문자에겐 아무것도 안 보입니다.** 아래 초대 링크를 거친 사람에게만 위젯이 떠요.

### 🤖 AI에게 맡기기 (코드 직접 안 건드리고)

Claude Code · Cursor 등에 아래를 **그대로 붙여넣으면** 자동 설치됩니다:

```text
이 웹 프로젝트에 "Reviewer" 리뷰 위젯을 설치해줘.
1. 앱 최상위 레이아웃의 <body> 끝에 한 줄 추가(이미 있으면 생략):
   <script
     src="https://cdn.jsdelivr.net/gh/moonkey48/review-web-now@v0.5.4/dist/widget.js"
     integrity="sha384-J6sC1l0JhHWDGxY9vv0GiMTOj6uwMHmZHUlP1ymqw3brPlGrNYtL2spEUX9wbzEH"
     crossorigin="anonymous"
     defer
   ></script>
   - Next App Router=app/layout.tsx, Pages=pages/_document.tsx, 그 외=index.html
2. CDN URL은 브랜치 별칭이 아니라 현재 문서의 @v0.5.4 같은 버전 태그로 고정.
3. 위젯은 ?review=<리뷰어이름> 링크로 들어왔을 때만 보이고 일반 사용자에겐 안 보인다는 점 반영.
4. 설치 후 초대 링크 https://<이 앱 주소>/?review=<리뷰어이름> 를 알려줘.
```

> Claude Code라면 `.claude/skills/reviewer-install/` 스킬을 `~/.claude/skills/`로 복사한 뒤 "reviewer 설치해줘"라고만 해도 됩니다.

## 사용법

### ① 리뷰어 초대
리뷰할 사람에게 주소 끝에 `?review=이름`을 붙여 보내면 됩니다:
```
https://내서비스.com/?review=홍길동
```
`review` 뒤의 값은 최초 입장 팝업의 **이름** 입력칸에 자동으로 채워집니다.
스크립트 태그 방식에서는 URL에 `review` 쿼리가 있을 때만 입장 화면이 뜨며, 일반 URL로 들어온 방문자에겐 아무것도 보이지 않습니다.

최초 진입 시 **이름 + 공용 비밀번호**를 한 번 입력합니다 — 링크를 가진 사람 중에서도 한 번 더 거르는 게이트예요. (비밀번호는 팀에 따로 공유하고, 값은 `widget/app.tsx`의 `ACCESS_PASSWORD`에서 바꿉니다. 클라이언트 번들에 포함되므로 강한 보안이 아니라 가벼운 차단용입니다.)

### ② 코멘트 남기기
1. 우하단 **💬** 클릭 → **📍 코멘트 모드**
2. 화면의 요소(버튼·텍스트·이미지)를 클릭 → 코멘트 입력 → 필요하면 **📷 스크린샷 첨부** 체크 → 등록
3. 핀을 다시 클릭하면 **수정 · 삭제 · 해결** 처리

### ③ 정리해서 전달
패널에서 **📋 MD 복사** 또는 **⬇ 다운로드** → 받는 사람에게 붙여넣기/파일 전달.
스크린샷이 첨부된 코멘트가 있으면 다운로드는 자동으로 `review.md`와 `images/*.png`가 들어간 ZIP으로 내려받습니다.

### ④ 끄기
패널의 **위젯 닫기**. (남긴 코멘트는 그대로 저장됩니다.)

### 결과물 (Markdown)
```markdown
# 리뷰 리포트 — 우리 서비스

> 2026-06-14 10:30 (KST) 기준 · 총 2개 (미해결 1)

## /pricing (2개)

### 1. [ ] 결제 버튼 색이 비활성처럼 보여요
- 홍길동 · 6/14 10:30 · 핀: `#checkout-btn`
- 스크린샷: ![#1](images/rv_1.png)

### 2. [x] 카피 오타
- 홍길동 · 6/14 10:31 · 페이지 코멘트
```

## 알아두기

- **저장 위치**: 코멘트는 그 사이트의 **브라우저(localStorage)에만** 저장됩니다. 서버로 안 보냅니다.
- **스크린샷**: 첨부 이미지는 IndexedDB에 저장됩니다. 캡처가 끝나기 전에 복사/다운로드를 눌러도 완료를 기다린 뒤 내보냅니다.
- **공유 방식**: 리뷰어끼리 코멘트가 실시간으로 공유되진 않아요. 각자 MD로 내보내 **합치는** 방식입니다. → 모두 **같은 URL**에서 리뷰하세요(도메인이 다르면 저장소가 갈립니다).
- **버전 고정**: 설치 URL은 `@v0.5.4`처럼 버전 태그를 사용하세요. 브랜치 별칭은 배포 코드가 예고 없이 바뀔 수 있어 권장하지 않습니다.
- **비우기**: 위젯 패널의 **전체 삭제**.
- **CSP/Safari**: 보안정책이 엄격하면 `script-src 'self'`가 허용돼야 합니다(보통 문제없음).

## 사이트를 수정할 수 없다면 (북마클릿)

남의 사이트처럼 코드를 못 넣는 경우엔 북마클릿으로:
1. `pnpm preview` → 뜬 페이지에서 **"📌 코멘트 남기기"**를 북마크바로 **드래그** (한 번만)
2. 리뷰할 페이지에서 그 북마크를 **클릭** → 위젯 등장

(리뷰어 본인이 북마크를 만드는 것이라, 사이트 방문자에겐 영향이 없습니다.)

## 개발

```bash
pnpm install
pnpm preview     # 빌드 + 데모/설치 페이지 → http://127.0.0.1:4178
pnpm build       # dist/ 생성 (widget.js, bookmarklet.txt, index.html)
pnpm dev         # esbuild watch
pnpm typecheck   # tsc -p widget
pnpm test        # store + markdown 테스트
```

### 릴리스 / CDN 배포 규칙

위젯을 고치면 아래 순서로 배포하세요.

1. `pnpm build` 후 `dist/widget.js`를 포함해 커밋합니다.
2. PR을 `main`에 머지합니다.
3. 다음 SemVer 태그를 정합니다. 기능/버그 수정 배포는 보통 patch를 올립니다. 예: `v0.5.4`
4. README와 설치 페이지 템플릿의 CDN URL, SRI 값을 새 버전으로 갱신합니다.
5. 설치 대상 프로젝트에서는 브랜치 별칭이 아니라 새 버전 태그로 올립니다. 예: `@v0.5.4`
6. 태그를 push한 뒤 jsDelivr URL이 200으로 서빙되는지 확인합니다.

브랜치 별칭은 임시 확인용으로만 쓰고 README, 설치 스니펫, AI 설치 프롬프트에는 넣지 않습니다.

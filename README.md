# Reviewer

배포된 페이지 위에 코멘트를 남기고, 한 번에 **Markdown**으로 복사·전달하는 가벼운 리뷰 위젯.
**서버·DB·계정 없음.** 코멘트는 그 사이트의 `localStorage`에만 저장된다(네트워크 요청 0).

위젯은 **페이지 우하단에 뜨는 💬 버튼**으로 동작한다.

> ⚠️ 헷갈리기 쉬운 점: 이 도구는 방문자의 **브라우저 북마크를 자동으로 만들지 않는다.** (웹사이트는 북마크를 건드릴 수 없다.) 북마크는 아래 **방법 B(북마클릿)** 에서 사람이 직접 드래그할 때만 생긴다. 보통은 **방법 A(스크립트 태그)** 를 쓰면 되고, 이때 북마크와는 전혀 무관하다.

## 위젯을 띄우는 두 가지 방법

### ✅ 방법 A — 스크립트 태그 (내 서비스에 심기 · 팀용 · 권장)

사이트에 코드를 한 줄 넣어두면, **초대 링크를 거친 리뷰어에게만** 위젯이 뜬다. 일반 사용자는 못 본다. **북마크를 만들 필요가 없다.**

1. 앱의 `<body>` 끝에 한 줄 추가 (CDN에서 바로 로드 — 파일 복사 불필요):
   ```html
   <script src="https://cdn.jsdelivr.net/gh/moonkey48/review-web-now@main/dist/widget.js" defer></script>
   ```
   (직접 호스팅하려면 `dist/widget.js`를 `public/`에 두고 `src="/widget.js"`)
2. 리뷰어에게 **초대 링크** 공유: `https://<서비스>/?review=1`
   - 그 링크를 한 번 연 브라우저에만 💬가 뜬다. URL의 `?review`는 즉시 제거된다.
   - **일반 사용자에겐 렌더·흔적이 전혀 없다.** 끄려면 위젯 패널의 **위젯 닫기**(다시 켜려면 초대 링크 재방문).

#### 복사해서 바로 설치 — AI 프롬프트

코딩 에이전트(Claude Code / Cursor 등)에 **아래를 그대로 붙여넣으면** 자동으로 설치된다:

```text
이 웹 프로젝트에 "Reviewer" 리뷰 위젯을 설치해줘.

1. 앱 최상위 레이아웃의 <body> 끝에 아래 한 줄을 추가해줘(이미 있으면 생략):
   <script src="https://cdn.jsdelivr.net/gh/moonkey48/review-web-now@main/dist/widget.js" defer></script>
   - Next.js App Router = app/layout.tsx 의 {children} 뒤
   - Next.js Pages Router = pages/_document.tsx 의 <NextScript/> 뒤
   - Vite/CRA/순수 HTML = index.html 의 </body> 직전
2. 위젯은 ?review=1 링크를 한 번 연 브라우저에만 보이고 일반 사용자에겐 안 보인다는 점을 반영해줘.
3. 설치 후, 리뷰어에게 공유할 초대 링크(https://<이 앱 주소>/?review=1)를 알려줘.
```

> **Claude Code 사용자**라면 스킬도 있다: `.claude/skills/reviewer-install/`(widget.js 동봉).
> 다른 프로젝트에서도 쓰려면 이 폴더를 그 프로젝트의 `.claude/skills/` 또는 `~/.claude/skills/`로 복사한 뒤,
> "reviewer 위젯 설치해줘"라고 하면 된다.

### 방법 B — 북마클릿 (사이트를 수정할 수 없을 때)

남의 사이트 등 코드를 못 넣는 경우, 위젯 전체를 담은 북마클릿을 **리뷰어가 직접 북마크바에 한 번 드래그**해두고 클릭한다. (사이트가 북마크를 만드는 게 아니라 리뷰어 본인이 만든다.)

```bash
pnpm preview   # 뜬 페이지에서 "📌 코멘트 남기기"를 북마크바로 드래그 → 리뷰할 페이지에서 클릭
```

## 코멘트 & 내보내기 (두 방법 공통)

1. 우하단 **💬** → **📍 코멘트 모드** → 화면 요소 클릭(핀) 또는 `+ 페이지 코멘트`
2. 핀/목록 클릭 → 수정 · 삭제 · 해결 토글
3. 패널에서 **📋 MD 복사** 또는 **⬇ 다운로드** → 받는 사람에게 전달
   - `해결됨 숨기기`를 켜면 내보내기도 **미해결만**으로 필터된다

### MD 리포트 형식

```markdown
# 리뷰 리포트 — <문서 제목>

> 2026-06-14 10:30 (KST) 기준 · 총 3개 (미해결 2)

## /pricing (2개)

### 1. [ ] 결제 버튼 색이 비활성처럼 보여요
- 홍길동 · 6/14 10:30 · 핀: `#checkout-btn`

### 2. [x] 카피 오타
- 홍길동 · 6/14 10:31 · 페이지 코멘트
```

## 빌드 / 명령

```bash
pnpm install
pnpm preview        # 빌드 + 설치/튜토리얼 페이지 → http://127.0.0.1:4178
pnpm build          # dist/{widget.js, bookmarklet.txt, index.html} 만 생성
pnpm dev            # esbuild watch
pnpm typecheck      # tsc -p widget
pnpm test           # store + markdown 자체 테스트
```

- `dist/widget.js` — 방법 A에서 서빙할 위젯 번들
- `dist/index.html` — 튜토리얼 + 설치 + 라이브 데모. 정적 호스트(Vercel/GitHub Pages)에 올리면 **누구나 설치하는 배포 페이지**가 된다
- `dist/bookmarklet.txt` — 방법 B 북마클릿 원문(URL)

## 팀 운영 팁 (백엔드 없음)

- **모두 같은 URL에서 리뷰**: 코멘트는 origin(도메인)별 localStorage라, 프리뷰/프로덕션 도메인이 다르면 저장소가 분리된다. 리뷰할 URL 하나를 정해 공유.
- **서로의 코멘트는 보이지 않음**: 각자 자기 브라우저에 쌓이고, 합쳐지는 건 각자 MD를 모았을 때다.

## 주의

- **CSP**: `script-src`가 엄격하면 위젯 origin(방법 A는 보통 `'self'`)이 허용돼야 한다. 북마클릿(방법 B)은 강한 CSP에서 차단될 수 있다.
- **Safari**: 북마클릿 URL 길이 제한이 있을 수 있다 → 방법 A(스크립트 태그) 사용.
- **클립보드**: http(비보안) 페이지에서 막히면 다운로드를 사용(자동 폴백 포함).
- **localStorage**: 대상 사이트에 `rv:*` 키가 생긴다 → 패널 **전체 삭제**로 회수.

## 구조

```
reviewer/
├─ widget/
│  ├─ index.tsx     # 마운트 / 노출 게이트(?review·__RV_FORCE__) / SPA 훅
│  ├─ app.tsx       # UI (핀·패널·작성·상세·MD 내보내기)
│  ├─ store.ts      # localStorage CRUD
│  ├─ markdown.ts   # 코멘트 → MD 리포트
│  ├─ anchor.ts     # 요소 셀렉터·핀 좌표 (순수 DOM)
│  ├─ styles.ts     # Shadow DOM CSS
│  └─ types.ts      # Anchor · RvComment
├─ scripts/{build-widget,serve,selftest}.mjs
├─ templates/index.html        # 튜토리얼·데모 (빌드가 북마클릿/크기 주입)
├─ .claude/skills/reviewer-install/   # Claude Code 설치 스킬 (widget.js 동봉)
└─ dist/                       # 빌드 산출물
```

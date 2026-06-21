---
name: reviewer-install
description: 현재 웹 프로젝트에 Reviewer 리뷰 위젯을 설치한다 (widget.js 배치 + <script> 태그 추가 + 초대 링크 안내). "리뷰 위젯 설치", "reviewer 설치", "코멘트 위젯 붙여줘", "review widget install" 같은 요청에 사용.
---

# Reviewer 위젯 설치

현재 작업 중인 **웹 프로젝트**에 Reviewer 위젯을 설치한다. Reviewer는 페이지 우하단에 떠서 요소에 코멘트를 남기고 Markdown으로 내보내는 리뷰 도구다. 백엔드가 없고(코멘트는 그 사이트 origin의 `localStorage`에만 저장), `?review=<리뷰어이름>` 링크로 들어왔을 때만 보여 **일반 사용자에겐 노출되지 않는다.** 브라우저 북마크는 건드리지 않는다.

## 설치 단계

1. **widget.js 배치** — 이 스킬 폴더에 동봉된 `widget.js`(이 SKILL.md와 같은 디렉토리)를 프로젝트의 정적 자산 폴더로 복사한다.
   - Next.js / Vite / CRA / 정적 사이트: `public/widget.js`
   - 정적 폴더 규칙이 다르면 거기에 맞추고, 2단계의 `src` 경로를 그에 맞게 조정한다.

2. **스크립트 태그 추가** — 모든 페이지에 공통으로 들어가는 최상위 레이아웃의 `<body>` 끝(닫기 직전)에 추가한다. **이미 있으면 중복 추가하지 않는다.**
   ```html
   <script src="/widget.js" defer></script>
   ```
   프레임워크별 위치:
   - **Next.js App Router**: `app/layout.tsx` — `<body>` 안 `{children}` 뒤
   - **Next.js Pages Router**: `pages/_document.tsx` — `<body>` 안 `<NextScript />` 뒤
   - **Vite / CRA / 순수 HTML**: 진입 `index.html` 의 `</body>` 직전
   - **기타**: 루트 레이아웃/템플릿의 `</body>` 직전

3. **검증** — 변경은 "파일 1개 복사 + 스크립트 한 줄"뿐이어야 한다. 프로젝트의 타입체크/빌드가 깨지지 않는지 확인한다(예: `pnpm build` 또는 `tsc --noEmit` 등 그 프로젝트의 검증 명령).

4. **요약 출력** — 사용자에게 다음을 알린다:
   - 추가한 위치와 `widget.js` 경로
   - **리뷰어 초대 링크**: `<배포 또는 로컬 URL>/?review=<리뷰어이름>`
     `review` 뒤의 값은 위젯의 기본 작성자 이름으로 사용된다. URL에 `review` 쿼리가 있을 때만 위젯이 바로 뜬다(일반 사용자에겐 안 보임). 끄려면 위젯 패널의 **위젯 닫기**.
   - **접근 제한**: 위젯 자체에는 비밀번호가 없다. 실제 접근 제한이 필요하면 리뷰 대상 앱의 staging auth, Basic Auth, VPN 등으로 보호한다.

## 사용 안내 (요약에 함께 전달)

- 코멘트는 그 사이트 origin의 `localStorage`에만 저장된다(서버 전송 0). 비우려면 위젯 패널의 **전체 삭제**.
- 팀원끼리 코멘트는 **공유되지 않는다** — 전달은 `📋 MD 복사` / `⬇ ZIP 다운로드`, 병합은 `JSON 다운로드` / `JSON 가져오기`로 취합한다. JSON은 screenshot blob을 포함하지 않으므로 이미지는 ZIP/폴더 저장으로 보관한다.
- 리뷰는 **모두 같은 URL/도메인**에서 (저장소가 origin별로 분리됨).
- CSP가 엄격하면 설치 방식에 맞춰 `script-src`를 허용해야 한다. 이 스킬처럼 `/widget.js`를 같은 origin에 두면 `script-src 'self'`가 필요하고, 스크린샷용 `html2canvas`도 사내망/offline에서는 같은 origin에 둔 뒤 위젯보다 앞에서 `window.__RV_H2C_URL__="/vendor/html2canvas.min.js"`를 지정한다.

## 주의
- 이 스킬은 **새 파일 추가 + 한 줄 삽입**만 한다. 다른 코드를 수정하지 말 것.
- 대상이 웹 프로젝트가 아니거나 정적 폴더/레이아웃을 못 찾으면, 임의로 만들지 말고 사용자에게 위치를 묻는다.

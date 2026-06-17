# Lessons

- 2026-06-17: Reviewer 스크립트 태그 모드의 노출 조건은 현재 URL의 `review` 쿼리여야 한다. `localStorage` 플래그만으로 일반 URL에서 위젯이나 입장 화면을 자동 표시하지 않는다.
- 2026-06-17: `?review=<값>`의 값은 초대받은 리뷰어 이름으로 취급해 잠금 화면 이름 입력칸에 우선 채운다.
- 2026-06-17: 핸드오프(사람/Claude Code/Codex) 정확도는 셀렉터만으론 부족하다 — 렌더 DOM 셀렉터는 소스 레포로 환원 불가. 핀에 요소 텍스트(인용)+가까운 heading(섹션)을 같이 저장해 MD에 노출하면 grep/검색으로 위치를 찾을 수 있다.
- 2026-06-17: 북마클릿은 번들 전체를 URL에 인코딩하므로 무거운 라이브러리(html2canvas ~150KB)는 절대 정적 import 금지. 캡처 시점에만 `<script>`로 지연 로드하고, `window.__RV_H2C_URL__`로 같은 origin 자가호스트 경로를 주입할 수 있게 해 "네트워크 0" 옵션을 남긴다.
- 2026-06-17: 큰 바이너리(스크린샷 PNG)는 localStorage에 넣으면 용량 초과로 `setItem`이 조용히 실패해 코멘트까지 유실된다. blob은 IndexedDB(`rv-shots`)에 두고 localStorage엔 메타(id·w·h)만.
- 2026-06-17: 웹 위젯은 `~/Desktop` 같은 고정 경로에 무팝업 저장 불가(샌드박스). File System Access API로 폴더 1회 선택(세션 동안 핸들 유지)이 현실적 최대치. 고른 폴더의 절대경로는 API가 숨기므로 MD는 상대경로(`images/<id>.png`) 참조로 쓰고 `review.md`를 같은 폴더에 함께 저장한다.
- 2026-06-17: TS 5.7+ 에선 `Uint8Array`가 `Uint8Array<ArrayBufferLike>`로 제네릭화돼 `BlobPart`(=`ArrayBufferView<ArrayBuffer>`)에 바로 안 들어간다. ZIP 등 바이트 버퍼는 `Uint8Array<ArrayBuffer>`로 명시.
- 2026-06-17: claude-in-chrome `javascript_tool`은 async IIFE의 resolve 값을 `{}`로 직렬화한다 — 결과는 `window.__x`에 stash하고 다음 동기 호출로 읽는다.
- 2026-06-17: **html2canvas가 반환한 캔버스에 직접 `getContext('2d')`로 그리면 `toBlob`/`toDataURL` export에 반영되지 않는다**(컨텍스트 변환 상태가 남음). 주석(박스·배지)을 얹으려면 새 `<canvas>`를 만들어 `drawImage(src,0,0)`로 복사한 뒤 그 위에 그려라. (`capture.ts`) — 브라우저 시각 검증 없이는 못 잡았을 버그.
- 2026-06-17: 스크린샷 주석 색은 대상 UI와 동색이면 보이지 않는다(데모 버튼이 위젯 강조색 `#6366f1`와 같아 카무플라주). 흰 halo + 대비색(빨강 `#ef4444`)으로 임의 배경에서 대비를 보장하라.
- 2026-06-17: 핸드오프 정확도는 "더 똑똑한 셀렉터 하나"가 아니라 같은 위치를 여러 방식으로 중복 기술하는 "다층 앵커"로 푼다(W3C Web Annotation 패턴). 단 라이브러리 정적 포함은 북마클릿이 raw 바이트를 그대로 싣기 때문에(gzip 무의미) 금지 — TextQuote(앞뒤맥락)·role+name·Text Fragment는 모두 순수 DOM/문자열로 자체 구현(번들 라이브러리 0). [[reviewer-screenshots]]
- 2026-06-17: 무거운 fuzzy 재앵커링(diff-match-patch raw 76KB·32자 초과 throw)은 위젯이 아니라 리포트를 소비하는 Claude Code 측 책임 — 위젯은 가벼운 "생성"만, "복원"은 소비 측. Text Fragment(#:~:text=)는 SPA 클라이언트 라우팅에선 발동하지 않고 디렉티브가 URL에서 스트립돼 JS 복구 불가 → 보조 채널로만.
- 2026-06-17: jsDelivr CDN 반영 문제를 볼 때는 먼저 실제 설치 URL이 `@main`인지 `@vX.Y.Z`인지 확인한다. 버전 태그 URL은 main 머지나 purge로 새 코드가 되지 않으며, 새 태그를 만들거나 설치 URL의 버전을 바꿔야 한다.
- 2026-06-17: Reviewer의 CDN 버전 태그, SRI, 설치 스크립트가 바뀌는 작업은 반드시 README와 설치 페이지 템플릿(`templates/index.html`)을 함께 갱신한다. README/프롬프트/복사 스니펫에 `@main`을 다시 넣지 않는다.

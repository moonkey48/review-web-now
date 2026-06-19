# 소스 포인터(① 앵커) 설치 — 타깃 앱에 `data-source` 심기

리뷰 위젯은 핀마다 우선순위 순으로 앵커를 싣는다. **1순위는 "소스 포인터"**(컴포넌트명 + `file:line`)로,
이것만 정확하면 받는 쪽(Claude Code/Codex/사람)이 **DOM을 손으로 풀지 않고 바로 소스로** 간다.

위젯의 `widget/react-source.ts`는 클릭한 요소(및 조상 ≤6)에서 다음 속성을 **자동으로 읽는다**:

| 속성 | 형식 | 예 |
| --- | --- | --- |
| `data-component` | 컴포넌트 이름 | `data-component="QueueItem"` |
| `data-source` | `파일:라인[:컬럼]` | `data-source="src/queue-item.tsx:31"` |
| `data-locatorjs-id` | LocatorJS id (`path::line:col`) | (LocatorJS 설치 시) |
| `data-inspector-relative-path` + `data-inspector-line` | react-dev-inspector | (아래 1안) |

> **왜 빌드 플러그인이 필요한가** — 타깃이 **React 19**면 fiber에서 진짜 `file:line`을 못 뽑는다.
> React 19가 `_debugSource`를 제거했고(PR #28265), 수동 주입 위젯은 대체 경로(강제 리렌더 + `Error.stack`
> 파싱)를 쓸 수 없다. **dev 빌드의 컴포넌트 이름**까지는 fiber로 얻지만 prod 빌드는 난독화된다.
> ⇒ **진짜 `file:line`은 앱이 빌드 시 위 속성 중 하나를 심어야만** 가능하다. 심으면 위젯이 그대로 읽는다.

---

## ⚠ Next.js 16 + Turbopack 주의 (가장 중요)

Next.js 16은 `next dev`에서 **Turbopack이 기본**이다. 이 때문에:

- `next.config`의 커스텀 `webpack:` 로더는 **Turbopack dev에서 실행되지 않는다** → webpack 로더 방식은 무용.
- `.babelrc` / `babel.config.js`를 추가하면 앱 전체가 **SWC/Turbopack을 벗어나 Babel(webpack)로** 빌드된다
  (느려짐). dev/preview 한정이면 감수 가능하지만 알고 써야 한다.

따라서 **dev/preview 전용**으로만 켜고, 공개 prod 빌드에는 절대 넣지 않는다(빌드 속도 + 절대경로 유출 방지).

---

## 1안 (권장) — react-dev-inspector

유지보수되는 클릭-투-소스 도구. Babel 플러그인이 `data-inspector-relative-path` / `data-inspector-line`를
심고, 위젯의 `fromAttributes`가 이미 그 둘을 읽는다. 추가 코드 0.

```bash
npm i -D react-dev-inspector @react-dev-inspector/babel-plugin
```

`.babelrc`(dev에서만 — Babel 도입 = Turbopack 해제 감수):

```json
{
  "presets": ["next/babel"],
  "env": {
    "development": {
      "plugins": ["@react-dev-inspector/babel-plugin"]
    }
  }
}
```

dev 서버를 webpack 모드로 띄운다(Babel 설정이 있으면 Next가 자동으로 SWC를 끄지만, Next 16에선 명시가 안전):
`next dev`(Turbopack 미사용 플래그는 Next 버전에 따라 다름 — Babel 설정 존재 시 자동 webpack 전환되는지 콘솔로 확인).

→ 위젯이 핀마다 `소스: src/queue-item.tsx:31`를 바로 찍는다.

## 2안 — 손으로 만든 미니 Babel 플러그인 (`data-source` only)

react-dev-inspector를 쓰기 싫고 webpack 기반이면, 호스트 JSX에 `data-source="repo상대경로:라인"`만 심는
~25줄 플러그인:

```js
// tools/babel-plugin-rv-data-source.js  (CommonJS)
const path = require("path");
module.exports = function ({ types: t }) {
  return {
    name: "rv-data-source",
    visitor: {
      JSXOpeningElement(p, state) {
        const node = p.node;
        if (node.__rv) return;
        node.__rv = true;
        // 호스트 태그(div/button 등 소문자)만 — 컴포넌트는 자기 호스트에서 잡힘
        if (!t.isJSXIdentifier(node.name) || /^[A-Z]/.test(node.name.name)) return;
        const loc = node.loc;
        if (!loc) return;
        const already = node.attributes.some(
          (a) => t.isJSXAttribute(a) && a.name && a.name.name === "data-source",
        );
        if (already) return;
        const file = state.file.opts.filename || "";
        const rel = path.relative(state.cwd || process.cwd(), file).replace(/\\/g, "/");
        node.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier("data-source"),
            t.stringLiteral(`${rel}:${loc.start.line}`),
          ),
        );
      },
    },
  };
};
```

`.babelrc`:

```json
{
  "presets": ["next/babel"],
  "env": { "development": { "plugins": ["./tools/babel-plugin-rv-data-source.js"] } }
}
```

## 3안 — Turbopack 유지가 필수라면

Babel을 못 들이면 `next.config`의 `experimental.swcPlugins`(Wasm SWC 플러그인) 경로가 있으나,
`data-source`를 심는 안정적인 공개 SWC 플러그인은 아직 드물다(직접 작성 = Rust/Wasm 빌드 필요).
이 경우는 비용 대비 효과가 낮으니, **소스 포인터 없이 ② 인용(텍스트 grep) + ③ role/이름 앵커**로 운용하고
(이 레포는 한글 리터럴이 인라인이라 인용 grep이 거의 1줄로 적중) 소스 포인터는 preview 빌드에서만 1·2안으로 켠다.

---

## 검증

심은 뒤, dev/preview에서 임의 요소를 DevTools로 열어 `data-source`(또는 `data-inspector-*`)가 붙었는지 확인.
그 페이지에서 위젯으로 핀을 찍고 MD를 내보내면 `- 소스: <컴포넌트> · <파일>:<라인>` 라인이 보이면 성공.

## 프라이버시

- repo **상대경로**만 emit(절대 FS 경로 금지).
- **dev/preview 전용** — 공개 prod 번들엔 넣지 않는다(소스 구조 유출 방지).

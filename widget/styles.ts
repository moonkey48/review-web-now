// Shadow DOM 내부에 주입되는 전체 스타일. 페이지 CSS와 완전히 격리된다.
export const CSS_TEXT = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.rv-root {
  font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", Pretendard,
    "Noto Sans KR", "Segoe UI", sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: #18181b;
  -webkit-font-smoothing: antialiased;
}
button { cursor: pointer; background: none; border: none; font: inherit; color: inherit; }
button:disabled { cursor: not-allowed; opacity: .5; }
input, textarea { font: inherit; color: inherit; }

/* ── 플로팅 버튼 ─────────────────────────────── */
.rv-fab {
  position: fixed; right: 20px; bottom: 20px; z-index: 2147483600;
  width: 48px; height: 48px; border-radius: 50%;
  background: #18181b; color: #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,.28);
  transition: transform .15s ease;
}
.rv-fab:hover { transform: scale(1.07); }
.rv-fab svg { width: 22px; height: 22px; }
.rv-fab-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px;
  background: #ef4444; color: #fff; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

/* ── 코멘트 모드 오버레이 ────────────────────── */
.rv-overlay { position: fixed; inset: 0; z-index: 2147483550; cursor: crosshair; }
.rv-highlight {
  position: fixed; pointer-events: none; z-index: 2147483551;
  border: 2px dashed #6366f1; background: rgba(99,102,241,.08); border-radius: 4px;
}
.rv-mode-hint {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  z-index: 2147483552; pointer-events: none;
  background: #18181b; color: #fff; font-size: 12px;
  padding: 8px 14px; border-radius: 999px;
  box-shadow: 0 4px 16px rgba(0,0,0,.3); white-space: nowrap;
}

/* ── 핀 ──────────────────────────────────────── */
.rv-pin {
  position: fixed; z-index: 2147483560;
  width: 26px; height: 26px; border-radius: 50%;
  background: #6366f1; color: #fff; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,.35);
  transform: translate(-50%, -100%);
  transition: transform .1s ease;
}
.rv-pin:hover { transform: translate(-50%, -100%) scale(1.12); }
.rv-pin.rv-pin-resolved { background: #a1a1aa; opacity: .55; }
.rv-pin.rv-pin-active { outline: 3px solid rgba(99,102,241,.35); }

/* ── 카드 공통 (작성 폼 / 스레드 / 패널) ────── */
.rv-card {
  position: fixed; z-index: 2147483620;
  background: #fff; border: 1px solid #e4e4e7; border-radius: 12px;
  box-shadow: 0 12px 36px rgba(0,0,0,.2);
}
.rv-card-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-bottom: 1px solid #f1f1f4;
}
.rv-card-title { font-weight: 600; font-size: 13px; }
.rv-icon-btn { color: #a1a1aa; padding: 2px 4px; border-radius: 6px; font-size: 12px; }
.rv-icon-btn:hover { color: #18181b; background: #f4f4f5; }

.rv-input, .rv-textarea {
  width: 100%; border: 1px solid #d4d4d8; border-radius: 8px;
  padding: 7px 9px; font-size: 13px; outline: none; background: #fff;
}
.rv-input:focus, .rv-textarea:focus { border-color: #6366f1; }
.rv-textarea { resize: vertical; min-height: 64px; }

.rv-btn {
  border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600;
}
.rv-btn-primary { background: #18181b; color: #fff; }
.rv-btn-primary:hover { background: #3f3f46; }
.rv-btn-ghost { color: #52525b; border: 1px solid #d4d4d8; background: #fff; }
.rv-btn-ghost:hover { border-color: #a1a1aa; }
.rv-btn-danger { color: #dc2626; }
.rv-row { display: flex; gap: 6px; align-items: center; }
.rv-row-end { display: flex; gap: 6px; justify-content: flex-end; }

/* ── 작성 폼 ─────────────────────────────────── */
.rv-composer { width: 290px; padding: 12px; }
.rv-composer .rv-textarea { margin-top: 8px; }
.rv-composer .rv-row-end { margin-top: 8px; }

/* ── 스레드 팝업 ────────────────────────────── */
.rv-thread { width: 320px; max-height: min(480px, 72vh); display: flex; flex-direction: column; }
.rv-thread-body { overflow-y: auto; padding: 12px; }
.rv-msg { margin-bottom: 10px; }
.rv-msg-meta { font-size: 11px; color: #71717a; margin-bottom: 2px; display: flex; gap: 6px; align-items: baseline; flex-wrap: wrap; }
.rv-msg-author { font-weight: 600; color: #3f3f46; }
.rv-msg-text { white-space: pre-wrap; word-break: break-word; }
.rv-msg-actions { display: inline-flex; gap: 6px; margin-left: 2px; }
.rv-msg-actions button { font-size: 11px; color: #a1a1aa; }
.rv-msg-actions button:hover { color: #18181b; }
.rv-resolve-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: #52525b;
  border: 1px solid #d4d4d8; border-radius: 999px; padding: 3px 9px; background: #fff;
}
.rv-resolve-btn.rv-on { color: #047857; border-color: #6ee7b7; background: #ecfdf5; }

/* ── 패널 ────────────────────────────────────── */
.rv-panel {
  right: 20px; bottom: 80px; width: 340px;
  max-height: min(560px, 75vh); display: flex; flex-direction: column;
}
.rv-tabs { display: flex; gap: 2px; padding: 8px 10px 0; }
.rv-tab {
  flex: 1; text-align: center; padding: 6px 0; font-size: 12px; font-weight: 600;
  color: #71717a; border-bottom: 2px solid transparent;
}
.rv-tab.rv-active { color: #18181b; border-color: #18181b; }
.rv-panel-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 6px; padding: 8px 12px;
}
.rv-check { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #71717a; cursor: pointer; }
.rv-list { overflow-y: auto; padding: 0 8px 8px; flex: 1; }
.rv-item {
  width: 100%; text-align: left; display: flex; gap: 8px; align-items: flex-start;
  padding: 8px; border-radius: 8px;
}
.rv-item:hover { background: #f4f4f5; }
.rv-item-num {
  flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%;
  background: #6366f1; color: #fff; font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; margin-top: 1px;
}
.rv-item.rv-resolved .rv-item-num { background: #a1a1aa; }
.rv-item.rv-resolved .rv-item-text { color: #a1a1aa; text-decoration: line-through; }
.rv-item-text {
  font-size: 12px; color: #3f3f46;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  word-break: break-word;
}
.rv-item-meta { font-size: 10px; color: #a1a1aa; margin-top: 2px; }
.rv-badge {
  display: inline-block; font-size: 9px; font-weight: 700; border-radius: 4px;
  padding: 1px 4px; margin-left: 4px; vertical-align: 1px;
}
.rv-badge-lost { background: #fef3c7; color: #b45309; }
.rv-badge-page { background: #e0e7ff; color: #4338ca; }
.rv-empty { text-align: center; color: #a1a1aa; font-size: 12px; padding: 24px 12px; }
.rv-panel-foot {
  border-top: 1px solid #f1f1f4; padding: 8px 12px;
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
.rv-foot-link { font-size: 11px; color: #71717a; }
.rv-foot-link:hover { color: #18181b; }
.rv-foot-link.rv-danger { color: #dc2626; }
.rv-foot-link.rv-danger:hover { color: #b91c1c; }

/* ── MD 내보내기 ────────────────────────────── */
.rv-export { padding: 8px 12px; border-top: 1px solid #f1f1f4; }
.rv-export-row { display: flex; gap: 6px; align-items: center; }
.rv-export-hint { font-size: 11px; color: #a1a1aa; margin-left: auto; white-space: nowrap; }
.rv-mode-btn {
  width: calc(100% - 24px); margin: 10px 12px 2px;
  background: #6366f1; color: #fff; border-radius: 8px;
  padding: 8px 0; font-size: 12px; font-weight: 700; text-align: center;
}
.rv-mode-btn:hover { background: #4f46e5; }
.rv-mode-btn.rv-exit { background: #fff; color: #6366f1; border: 1px solid #6366f1; }

/* ── 토스트 ─────────────────────────────────── */
.rv-toast {
  position: fixed; bottom: 84px; left: 50%; transform: translateX(-50%);
  z-index: 2147483640; background: #18181b; color: #fff;
  font-size: 12px; padding: 8px 14px; border-radius: 999px;
  box-shadow: 0 4px 16px rgba(0,0,0,.3); white-space: nowrap;
}

/* ── 이름 설정 폼 ───────────────────────────── */
.rv-name-form { display: flex; gap: 6px; padding: 8px 12px; border-top: 1px solid #f1f1f4; }
`;

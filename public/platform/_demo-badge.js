/* Nevula demo — subtle "preview mode" indicator.
 *
 * Injected into every public/platform/<page>/index.html via a <script
 * src="../_demo-badge.js"> tag (added to the page HTML AND baked into
 * Nevula Demo/_decode.mjs so it survives a re-decode). A small fixed pill in
 * the bottom-left corner; pointer-events:none so it never blocks the demo UI.
 * Reinforces the entry disclaimer: this is an illustrative preview. */
(function () {
  if (window.__nvDemoBadge) return;
  window.__nvDemoBadge = true;

  function add() {
    if (document.querySelector('.nv-demo-badge')) return;

    var style = document.createElement('style');
    style.textContent =
      '.nv-demo-badge{position:fixed;left:16px;bottom:16px;z-index:2147483000;' +
      'display:inline-flex;align-items:center;gap:7px;padding:6px 12px 6px 10px;' +
      'font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;' +
      'font-size:10px;line-height:1;letter-spacing:.16em;text-transform:uppercase;' +
      'color:#3d4866;background:rgba(255,255,255,.74);border:1px solid rgba(10,15,31,.10);' +
      'border-radius:999px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);' +
      'box-shadow:0 8px 22px -12px rgba(10,15,31,.35);pointer-events:none;' +
      'user-select:none;opacity:.92}' +
      '.nv-demo-badge .nv-demo-dot{width:6px;height:6px;border-radius:50%;background:#ff6600;' +
      'box-shadow:0 0 0 0 rgba(255,102,0,.5);animation:nvDemoPulse 2.4s ease-out infinite}' +
      '@keyframes nvDemoPulse{0%{box-shadow:0 0 0 0 rgba(255,102,0,.45)}' +
      '70%{box-shadow:0 0 0 7px rgba(255,102,0,0)}100%{box-shadow:0 0 0 0 rgba(255,102,0,0)}}' +
      '@media (prefers-reduced-motion:reduce){.nv-demo-badge .nv-demo-dot{animation:none}}';
    document.head.appendChild(style);

    var badge = document.createElement('div');
    badge.className = 'nv-demo-badge';
    badge.setAttribute('role', 'note');
    badge.setAttribute('aria-label', 'Demo preview environment');
    badge.innerHTML = '<span class="nv-demo-dot"></span>Demo preview';
    document.body.appendChild(badge);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', add);
  } else {
    add();
  }
})();

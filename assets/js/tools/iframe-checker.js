// Iframe / clickjacking checker — best-effort. A static page can only observe
// whether the target *renders* inside an iframe; X-Frame-Options / CSP are
// enforced by the browser, and cross-origin frames are opaque to script.
(function () {
  'use strict';
  var root = document.getElementById('tool-root');
  if (!root) return;

  root.innerHTML =
    '<div class="tool-row">' +
      '<input class="tool-input" id="if-url" type="url" placeholder="https://example.com" style="flex:1;min-width:220px">' +
      '<button type="button" class="tool-btn" id="if-go">Load in iframe</button>' +
    '</div>' +
    '<p class="tool-note">If the target sets <code>X-Frame-Options: DENY/SAMEORIGIN</code> or a restrictive <code>frame-ancestors</code> CSP, the frame below stays blank — that means it is <strong>protected</strong> against clickjacking. If it renders, it may be <strong>framable</strong>.</p>' +
    '<p class="tool-status" id="if-status"></p>' +
    '<div id="if-frame-wrap" style="margin-top:1rem"></div>';

  var url = document.getElementById('if-url'), status = document.getElementById('if-status'),
      wrap = document.getElementById('if-frame-wrap');

  document.getElementById('if-go').addEventListener('click', function () {
    var u = url.value.trim();
    if (!/^https?:\/\//i.test(u)) { status.textContent = 'Enter a full http(s):// URL.'; return; }
    status.textContent = 'Loading… (a blank frame after a few seconds usually means framing is blocked)';
    wrap.innerHTML = '';
    var f = document.createElement('iframe');
    f.src = u;
    f.style.cssText = 'width:100%;height:480px;border:1px solid #3d3d42;border-radius:6px;background:#fff';
    f.addEventListener('load', function () { status.textContent = 'Frame load event fired. Inspect the frame above to judge whether content actually rendered.'; });
    wrap.appendChild(f);
  });
})();

// Wrap every code block on a wiki page with a copy-to-clipboard button.
// The copied text uses the *substituted* output (see pentest-params.js), so a
// user who set parameters copies the ready-to-run command.
(function () {
  'use strict';
  var blocks = document.querySelectorAll('.wiki-content pre');
  if (!blocks.length) return;

  Array.prototype.forEach.call(blocks, function (pre) {
    if (pre.parentNode.classList.contains('code-wrap')) return;
    var wrap = document.createElement('div');
    wrap.className = 'code-wrap';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    // language label (read from Rouge's .language-xxx wrapper)
    var rouge = pre.closest('.highlighter-rouge');
    var m = rouge && rouge.className.match(/language-([\w-]+)/);
    if (m && m[1] !== 'text') {
      var lbl = document.createElement('span');
      lbl.className = 'code-lang';
      lbl.textContent = m[1];
      wrap.appendChild(lbl);
    }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy-btn';
    btn.textContent = 'Copy';
    wrap.appendChild(btn);

    btn.addEventListener('click', function () {
      var code = pre.querySelector('code') || pre;
      var text = code.textContent;
      var done = function () {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else { fallback(); }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  });
})();

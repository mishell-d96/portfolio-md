// Google dork query builder — pure string templating.
(function () {
  'use strict';
  var root = document.getElementById('tool-root');
  if (!root) return;

  var FIELDS = [
    ['site', 'site:', 'example.com'],
    ['inurl', 'inurl:', 'admin'],
    ['intitle', 'intitle:', 'index of'],
    ['intext', 'intext:', 'password'],
    ['filetype', 'filetype:', 'pdf'],
    ['ext', 'ext:', 'sql'],
    ['cache', 'cache:', ''],
    ['related', 'related:', '']
  ];
  var PRESETS = [
    ['Exposed directories', 'intitle:"index of"'],
    ['Config files', '(ext:conf OR ext:cnf OR ext:ini OR ext:env)'],
    ['Backup / old files', '(ext:bak OR ext:old OR ext:backup OR ext:sql)'],
    ['Login pages', '(inurl:login OR intitle:login)'],
    ['Sensitive keywords', '(intext:"password" OR intext:"username" OR intext:"api_key")'],
    ['Documents', '(filetype:pdf OR filetype:doc OR filetype:xls)']
  ];

  var fieldRows = FIELDS.map(function (f) {
    return '<div class="param-field"><label for="gd-' + f[0] + '">' + f[1] + '</label>' +
      '<input type="text" id="gd-' + f[0] + '" data-op="' + f[1] + '" placeholder="' + f[2] + '" autocomplete="off"></div>';
  }).join('');
  var presetRows = PRESETS.map(function (p, i) {
    return '<label style="display:block;font-size:.85rem;margin:.2rem 0;cursor:pointer">' +
      '<input type="checkbox" class="gd-preset" data-q="' + p[1].replace(/"/g, '&quot;') + '" id="gd-p' + i + '"> ' + p[0] + '</label>';
  }).join('');

  root.innerHTML =
    '<div class="params-body" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:.6rem .9rem">' + fieldRows + '</div>' +
    '<div class="tool-field" style="margin-top:1rem"><label>Common presets</label>' + presetRows + '</div>' +
    '<div class="tool-row" style="margin-top:1rem">' +
      '<button type="button" class="tool-btn" id="gd-open">Search on Google ↗</button>' +
      '<button type="button" class="tool-btn secondary" id="gd-copy">Copy query</button></div>' +
    '<div class="tool-field"><label for="gd-out">Query</label><textarea class="tool-output" id="gd-out" spellcheck="false" readonly></textarea></div>' +
    '<p class="tool-status" id="gd-status"></p>';

  var out = document.getElementById('gd-out'), status = document.getElementById('gd-status');

  function quoteIfNeeded(v) { return /\s/.test(v) ? '"' + v + '"' : v; }
  function build() {
    var parts = [];
    Array.prototype.forEach.call(root.querySelectorAll('input[data-op]'), function (i) {
      var v = i.value.trim();
      if (v) parts.push(i.getAttribute('data-op') + quoteIfNeeded(v));
    });
    Array.prototype.forEach.call(root.querySelectorAll('.gd-preset:checked'), function (c) {
      parts.push(c.getAttribute('data-q'));
    });
    var q = parts.join(' ');
    out.value = q;
    return q;
  }

  root.addEventListener('input', build);
  root.addEventListener('change', build);
  document.getElementById('gd-open').addEventListener('click', function () {
    var q = build();
    if (!q) { status.textContent = 'Add at least one operator.'; return; }
    window.open('https://www.google.com/search?q=' + encodeURIComponent(q), '_blank', 'noopener');
  });
  document.getElementById('gd-copy').addEventListener('click', function () {
    var q = build();
    if (navigator.clipboard) navigator.clipboard.writeText(q);
    status.textContent = q ? 'Copied.' : 'Nothing to copy.';
    setTimeout(function () { status.textContent = ''; }, 1400);
  });
  build();
})();

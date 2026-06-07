// Code formatter / beautifier — uses vendored js-beautify (js/css/html) + native JSON.
(function () {
  'use strict';
  var root = document.getElementById('tool-root');
  if (!root) return;

  var FMT = {
    'JavaScript': function (s) { return js_beautify(s, { indent_size: 4 }); },
    'HTML / XML': function (s) { return html_beautify(s, { indent_size: 4 }); },
    'CSS': function (s) { return css_beautify(s, { indent_size: 4 }); },
    'JSON': function (s) { return JSON.stringify(JSON.parse(s), null, 4); }
  };

  var opts = Object.keys(FMT).map(function (k) { return '<option value="' + k + '">' + k + '</option>'; }).join('');
  root.innerHTML =
    '<div class="tool-row">' +
      '<select class="tool-select" id="cf-lang">' + opts + '</select>' +
      '<button type="button" class="tool-btn" id="cf-go">Format</button>' +
    '</div>' +
    '<div class="tool-field"><label for="cf-in">Input</label><textarea class="tool-input" id="cf-in" spellcheck="false"></textarea></div>' +
    '<div class="tool-field"><label for="cf-out">Formatted</label><textarea class="tool-output" id="cf-out" spellcheck="false" readonly></textarea></div>' +
    '<p class="tool-status" id="cf-status"></p>';

  var lang = document.getElementById('cf-lang'), inp = document.getElementById('cf-in'),
      out = document.getElementById('cf-out'), status = document.getElementById('cf-status');

  document.getElementById('cf-go').addEventListener('click', function () {
    try {
      out.value = FMT[lang.value](inp.value);
      status.textContent = '';
    } catch (e) { out.value = ''; status.textContent = 'Error: ' + e.message; }
  });
})();

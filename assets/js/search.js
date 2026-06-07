// Live wiki search over a prebuilt /search.json index. Dependency-free.
(function () {
  'use strict';
  var input = document.getElementById('wiki-search');
  var results = document.getElementById('wiki-search-results');
  if (!input || !results) return;

  var script = document.querySelector('script[data-search-url]');
  var url = (script && script.getAttribute('data-search-url')) || 'search.json';

  var index = null, loading = false, activeIdx = -1;

  function load() {
    if (index || loading) return;
    loading = true;
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) { index = data; if (input.value) run(input.value); })
      .catch(function () { index = []; });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function highlight(text, tokens) {
    var out = esc(text);
    tokens.forEach(function (t) {
      if (!t) return;
      var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }

  function score(item, tokens) {
    var title = (item.title || '').toLowerCase();
    var cat = (item.category || '').toLowerCase();
    var tags = (item.tags || []).join(' ').toLowerCase();
    var body = (item.body || '').toLowerCase();
    var hay = title + ' ' + cat + ' ' + tags + ' ' + body;
    var s = 0;
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (hay.indexOf(t) === -1) return 0; // AND: every token must match somewhere
      if (title.indexOf(t) !== -1) s += 5;
      if (tags.indexOf(t) !== -1) s += 3;
      if (cat.indexOf(t) !== -1) s += 2;
      if (body.indexOf(t) !== -1) s += 1;
    }
    return s;
  }

  function run(q) {
    var tokens = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!tokens.length || !index) { hide(); return; }
    var scored = [];
    for (var i = 0; i < index.length; i++) {
      var s = score(index[i], tokens);
      if (s > 0) scored.push({ item: index[i], s: s });
    }
    scored.sort(function (a, b) { return b.s - a.s; });
    render(scored.slice(0, 12), tokens, q);
  }

  function render(list, tokens, q) {
    activeIdx = -1;
    if (!list.length) {
      results.innerHTML = '<li class="sr-empty">No matches for “' + esc(q) + '”.</li>';
      results.hidden = false;
      return;
    }
    var html = '';
    list.forEach(function (r) {
      html += '<li><a href="' + esc(r.item.url) + '">' +
        '<span class="sr-title">' + highlight(r.item.title, tokens) + '</span>' +
        '<span class="sr-cat">' + esc(r.item.category || '') + '</span></a></li>';
    });
    results.innerHTML = html;
    results.hidden = false;
  }

  function hide() { results.hidden = true; results.innerHTML = ''; activeIdx = -1; }

  function links() { return results.querySelectorAll('a'); }
  function setActive(idx) {
    var a = links();
    if (!a.length) return;
    if (idx < 0) idx = a.length - 1;
    if (idx >= a.length) idx = 0;
    a.forEach(function (el) { el.classList.remove('kb-active'); });
    a[idx].classList.add('kb-active');
    a[idx].scrollIntoView({ block: 'nearest' });
    activeIdx = idx;
  }

  input.addEventListener('focus', load);
  input.addEventListener('input', function () { run(input.value); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIdx - 1); }
    else if (e.key === 'Enter') {
      var a = links();
      if (activeIdx >= 0 && a[activeIdx]) { window.location.href = a[activeIdx].href; }
      else if (a[0]) { window.location.href = a[0].href; }
    } else if (e.key === 'Escape') { input.value = ''; hide(); input.blur(); }
  });

  document.addEventListener('click', function (e) {
    if (!results.contains(e.target) && e.target !== input) hide();
  });
})();

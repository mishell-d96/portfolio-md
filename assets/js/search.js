// Full-text wiki search: top dropdown bar, snippet teasers with highlighting,
// keyboard navigation, and highlight-on-arrival via ?q=. Dependency-free.
(function () {
  'use strict';
  var input = document.getElementById('wiki-search');
  var results = document.getElementById('wiki-search-results');
  var bar = document.getElementById('topsearch');
  if (!input || !results) return;

  var script = document.querySelector('script[data-search-url]');
  var url = (script && script.getAttribute('data-search-url')) || 'search.json';

  var index = null, loading = false, activeIdx = -1;

  function load() {
    if (index || loading) return;
    loading = true;
    fetch(url).then(function (r) { return r.json(); })
      .then(function (d) { index = d; if (input.value) run(input.value); })
      .catch(function () { index = []; });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // Escape, then wrap matched tokens in <mark>. The (?![^<]*>) guard avoids
  // matching inside a tag we just inserted.
  function mark(text, tokens) {
    var out = esc(text);
    tokens.forEach(function (t) {
      if (!t) return;
      out = out.replace(new RegExp('(' + reEsc(t) + ')(?![^<]*>)', 'ig'), '<mark>$1</mark>');
    });
    return out;
  }

  // Build a teaser window of the body around the first matching token.
  function teaser(body, tokens) {
    var lower = body.toLowerCase(), pos = -1;
    for (var i = 0; i < tokens.length; i++) {
      var p = lower.indexOf(tokens[i]);
      if (p !== -1 && (pos === -1 || p < pos)) pos = p;
    }
    if (pos === -1) pos = 0;
    var start = Math.max(0, pos - 60), end = Math.min(body.length, pos + 140);
    var snip = (start > 0 ? '…' : '') + body.slice(start, end).trim() + (end < body.length ? '…' : '');
    return mark(snip, tokens);
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
      if (hay.indexOf(t) === -1) return 0; // AND match
      if (title.indexOf(t) !== -1) s += 8;
      if (tags.indexOf(t) !== -1) s += 4;
      if (cat.indexOf(t) !== -1) s += 3;
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
    render(scored.slice(0, 15), tokens, q);
  }

  function render(list, tokens, q) {
    activeIdx = -1;
    if (!list.length) {
      results.innerHTML = '<div class="sr-empty">No matches for “' + esc(q) + '”.</div>';
      open(); return;
    }
    var qs = '?q=' + encodeURIComponent(q);
    results.innerHTML = list.map(function (r) {
      return '<a class="sr-item" href="' + esc(r.item.url) + qs + '" role="option">' +
        '<div class="sr-head"><span class="sr-title">' + mark(r.item.title, tokens) + '</span>' +
        '<span class="sr-cat">' + esc(r.item.category || '') + '</span></div>' +
        '<div class="sr-teaser">' + teaser(r.item.body || '', tokens) + '</div></a>';
    }).join('');
    open();
  }

  function open() { results.hidden = false; input.setAttribute('aria-expanded', 'true'); if (bar) bar.classList.add('active'); }
  function hide() { results.hidden = true; results.innerHTML = ''; activeIdx = -1; input.setAttribute('aria-expanded', 'false'); if (bar) bar.classList.remove('active'); }

  function items() { return results.querySelectorAll('.sr-item'); }
  function setActive(i) {
    var a = items(); if (!a.length) return;
    if (i < 0) i = a.length - 1; if (i >= a.length) i = 0;
    a.forEach(function (el) { el.classList.remove('kb-active'); });
    a[i].classList.add('kb-active'); a[i].scrollIntoView({ block: 'nearest' }); activeIdx = i;
  }

  input.addEventListener('focus', load);
  input.addEventListener('input', function () { run(input.value); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIdx - 1); }
    else if (e.key === 'Enter') {
      var a = items();
      if (activeIdx >= 0 && a[activeIdx]) window.location.href = a[activeIdx].href;
      else if (a[0]) window.location.href = a[0].href;
    } else if (e.key === 'Escape') { hide(); input.blur(); }
  });

  // "/" focuses search from anywhere (unless already typing in a field)
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
      e.preventDefault(); input.focus(); input.select();
    }
  });
  document.addEventListener('click', function (e) {
    if (!results.contains(e.target) && e.target !== input) hide();
  });

  // ---- highlight-on-arrival: ?q=… marks matches and scrolls to the first ----
  (function highlightFromQuery() {
    var m = /[?&]q=([^&]+)/.exec(window.location.search);
    var content = document.querySelector('.wiki-content');
    if (!m || !content) return;
    var terms = decodeURIComponent(m[1].replace(/\+/g, ' ')).toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return;
    var rx = new RegExp('(' + terms.map(reEsc).join('|') + ')', 'ig');
    var walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) {
      var n = walker.currentNode;
      if (n.parentNode && /^(SCRIPT|STYLE)$/.test(n.parentNode.tagName)) continue;
      if (rx.test(n.nodeValue)) nodes.push(n);
      rx.lastIndex = 0;
    }
    var first = null;
    nodes.forEach(function (n) {
      var span = document.createElement('span');
      span.innerHTML = esc(n.nodeValue).replace(rx, '<mark class="search-hit">$1</mark>');
      var frag = document.createDocumentFragment();
      while (span.firstChild) frag.appendChild(span.firstChild);
      if (!first) first = frag.querySelector('.search-hit');
      n.parentNode.replaceChild(frag, n);
    });
    if (first) setTimeout(function () { first.scrollIntoView({ block: 'center' }); }, 60);
  })();
})();

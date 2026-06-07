// Page usability enhancements for wiki content:
//  • collapsible chapters (H2 sections), expanded by default, + expand/collapse all
//  • "On this page" TOC (right column) with scroll-spy
//  • hover anchor links on headings
//  • back-to-top button
(function () {
  'use strict';
  var content = document.querySelector('.wiki-content');
  if (!content) return;

  // ── 1. Wrap each H2 + its following siblings into a collapsible <section> ──
  var kids = Array.prototype.slice.call(content.children);
  var sections = [], current = null;
  kids.forEach(function (node) {
    if (node.tagName === 'H2') {
      current = document.createElement('section');
      current.className = 'chapter open';
      var body = document.createElement('div');
      body.className = 'chapter-body';
      content.insertBefore(current, node);
      current.appendChild(node);
      current.appendChild(body);
      current._body = body;
      node.classList.add('chapter-head');
      node.insertAdjacentHTML('beforeend', '<span class="chapter-caret" aria-hidden="true">▾</span>');
      node.setAttribute('role', 'button');
      node.setAttribute('tabindex', '0');
      sections.push(current);
    } else if (current) {
      current._body.appendChild(node);
    }
  });

  function toggleSection(sec, force) {
    var open = force === undefined ? !sec.classList.contains('open') : force;
    sec.classList.toggle('open', open);
    var h = sec.querySelector('.chapter-head');
    if (h) h.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  sections.forEach(function (sec) {
    var head = sec.querySelector('.chapter-head');
    head.setAttribute('aria-expanded', 'true');
    head.addEventListener('click', function (e) {
      if (e.target.closest('.h-anchor')) return; // let anchor links work
      toggleSection(sec);
    });
    head.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection(sec); }
    });
  });

  // expand / collapse all toolbar
  if (sections.length > 1) {
    var bar = document.createElement('div');
    bar.className = 'chapters-toolbar';
    bar.innerHTML = '<button type="button" class="chapters-btn" data-act="expand">Expand all</button>' +
                    '<button type="button" class="chapters-btn" data-act="collapse">Collapse all</button>';
    content.insertBefore(bar, content.firstChild);
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('.chapters-btn'); if (!b) return;
      var open = b.getAttribute('data-act') === 'expand';
      sections.forEach(function (s) { toggleSection(s, open); });
    });
  }

  // ── 2. Heading anchor links ──
  Array.prototype.forEach.call(content.querySelectorAll('h2[id], h3[id]'), function (h) {
    var a = document.createElement('a');
    a.className = 'h-anchor';
    a.href = '#' + h.id;
    a.setAttribute('aria-label', 'Link to this section');
    a.textContent = '#';
    h.appendChild(a);
  });

  // ── 3. "On this page" TOC ──
  var toc = document.getElementById('on-this-page');
  var heads = Array.prototype.slice.call(content.querySelectorAll('h2[id], h3[id]'));
  var linkById = {};
  if (toc && heads.length > 1) {
    var html = '<div class="otp-title">On this page</div><nav class="otp-nav">';
    heads.forEach(function (h) {
      var clone = h.cloneNode(true);
      var c = clone.querySelector('.chapter-caret'); if (c) c.remove();
      var an = clone.querySelector('.h-anchor'); if (an) an.remove();
      var label = clone.textContent.trim().replace(/[&<>]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]; });
      html += '<a class="otp-link otp-' + h.tagName.toLowerCase() + '" href="#' + h.id + '" data-target="' + h.id + '">' + label + '</a>';
    });
    toc.innerHTML = html + '</nav>';
    Array.prototype.forEach.call(toc.querySelectorAll('.otp-link'), function (l) {
      linkById[l.getAttribute('data-target')] = l;
      l.addEventListener('click', function (e) {
        e.preventDefault();
        var t = document.getElementById(l.getAttribute('data-target'));
        if (!t) return;
        var sec = t.closest('.chapter');
        if (sec && !sec.classList.contains('open')) toggleSection(sec, true);
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + l.getAttribute('data-target'));
      });
    });
  } else if (toc) {
    toc.remove();
  }

  function setCurrent(id) {
    Object.keys(linkById).forEach(function (k) { linkById[k].classList.toggle('current', k === id); });
  }
  if (heads.length > 1 && 'IntersectionObserver' in window) {
    var tops = {};
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { tops[en.target.id] = en.isIntersecting ? en.boundingClientRect.top : null; });
      var best = null, bestTop = Infinity;
      heads.forEach(function (h) { if (tops[h.id] != null && tops[h.id] < bestTop) { bestTop = tops[h.id]; best = h.id; } });
      if (best) setCurrent(best);
    }, { rootMargin: '0px 0px -75% 0px', threshold: 0 });
    heads.forEach(function (h) { obs.observe(h); });
  }

  // ── 4. Back-to-top ──
  var top = document.createElement('button');
  top.type = 'button';
  top.className = 'back-to-top';
  top.setAttribute('aria-label', 'Back to top');
  top.innerHTML = '↑';
  document.body.appendChild(top);
  top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  function onScroll() { top.classList.toggle('visible', window.scrollY > 600); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

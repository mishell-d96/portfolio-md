// GitBook-style nested sidebar: under the active page's sidebar entry, list the
// page's headings (h2/h3) as anchor links, and highlight the current section on
// scroll (scrollspy).
(function () {
  'use strict';
  var active = document.querySelector('.sidebar-nav-subitem.active');
  var content = document.querySelector('.wiki-content');
  if (!active || !content) return;

  var heads = Array.prototype.slice.call(content.querySelectorAll('h2[id], h3[id]'));
  if (!heads.length) return;

  // Build the nested section list.
  var sub = document.createElement('div');
  sub.className = 'nav-sections';
  heads.forEach(function (h) {
    var a = document.createElement('a');
    a.className = 'nav-section nav-section-' + h.tagName.toLowerCase();
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    a.setAttribute('data-target', h.id);
    sub.appendChild(a);
  });
  active.parentNode.insertBefore(sub, active.nextSibling);

  var links = Array.prototype.slice.call(sub.querySelectorAll('.nav-section'));
  var byId = {};
  links.forEach(function (l) { byId[l.getAttribute('data-target')] = l; });

  // Smooth-scroll + keep the URL clean-ish on click.
  links.forEach(function (l) {
    l.addEventListener('click', function (e) {
      var t = document.getElementById(l.getAttribute('data-target'));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', '#' + l.getAttribute('data-target')); setActive(l); }
    });
  });

  function setActive(link) {
    links.forEach(function (l) { l.classList.remove('current'); });
    if (link) link.classList.add('current');
  }

  // Scrollspy via IntersectionObserver.
  if ('IntersectionObserver' in window) {
    var visible = {};
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting ? en.boundingClientRect.top : null; });
      // pick the topmost currently-intersecting heading
      var best = null, bestTop = Infinity;
      heads.forEach(function (h) {
        if (visible[h.id] != null && visible[h.id] < bestTop) { bestTop = visible[h.id]; best = h.id; }
      });
      if (best && byId[best]) setActive(byId[best]);
    }, { rootMargin: '0px 0px -75% 0px', threshold: 0 });
    heads.forEach(function (h) { obs.observe(h); });
  }
})();

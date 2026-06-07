// Collapsible sidebar nav groups, with open/closed state persisted in localStorage.
(function () {
  'use strict';
  var KEY = 'wiki-nav-open';
  var groups = Array.prototype.slice.call(document.querySelectorAll('.nav-group'));
  if (!groups.length) return;

  function readOpen() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function writeOpen(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }

  var openList = readOpen();
  // Apply persisted state, but always keep the active group (set at build time) open.
  groups.forEach(function (g) {
    var key = g.getAttribute('data-group');
    if (g.classList.contains('open')) {
      if (openList.indexOf(key) === -1) openList.push(key);
    } else if (openList.indexOf(key) !== -1) {
      g.classList.add('open');
      var t = g.querySelector('.nav-group-toggle');
      if (t) t.setAttribute('aria-expanded', 'true');
    }
  });
  writeOpen(openList);

  groups.forEach(function (g) {
    var toggle = g.querySelector('.nav-group-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var key = g.getAttribute('data-group');
      var nowOpen = g.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
      var list = readOpen();
      var idx = list.indexOf(key);
      if (nowOpen && idx === -1) list.push(key);
      else if (!nowOpen && idx !== -1) list.splice(idx, 1);
      writeOpen(list);
    });
  });
})();

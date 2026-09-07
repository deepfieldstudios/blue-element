/* ============================================================
   BLUE ELEMENT — event-page depth rail (shared)

   Used by the depth camp page and every competition page. Lights the
   rail tick for whichever section is currently in view, and flips the
   rail to its dark-on-light treatment over light sections.

   Every tick is already visible and legible without this script — it
   only decides which one is lit. If it never runs, the rail still reads
   as a static scale rather than disappearing.

   Markup contract:
     .ev-rail            the rail, containing N .ev-tick children
     [data-ev-tick]      each page section, in document order
     [data-ev-light]     add to a section that sits on a light background

   Ticks are distributed across sections by data-ev-own on each section:
   a space-separated list of tick indexes that section owns. Omit it and
   the section owns the single tick at its own position.
   ============================================================ */
(function () {
  var rail = document.querySelector('.ev-rail');
  if (!rail || !('IntersectionObserver' in window)) return;

  var ticks = rail.querySelectorAll('.ev-tick');
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-ev-tick]'));
  if (!ticks.length || !sections.length) return;

  var owns = sections.map(function (s, i) {
    var attr = s.getAttribute('data-ev-own');
    return attr ? attr.trim().split(/\s+/).map(Number) : [i];
  });

  function light(i) {
    for (var t = 0; t < ticks.length; t++) ticks[t].classList.remove('on');
    owns[i].forEach(function (n) { if (ticks[n]) ticks[n].classList.add('on'); });
    rail.classList.toggle('on-light', sections[i].hasAttribute('data-ev-light'));
  }
  light(0);

  var io = new IntersectionObserver(function (entries) {
    var best = null;
    entries.forEach(function (e) {
      if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e;
    });
    if (!best) return;
    var i = sections.indexOf(best.target);
    if (i > -1) light(i);
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  sections.forEach(function (s) { io.observe(s); });
})();

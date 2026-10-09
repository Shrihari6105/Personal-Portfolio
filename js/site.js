/* Page-level behaviour for the portfolio. The engine (engine/scrollcraft.js)
   is untouched; everything bespoke lives here and reads the act's --sc-p.

   1. Declassification: redaction bars, one per rendered line box, lifted by
      scroll inside the Case files act.
   2. The desk travel: the pinned case-file stage is taller than the
      viewport, so it reads down the desk while pinned.
   3. The folio: which chapter you are in. */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var files = document.getElementById('files');

  // Reduced motion: no pin, no redaction, the exhibit simply open. The page
  // keeps every word and the dashboard; it drops the choreography.
  if (reduce && files) {
    files.setAttribute('data-sc-act', 'flow');
    files.removeAttribute('data-sc-span');
    var win = files.querySelector('[data-sc-reveal]');
    if (win) win.removeAttribute('data-sc-reveal');
  }

  /* ------------------------------------------------ 1. redaction bars -- */
  // A bar is drawn over each line fragment of every [data-rx] span, so a
  // phrase that wraps gets one bar per line, the way a marker would. Bars on
  // later lines of the same phrase lift slightly later.
  function buildBars() {
    if (reduce || !files) return;
    var old = files.querySelectorAll('.rx-bar');
    for (var i = 0; i < old.length; i++) old[i].remove();

    var spans = files.querySelectorAll('[data-rx]');
    for (var s = 0; s < spans.length; s++) {
      var span = spans[s];
      var sheet = span.closest('.sheet');
      if (!sheet) continue;
      var at = parseFloat(span.getAttribute('data-rx')) || 0;
      // Measure against the sheet with its rotation removed, then restore it.
      sheet.style.rotate = '0deg';
      var base = sheet.getBoundingClientRect();
      var rects = span.getClientRects();
      for (var r = 0; r < rects.length; r++) {
        var rc = rects[r];
        if (rc.width < 2) continue;
        var bar = document.createElement('span');
        bar.className = 'rx-bar';
        bar.setAttribute('aria-hidden', 'true');
        var padY = rc.height * 0.08;
        bar.style.left = (rc.left - base.left - 2).toFixed(1) + 'px';
        bar.style.top = (rc.top - base.top + padY).toFixed(1) + 'px';
        bar.style.width = (rc.width + 4).toFixed(1) + 'px';
        bar.style.height = (rc.height - padY * 2).toFixed(1) + 'px';
        bar.style.setProperty('--at', (at + r * 0.018).toFixed(3));
        sheet.appendChild(bar);
      }
      sheet.style.rotate = '';
    }
  }

  /* ------------------------------------------------- 2. desk travel ---- */
  function measureTravel() {
    if (!files) return;
    var inner = files.querySelector('[data-files-inner]');
    if (!inner) return;
    if (reduce) { inner.style.removeProperty('--travel'); return; }
    var stage = inner.parentElement;
    var over = inner.scrollHeight - stage.clientHeight;
    inner.style.setProperty('--travel', Math.max(0, Math.ceil(over)));
  }

  /* ------------------------------------------------- 3. the folio ----- */
  function folio() {
    var nav = document.querySelector('.folio');
    if (!nav || !('IntersectionObserver' in window)) return;
    var links = {};
    Array.prototype.forEach.call(nav.querySelectorAll('[data-folio]'), function (a) {
      links[a.getAttribute('data-folio')] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.getAttribute('data-chapter');
        nav.classList.toggle('is-on', id !== 'title' && id !== 'silence');
        nav.classList.toggle('is-paper', id === 'colophon');
        for (var k in links) {
          if (k === id) links[k].setAttribute('aria-current', 'true');
          else links[k].removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('[data-chapter]'), function (s) { io.observe(s); });
  }

  function layout() { measureTravel(); buildBars(); }

  ScrollCraft.mount(document.body);
  folio();
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  var t;
  addEventListener('resize', function () { clearTimeout(t); t = setTimeout(layout, 120); });
})();

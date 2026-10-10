/* Page-level behaviour for the portfolio. The engine (engine/scrollcraft.js)
   is untouched; everything bespoke lives here and reads the act's --sc-p.

   1. Declassification: redaction bars, one per rendered line box, lifted by
      scroll inside the Case files act.
   2. The desk timeline: the pinned stage HOLDS still on each case file until
      its redactions have lifted, then steps to the next, then to the exhibit.
   3. The menu bar: current section, solid on scroll, mobile panel.
   4. The hero's letter-glitch field, paused whenever the hero is off screen. */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Palette preview: ?palette=red | amber | blue (css/palettes.css).
  // Set before anything reads colours, so the glitch field picks it up too.
  var pal = /[?&]palette=(red|amber|blue)\b/.exec(location.search);
  if (pal) document.documentElement.setAttribute('data-palette', pal[1]);
  var files = document.getElementById('files');

  // Reduced motion: no pin, no redaction, the exhibit simply open. The page
  // keeps every word and the dashboard; it drops the choreography.
  if (reduce && files) {
    files.setAttribute('data-sc-act', 'flow');
    files.removeAttribute('data-sc-span');
  }

  // The Case files timeline, in act progress (0..1). Each sheet owns a hold
  // window: the stage does not move while its bars lift. Between holds the
  // stage steps to the next sheet; the last stop is the exhibit, which then
  // pans (site.css, from 0.84).
  // Bars lift in the first part of each hold; the rest is a reading pause,
  // so a revealed file stays still for a few scrolls before the stage moves.
  // After the last file there is one more pause with all three on screen.
  var HOLDS = [[0.02, 0.20], [0.25, 0.43], [0.48, 0.66]];
  var LIFT_SHARE = 0.6;   // share of each hold spent lifting bars
  var READ_END = 0.78;    // the stage holds on the last file until here
  var EXHIBIT_AT = 0.82;
  var LIFT = 1 / 22;   // how much progress one bar takes to peel (see .rx-bar)

  /* ------------------------------------------------ 1. redaction bars -- */
  // A bar is drawn over each line fragment of every [data-rx] span, so a
  // phrase that wraps gets one bar per line, the way a marker would. Bars on
  // later lines of the same phrase lift slightly later.
  function buildBars() {
    if (reduce || !files) return;
    var old = files.querySelectorAll('.rx-bar');
    for (var i = 0; i < old.length; i++) old[i].remove();

    // Bars are spread evenly across their sheet's hold window, in reading
    // order, so the last one is fully lifted before the stage moves on.
    var sheets = files.querySelectorAll('.sheet');
    for (var s = 0; s < sheets.length; s++) {
      var sheet = sheets[s];
      var hold = HOLDS[Math.min(s, HOLDS.length - 1)];
      // Measure against the sheet with its rotation removed, then restore it.
      sheet.style.rotate = '0deg';
      var base = sheet.getBoundingClientRect();
      var boxes = [];
      Array.prototype.forEach.call(sheet.querySelectorAll('[data-rx]'), function (span) {
        Array.prototype.forEach.call(span.getClientRects(), function (rc) {
          if (rc.width >= 2) boxes.push(rc);
        });
      });
      var room = (hold[1] - hold[0]) * LIFT_SHARE - LIFT;
      for (var b = 0; b < boxes.length; b++) {
        var rc = boxes[b];
        var bar = document.createElement('span');
        bar.className = 'rx-bar';
        bar.setAttribute('aria-hidden', 'true');
        var padY = rc.height * 0.08;
        bar.style.left = (rc.left - base.left - 2).toFixed(1) + 'px';
        bar.style.top = (rc.top - base.top + padY).toFixed(1) + 'px';
        bar.style.width = (rc.width + 4).toFixed(1) + 'px';
        bar.style.height = (rc.height - padY * 2).toFixed(1) + 'px';
        bar.style.setProperty('--at', (hold[0] + room * b / Math.max(boxes.length - 1, 1)).toFixed(3));
        sheet.appendChild(bar);
      }
      sheet.style.rotate = '';
    }
  }

  /* ----------------------------------------------- 2. desk timeline --- */
  // Keyframes of (progress, offset). Each stop is the smallest offset that
  // shows the whole sheet (or its top, if it is taller than the screen).
  var keys = [];
  function measureStops() {
    keys = [];
    if (reduce || !files) return;
    var inner = files.querySelector('[data-files-inner]');
    var stage = inner.parentElement;
    var prev = inner.style.getPropertyValue('--ty');
    inner.style.setProperty('--ty', '0');
    var h = stage.clientHeight;
    var travel = Math.max(0, inner.scrollHeight - h);
    var top0 = inner.getBoundingClientRect().top;
    var pad = 72;   // clears the fixed menu bar
    function stop(el) {
      var r = el.getBoundingClientRect();
      var t = r.top - top0, btm = r.bottom - top0;
      var y = Math.min(t - pad, Math.max(0, btm + 24 - h));
      return Math.max(0, Math.min(travel, y));
    }
    var sheets = files.querySelectorAll('.sheet');
    for (var i = 0; i < sheets.length && i < HOLDS.length; i++) {
      var y = stop(sheets[i]);
      keys.push([HOLDS[i][0], y], [HOLDS[i][1], y]);
    }
    keys.push([READ_END, keys[keys.length - 1][1]]);
    var ex = stop(files.querySelector('.exhibit'));
    keys.push([EXHIBIT_AT, ex], [1, ex]);
    keys.unshift([0, keys[0][1]]);
    inner.style.setProperty('--ty', prev || '0');
  }
  function ease(t) { return t * t * (3 - 2 * t); }
  function offsetAt(p) {
    for (var i = 1; i < keys.length; i++) {
      if (p <= keys[i][0]) {
        var a = keys[i - 1], b = keys[i];
        var t = (p - a[0]) / Math.max(b[0] - a[0], 1e-4);
        return a[1] + (b[1] - a[1]) * ease(Math.max(0, Math.min(1, t)));
      }
    }
    return keys.length ? keys[keys.length - 1][1] : 0;
  }
  function runTimeline() {
    if (reduce || !files) return;
    var inner = files.querySelector('[data-files-inner]');
    var last = -1;
    (function frame() {
      var p = parseFloat(files.style.getPropertyValue('--sc-p')) || 0;
      if (p !== last && keys.length) {
        inner.style.setProperty('--ty', offsetAt(p).toFixed(1));
        last = p;
      }
      requestAnimationFrame(frame);
    })();
  }

  /* --------------------------------------------------- 3. the bar ----- */
  function bar() {
    var el = document.querySelector('[data-bar]');
    if (!el) return;
    var toggle = el.querySelector('[data-bar-toggle]');
    var links = {};
    Array.prototype.forEach.call(el.querySelectorAll('[data-nav]'), function (a) {
      links[a.getAttribute('data-nav')] = a;
    });

    // Solid once the hero has begun to scroll away.
    function solid() { el.classList.toggle('is-solid', scrollY > 40); }
    addEventListener('scroll', solid, { passive: true });
    solid();

    // Small screens: open and close the panel.
    function setOpen(on) {
      el.classList.toggle('is-open', on);
      toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
    toggle.addEventListener('click', function () { setOpen(!el.classList.contains('is-open')); });
    el.addEventListener('click', function (e) { if (e.target.closest('[data-nav]')) setOpen(false); });

    // "Case files" lands on the files fully revealed, not on the redacted
    // start of the pin: the reading hold after the last sheet (see HOLDS).
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href="#files"]');
      if (!a || reduce || !files) return;
      e.preventDefault();
      var travel = files.offsetHeight - innerHeight;
      var p = (HOLDS[HOLDS.length - 1][1] + READ_END) / 2;
      scrollTo({ top: files.offsetTop + travel * p, behavior: 'smooth' });
      history.replaceState(null, '', '#files');
    });
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && el.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });

    // The current section's link holds its underline.
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.getAttribute('data-chapter');
        for (var k in links) {
          if (k === id) links[k].setAttribute('aria-current', 'true');
          else links[k].removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('[data-chapter]'), function (s) { io.observe(s); });
  }

  /* ------------------------------------------- 4. letter-glitch field -- */
  function glitch() {
    var el = document.getElementById('letter-glitch-bg');
    if (!el || typeof LetterGlitch === 'undefined') return;
    var g = new LetterGlitch(el, {
      glitchSpeed: 60, centerVignette: false, outerVignette: true, smooth: true,
      glitchColors: getComputedStyle(document.documentElement)
        .getPropertyValue('--glitch').split(',').map(function (c) { return c.trim(); })
    });
    function pause() { cancelAnimationFrame(g.animationId); g.animationId = null; }
    // Reduced motion: one still frame of letters, no flicker.
    if (reduce) { requestAnimationFrame(pause); return; }
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) {
      var on = es[0].isIntersecting;
      if (!on && g.animationId) pause();
      else if (on && !g.animationId) g._animate();
    }).observe(document.getElementById('title'));
  }

  function layout() { measureStops(); buildBars(); }

  ScrollCraft.mount(document.body);
  bar();
  glitch();
  layout();
  runTimeline();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  var t;
  addEventListener('resize', function () { clearTimeout(t); t = setTimeout(layout, 120); });
})();

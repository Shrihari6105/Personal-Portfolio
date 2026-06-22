/* ============================================================
   Shrihari Portfolio — UI Enhancements (Vanilla JS)
   - Sticky/glass header on scroll
   - Mobile nav toggle
   - Scroll-spy to highlight active nav link
   - Smooth scroll on internal links
   - Fade-in on scroll using IntersectionObserver
   - Project filter chips (vanilla)
   - Footer year
   ============================================================ */

(() => {
  'use strict';

  // -----------------------------------------------------------
  // Footer year
  // -----------------------------------------------------------
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();



  // -----------------------------------------------------------
  // Smooth scroll for anchor links (fallback)
  // -----------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // -----------------------------------------------------------
  // Fade-in on scroll
  // -----------------------------------------------------------
  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -10% 0px' }
  );
  document.querySelectorAll('section').forEach((s) => fadeObserver.observe(s));

  // Failsafe: reveal any still-hidden sections after 2s (protects against
  // edge cases where IO doesn't fire — JS disabled, programmatic scroll, etc.)
  setTimeout(() => {
    document.querySelectorAll('section:not(.fade-in)').forEach((s) => s.classList.add('fade-in'));
  }, 2000);

  // -----------------------------------------------------------
  // Scroll-spy: highlight active nav link based on viewport
  // -----------------------------------------------------------
  const sections = Array.from(document.querySelectorAll('section[id]'));

  const setActiveLink = (id) => {
    if (window.pillNavInstance) {
      window.pillNavInstance.setActiveHref(`#${id}`);
    }
  };

  const spyObserver = new IntersectionObserver(
    (entries) => {
      // pick the entry most in view
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActiveLink(visible[0].target.id);
    },
    { threshold: [0.25, 0.5, 0.75], rootMargin: '-80px 0px -40% 0px' }
  );
  sections.forEach((s) => spyObserver.observe(s));

  // -----------------------------------------------------------
  // Project filter chips
  // -----------------------------------------------------------
  const chips = document.querySelectorAll('.filter-chip');
  const projectCards = document.querySelectorAll('.project-box');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const filter = chip.getAttribute('data-filter');
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      projectCards.forEach((card) => {
        const cat = card.getAttribute('data-category');
        const show = filter === 'all' || cat === filter;
        card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        if (show) {
          card.style.display = '';
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(10px)';
          setTimeout(() => { card.style.display = 'none'; }, 250);
        }
      });
    });
  });
})();

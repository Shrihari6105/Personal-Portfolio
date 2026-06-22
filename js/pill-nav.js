/* ============================================================
   PillNav — Vanilla JS (ported from React Bits)
   Requires GSAP
   ============================================================ */

class PillNav {
  constructor(container, options = {}) {
    this.container = container;
    this.logo = options.logo || '';
    this.logoAlt = options.logoAlt || 'Logo';
    this.logoText = options.logoText || 'V';
    this.items = options.items || [];
    this.activeHref = options.activeHref || '';
    this.className = options.className || '';
    this.ease = options.ease || 'power3.easeOut';
    this.baseColor = options.baseColor || '#fff';
    this.pillColor = options.pillColor || '#120F17';
    this.hoveredPillTextColor = options.hoveredPillTextColor || '#120F17';
    this.pillTextColor = options.pillTextColor ?? this.baseColor;
    this.onMobileMenuClick = options.onMobileMenuClick || null;
    this.initialLoadAnimation = options.initialLoadAnimation ?? false;

    this.isMobileMenuOpen = false;
    this.circleRefs = [];
    this.tlRefs = [];
    this.activeTweenRefs = [];

    this._buildDOM();
    this._init();
  }

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'pill-nav-container';

    this.nav = document.createElement('nav');
    this.nav.className = `pill-nav ${this.className}`;
    this.nav.setAttribute('aria-label', 'Primary');
    this.nav.style.setProperty('--base', this.baseColor);
    this.nav.style.setProperty('--pill-bg', this.pillColor);
    this.nav.style.setProperty('--hover-text', this.hoveredPillTextColor);
    this.nav.style.setProperty('--pill-text', this.pillTextColor);

    // Logo
    this.logoEl = document.createElement('a');
    this.logoEl.className = 'pill-logo';
    this.logoEl.href = this.items[0]?.href || '#';
    this.logoEl.setAttribute('aria-label', 'Home');
    if (this.logo) {
      this.logoImg = document.createElement('img');
      this.logoImg.src = this.logo;
      this.logoImg.alt = this.logoAlt;
      this.logoEl.appendChild(this.logoImg);
    } else {
      this.logoEl.innerHTML = `<span style="color: ${this.pillTextColor}; font-weight: bold; font-family: 'Montserrat', sans-serif;">${this.logoText}</span>`;
      this.logoImg = this.logoEl.firstElementChild;
    }
    this.logoEl.addEventListener('mouseenter', () => this._handleLogoEnter());
    this.logoEl.addEventListener('click', (e) => this._handleLinkClick(e, this.items[0]?.href || '#', this.logoEl));
    this.nav.appendChild(this.logoEl);

    // Desktop Nav Items
    this.navItemsEl = document.createElement('div');
    this.navItemsEl.className = 'pill-nav-items desktop-only';

    const ul = document.createElement('ul');
    ul.className = 'pill-list';
    ul.setAttribute('role', 'menubar');

    this.items.forEach((item, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'none');

      const a = document.createElement('a');
      a.setAttribute('role', 'menuitem');
      a.href = item.href;
      a.className = `pill ${this.activeHref === item.href ? 'is-active' : ''}`;
      a.setAttribute('aria-label', item.ariaLabel || item.label);
      a.dataset.index = i;

      const circle = document.createElement('span');
      circle.className = 'hover-circle';
      circle.setAttribute('aria-hidden', 'true');
      this.circleRefs[i] = circle;

      const stack = document.createElement('div');
      stack.className = 'label-stack';

      const label = document.createElement('div');
      label.className = 'pill-label';
      label.textContent = item.label;

      const labelHover = document.createElement('div');
      labelHover.className = 'pill-label-hover';
      labelHover.setAttribute('aria-hidden', 'true');
      labelHover.textContent = item.label;

      stack.appendChild(label);
      stack.appendChild(labelHover);
      a.appendChild(circle);
      a.appendChild(stack);

      a.addEventListener('mouseenter', () => this._handleEnter(i));
      a.addEventListener('mouseleave', () => this._handleLeave(i));

      // Handle click to update active state and scroll (if internal link)
      a.addEventListener('click', (e) => this._handleLinkClick(e, item.href, a));

      li.appendChild(a);
      ul.appendChild(li);
    });

    this.navItemsEl.appendChild(ul);
    this.nav.appendChild(this.navItemsEl);

    // Mobile Menu Button
    this.hamburgerBtn = document.createElement('button');
    this.hamburgerBtn.className = 'mobile-menu-button mobile-only';
    this.hamburgerBtn.setAttribute('aria-label', 'Toggle menu');
    this.hamburgerBtn.addEventListener('click', () => this._toggleMobileMenu());

    this.hamburgerLines = [];
    for (let i = 0; i < 2; i++) {
      const line = document.createElement('span');
      line.className = 'hamburger-line';
      this.hamburgerLines.push(line);
      this.hamburgerBtn.appendChild(line);
    }
    this.nav.appendChild(this.hamburgerBtn);
    this.wrapper.appendChild(this.nav);

    // Mobile Menu Popover
    this.mobileMenu = document.createElement('div');
    this.mobileMenu.className = 'mobile-menu-popover mobile-only';
    this.mobileMenu.style.setProperty('--base', this.baseColor);
    this.mobileMenu.style.setProperty('--pill-bg', this.pillColor);
    this.mobileMenu.style.setProperty('--hover-text', this.hoveredPillTextColor);
    this.mobileMenu.style.setProperty('--pill-text', this.pillTextColor);

    const mobileUl = document.createElement('ul');
    mobileUl.className = 'mobile-menu-list';

    this.items.forEach((item, i) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.href;
      a.className = `mobile-menu-link ${this.activeHref === item.href ? 'is-active' : ''}`;
      a.textContent = item.label;
      a.addEventListener('click', (e) => {
        this._toggleMobileMenu(false);
        this._handleLinkClick(e, item.href, a);
      });
      li.appendChild(a);
      mobileUl.appendChild(li);
    });

    this.mobileMenu.appendChild(mobileUl);
    this.wrapper.appendChild(this.mobileMenu);

    this.container.appendChild(this.wrapper);
  }

  _init() {
    this._layout();

    this._onResize = () => this._layout();
    window.addEventListener('resize', this._onResize);

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => this._layout()).catch(() => { });
    }

    if (this.mobileMenu) {
      gsap.set(this.mobileMenu, { visibility: 'hidden', opacity: 0, scaleY: 1 });
    }

    if (this.initialLoadAnimation) {
      if (this.logoEl) {
        gsap.set(this.logoEl, { scale: 0 });
        gsap.to(this.logoEl, {
          scale: 1,
          duration: 0.6,
          ease: this.ease
        });
      }

      if (this.navItemsEl) {
        gsap.set(this.navItemsEl, { width: 0, overflow: 'hidden' });
        gsap.to(this.navItemsEl, {
          width: 'auto',
          duration: 0.6,
          ease: this.ease
        });
      }
    }
  }

  _layout() {
    this.circleRefs.forEach((circle, index) => {
      if (!circle || !circle.parentElement) return;

      const pill = circle.parentElement;
      const rect = pill.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const R = ((w * w) / 4 + h * h) / (2 * h);
      const D = Math.ceil(2 * R) + 2;
      const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
      const originY = D - delta;

      circle.style.width = `${D}px`;
      circle.style.height = `${D}px`;
      circle.style.bottom = `-${delta}px`;

      gsap.set(circle, {
        xPercent: -50,
        scale: 0,
        transformOrigin: `50% ${originY}px`
      });

      const label = pill.querySelector('.pill-label');
      const white = pill.querySelector('.pill-label-hover');

      if (label) gsap.set(label, { y: 0 });
      if (white) gsap.set(white, { y: h + 12, opacity: 0 });

      if (this.tlRefs[index]) this.tlRefs[index].kill();
      const tl = gsap.timeline({ paused: true });

      tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease: this.ease, overwrite: 'auto' }, 0);

      if (label) {
        tl.to(label, { y: -(h + 8), duration: 2, ease: this.ease, overwrite: 'auto' }, 0);
      }

      if (white) {
        gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
        tl.to(white, { y: 0, opacity: 1, duration: 2, ease: this.ease, overwrite: 'auto' }, 0);
      }

      this.tlRefs[index] = tl;
    });
  }

  _handleEnter(i) {
    const tl = this.tlRefs[i];
    if (!tl) return;
    if (this.activeTweenRefs[i]) this.activeTweenRefs[i].kill();
    this.activeTweenRefs[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease: this.ease,
      overwrite: 'auto'
    });
  }

  _handleLeave(i) {
    const tl = this.tlRefs[i];
    if (!tl) return;
    if (this.activeTweenRefs[i]) this.activeTweenRefs[i].kill();
    this.activeTweenRefs[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease: this.ease,
      overwrite: 'auto'
    });
  }

  _handleLogoEnter() {
    const img = this.logoImg;
    if (!img) return;
    if (this.logoTween) this.logoTween.kill();
    gsap.set(img, { rotate: 0 });
    this.logoTween = gsap.to(img, {
      rotate: 360,
      duration: 0.2,
      ease: this.ease,
      overwrite: 'auto'
    });
  }

  _toggleMobileMenu(forceState = null) {
    const newState = forceState !== null ? forceState : !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen === newState) return;
    this.isMobileMenuOpen = newState;

    if (this.hamburgerLines.length === 2) {
      if (newState) {
        gsap.to(this.hamburgerLines[0], { rotation: 45, y: 3, duration: 0.3, ease: this.ease });
        gsap.to(this.hamburgerLines[1], { rotation: -45, y: -3, duration: 0.3, ease: this.ease });
      } else {
        gsap.to(this.hamburgerLines[0], { rotation: 0, y: 0, duration: 0.3, ease: this.ease });
        gsap.to(this.hamburgerLines[1], { rotation: 0, y: 0, duration: 0.3, ease: this.ease });
      }
    }

    if (this.mobileMenu) {
      if (newState) {
        gsap.set(this.mobileMenu, { visibility: 'visible' });
        gsap.fromTo(
          this.mobileMenu,
          { opacity: 0, y: 10, scaleY: 1 },
          {
            opacity: 1,
            y: 0,
            scaleY: 1,
            duration: 0.3,
            ease: this.ease,
            transformOrigin: 'top center'
          }
        );
      } else {
        gsap.to(this.mobileMenu, {
          opacity: 0,
          y: 10,
          scaleY: 1,
          duration: 0.2,
          ease: this.ease,
          transformOrigin: 'top center',
          onComplete: () => {
            gsap.set(this.mobileMenu, { visibility: 'hidden' });
          }
        });
      }
    }

    if (this.onMobileMenuClick) this.onMobileMenuClick();
  }

  _handleLinkClick(e, href, element) {
    // Scroll handling for internal links
    if (href.startsWith('#') && href !== '#') {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;
        const startTop = window.scrollY;
        const distance = targetTop - startTop;
        const duration = 1000; // 1 second duration for smooth feel
        let startTimestamp = null;

        // Custom ease-in-out cubic function for a luxurious scroll
        const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        // Disable native smooth scroll during custom animation
        document.documentElement.style.scrollBehavior = 'auto';

        const step = (timestamp) => {
          if (!startTimestamp) startTimestamp = timestamp;
          const progress = Math.min((timestamp - startTimestamp) / duration, 1);
          const easeProgress = easeInOutCubic(progress);
          window.scrollTo(0, startTop + distance * easeProgress);
          
          if (progress < 1) {
            window.requestAnimationFrame(step);
          } else {
            // Restore native smooth scroll
            document.documentElement.style.scrollBehavior = '';
          }
        };
        
        window.requestAnimationFrame(step);
      }
    }
    
    // Update active class
    this.setActiveHref(href);
  }

  setActiveHref(href) {
    this.activeHref = href;
    const allLinks = this.wrapper.querySelectorAll('.pill, .mobile-menu-link');
    allLinks.forEach(link => {
      if (link.getAttribute('href') === href) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    if (this.wrapper && this.wrapper.parentElement) {
      this.wrapper.parentElement.removeChild(this.wrapper);
    }
  }
}

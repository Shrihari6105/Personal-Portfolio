/* ============================================================
   LetterGlitch — Vanilla JS (ported from React Bits)
   Canvas-based animated glitching letter background effect.
   ============================================================ */

class LetterGlitch {
  /**
   * @param {HTMLElement} container - The DOM element to render into.
   * @param {Object} options
   * @param {string[]}  [options.glitchColors=['#2b4539','#61dca3','#61b3dc']]
   * @param {number}    [options.glitchSpeed=50]
   * @param {boolean}   [options.centerVignette=false]
   * @param {boolean}   [options.outerVignette=true]
   * @param {boolean}   [options.smooth=true]
   * @param {string}    [options.characters]
   */
  constructor(container, options = {}) {
    this.container = container;
    this.glitchColors = options.glitchColors || ['#5e5e5e', '#373737', '#d7dadd'];
    this.glitchSpeed = options.glitchSpeed ?? 50;
    this.centerVignette = options.centerVignette ?? false;
    this.outerVignette = options.outerVignette ?? true;
    this.smooth = options.smooth ?? true;
    this.characters = options.characters ||
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789';

    this.lettersAndSymbols = Array.from(this.characters);
    this.fontSize = 16;
    this.charWidth = 10;
    this.charHeight = 20;

    this.letters = [];
    this.grid = { columns: 0, rows: 0 };
    this.context = null;
    this.animationId = null;
    this.lastGlitchTime = Date.now();

    this._buildDOM();
    this._init();
  }

  /* ---- DOM ---- */
  _buildDOM() {
    // Wrapper
    this.wrapper = document.createElement('div');
    Object.assign(this.wrapper.style, {
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: '#000000',
      overflow: 'hidden'
    });

    // Canvas
    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {
      display: 'block',
      width: '100%',
      height: '100%'
    });
    this.wrapper.appendChild(this.canvas);

    // Outer vignette
    if (this.outerVignette) {
      const ov = document.createElement('div');
      Object.assign(ov.style, {
        position: 'absolute',
        top: '0', left: '0',
        width: '100%', height: '100%',
        pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 100%)'
      });
      this.wrapper.appendChild(ov);
    }

    // Center vignette
    if (this.centerVignette) {
      const cv = document.createElement('div');
      Object.assign(cv.style, {
        position: 'absolute',
        top: '0', left: '0',
        width: '100%', height: '100%',
        pointerEvents: 'none',
        background: 'radial-gradient(circle at 30% 50%, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)'
      });
      this.wrapper.appendChild(cv);
    }

    this.container.appendChild(this.wrapper);
  }

  /* ---- Init ---- */
  _init() {
    this.context = this.canvas.getContext('2d');
    this._resizeCanvas();
    this._animate();

    this._handleResize = () => {
      clearTimeout(this._resizeTimeout);
      this._resizeTimeout = setTimeout(() => {
        cancelAnimationFrame(this.animationId);
        this._resizeCanvas();
        this._animate();
      }, 100);
    };

    window.addEventListener('resize', this._handleResize);
  }

  /* ---- Helpers ---- */
  _getRandomChar() {
    return this.lettersAndSymbols[
      Math.floor(Math.random() * this.lettersAndSymbols.length)
    ];
  }

  _getRandomColor() {
    return this.glitchColors[
      Math.floor(Math.random() * this.glitchColors.length)
    ];
  }

  _hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : null;
  }

  _interpolateColor(start, end, factor) {
    return `rgb(${Math.round(start.r + (end.r - start.r) * factor)}, ${Math.round(start.g + (end.g - start.g) * factor)}, ${Math.round(start.b + (end.b - start.b) * factor)})`;
  }

  /* ---- Grid / Canvas ---- */
  _calculateGrid(width, height) {
    return {
      columns: Math.ceil(width / this.charWidth),
      rows: Math.ceil(height / this.charHeight)
    };
  }

  _initializeLetters(columns, rows) {
    this.grid = { columns, rows };
    const total = columns * rows;
    this.letters = Array.from({ length: total }, () => ({
      char: this._getRandomChar(),
      color: this._getRandomColor(),
      targetColor: this._getRandomColor(),
      colorProgress: 1
    }));
  }

  _resizeCanvas() {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    if (this.context) {
      this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const { columns, rows } = this._calculateGrid(rect.width, rect.height);
    this._initializeLetters(columns, rows);
    this._drawLetters();
  }

  /* ---- Draw ---- */
  _drawLetters() {
    if (!this.context || this.letters.length === 0) return;
    const ctx = this.context;
    const { width, height } = this.canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${this.fontSize}px monospace`;
    ctx.textBaseline = 'top';

    for (let i = 0; i < this.letters.length; i++) {
      const letter = this.letters[i];
      const x = (i % this.grid.columns) * this.charWidth;
      const y = Math.floor(i / this.grid.columns) * this.charHeight;
      ctx.fillStyle = letter.color;
      ctx.fillText(letter.char, x, y);
    }
  }

  _updateLetters() {
    if (!this.letters || this.letters.length === 0) return;
    const updateCount = Math.max(1, Math.floor(this.letters.length * 0.05));

    for (let i = 0; i < updateCount; i++) {
      const index = Math.floor(Math.random() * this.letters.length);
      if (!this.letters[index]) continue;

      this.letters[index].char = this._getRandomChar();
      this.letters[index].targetColor = this._getRandomColor();

      if (!this.smooth) {
        this.letters[index].color = this.letters[index].targetColor;
        this.letters[index].colorProgress = 1;
      } else {
        this.letters[index].colorProgress = 0;
      }
    }
  }

  _handleSmoothTransitions() {
    let needsRedraw = false;
    for (const letter of this.letters) {
      if (letter.colorProgress < 1) {
        letter.colorProgress += 0.05;
        if (letter.colorProgress > 1) letter.colorProgress = 1;

        const startRgb = this._hexToRgb(letter.color);
        const endRgb = this._hexToRgb(letter.targetColor);
        if (startRgb && endRgb) {
          letter.color = this._interpolateColor(startRgb, endRgb, letter.colorProgress);
          needsRedraw = true;
        }
      }
    }
    if (needsRedraw) this._drawLetters();
  }

  /* ---- Animation loop ---- */
  _animate() {
    const now = Date.now();
    if (now - this.lastGlitchTime >= this.glitchSpeed) {
      this._updateLetters();
      this._drawLetters();
      this.lastGlitchTime = now;
    }

    if (this.smooth) {
      this._handleSmoothTransitions();
    }

    this.animationId = requestAnimationFrame(() => this._animate());
  }

  /* ---- Cleanup ---- */
  destroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this._handleResize);
    if (this.wrapper && this.wrapper.parentElement) {
      this.wrapper.parentElement.removeChild(this.wrapper);
    }
  }
}

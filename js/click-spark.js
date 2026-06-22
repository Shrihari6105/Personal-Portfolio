/* ============================================================
   ClickSpark — Vanilla JS (ported from React Bits)
   Full-page click spark effect using a fixed canvas overlay.
   ============================================================ */

class ClickSpark {
  constructor(options = {}) {
    this.sparkColor = options.sparkColor || '#fff';
    this.sparkSize = options.sparkSize || 10;
    this.sparkRadius = options.sparkRadius || 15;
    this.sparkCount = options.sparkCount || 8;
    this.duration = options.duration || 400;
    this.easing = options.easing || 'ease-out';
    this.extraScale = options.extraScale || 1.0;

    this.sparks = [];
    this.animationId = null;

    this._drawBound = this._draw.bind(this);
    this._handleClickBound = this._handleClick.bind(this);
    this._resizeCanvasBound = this._resizeCanvas.bind(this);

    this._buildCanvas();
    this._bindEvents();
    this._startLoop();
  }

  _buildCanvas() {
    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '99999',
      display: 'block',
      userSelect: 'none'
    });
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this._resizeCanvas();
  }

  _resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _bindEvents() {
    window.addEventListener('resize', this._resizeCanvasBound);
    document.addEventListener('click', this._handleClickBound);
  }

  _easeFunc(t) {
    switch (this.easing) {
      case 'linear':
        return t;
      case 'ease-in':
        return t * t;
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default: // ease-out
        return t * (2 - t);
    }
  }

  _draw(timestamp) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.sparks = this.sparks.filter(spark => {
      const elapsed = timestamp - spark.startTime;
      if (elapsed >= this.duration) return false;

      const progress = elapsed / this.duration;
      const eased = this._easeFunc(progress);

      const distance = eased * this.sparkRadius * this.extraScale;
      const lineLength = this.sparkSize * (1 - eased);

      const x1 = spark.x + distance * Math.cos(spark.angle);
      const y1 = spark.y + distance * Math.sin(spark.angle);
      const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
      const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

      this.ctx.strokeStyle = this.sparkColor;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();

      return true;
    });

    this.animationId = requestAnimationFrame(this._drawBound);
  }

  _startLoop() {
    this.animationId = requestAnimationFrame(this._drawBound);
  }

  _handleClick(e) {
    const x = e.clientX;
    const y = e.clientY;
    const now = performance.now();

    const newSparks = Array.from({ length: this.sparkCount }, (_, i) => ({
      x,
      y,
      angle: (2 * Math.PI * i) / this.sparkCount,
      startTime: now
    }));

    this.sparks.push(...newSparks);
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this._resizeCanvasBound);
    document.removeEventListener('click', this._handleClickBound);
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
  }
}

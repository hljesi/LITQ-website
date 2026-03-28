/* ═══════════════════════════════════════════════════════
   GAUSSIAN WAVE PACKET ANIMATION
   Renders Re[ψ(x,t)] = A · exp(-(x-x₀(t))²/2σ²) · cos(k₀x - ωt)
   for multiple wave packets at different heights,
   simulating propagating quantum wavefunctions.
═══════════════════════════════════════════════════════ */
(function () {
  const canvas = document.getElementById('wave-canvas');
  if (!canvas) return; // only runs on pages that have the canvas
  const ctx    = canvas.getContext('2d');
  const dpr    = window.devicePixelRatio || 1;
  let W = 0, H = 0, animId, t = 0;

  // Wave packet descriptors
  // yF: vertical position (fraction of height)
  // k: wavenumber (oscillations per unit width, ×2π)
  // sig: Gaussian envelope half-width (fraction of width)
  // spd: group velocity (fraction of width per second)
  // om: angular frequency (rad/s) — om = k·spd for dispersion-free
  // x0: initial packet centre (fraction of width)
  // r,g,b: stroke colour   a: max opacity   amp: amplitude (fraction of height)
  const packets = [
    { yF:0.17, k:6.5,  sig:0.14, spd:0.038, om:1.55, x0:0.15, r:109, g:40,  b:217, a:0.70, amp:0.033 },
    { yF:0.32, k:10.5, sig:0.10, spd:0.055, om:2.20, x0:0.55, r:88,  g:28,  b:135, a:0.58, amp:0.026 },
    { yF:0.50, k:8.0,  sig:0.17, spd:0.044, om:1.65, x0:0.00, r:15,  g:118, b:110, a:0.65, amp:0.034 },
    { yF:0.68, k:12.5, sig:0.09, spd:0.066, om:2.60, x0:0.72, r:109, g:40,  b:217, a:0.52, amp:0.023 },
    { yF:0.85, k:6.0,  sig:0.19, spd:0.031, om:1.25, x0:0.38, r:15,  g:118, b:110, a:0.58, amp:0.036 },
  ];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawPacket(p) {
    const yC    = p.yF * H;
    const A     = p.amp * H;
    // Packet centre wraps: 0...(1 + 2·sigma) then snaps back to -sigma
    const span  = 1.0 + 2.5 * p.sig;
    const cx    = ((p.x0 + p.spd * t) % span) - 1.2 * p.sig;

    // Helper: compute ψ at normalised x in [0,1]
    function psi(xn) {
      const dx  = xn - cx;
      const env = Math.exp(-dx * dx / (2 * p.sig * p.sig));
      const osc = Math.cos(p.k * 2 * Math.PI * xn - p.om * t);
      return env * osc;
    }
    function envelope(xn) {
      const dx = xn - cx;
      return Math.exp(-dx * dx / (2 * p.sig * p.sig));
    }

    // Left-side fade mask (keep text legible on the left ~30% of canvas)
    function leftFade(xn) {
      return Math.min(1, Math.max(0, (xn - 0.22) / 0.18));
    }

    // ── Fill: probability density |ψ|² ────────────────────────────────
    ctx.beginPath();
    for (let px = 0; px <= W; px++) {
      const xn  = px / W;
      const env = envelope(xn);
      const prob = env * env;   // |ψ|² = envelope²
      const fade = leftFade(xn);
      if (px === 0) ctx.moveTo(px, yC - A * prob * fade);
      else          ctx.lineTo(px, yC - A * prob * fade);
    }
    for (let px = W; px >= 0; px--) {
      const xn  = px / W;
      const env = envelope(xn);
      const prob = env * env;
      const fade = leftFade(xn);
      ctx.lineTo(px, yC + A * prob * fade);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},0.045)`;
    ctx.fill();

    // ── Envelope outline (dashed, faint) ──────────────────────────────
    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 0.85;
    ctx.strokeStyle = `rgba(${p.r},${p.g},${p.b},0.20)`;
    // Upper envelope
    ctx.beginPath();
    for (let px = 0; px <= W; px++) {
      const xn   = px / W;
      const fade = leftFade(xn);
      const y    = yC - A * envelope(xn) * fade;
      px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
    }
    ctx.stroke();
    // Lower envelope
    ctx.beginPath();
    for (let px = 0; px <= W; px++) {
      const xn   = px / W;
      const fade = leftFade(xn);
      const y    = yC + A * envelope(xn) * fade;
      px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Main wave: Re[ψ(x,t)] ─────────────────────────────────────────
    ctx.beginPath();
    ctx.lineWidth = 1.55;
    ctx.strokeStyle = `rgba(${p.r},${p.g},${p.b},${p.a})`;
    for (let px = 0; px <= W; px++) {
      const xn   = px / W;
      const fade = leftFade(xn);
      const y    = yC + A * psi(xn) * fade;
      px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
    }
    ctx.stroke();
  }

  function frame() {
    if (!W || !H) { animId = requestAnimationFrame(frame); return; }
    ctx.clearRect(0, 0, W, H);

    // Very faint horizontal "qubit wire" baselines
    packets.forEach(p => {
      ctx.beginPath();
      ctx.moveTo(0, p.yF * H);
      ctx.lineTo(W, p.yF * H);
      ctx.strokeStyle = `rgba(${p.r},${p.g},${p.b},0.06)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    packets.forEach(drawPacket);

    t += 0.016;   // ~60 fps assumed; tune with actual delta if needed
    animId = requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', () => {
    cancelAnimationFrame(animId);
    resize();
    frame();
  });
  frame();
})();

/* ── Nav scroll solid class ─── */
const nav = document.getElementById('nav');
if (nav && !nav.classList.contains('always-solid')) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('solid', window.scrollY > 60);
  }, { passive: true });
}

/* ── Team carousels ─── */
(function () {
  const CARD_MIN_W = 160; // px — fixed card width on small screens
  const GAP = 22;         // matches 1.4rem gap at 16px base

  document.querySelectorAll('.team-carousel-wrap').forEach(wrap => {
    const track = wrap.querySelector('.team-grid');
    const outer = wrap.querySelector('.team-carousel-track-outer');
    const btnP  = wrap.querySelector('.carousel-btn--prev');
    const btnN  = wrap.querySelector('.carousel-btn--next');
    const cards = Array.from(track.querySelectorAll('.team-card'));
    const total = cards.length;
    let offset  = 0;

    function cardStep() {
      // fixed card width + gap
      return (cards[0].getBoundingClientRect().width || CARD_MIN_W) + GAP;
    }

    function maxOffset() {
      const trackW = total * cardStep() - GAP;
      const outerW = outer.getBoundingClientRect().width;
      return Math.max(0, Math.ceil((trackW - outerW) / cardStep()));
    }

    function applyOffset() {
      track.style.transform = `translateX(-${offset * cardStep()}px)`;
      btnP.classList.toggle('visible', offset > 0);
      btnN.classList.toggle('visible', offset < maxOffset());
    }

    function update() {
      offset = Math.min(offset, maxOffset());
      applyOffset();
    }

    btnP.addEventListener('click', () => { if (offset > 0) { offset--; applyOffset(); } });
    btnN.addEventListener('click', () => { if (offset < maxOffset()) { offset++; applyOffset(); } });

    window.addEventListener('resize', update);
    requestAnimationFrame(() => requestAnimationFrame(update));
  });
})();

/* ── Scroll reveal ─── */
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

/* ── Mobile burger ─── */
const burger = document.getElementById('burger');
if (burger) {
  burger.addEventListener('click', function () {
    const links = document.querySelector('.nav-links');
    const open  = links.style.display === 'flex';
    links.style.display = open ? 'none' : 'flex';
    if (!open) Object.assign(links.style, {
      flexDirection:  'column',
      position:       'absolute',
      top:            '68px',
      left:           '0',
      right:          '0',
      background:     'rgba(247,243,235,0.96)',
      padding:        '1.5rem 5vw 2rem',
      backdropFilter: 'blur(20px)',
      borderBottom:   '1px solid rgba(88,28,135,0.13)',
      gap:            '1.2rem'
    });
  });
}

// ============ Mobile rail toggle ============
const railToggle = document.querySelector('.rail-toggle');
const rail = document.querySelector('.rail');

railToggle.addEventListener('click', () => {
  const isOpen = rail.classList.toggle('open');
  railToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

document.querySelectorAll('.rail-link').forEach(link => {
  link.addEventListener('click', () => {
    rail.classList.remove('open');
    railToggle.setAttribute('aria-expanded', 'false');
  });
});

// ============ Scroll-spy: highlight active rail link + grow trace line ============
const sections = document.querySelectorAll('main .mod');
const railLinks = document.querySelectorAll('.rail-link');
const traceFill = document.getElementById('traceFill');

function updateScrollSpy() {
  let activeIndex = 0;
  const scrollPos = window.scrollY + window.innerHeight * 0.3;

  sections.forEach((section, i) => {
    if (section.offsetTop <= scrollPos) activeIndex = i;
  });

  railLinks.forEach((link, i) => {
    link.classList.toggle('active', i === activeIndex);
  });

  if (traceFill) {
    const progress = (activeIndex) / Math.max(railLinks.length - 1, 1);
    const fullHeight = 600; // matches viewBox height in SVG
    traceFill.setAttribute('y2', (progress * fullHeight).toFixed(1));
  }
}

window.addEventListener('scroll', updateScrollSpy, { passive: true });
window.addEventListener('load', updateScrollSpy);
updateScrollSpy();

// ============ Terminal boot sequence ============
(function () {
  const body = document.getElementById('terminalBody');
  if (!body) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lines = [
    { prompt: '$ whoami', cls: 'line-prompt' },
    { text: 'pratik tamang — software engineer, ui/ux designer', cls: 'line-bright' },
    { prompt: '$ cat location.txt', cls: 'line-prompt' },
    { text: 'based in nepal', cls: '' },
    { prompt: '$ status --current', cls: 'line-prompt' },
    { text: 'co-founder & designer @ yaksha soft', cls: '' },
    { text: 'building products end to end — wireframe to working code.', cls: 'line-dim' }
  ];

  if (reduceMotion) {
    body.innerHTML = lines.map(l =>
      `<div class="${l.cls}">${l.prompt ? l.prompt : l.text}</div>`
    ).join('');
    return;
  }

  let lineIndex = 0;
  let charIndex = 0;
  let currentDiv = null;

  function typeNext() {
    if (lineIndex >= lines.length) {
      const cursor = document.createElement('span');
      cursor.className = 'cursor-blink';
      body.appendChild(cursor);
      return;
    }

    const lineData = lines[lineIndex];
    const fullText = lineData.prompt || lineData.text;

    if (charIndex === 0) {
      currentDiv = document.createElement('div');
      currentDiv.className = lineData.cls;
      body.appendChild(currentDiv);
    }

    if (charIndex < fullText.length) {
      currentDiv.textContent = fullText.slice(0, charIndex + 1);
      charIndex++;
      setTimeout(typeNext, lineData.prompt ? 28 : 14);
    } else {
      charIndex = 0;
      lineIndex++;
      setTimeout(typeNext, lineData.prompt ? 220 : 320);
    }
  }

  typeNext();
})();

// ============ Dotted portrait canvas (hero readout) ============
// Builds a halftone-dot portrait from a real photo silhouette and lets the
// cursor repel nearby dots, like iron filings reacting to a magnet.
(function () {
  const canvas = document.getElementById('dotCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W, H, DPR;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  const hasPhotoSilhouette = typeof SILHOUETTE_FLAT !== 'undefined' && SILHOUETTE_FLAT.length > 0;
  const photoAspect = hasPhotoSilhouette ? SILHOUETTE_ASPECT : 1;

  function inSilhouetteFallback(nx, ny) {
    const shoulderTop = 0.62;
    if (ny > shoulderTop) {
      const spread = (ny - shoulderTop) / (1 - shoulderTop);
      const halfWidth = 0.22 + spread * 0.33;
      return Math.abs(nx - 0.5) < halfWidth;
    }
    const cx = 0.5, cy = 0.36;
    const rx = 0.21, ry = 0.27;
    const dx = (nx - cx) / rx;
    const dy = (ny - cy) / ry;
    return dx * dx + dy * dy < 1;
  }

  let dots = [];
  const spacing = 9;

  const mouse = { x: -9999, y: -9999, active: false };
  const REPEL_RADIUS = 50;
  const REPEL_STRENGTH = 22;
  const SPRING = 0.12;
  const DAMPING = 0.82;

  function buildDots() {
    dots = [];

    if (hasPhotoSilhouette) {
      const boxAspect = W / H;
      let fitW, fitH, offX, offY;
      if (photoAspect > boxAspect) {
        fitW = W;
        fitH = W / photoAspect;
      } else {
        fitH = H;
        fitW = H * photoAspect;
      }
      offX = (W - fitW) / 2;
      offY = (H - fitH) / 2;

      for (let p = 0; p < SILHOUETTE_FLAT.length; p += 2) {
        const nx = SILHOUETTE_FLAT[p];
        const ny = SILHOUETTE_FLAT[p + 1];
        const x = offX + nx * fitW;
        const y = offY + ny * fitH;
        dots.push({
          hx: x, hy: y, x, y, vx: 0, vy: 0,
          inside: true,
          r: 0.9 + Math.random() * 0.5,
          delay: Math.random() * 700,
          twinkle: Math.random() * Math.PI * 2
        });
      }
      const ambientCount = Math.floor((W * H) / (spacing * spacing) * 0.035);
      for (let k = 0; k < ambientCount; k++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        dots.push({
          hx: x, hy: y, x, y, vx: 0, vy: 0,
          inside: false,
          r: 0.6,
          delay: Math.random() * 700,
          twinkle: Math.random() * Math.PI * 2
        });
      }
      return;
    }

    const cols = Math.floor(W / spacing);
    const rows = Math.floor(H / spacing);
    for (let i = 0; i <= cols; i++) {
      for (let j = 0; j <= rows; j++) {
        const x = i * spacing;
        const y = j * spacing;
        const nx = x / W;
        const ny = y / H;
        const inside = inSilhouetteFallback(nx, ny);
        if (inside || Math.random() < 0.05) {
          dots.push({
            hx: x, hy: y, x, y, vx: 0, vy: 0,
            inside,
            r: inside ? 1.2 + Math.random() * 0.6 : 0.6,
            delay: Math.random() * 600,
            twinkle: Math.random() * Math.PI * 2
          });
        }
      }
    }
  }

  function updatePhysics() {
    dots.forEach(d => {
      if (mouse.active) {
        const dx = d.hx - mouse.x;
        const dy = d.hy - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0.0001) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          d.vx += (dx / dist) * force * 0.08;
          d.vy += (dy / dist) * force * 0.08;
        }
      }
      const sx = (d.hx - d.x) * SPRING;
      const sy = (d.hy - d.y) * SPRING;
      d.vx += sx;
      d.vy += sy;
      d.vx *= DAMPING;
      d.vy *= DAMPING;
      d.x += d.vx;
      d.y += d.vy;
    });
  }

  let startTime = null;

  function draw(time) {
    if (!startTime) startTime = time;
    const elapsed = time - startTime;

    if (!reduceMotion) updatePhysics();

    ctx.clearRect(0, 0, W, H);

    dots.forEach(d => {
      const t = elapsed - d.delay;
      let alpha;
      if (reduceMotion) {
        alpha = d.inside ? 0.9 : 0.2;
      } else if (t < 0) {
        alpha = 0;
      } else {
        const appear = Math.min(t / 400, 1);
        const twinkle = d.inside ? 0.75 + 0.25 * Math.sin(elapsed / 900 + d.twinkle) : 0.18;
        alpha = appear * twinkle;
      }

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = d.inside
        ? `rgba(255, 107, 53, ${alpha})`
        : `rgba(201, 201, 194, ${alpha * 0.5})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  function init() {
    resize();
    buildDots();
    startTime = null;
    requestAnimationFrame(draw);
  }

  function setMouseFromEvent(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = clientX - rect.left;
    mouse.y = clientY - rect.top;
    mouse.active = true;
  }

  canvas.addEventListener('mousemove', e => setMouseFromEvent(e.clientX, e.clientY));
  canvas.addEventListener('mouseleave', () => { mouse.active = false; });
  canvas.addEventListener('touchmove', e => {
    if (e.touches[0]) setMouseFromEvent(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  canvas.addEventListener('touchend', () => { mouse.active = false; });

  window.addEventListener('resize', () => {
    clearTimeout(window._dotResizeTO);
    window._dotResizeTO = setTimeout(init, 200);
  });

  init();
})();

// ============ Hide profile image gracefully if missing ============
const profileImg = document.getElementById('profileImg');
if (profileImg) {
  profileImg.addEventListener('error', () => {
    profileImg.closest('.id-photo').style.background =
      'linear-gradient(155deg, var(--bg-raised-2), var(--bg))';
    profileImg.style.display = 'none';
  });
}

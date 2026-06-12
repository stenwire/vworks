const DEFAULT_CONTENT = {
  hero: {
    headline: { line1: 'Work.', line2: 'Sip.', line3: ' Game.' },
    subtext: "Olambe's boldest co-working hub — fast WiFi, cold brew, and PS5 stations under one roof."
  },
  services: {
    workspace: { title: 'Workspace', desc: 'Hot desks, private pods, and a buzzing open floor. Plug in, focus up.' },
    coffee:    { title: 'Coffee Spot', desc: 'Cold brew, espresso, and snacks to keep your workflow fuelled all day.' },
    gaming:    { title: 'PS5 Gaming', desc: 'Unwind between sessions on our PS5 stations. Book a slot or walk in.' }
  },
  hours: {
    mon: '8:00 AM – 7:00 PM',
    tue: '8:00 AM – 7:00 PM',
    wed: '8:00 AM – 7:00 PM',
    thu: '8:00 AM – 7:00 PM',
    fri: '8:00 AM – 7:00 PM',
    sat: '8:00 AM – 7:00 PM',
    sun: 'Closed'
  },
  visibility: { gallery: true, amenities: true }
};

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
}

function loadContent() {
  let content = DEFAULT_CONTENT;
  try {
    const raw = localStorage.getItem('vworks_content');
    if (raw) {
      const parsed = JSON.parse(raw);
      content = deepMerge(DEFAULT_CONTENT, parsed);
    }
  } catch (_) {}
  return content;
}

function deepMerge(base, override) {
  const result = Object.assign({}, base);
  for (const key of Object.keys(override)) {
    if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
      result[key] = deepMerge(base[key] || {}, override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

function hydrateContent(content) {
  document.querySelectorAll('[data-content]').forEach(el => {
    const val = getNestedValue(content, el.dataset.content);
    if (val !== null && val !== undefined) el.textContent = val;
  });

  document.querySelectorAll('[data-section]').forEach(el => {
    const key = el.dataset.section;
    const visible = content.visibility && content.visibility[key] !== false;
    el.style.display = visible ? '' : 'none';
  });
}

// ─── CURSOR ───────────────────────────────────────────
function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) {
    document.body.classList.add('touch-device');
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (dot) dot.style.display = 'none';
    if (ring) ring.style.display = 'none';
    return;
  }

  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;
  let rafId;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%))`;
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate(calc(${ringX}px - 50%), calc(${ringY}px - 50%))`;
    rafId = requestAnimationFrame(animateRing);
  }
  animateRing();

  const hoverTargets = 'a, button, .service-card, .gallery-slot, .amenity-item';
  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

// ─── NAVBAR ───────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    navbar.classList.toggle('scrolled', current > 60);
    if (current > lastScroll && current > 250) {
      navbar.classList.add('hidden');
    } else {
      navbar.classList.remove('hidden');
    }
    lastScroll = Math.max(0, current);
  }, { passive: true });

  // Mobile menu
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileClose');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => mobileMenu.classList.add('open'));
  }
  if (mobileClose && mobileMenu) {
    mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
  }
}

window.closeMobileMenu = function () {
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu) mobileMenu.classList.remove('open');
};

// ─── SCROLL REVEALS ───────────────────────────────────
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ─── VIDEO PLAY OVERLAYS ──────────────────────────────
function initVideoOverlays() {
  document.querySelectorAll('.play-overlay').forEach(btn => {
    const video = btn.closest('.video-wrap').querySelector('video');

    btn.addEventListener('click', () => {
      video.play();
      btn.classList.add('hidden');
    });

    video.addEventListener('pause', () => btn.classList.remove('hidden'));
    video.addEventListener('ended', () => btn.classList.remove('hidden'));
  });
}

// ─── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const content = loadContent();
  hydrateContent(content);
  initCursor();
  initNavbar();
  initVideoOverlays();

  // Small delay so elements paint before observer fires
  requestAnimationFrame(() => initReveal());
});

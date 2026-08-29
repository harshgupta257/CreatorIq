/* ============================================================
   CreatorIQ — js/main.js
   Smooth animations, canvas particles, counters, typed text
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────
   1. NAVBAR SCROLL EFFECT
───────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  if (scrollY > 30) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  lastScrollY = scrollY;
}, { passive: true });

/* ─────────────────────────────────────────────
   2. HAMBURGER MENU
───────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
let menuOpen = false;

hamburger.addEventListener('click', () => {
  menuOpen = !menuOpen;
  if (menuOpen) {
    mobileMenu.classList.add('open');
    hamburger.style.transform = 'rotate(90deg)';
  } else {
    mobileMenu.classList.remove('open');
    hamburger.style.transform = 'rotate(0deg)';
  }
});

// Close menu on mobile link click
document.querySelectorAll('.mobile-link, .mobile-cta').forEach(link => {
  link.addEventListener('click', () => {
    menuOpen = false;
    mobileMenu.classList.remove('open');
    hamburger.style.transform = 'rotate(0deg)';
  });
});

/* ─────────────────────────────────────────────
   3. SMOOTH SCROLL
───────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ─────────────────────────────────────────────
   4. INTERSECTION OBSERVER — REVEAL ANIMATIONS
───────────────────────────────────────────── */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger children in the same parent
        const siblings = [...entry.target.parentElement.querySelectorAll('.reveal')];
        const idx = siblings.indexOf(entry.target);
        const delay = idx * 80; // 80ms stagger
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ─────────────────────────────────────────────
   5. ANIMATED NUMBER COUNTERS (stats bar)
───────────────────────────────────────────── */
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const duration = 1800;
  const step = 16;
  const steps = duration / step;
  const increment = target / steps;
  let current = 0;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    // Format: if integer show integer, else show 1 decimal
    const display = Number.isInteger(target)
      ? Math.round(current)
      : current.toFixed(1);
    el.textContent = display + suffix;
  }, step);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll('.stat-num[data-target]').forEach(el => {
  counterObserver.observe(el);
});

/* ─────────────────────────────────────────────
   6. TYPING ANIMATION — HERO HEADLINE
───────────────────────────────────────────── */
const typedEl = document.getElementById('typed-text');
const phrases = [
  'Grow Your Reach.',
  'Dominate Your Niche.',
  'Unlock AI Insights.',
  'Predict Your Growth.'
];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingTimeout;

// Create cursor element
const cursor = document.createElement('span');
cursor.className = 'typed-cursor';
typedEl.parentElement.appendChild(cursor);

function type() {
  const currentPhrase = phrases[phraseIndex];

  if (!isDeleting) {
    typedEl.textContent = currentPhrase.slice(0, charIndex + 1);
    charIndex++;
    if (charIndex === currentPhrase.length) {
      isDeleting = true;
      typingTimeout = setTimeout(type, 2400); // Pause at end
      return;
    }
  } else {
    typedEl.textContent = currentPhrase.slice(0, charIndex - 1);
    charIndex--;
    if (charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
    }
  }

  const speed = isDeleting ? 45 : 75;
  typingTimeout = setTimeout(type, speed);
}

// Apply gradient to typed element
typedEl.classList.add('gradient-text');

// Start typing after a short delay (let page load)
setTimeout(type, 1200);

/* ─────────────────────────────────────────────
   7. YOUTUBE URL VALIDATION & REDIRECT
───────────────────────────────────────────── */
function analyzeChannel() {
  const input = document.getElementById('channelInput');
  const errorEl = document.getElementById('inputError');
  const btn = document.getElementById('analyzeBtn');
  const value = input.value.trim();

  // Clear previous error
  errorEl.textContent = '';

  if (!value) {
    showError('Please enter a YouTube channel URL or @handle.');
    shakeInput(input);
    return;
  }

  // Validate: accept @handle or youtube.com URLs
  const isHandle = /^@[\w.-]{2,100}$/.test(value);
  const isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com\/(channel\/|c\/|user\/|@)|youtu\.be\/)/i.test(value);
  const isShortHandle = /^[\w.-]{2,100}$/.test(value); // bare name fallback

  if (!isHandle && !isUrl && !isShortHandle) {
    showError('Invalid format. Try "@ChannelName" or a full YouTube URL.');
    shakeInput(input);
    return;
  }

  // Store in localStorage
  localStorage.setItem('creatoriq_channel', value);
  localStorage.setItem('creatoriq_timestamp', Date.now());

  // Animate button
  btn.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';
  btn.querySelector('.btn-text').textContent = 'Analyzing…';
  btn.querySelector('.btn-arrow').textContent = '⟳';
  btn.disabled = true;

  // Redirect after a brief animation
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 800);
}

function showError(msg) {
  const errorEl = document.getElementById('inputError');
  errorEl.textContent = '⚠ ' + msg;
}

function shakeInput(el) {
  el.parentElement.style.animation = 'shake 0.4s ease';
  el.parentElement.addEventListener('animationend', () => {
    el.parentElement.style.animation = '';
  }, { once: true });
}

// Inject shake keyframes
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-8px); }
    40%       { transform: translateX(8px); }
    60%       { transform: translateX(-5px); }
    80%       { transform: translateX(5px); }
  }
`;
document.head.appendChild(shakeStyle);

// Enter key submit
document.getElementById('channelInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') analyzeChannel();
});

// Input focus — clear error
document.getElementById('channelInput').addEventListener('input', () => {
  document.getElementById('inputError').textContent = '';
});

/* ─────────────────────────────────────────────
   8. PARTICLE CANVAS
───────────────────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles;
  const PARTICLE_COUNT = 80;

  const COLORS = [
    'rgba(124, 58, 237, 0.7)',
    'rgba(59, 130, 246, 0.6)',
    'rgba(6, 182, 212, 0.5)',
    'rgba(236, 72, 153, 0.4)',
    'rgba(167, 139, 250, 0.5)'
  ];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x     = Math.random() * W;
      this.y     = Math.random() * H;
      this.r     = Math.random() * 1.8 + 0.4;
      this.vx    = (Math.random() - 0.5) * 0.35;
      this.vy    = (Math.random() - 0.5) * 0.35;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.alpha = Math.random() * 0.6 + 0.2;
      this.life  = 0;
      this.maxLife = Math.random() * 400 + 200;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      if (this.life > this.maxLife || this.x < 0 || this.x > W || this.y < 0 || this.y > H) {
        this.reset();
      }
    }
    draw() {
      const progress = this.life / this.maxLife;
      const a = this.alpha * Math.sin(progress * Math.PI); // fade in/out
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color.replace(/[\d.]+\)$/, `${a})`);
      ctx.fill();
    }
  }

  function initParticlePool() {
    particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
  }

  // Draw connections between nearby particles
  function drawConnections() {
    const maxDist = 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  let raf;
  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    raf = requestAnimationFrame(animate);
  }

  // Mouse interaction — repel particles
  let mouseX = -9999, mouseY = -9999;
  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  // Modified update with mouse repulsion
  Particle.prototype.updateWithMouse = function() {
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const repelRadius = 100;
    if (dist < repelRadius && dist > 0) {
      const force = (repelRadius - dist) / repelRadius;
      this.vx += (dx / dist) * force * 0.5;
      this.vy += (dy / dist) * force * 0.5;
    }
    // Dampen velocity
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.x += this.vx;
    this.y += this.vy;
    this.life++;
    if (this.life > this.maxLife || this.x < -10 || this.x > W + 10 || this.y < -10 || this.y > H + 10) {
      this.reset();
    }
  };

  // Override update with mouse version
  Particle.prototype.update = Particle.prototype.updateWithMouse;

  resize();
  initParticlePool();
  animate();

  window.addEventListener('resize', () => {
    resize();
    initParticlePool();
  }, { passive: true });
})();

/* ─────────────────────────────────────────────
   9. FLOATING CARDS PARALLAX (subtle)
───────────────────────────────────────────── */
const floatCards = document.querySelectorAll('.float-card');
window.addEventListener('mousemove', (e) => {
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;
  const dx = (e.clientX - cx) / cx; // -1 to 1
  const dy = (e.clientY - cy) / cy;

  floatCards.forEach((card, i) => {
    const depth = (i + 1) * 4;
    card.style.transform = `translate(${dx * depth}px, ${dy * depth}px)`;
  });
}, { passive: true });

/* ─────────────────────────────────────────────
   10. INPUT PLACEHOLDER CYCLE (subtle UX)
───────────────────────────────────────────── */
const channelInput = document.getElementById('channelInput');
const placeholders = [
  'Enter YouTube Channel URL or @handle (e.g. @MrBeast)',
  'Try @mkbhd, @veritasium, @LexFridman…',
  'Paste a YouTube URL like youtube.com/@NASA',
  'Search any creator by @handle or full URL'
];
let placeholderIdx = 0;

setInterval(() => {
  if (document.activeElement !== channelInput) {
    placeholderIdx = (placeholderIdx + 1) % placeholders.length;
    channelInput.placeholder = placeholders[placeholderIdx];
  }
}, 3500);

/* ─────────────────────────────────────────────
   11. FEATURE CARD TILT (mouse over)
───────────────────────────────────────────── */
document.querySelectorAll('.feature-card, .wyg-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width  / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -5;
    const rotateY = ((x - cx) / cx) *  5;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ─────────────────────────────────────────────
   12. STEP ICON HOVER — COLOR ROTATION
───────────────────────────────────────────── */
const stepColors = ['#7c3aed', '#3b82f6', '#06b6d4', '#ec4899'];
document.querySelectorAll('.step-icon').forEach((icon, i) => {
  icon.addEventListener('mouseenter', () => {
    icon.style.boxShadow = `0 0 40px ${stepColors[i]}80`;
  });
  icon.addEventListener('mouseleave', () => {
    icon.style.boxShadow = '';
  });
});

/* ─────────────────────────────────────────────
   13. RESTORE LAST CHANNEL FROM LOCALSTORAGE
───────────────────────────────────────────── */
(function restoreChannel() {
  const stored = localStorage.getItem('creatoriq_channel');
  const ts = localStorage.getItem('creatoriq_timestamp');
  if (stored && ts) {
    const age = Date.now() - parseInt(ts);
    // Show last channel if less than 1 hour old
    if (age < 3_600_000) {
      const input = document.getElementById('channelInput');
      if (input && !input.value) {
        input.value = stored;
      }
    }
  }
})();

/* ─────────────────────────────────────────────
   14. STATS BAR SPARKLE ON HOVER
───────────────────────────────────────────── */
document.querySelectorAll('.stat-item').forEach(item => {
  item.addEventListener('mouseenter', () => {
    item.style.transform = 'scale(1.05)';
    item.style.transition = 'transform 0.2s ease';
  });
  item.addEventListener('mouseleave', () => {
    item.style.transform = '';
  });
});

/* ─────────────────────────────────────────────
   15. SCROLL PROGRESS INDICATOR
───────────────────────────────────────────── */
const progressBar = document.createElement('div');
progressBar.style.cssText = `
  position: fixed;
  top: 0; left: 0;
  height: 2px;
  width: 0%;
  background: linear-gradient(90deg, #7c3aed, #3b82f6, #06b6d4);
  z-index: 9999;
  transition: width 0.1s linear;
  pointer-events: none;
`;
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
  const docH   = document.documentElement.scrollHeight - window.innerHeight;
  const scrolled = (window.scrollY / docH) * 100;
  progressBar.style.width = Math.min(scrolled, 100) + '%';
}, { passive: true });

/* ─────────────────────────────────────────────
   16. HERO SCROLL INDICATOR FADE OUT
───────────────────────────────────────────── */
const scrollIndicator = document.querySelector('.hero-scroll-indicator');
if (scrollIndicator) {
  window.addEventListener('scroll', () => {
    const opacity = Math.max(0, 1 - window.scrollY / 200);
    scrollIndicator.style.opacity = opacity;
  }, { passive: true });
}

console.log('%c CreatorIQ Analytics Platform', 'color: #7c3aed; font-size: 16px; font-weight: bold;');
console.log('%c Multi-source analytics powered by AI', 'color: #06b6d4; font-size: 12px;');

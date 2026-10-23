/**
 * ui.js — UI Utilities & Global Helpers
 * Toast notifications, scroll behavior, mobile menu, hero slider, search
 */

'use strict';

/* ================================================================
   TOAST NOTIFICATIONS
   ================================================================ */
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '📢'}</span>
    <span class="toast-message">${MarkusSecurity.sanitizeHTML(String(message))}</span>
    <button class="toast-close" onclick="this.closest('.toast').remove()" aria-label="Close notification">✕</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ================================================================
   SEARCH
   ================================================================ */
function setupSearch() {
  const input = document.getElementById('mainSearchInput');
  const btn   = document.getElementById('searchBtn');
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  btn?.addEventListener('click', performSearch);

  // Real-time search dropdown (debounced)
  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const q = input.value.trim();
      if (q.length >= 2) updateSearchDropdown(q);
    }, 300);
  });
}

function performSearch() {
  const q = document.getElementById('mainSearchInput')?.value.trim();
  const cat = document.getElementById('searchCategory')?.value || 'all';
  if (!q) return;
  window.location.href = `pages/search.html?q=${encodeURIComponent(q)}&cat=${cat}`;
}

function updateSearchDropdown(q) {
  const dropdown = document.getElementById('searchDropdown');
  if (!dropdown) return;
  const results = MarkusStore.searchProducts(q).slice(0, 5);
  if (results.length === 0) return;

  const html = `
    <div class="search-trending" style="margin-top:10px;">
      <span class="search-label">🔍 Results</span>
      ${results.map(p => `
        <a href="pages/product.html?id=${p.id}" style="display:flex;align-items:center;gap:10px;padding:8px 4px;border-radius:8px;color:var(--color-silver);font-size:.85rem;transition:background .15s;" onmouseover="this.style.background='rgba(255,255,255,.05)'" onmouseout="this.style.background=''">
          <span>${p.emoji}</span>
          <span>${MarkusSecurity.sanitizeHTML(p.name.substring(0, 50))}${p.name.length > 50 ? '...' : ''}</span>
          <span style="margin-left:auto;color:var(--color-orange);font-weight:700;">₹${p.price.toLocaleString('en-IN')}</span>
        </a>
      `).join('')}
    </div>
  `;
  dropdown.innerHTML = html;
}

function fillSearch(query) {
  const input = document.getElementById('mainSearchInput');
  if (input) { input.value = query; performSearch(); }
}

/* ================================================================
   HERO SLIDER
   ================================================================ */
function setupHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.slider-dot');
  if (!slides.length) return;

  let current = 0;
  let autoPlayTimer;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');
    dots[current]?.setAttribute('aria-selected', 'false');

    current = (index + slides.length) % slides.length;

    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
    dots[current]?.setAttribute('aria-selected', 'true');
  }

  function startAutoPlay() {
    autoPlayTimer = setInterval(() => goTo(current + 1), 5000);
  }

  function stopAutoPlay() { clearInterval(autoPlayTimer); }

  document.getElementById('heroNext')?.addEventListener('click', () => { goTo(current + 1); stopAutoPlay(); startAutoPlay(); });
  document.getElementById('heroPrev')?.addEventListener('click', () => { goTo(current - 1); stopAutoPlay(); startAutoPlay(); });

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(parseInt(dot.dataset.index));
      stopAutoPlay();
      startAutoPlay();
    });
  });

  // Touch/swipe support
  const slider = document.getElementById('heroSlider');
  if (slider) {
    let touchStartX = 0;
    slider.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    slider.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) { goTo(current + (diff > 0 ? 1 : -1)); stopAutoPlay(); startAutoPlay(); }
    }, { passive: true });
  }

  // Pause on hover
  slider?.addEventListener('mouseenter', stopAutoPlay);
  slider?.addEventListener('mouseleave', startAutoPlay);

  startAutoPlay();
}

/* ================================================================
   MOBILE MENU
   ================================================================ */
function setupMobileMenu() {
  const btn     = document.getElementById('mobileMenuBtn');
  const menu    = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileMenuOverlay');
  const close   = document.getElementById('mobileMenuClose');

  function open() {
    menu?.classList.add('open');
    overlay?.classList.add('open');
    btn?.classList.add('active');
    btn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    menu?.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    menu?.classList.remove('open');
    overlay?.classList.remove('open');
    btn?.classList.remove('active');
    btn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    menu?.setAttribute('aria-hidden', 'true');
  }

  btn?.addEventListener('click', () => menu?.classList.contains('open') ? closeMenu() : open());
  close?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu?.classList.contains('open')) closeMenu();
  });
}

/* ================================================================
   HEADER SCROLL BEHAVIOR
   ================================================================ */
function setupHeaderScroll() {
  const header = document.getElementById('mainHeader');
  if (!header) return;
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    header.classList.toggle('scrolled', current > 50);
    lastScroll = current;
  }, { passive: true });
}

/* ================================================================
   SCROLL TO TOP
   ================================================================ */
function setupScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.style.display = window.scrollY > 400 ? 'flex' : 'none';
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ================================================================
   ANNOUNCEMENT BAR
   ================================================================ */
function setupAnnouncementBar() {
  const bar = document.getElementById('announcementBar');
  const closeBtn = document.getElementById('closeAnnouncement');

  if (sessionStorage.getItem('announcementClosed')) {
    bar?.remove();
    return;
  }

  closeBtn?.addEventListener('click', () => {
    bar?.remove();
    sessionStorage.setItem('announcementClosed', '1');
  });
}

/* ================================================================
   LOCATION DETECTOR
   ================================================================ */
function setupLocation() {
  const btn = document.getElementById('locationBtn');
  const val = document.getElementById('locationValue');
  if (!btn || !val) return;

  btn.addEventListener('click', () => {
    if (!navigator.geolocation) { showToast('Geolocation not supported', 'error'); return; }
    navigator.geolocation.getCurrentPosition(
      () => {
        // In production, reverse geocode with Maps API
        val.textContent = 'Current Location';
        showToast('Location detected!', 'success');
      },
      () => showToast('Location access denied. Set manually.', 'warning')
    );
  });
}

/* ================================================================
   RIPPLE EFFECT
   ================================================================ */
function setupRipple() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.ripple-container, .btn-primary-hero, .btn-buy-now, .btn-add-cart, .btn-auth-submit');
    if (!target) return;

    const rect   = target.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height);
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;

    target.style.position = 'relative';
    target.style.overflow = 'hidden';
    target.appendChild(ripple);

    ripple.addEventListener('animationend', () => ripple.remove());
  });
}

/* ================================================================
   INTERSECTION OBSERVER FOR ANIMATIONS
   ================================================================ */
function setupRevealObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

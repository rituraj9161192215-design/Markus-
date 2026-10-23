/**
 * security.js — Markus Security Layer
 * 
 * Client-side security hardening:
 * - CSRF token management
 * - XSS sanitization helpers
 * - Input validation utilities
 * - Content Security Policy helpers
 * - Rate limiting for auth actions
 * - Anti-clickjacking
 * 
 * NOTE: True security is enforced server-side.
 * This is the client-side hardening layer.
 */

'use strict';

const MarkusSecurity = (() => {

  /* ================================================================
     CSRF TOKEN
     ================================================================ */
  const CSRF_TOKEN_KEY = 'markus_csrf_token';

  function generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  function getCSRFToken() {
    let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
    if (!token) {
      token = generateCSRFToken();
      sessionStorage.setItem(CSRF_TOKEN_KEY, token);
    }
    return token;
  }

  function injectCSRFTokens() {
    // Add hidden CSRF field to all forms
    document.querySelectorAll('form').forEach(form => {
      if (!form.querySelector('[name="_csrf"]')) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = '_csrf';
        input.value = getCSRFToken();
        form.appendChild(input);
      }
    });
  }

  /* ================================================================
     XSS SANITIZATION
     ================================================================ */
  function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  }

  function sanitizeURL(url) {
    try {
      const parsed = new URL(url);
      // Only allow safe protocols
      if (!['http:', 'https:', 'tel:', 'mailto:'].includes(parsed.protocol)) {
        return '#';
      }
      return parsed.href;
    } catch {
      return '#';
    }
  }

  function stripTags(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  /* ================================================================
     INPUT VALIDATION
     ================================================================ */
  const Validators = {
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    phone: (v) => /^(\+91|91)?[6-9]\d{9}$/.test(v.replace(/[\s\-()]/g, '')),
    gst:   (v) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v),
    pincode: (v) => /^[1-9][0-9]{5}$/.test(v),
    password: (v) => v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v) && /[^A-Za-z0-9]/.test(v),
    name: (v) => v.trim().length >= 2 && v.trim().length <= 100 && !/[<>"/\\|?*]/.test(v),
    upi:  (v) => /^[\w.\-]{3,}@[\w]{3,}$/.test(v),
    amount: (v) => !isNaN(v) && Number(v) > 0 && Number(v) < 1000000,
    sqlSafe: (v) => !/('|--|;|\/\*|\*\/|xp_|EXEC|UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)/i.test(v),
  };

  function validateField(type, value) {
    if (!value || !Validators[type]) return false;
    return Validators[type](String(value));
  }

  /* ================================================================
     PASSWORD STRENGTH
     ================================================================ */
  function checkPasswordStrength(password) {
    let score = 0;
    const checks = {
      length:    password.length >= 8,
      longLen:   password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number:    /[0-9]/.test(password),
      special:   /[^A-Za-z0-9]/.test(password),
    };

    score += checks.length   ? 1 : 0;
    score += checks.longLen  ? 1 : 0;
    score += checks.uppercase ? 1 : 0;
    score += checks.lowercase ? 1 : 0;
    score += checks.number   ? 1 : 0;
    score += checks.special  ? 2 : 0;

    let label, color, percent;
    if      (score < 2) { label = 'Very Weak';  color = '#EF4444'; percent = 15; }
    else if (score < 3) { label = 'Weak';        color = '#F97316'; percent = 30; }
    else if (score < 4) { label = 'Fair';        color = '#F59E0B'; percent = 55; }
    else if (score < 6) { label = 'Strong';      color = '#22C55E'; percent = 75; }
    else                { label = 'Very Strong'; color = '#10B981'; percent = 100; }

    return { score, label, color, percent, checks };
  }

  /* ================================================================
     RATE LIMITING (client-side, rudimentary)
     ================================================================ */
  const _rateLimits = {};

  function checkRateLimit(action, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    const key = `rl_${action}`;

    if (!_rateLimits[key]) {
      _rateLimits[key] = { count: 0, windowStart: now };
    }

    const state = _rateLimits[key];

    // Reset window if expired
    if (now - state.windowStart > windowMs) {
      state.count = 0;
      state.windowStart = now;
    }

    state.count++;

    if (state.count > maxAttempts) {
      const remaining = Math.ceil((state.windowStart + windowMs - now) / 1000);
      return { allowed: false, remaining };
    }

    return { allowed: true, remaining: 0 };
  }

  /* ================================================================
     SECURE STORAGE (encrypt with sessionStorage)
     ================================================================ */
  const SecureStorage = {
    set(key, value) {
      try {
        // In production, encrypt with a derived key. Here: base64 obfuscation.
        const encoded = btoa(JSON.stringify({ v: value, t: Date.now() }));
        localStorage.setItem(`markus_${key}`, encoded);
      } catch {}
    },
    get(key) {
      try {
        const raw = localStorage.getItem(`markus_${key}`);
        if (!raw) return null;
        const decoded = JSON.parse(atob(raw));
        return decoded.v;
      } catch { return null; }
    },
    remove(key) {
      localStorage.removeItem(`markus_${key}`);
    },
    clear() {
      Object.keys(localStorage).filter(k => k.startsWith('markus_')).forEach(k => localStorage.removeItem(k));
    }
  };

  /* ================================================================
     ANTI-CLICKJACKING (defence in depth — also done server-side)
     ================================================================ */
  function preventClickjacking() {
    if (window.self !== window.top) {
      // We're in an iframe — break out
      try { window.top.location = window.self.location; } catch { document.body.innerHTML = ''; }
    }
  }

  /* ================================================================
     CONTENT INTEGRITY (SRI check helper)
     ================================================================ */
  function checkExternalResources() {
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      if (!script.integrity && script.src && !script.src.startsWith(window.location.origin)) {
        console.warn('[Markus Security] External script without SRI:', script.src);
      }
    });
  }

  /* ================================================================
     INITIALIZE
     ================================================================ */
  function init() {
    preventClickjacking();
    injectCSRFTokens();

    // Re-inject on dynamic DOM changes
    const observer = new MutationObserver(() => injectCSRFTokens());
    observer.observe(document.body, { childList: true, subtree: true });

    // Block right-click on sensitive content (light protection)
    document.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.secure-content')) {
        e.preventDefault();
      }
    });

    // Log security events (in production, send to SIEM)
    window.addEventListener('error', (e) => {
      if (e.message && e.message.includes('Content Security Policy')) {
        console.error('[Markus CSP Violation]', e.message);
      }
    });

    if (window.location.protocol === 'http:' && !window.location.hostname.includes('localhost')) {
      console.warn('[Markus Security] Not using HTTPS! Please enforce HTTPS in production.');
    }
  }

  /* ================================================================
     PUBLIC API
     ================================================================ */
  return {
    init,
    getCSRFToken,
    sanitizeHTML,
    sanitizeURL,
    stripTags,
    validate: validateField,
    Validators,
    checkPasswordStrength,
    checkRateLimit,
    storage: SecureStorage,
  };

})();

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MarkusSecurity.init());
} else {
  MarkusSecurity.init();
}

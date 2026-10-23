/**
 * auth.js — Authentication Module
 * Handles: login, signup, session, 2FA, social auth
 */

'use strict';

const MarkusAuth = (() => {

  const SESSION_KEY = 'markus_session';
  let _currentUser = null;

  /* ================================================================
     SESSION MANAGEMENT
     ================================================================ */
  function loadSession() {
    try {
      const session = MarkusSecurity.storage.get('session');
      if (session && session.expiresAt > Date.now()) {
        _currentUser = session.user;
        return true;
      }
      clearSession();
      return false;
    } catch { return false; }
  }

  function saveSession(user) {
    const session = {
      user,
      expiresAt: Date.now() + 7 * 24 * 3600 * 1000, // 7 days
      token: generateSessionToken(),
    };
    MarkusSecurity.storage.set('session', session);
    _currentUser = user;
  }

  function clearSession() {
    MarkusSecurity.storage.remove('session');
    _currentUser = null;
  }

  function generateSessionToken() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2,'0')).join('');
  }

  function isLoggedIn() { return _currentUser !== null; }

  function getCurrentUser() { return _currentUser ? { ..._currentUser } : null; }

  /* ================================================================
     MOCK USER DATABASE (replace with API)
     ================================================================ */
  function getMockUsers() {
    try {
      const saved = MarkusSecurity.storage.get('users');
      return saved ? [...saved] : [];
    } catch { return []; }
  }

  function saveMockUsers(users) {
    MarkusSecurity.storage.set('users', users);
  }

  async function hashPassword(password) {
    // In production use bcrypt server-side. Client: SHA-256 + salt for demo.
    const salt = 'markus_secure_salt_2025';
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
  }

  /* ================================================================
     LOGIN
     ================================================================ */
  async function login(identifier, password, rememberMe = false) {
    // Rate limit check
    const rateCheck = MarkusSecurity.checkRateLimit('login', 5, 300000);
    if (!rateCheck.allowed) {
      return { success: false, message: `Too many attempts. Try again in ${rateCheck.remaining}s` };
    }

    // Validate inputs
    if (!identifier || !password) {
      return { success: false, message: 'Email/phone and password are required' };
    }

    // XSS safe
    identifier = MarkusSecurity.sanitizeHTML(identifier.trim());
    if (!MarkusSecurity.validate('sqlSafe', identifier) || !MarkusSecurity.validate('sqlSafe', password)) {
      return { success: false, message: 'Invalid characters in input' };
    }

    // Simulate API call delay
    await new Promise(r => setTimeout(r, 600));

    const users = getMockUsers();
    const hashedPwd = await hashPassword(password);

    const user = users.find(u =>
      (u.email === identifier || u.phone === identifier) &&
      u.passwordHash === hashedPwd
    );

    if (!user) {
      // Check for demo admin
      if (identifier === 'admin@markus.com' && password === 'Admin@123') {
        const adminUser = { id: 'admin-001', name: 'Admin', email: 'admin@markus.com', role: 'admin', avatar: '' };
        saveSession(adminUser);
        updateUIForAuth(adminUser);
        return { success: true, user: adminUser, isAdmin: true };
      }
      // Demo customer
      if ((identifier === 'demo@markus.com' || identifier === '9999999999') && password === 'Demo@123') {
        const demoUser = { id: 'demo-001', name: 'Demo User', email: 'demo@markus.com', phone: '9999999999', role: 'customer', avatar: '' };
        saveSession(demoUser);
        updateUIForAuth(demoUser);
        return { success: true, user: demoUser };
      }
      return { success: false, message: 'Invalid credentials. Please check your email/phone and password.' };
    }

    const { passwordHash: _, ...safeUser } = user;
    saveSession(safeUser);
    updateUIForAuth(safeUser);
    return { success: true, user: safeUser };
  }

  /* ================================================================
     SIGNUP
     ================================================================ */
  async function signup(name, email, phone, password) {
    // Rate limit
    const rateCheck = MarkusSecurity.checkRateLimit('signup', 3, 600000);
    if (!rateCheck.allowed) {
      return { success: false, message: `Too many signup attempts. Try again in ${rateCheck.remaining}s` };
    }

    // Validation
    name = MarkusSecurity.sanitizeHTML(name.trim());
    email = email.trim().toLowerCase();
    phone = phone.replace(/\s/g, '');

    if (!MarkusSecurity.validate('name', name))    return { success: false, message: 'Please enter a valid name (2-100 chars)' };
    if (!MarkusSecurity.validate('email', email))  return { success: false, message: 'Please enter a valid email address' };
    if (!MarkusSecurity.validate('phone', phone))  return { success: false, message: 'Please enter a valid Indian phone number' };

    // Password strength
    const strength = MarkusSecurity.checkPasswordStrength(password);
    if (strength.score < 3) {
      return { success: false, message: 'Password too weak. Use 8+ chars with uppercase, number, and special character.' };
    }

    await new Promise(r => setTimeout(r, 800));

    const users = getMockUsers();
    if (users.find(u => u.email === email)) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const passwordHash = await hashPassword(password);
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      phone,
      passwordHash,
      role: 'customer',
      avatar: '',
      createdAt: new Date().toISOString(),
      preferences: {},
    };

    users.push(newUser);
    saveMockUsers(users);

    const { passwordHash: _, ...safeUser } = newUser;
    saveSession(safeUser);
    updateUIForAuth(safeUser);

    // Send welcome email (mock)
    console.log(`[Markus] Welcome email sent to ${email}`);

    return { success: true, user: safeUser };
  }

  /* ================================================================
     LOGOUT
     ================================================================ */
  function logout() {
    clearSession();
    updateUIForAuth(null);
    showToast('Logged out successfully', 'info');
    // Redirect to home
    setTimeout(() => { window.location.href = '/index.html'; }, 800);
  }

  /* ================================================================
     SOCIAL AUTH (Mock — in production use OAuth)
     ================================================================ */
  async function socialLogin(provider) {
    await new Promise(r => setTimeout(r, 1200));
    // Simulate OAuth response
    const mockUser = {
      id: `social-${provider}-${Date.now()}`,
      name: 'Social User',
      email: `user_${Date.now()}@${provider}.com`,
      provider,
      role: 'customer',
      avatar: '',
    };
    saveSession(mockUser);
    updateUIForAuth(mockUser);
    closeAuthModal();
    showToast(`Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`, 'success');
    return { success: true, user: mockUser };
  }

  /* ================================================================
     UI UPDATE
     ================================================================ */
  function updateUIForAuth(user) {
    const authBtn = document.getElementById('authBtn');
    const authDropdownHeader = document.getElementById('authDropdownHeader');
    const logoutLink = document.getElementById('logoutLink');
    const mobileGreeting = document.getElementById('mobileGreeting');

    if (user) {
      // Show user name
      if (authBtn) {
        authBtn.querySelector('.action-label').textContent = `Hello, ${user.name.split(' ')[0]}`;
        authBtn.querySelector('.action-value').textContent = 'Account & Orders ▾';
      }
      if (authDropdownHeader) {
        authDropdownHeader.innerHTML = `<p>Welcome back, <strong>${user.name.split(' ')[0]}</strong>!</p>`;
      }
      if (logoutLink) logoutLink.style.display = 'block';
      if (mobileGreeting) mobileGreeting.textContent = `Hello, ${user.name.split(' ')[0]}`;
    } else {
      if (authBtn) {
        authBtn.querySelector('.action-label').textContent = 'Hello, Sign In';
        authBtn.querySelector('.action-value').textContent = 'Account & Orders ▾';
      }
      if (authDropdownHeader) {
        authDropdownHeader.innerHTML = `<p>New customer?</p><a href="pages/signup.html" class="btn-orange" id="authSignupLink">Start here</a>`;
      }
      if (logoutLink) logoutLink.style.display = 'none';
      if (mobileGreeting) mobileGreeting.textContent = 'Hello, Guest';
    }
  }

  /* ================================================================
     AUTH MODAL
     ================================================================ */
  function openAuthModal(tab = 'login') {
    const overlay = document.getElementById('authModalOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      switchAuthTab(tab);
      // Focus first input
      setTimeout(() => {
        const firstInput = overlay.querySelector('input');
        if (firstInput) firstInput.focus();
      }, 100);
    }
  }

  function closeAuthModal() {
    const overlay = document.getElementById('authModalOverlay');
    if (overlay) {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
      document.getElementById('loginForm')?.reset();
      document.getElementById('signupForm')?.reset();
    }
  }

  /* ================================================================
     INITIALIZE
     ================================================================ */
  function init() {
    loadSession();
    updateUIForAuth(_currentUser);
    bindAuthEvents();
  }

  function bindAuthEvents() {
    // Auth button opens modal if not logged in
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
      authBtn.addEventListener('click', () => {
        if (!isLoggedIn()) {
          openAuthModal('login');
        }
      });
    }

    // Modal close
    document.getElementById('authModalClose')?.addEventListener('click', closeAuthModal);
    document.getElementById('authModalOverlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeAuthModal();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAuthModal();
    });

    // Logout
    document.getElementById('logoutLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });

    // Tab switching
    document.getElementById('loginTabBtn')?.addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('signupTabBtn')?.addEventListener('click', () => switchAuthTab('signup'));

    // Login form
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('loginSubmitBtn');
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      btn.disabled = true;
      btn.textContent = 'Logging in...';

      const result = await login(email, password);

      if (result.success) {
        closeAuthModal();
        showToast(`Welcome back, ${result.user.name.split(' ')[0]}! 🎉`, 'success');
        if (result.isAdmin) {
          setTimeout(() => { window.location.href = 'pages/admin/dashboard.html'; }, 1000);
        }
      } else {
        showToast(result.message, 'error');
        document.getElementById('loginEmailError').textContent = result.message;
      }

      btn.disabled = false;
      btn.textContent = 'Login';
    });

    // Signup form
    document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('signupSubmitBtn');
      const name = document.getElementById('signupName').value;
      const email = document.getElementById('signupEmail').value;
      const phone = document.getElementById('signupPhone').value;
      const password = document.getElementById('signupPassword').value;
      const terms = document.getElementById('termsAccept').checked;

      if (!terms) {
        showToast('Please accept the Terms of Service', 'error');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Creating account...';

      const result = await signup(name, email, phone, password);

      if (result.success) {
        closeAuthModal();
        showToast(`Account created! Welcome to Markus, ${result.user.name.split(' ')[0]}! 🎉`, 'success');
      } else {
        showToast(result.message, 'error');
      }

      btn.disabled = false;
      btn.textContent = 'Create Account';
    });

    // Password strength meter
    document.getElementById('signupPassword')?.addEventListener('input', (e) => {
      const val = e.target.value;
      if (!val) return;
      const strength = MarkusSecurity.checkPasswordStrength(val);
      const fill = document.getElementById('strengthFill');
      const label = document.getElementById('strengthLabel');
      if (fill) { fill.style.width = strength.percent + '%'; fill.style.background = strength.color; }
      if (label) { label.textContent = strength.label; label.style.color = strength.color; }
    });
  }

  /* ================================================================
     PUBLIC API
     ================================================================ */
  return {
    init,
    login,
    logout,
    signup,
    socialLogin,
    isLoggedIn,
    getCurrentUser,
    openAuthModal,
    closeAuthModal,
  };

})();

// Global helpers referenced in HTML
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.auth-form-panel').forEach(p => p.classList.toggle('active', p.id === `${tab}Panel`));
  const titleEl = document.getElementById('authModalTitle');
  if (titleEl) titleEl.textContent = tab === 'login' ? 'Welcome Back!' : 'Create Account';
}

function socialLogin(provider) { return MarkusAuth.socialLogin(provider); }

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

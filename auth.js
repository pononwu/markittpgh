/* ============================================================
   MARKITT PH — auth.js
   Owner login, session management, and logout.
   Used by: dashboard.html
   ============================================================ */

'use strict';

// ── Session ───────────────────────────────────────────────────
function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(KEYS.session)) || null;
  } catch { return null; }
}

function setSession(bizId, ownerName) {
  sessionStorage.setItem(KEYS.session, JSON.stringify({ bizId, ownerName, ts: Date.now() }));
}

function clearSession() {
  sessionStorage.removeItem(KEYS.session);
}

function isLoggedIn() {
  return getSession() !== null;
}

// ── Owner Login ───────────────────────────────────────────────
async function ownerLogin() {
  const nameInput = document.getElementById('loginBizName');
  const passInput = document.getElementById('loginPass');
  clearAlert('loginAlert');

  const bizName = nameInput.value.trim();
  const password = passInput.value;

  if (!bizName || !password) {
    showAlert('loginAlert', 'Please enter your business name and password.', 'error');
    return;
  }

  const businesses = getAll(KEYS.businesses);
  // Match by name (case-insensitive)
  const biz = businesses.find(b => b.name.toLowerCase() === bizName.toLowerCase());

  if (!biz) {
    showAlert('loginAlert', 'No business found with that name. Check the spelling or register below.', 'error');
    return;
  }

  const hashed = await hashPassword(password);
  if (hashed !== biz.passwordHash) {
    showAlert('loginAlert', 'Incorrect password. Please try again.', 'error');
    passInput.value = '';
    return;
  }

  setSession(biz.id, biz.ownerName);
  showDashboard(biz.id);
}

// ── Logout ────────────────────────────────────────────────────
function logoutOwner() {
  clearSession();
  document.getElementById('dashboardScreen').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginBizName').value = '';
  document.getElementById('loginPass').value = '';
  showToast('Logged out successfully.');
}

// ── Auto-login from URL param (after registration) ───────────
function checkAutoLogin() {
  const paramId = getParam('bizId');
  if (paramId) {
    const businesses = getAll(KEYS.businesses);
    const biz = businesses.find(b => b.id === paramId);
    if (biz) {
      // Registration just completed — skip password for this session
      setSession(biz.id, biz.ownerName);
      showDashboard(biz.id);
      return;
    }
  }
  // Check existing session
  const session = getSession();
  if (session) {
    showDashboard(session.bizId);
  }
}

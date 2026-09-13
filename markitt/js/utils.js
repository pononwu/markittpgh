/* ============================================================
   MARKITT PH — utils.js
   Shared helper functions used by all other JS modules.
   ============================================================ */

'use strict';

// ── localStorage Keys ─────────────────────────────────────────
const KEYS = {
  businesses: 'markittph_businesses',
  products:   'markittph_products',
  reviews:    'markittph_reviews',
  analytics:  'markittph_analytics',
  session:    'markittph_session',
};

// ── Storage Helpers ───────────────────────────────────────────
function getAll(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch { return []; }
}

function saveAll(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getObj(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch { return {}; }
}

function saveObj(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── ID Generator ──────────────────────────────────────────────
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Simple SHA-256-like hash (for passwords) ──────────────────
// Uses Web Crypto API (async). Falls back to btoa for older browsers.
async function hashPassword(plain) {
  if (window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain + 'markittph_salt');
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback
  return btoa(plain + 'markittph_salt');
}

// ── Toast Notification ────────────────────────────────────────
function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ── Alert Box ─────────────────────────────────────────────────
function showAlert(containerId, msg, type = 'success') {
  const el = document.getElementById(containerId);
  if (!el) return;
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle';
  el.innerHTML = `
    <div class="alert alert-${type}">
      <i class="fa fa-${icon}"></i> ${msg}
    </div>`;
}

function clearAlert(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = '';
}

// ── Form Validation Helpers ───────────────────────────────────
function showError(fieldId, errId) {
  const f = document.getElementById(fieldId);
  const e = document.getElementById(errId);
  if (f) f.classList.add('error');
  if (e) e.classList.add('show');
}

function clearError(fieldId, errId) {
  const f = document.getElementById(fieldId);
  const e = document.getElementById(errId);
  if (f) f.classList.remove('error');
  if (e) e.classList.remove('show');
}

function clearAllErrors(ids) {
  ids.forEach(([fid, eid]) => clearError(fid, eid));
}

// ── Image → Base64 ────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Resize image before storing (keeps localStorage lean) ─────
function resizeImage(base64, maxW = 600, maxH = 600) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(maxW / width, maxH / height, 1);
      width  = Math.round(width  * ratio);
      height = Math.round(height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.src = base64;
  });
}

// ── Star Rendering ────────────────────────────────────────────
function renderStars(rating, total = 5) {
  let html = '';
  for (let i = 1; i <= total; i++) {
    html += i <= Math.round(rating)
      ? '<i class="fa fa-star" style="color:var(--orange)"></i>'
      : '<i class="fa fa-star" style="color:var(--grey-md)"></i>';
  }
  return html;
}

// ── Date Formatter ────────────────────────────────────────────
function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Currency Formatter ────────────────────────────────────────
function formatPrice(val) {
  const n = parseFloat(val);
  if (!val || isNaN(n)) return 'Price on request';
  return '₦' + n.toLocaleString('en-NG');
}

// ── Category Emoji ────────────────────────────────────────────
function catEmoji(cat) {
  const map = {
    'Food & Drinks':        '🍽️',
    'Fashion & Clothing':   '👗',
    'Beauty & Salon':       '💅',
    'Electronics & Tech':   '💻',
    'Health & Pharmacy':    '💊',
    'Automobile & Repairs': '🚗',
    'Education & Training': '🎓',
    'Home & Furniture':     '🛋️',
    'Other':                '🏪',
  };
  return map[cat] || '🏪';
}

// ── URL param helper ──────────────────────────────────────────
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ── Build a profile URL ───────────────────────────────────────
function profileURL(bizId) {
  const base = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
  return base + 'profile.html?id=' + bizId;
}

// ── Tab switching (shared) ────────────────────────────────────
function switchTab(panelId, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('tab-' + panelId);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');

  // Initialise map lazily when location tab opened
  if (panelId === 'location' && typeof initMap === 'function') initMap();
}

// ── Analytics: record a view ──────────────────────────────────
function recordView(bizId) {
  const analytics = getObj(KEYS.analytics);
  if (!analytics[bizId]) analytics[bizId] = { views: 0, shares: 0 };
  analytics[bizId].views += 1;
  saveObj(KEYS.analytics, analytics);
}

// ── Analytics: record a share ─────────────────────────────────
function recordShare(bizId) {
  const analytics = getObj(KEYS.analytics);
  if (!analytics[bizId]) analytics[bizId] = { views: 0, shares: 0 };
  analytics[bizId].shares += 1;
  saveObj(KEYS.analytics, analytics);
}

// ── Analytics: get stats for a business ──────────────────────
function getAnalytics(bizId) {
  const analytics = getObj(KEYS.analytics);
  return analytics[bizId] || { views: 0, shares: 0 };
}

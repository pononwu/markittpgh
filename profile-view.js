/* ============================================================
   MARKITT PH — profile-view.js
   Renders the public business profile page (profile.html).
   Handles template switching, product grid, reviews, and map.
   Depends on: utils.js, reviews.js, share.js
   ============================================================ */

'use strict';

let currentBiz = null;
let mapInstance = null;

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const bizId = getParam('id');

  if (!bizId) {
    showNotFound();
    return;
  }

  const biz = getBusinessById(bizId);
  if (!biz) {
    showNotFound();
    return;
  }

  currentBiz = biz;
  document.title = `${biz.name} — Markitt PH`;

  applyTemplate(biz.template);
  renderHero(biz);
  renderAbout(biz);
  renderProducts(biz.id);
  renderReviews(biz.id);

  // Record view
  recordView(biz.id);

  // Hide loading overlay
  document.getElementById('loadingOverlay').style.display = 'none';
});

// ── Apply Template CSS ────────────────────────────────────────
function applyTemplate(tpl) {
  const link = document.getElementById('templateStylesheet');
  if (link) {
    link.href = tpl === 'B' ? 'css/template-b.css' : 'css/template-a.css';
  }
}

// ── Hero Section ──────────────────────────────────────────────
function renderHero(biz) {
  // Avatar
  const avatarEl = document.getElementById('heroAvatar');
  if (biz.logo) {
    avatarEl.innerHTML = `<img src="${biz.logo}" alt="${esc(biz.name)}" />`;
  } else {
    avatarEl.textContent = catEmoji(biz.category);
  }

  // Name
  document.getElementById('heroName').textContent = biz.name;

  // Category badge
  document.getElementById('heroBadge').innerHTML =
    `<span class="badge badge-green" style="font-size:13px;">${esc(biz.category)}</span>`;

  // Meta row
  const meta = [];
  if (biz.phone)   meta.push(`<span><i class="fa fa-phone"></i> ${esc(biz.phone)}</span>`);
  if (biz.address) meta.push(`<span><i class="fa fa-map-marker-alt"></i> ${esc(biz.address)}</span>`);
  if (biz.hours)   meta.push(`<span><i class="fa fa-clock"></i> ${esc(biz.hours)}</span>`);
  document.getElementById('heroMeta').innerHTML = meta.join('');

  // Dashboard link
  document.getElementById('dashLink').href = 'dashboard.html?bizId=' + biz.id;
}

// ── About Tab ─────────────────────────────────────────────────
function renderAbout(biz) {
  document.getElementById('aboutDesc').textContent = biz.description || '—';

  const items = [];
  if (biz.phone)   items.push(['fa-phone',         'Phone',   biz.phone]);
  if (biz.address) items.push(['fa-map-marker-alt', 'Address', biz.address]);
  if (biz.hours)   items.push(['fa-clock',          'Hours',   biz.hours]);
  if (biz.ownerName) items.push(['fa-user',         'Owner',   biz.ownerName]);

  const listEl = document.getElementById('infoList');
  listEl.innerHTML = items.map(([icon, label, val]) => `
    <li>
      <span class="info-icon"><i class="fa ${icon}"></i></span>
      <span class="info-label">${label}</span>
      <span>${esc(val)}</span>
    </li>`).join('');
}

// ── Products Tab ──────────────────────────────────────────────
function renderProducts(bizId) {
  const products = getProducts(bizId);
  const grid     = document.getElementById('productGrid');
  const noProds  = document.getElementById('noProducts');

  if (!products.length) {
    grid.innerHTML = '';
    noProds.classList.remove('hidden');
    return;
  }
  noProds.classList.add('hidden');

  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-card-img">
        ${p.image
          ? `<img src="${p.image}" alt="${esc(p.name)}" />`
          : '📦'}
      </div>
      <div class="product-card-body">
        <div class="product-card-name">${esc(p.name)}</div>
        <div class="product-card-price">${formatPrice(p.price)}</div>
        ${p.description ? `<div class="product-card-desc">${esc(p.description)}</div>` : ''}
      </div>
    </div>`).join('');
}

// ── Location Tab / Map ────────────────────────────────────────
function initMap() {
  if (mapInstance) return; // already initialised

  const biz = currentBiz;
  const lat  = parseFloat(biz?.lat) || 4.8156;
  const lng  = parseFloat(biz?.lng) || 7.0498;

  document.getElementById('locationAddress').textContent =
    biz?.address ? biz.address : 'Port Harcourt, Rivers State';

  mapInstance = L.map('map').setView([lat, lng], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(mapInstance);

  // Custom orange marker
  const icon = L.divIcon({
    className: '',
    html: `<div style="
      background:var(--orange,#E87722);
      color:#fff;
      border-radius:50% 50% 50% 0;
      width:32px;height:32px;
      display:flex;align-items:center;justify-content:center;
      font-size:16px;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
    "><span style="transform:rotate(45deg)">📍</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  L.marker([lat, lng], { icon })
    .addTo(mapInstance)
    .bindPopup(`<strong>${esc(biz?.name || 'Business')}</strong><br>${esc(biz?.address || 'Port Harcourt')}`)
    .openPopup();
}

// ── Not Found ──────────────────────────────────────────────────
function showNotFound() {
  document.getElementById('loadingOverlay').style.display = 'none';
  document.body.innerHTML = `
    <nav class="navbar"><div class="navbar-inner">
      <a href="index.html" class="navbar-brand">Markitt<span style="color:var(--orange)">PH</span></a>
    </div></nav>
    <div class="empty-state" style="margin-top:60px;">
      <div class="empty-icon">🔍</div>
      <h3>Business not found</h3>
      <p>This profile may have been removed or the link is incorrect.</p>
      <a href="index.html" class="btn btn-primary">Back to Home</a>
    </div>`;
}

// ── Tab switch override (calls initMap for location tab) ───────
// This overrides the generic switchTab in utils.js to add map init
function switchTab(panelId, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('tab-' + panelId);
  if (panel) panel.classList.add('active');
  if (btn)   btn.classList.add('active');
  if (panelId === 'location') initMap();
}

// ── XSS guard ─────────────────────────────────────────────────
function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

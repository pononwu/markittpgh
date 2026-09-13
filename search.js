/* ============================================================
   MARKITT PH — search.js
   Powers the homepage: loads business cards, search, and
   category filter.
   Depends on: utils.js
   ============================================================ */

'use strict';

let allBusinesses  = [];
let activeCategory = 'all';
let searchQuery    = '';

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  allBusinesses = getAllBusinesses();
  renderGrid();
  bindEvents();
});

// ── Events ────────────────────────────────────────────────────
function bindEvents() {
  // Search input
  const searchInput = document.getElementById('searchInput');
  const clearBtn    = document.getElementById('searchClear');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      clearBtn.style.display = searchQuery ? 'block' : 'none';
      renderGrid();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearBtn.style.display = 'none';
      renderGrid();
    });
  }

  // Category buttons
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      renderGrid();
    });
  });
}

// ── Filter ────────────────────────────────────────────────────
function filterBusinesses() {
  return allBusinesses.filter(biz => {
    const matchCat = activeCategory === 'all' || biz.category === activeCategory;
    const matchQ   = !searchQuery ||
      biz.name.toLowerCase().includes(searchQuery) ||
      (biz.description || '').toLowerCase().includes(searchQuery) ||
      (biz.category || '').toLowerCase().includes(searchQuery);
    return matchCat && matchQ;
  });
}

// ── Render ────────────────────────────────────────────────────
function renderGrid() {
  const grid      = document.getElementById('bizGrid');
  const emptyEl   = document.getElementById('emptyState');
  const emptyMsg  = document.getElementById('emptyMsg');
  const countEl   = document.getElementById('bizCount');

  const results = filterBusinesses();
  countEl.textContent = results.length;

  if (results.length === 0) {
    grid.innerHTML = '';
    emptyEl.classList.remove('hidden');
    emptyMsg.textContent = searchQuery
      ? `No businesses match "${searchQuery}".`
      : activeCategory !== 'all'
        ? `No businesses in the "${activeCategory}" category yet.`
        : 'No businesses have been listed yet — be the first!';
    return;
  }

  emptyEl.classList.add('hidden');
  grid.innerHTML = results.map(biz => buildCard(biz)).join('');
}

// ── Build one card ─────────────────────────────────────────────
function buildCard(biz) {
  // Average rating
  const revObj  = getObj(KEYS.reviews);
  const reviews = revObj[biz.id] || [];
  const avg     = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const starsHtml = avg
    ? `<div class="stars stars-sm">${renderStars(avg)}</div> <small style="color:var(--grey-dk)">${avg} (${reviews.length})</small>`
    : `<small style="color:var(--grey-dk)">No reviews yet</small>`;

  const avatarHtml = biz.logo
    ? `<div class="biz-card-img"><img src="${biz.logo}" alt="${escHtml(biz.name)}" /></div>`
    : `<div class="biz-card-img" style="font-size:52px;">${catEmoji(biz.category)}</div>`;

  return `
    <div class="biz-card">
      <a href="profile.html?id=${biz.id}" style="text-decoration:none;">
        ${avatarHtml}
      </a>
      <div class="biz-card-body">
        <div class="biz-card-name">${escHtml(biz.name)}</div>
        <div class="biz-card-cat">
          <span class="badge badge-green">${escHtml(biz.category)}</span>
        </div>
        <div class="biz-card-desc">${escHtml(biz.description)}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">${starsHtml}</div>
      </div>
      <div class="biz-card-footer">
        <small style="color:var(--grey-dk);font-size:12px;">
          <i class="fa fa-map-marker-alt" style="color:var(--orange)"></i>
          ${biz.address ? escHtml(biz.address.split(',')[0]) : 'Port Harcourt'}
        </small>
        <a href="profile.html?id=${biz.id}" class="btn btn-primary btn-sm">See Profile</a>
      </div>
    </div>`;
}

// ── XSS guard ─────────────────────────────────────────────────
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

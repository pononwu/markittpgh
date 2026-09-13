/* ============================================================
   MARKITT PH — admin.js
   Admin panel: login, business listing, review moderation.
   Depends on: utils.js
   ============================================================ */

'use strict';

// ── Admin password (hashed at runtime on first load) ──────────
// Change ADMIN_PLAIN to update the password.
const ADMIN_PLAIN   = 'markittadmin2025';
const ADMIN_SESSION = 'markittph_admin_session';
let   adminHashedPw = '';

document.addEventListener('DOMContentLoaded', async () => {
  adminHashedPw = await hashPassword(ADMIN_PLAIN);

  if (sessionStorage.getItem(ADMIN_SESSION) === adminHashedPw) {
    showAdminDashboard();
  }
});

// ── Login ─────────────────────────────────────────────────────
async function adminLogin() {
  clearAlert('adminLoginAlert');
  const input   = document.getElementById('adminPassInput');
  const entered = (input.value || '').trim();

  if (!entered) {
    document.getElementById('errAdminPass').textContent = 'Please enter the admin password.';
    document.getElementById('errAdminPass').classList.add('show');
    return;
  }

  const hashed = await hashPassword(entered);
  if (hashed !== adminHashedPw) {
    showAlert('adminLoginAlert', 'Incorrect admin password.', 'error');
    input.value = '';
    return;
  }

  sessionStorage.setItem(ADMIN_SESSION, hashed);
  showAdminDashboard();
}

function adminLogout() {
  sessionStorage.removeItem(ADMIN_SESSION);
  document.getElementById('adminDashboard').classList.add('hidden');
  document.getElementById('adminLoginScreen').classList.remove('hidden');
  document.getElementById('adminPassInput').value = '';
  showToast('Logged out.');
}

// ── Show dashboard ─────────────────────────────────────────────
function showAdminDashboard() {
  document.getElementById('adminLoginScreen').classList.add('hidden');
  document.getElementById('adminDashboard').classList.remove('hidden');
  renderAdminStats();
  renderAdminBiz();
  renderAdminReviews();
}

// ── Stats ─────────────────────────────────────────────────────
function renderAdminStats() {
  const businesses = getAllBusinesses();
  const allRevs    = getObj(KEYS.reviews);
  const allProds   = getObj(KEYS.products);

  let totalReviews = 0;
  let totalProds   = 0;
  businesses.forEach(b => {
    totalReviews += (allRevs[b.id]  || []).length;
    totalProds   += (allProds[b.id] || []).length;
  });

  document.getElementById('adminTotalBiz').textContent     = businesses.length;
  document.getElementById('adminTotalReviews').textContent  = totalReviews;
  document.getElementById('adminTotalProducts').textContent = totalProds;
}

// ── Business List ─────────────────────────────────────────────
function renderAdminBiz() {
  const query      = (document.getElementById('adminSearch')?.value || '').trim().toLowerCase();
  const businesses = getAllBusinesses().filter(b =>
    !query ||
    b.name.toLowerCase().includes(query) ||
    b.category.toLowerCase().includes(query)
  );

  const listEl  = document.getElementById('adminBizList');
  const emptyEl = document.getElementById('adminNoBiz');

  if (!businesses.length) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  const allRevs  = getObj(KEYS.reviews);
  const allProds = getObj(KEYS.products);

  listEl.innerHTML = businesses.map(biz => {
    const reviewCount = (allRevs[biz.id]  || []).length;
    const prodCount   = (allProds[biz.id] || []).length;
    const stats       = getAnalytics(biz.id);
    return `
      <div class="biz-row">
        <div style="font-size:32px;">${catEmoji(biz.category)}</div>
        <div class="biz-row-info">
          <div class="name">${esc(biz.name)}</div>
          <div class="meta">
            <span class="badge badge-green">${esc(biz.category)}</span>
            &nbsp;
            <i class="fa fa-eye"></i> ${stats.views} views &nbsp;
            <i class="fa fa-star" style="color:var(--orange)"></i> ${reviewCount} reviews &nbsp;
            <i class="fa fa-box-open"></i> ${prodCount} products
          </div>
          <div class="meta" style="margin-top:4px;color:var(--grey-dk);">
            Owner: ${esc(biz.ownerName)} · Listed: ${formatDate(biz.createdAt)}
          </div>
        </div>
        <div class="biz-row-actions">
          <a href="profile.html?id=${biz.id}" target="_blank" class="btn btn-outline btn-sm">
            <i class="fa fa-eye"></i> View
          </a>
          <button class="btn btn-danger btn-sm" onclick="adminDeleteBiz('${biz.id}', '${esc(biz.name)}')">
            <i class="fa fa-trash"></i> Delete
          </button>
        </div>
      </div>`;
  }).join('');
}

function adminDeleteBiz(bizId, name) {
  if (!confirm(`Delete "${name}" and all its data? This cannot be undone.`)) return;
  deleteBusiness(bizId);
  renderAdminStats();
  renderAdminBiz();
  renderAdminReviews();
  showToast(`"${name}" deleted.`);
}

// ── All Reviews ───────────────────────────────────────────────
function renderAdminReviews() {
  const businesses = getAllBusinesses();
  const allRevs    = getObj(KEYS.reviews);
  const listEl     = document.getElementById('adminReviewList');
  const emptyEl    = document.getElementById('adminNoReviews');

  // Flatten all reviews with business context
  const flat = [];
  businesses.forEach(biz => {
    (allRevs[biz.id] || []).forEach(r => flat.push({ biz, r }));
  });

  // Sort newest first
  flat.sort((a, b) => new Date(b.r.createdAt) - new Date(a.r.createdAt));

  if (!flat.length) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  listEl.innerHTML = flat.map(({ biz, r }) => `
    <div class="review-card" style="display:flex;gap:12px;align-items:flex-start;">
      <div style="flex:1;">
        <div style="font-size:12px;font-weight:700;color:var(--blue);margin-bottom:4px;">
          <i class="fa fa-store"></i> ${esc(biz.name)}
        </div>
        <div class="review-header">
          <span class="reviewer-name">${esc(r.reviewer)}</span>
          <span class="review-date">${formatDate(r.createdAt)}</span>
        </div>
        <div>${renderStars(r.rating)}</div>
        ${r.text ? `<p class="review-text">${esc(r.text)}</p>` : ''}
      </div>
      <button class="btn btn-danger btn-sm"
        onclick="adminDeleteReview('${biz.id}','${r.id}')" title="Remove review">
        <i class="fa fa-trash"></i>
      </button>
    </div>`).join('');
}

function adminDeleteReview(bizId, reviewId) {
  if (!confirm('Remove this review?')) return;
  const all  = getObj(KEYS.reviews);
  all[bizId] = (all[bizId] || []).filter(r => r.id !== reviewId);
  saveObj(KEYS.reviews, all);
  renderAdminStats();
  renderAdminReviews();
  showToast('Review removed.');
}

// ── Tab switching ─────────────────────────────────────────────
function switchAdminTab(panelId, btn) {
  document.querySelectorAll('[id^="admin-tab-"]').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('admin-tab-' + panelId);
  if (panel) panel.classList.add('active');
  if (btn)   btn.classList.add('active');
}

// ── XSS guard ─────────────────────────────────────────────────
function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

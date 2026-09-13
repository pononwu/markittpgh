/* ============================================================
   MARKITT PH — dashboard.js
   Owner dashboard logic: analytics, product CRUD,
   profile editing, and review display.
   Depends on: utils.js, auth.js, profile.js
   ============================================================ */

'use strict';

let dashBizId   = null;
let editingProdId = null;
let prodImgB64    = '';

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkAutoLogin();
});

// ── Show dashboard after login ────────────────────────────────
function showDashboard(bizId) {
  dashBizId = bizId;
  const biz = getBusinessById(bizId);
  if (!biz) {
    showAlert('loginAlert', 'Business not found. Please register first.', 'error');
    return;
  }

  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('dashboardScreen').classList.remove('hidden');

  document.getElementById('dashHeroTitle').textContent = `${biz.name} — Dashboard`;
  document.getElementById('dashHeroSub').textContent   = `Welcome back, ${biz.ownerName}`;

  // Profile link
  const url = profileURL(bizId);
  document.getElementById('profileLink').value = url;
  document.getElementById('viewProfileLink').href = url;

  renderAnalytics();
  renderDashProducts();
  renderDashReviews();
  populateEditForm(biz);
}

// ── Analytics ─────────────────────────────────────────────────
function renderAnalytics() {
  const stats    = getAnalytics(dashBizId);
  const reviews  = getReviews(dashBizId);
  const products = getProducts(dashBizId);

  document.getElementById('statViews').textContent    = stats.views    || 0;
  document.getElementById('statShares').textContent   = stats.shares   || 0;
  document.getElementById('statReviews').textContent  = reviews.length  || 0;
  document.getElementById('statProducts').textContent = products.length || 0;
}

// ── Products Tab ──────────────────────────────────────────────
function renderDashProducts() {
  const products = getProducts(dashBizId);
  const listEl   = document.getElementById('dashProductList');
  const emptyEl  = document.getElementById('noProductsDash');

  document.getElementById('statProducts').textContent = products.length;

  if (!products.length) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  listEl.innerHTML = products.map(p => `
    <div class="product-list-item">
      <div class="product-list-thumb">
        ${p.image ? `<img src="${p.image}" alt="${esc(p.name)}" />` : '📦'}
      </div>
      <div class="product-list-info">
        <div class="name">${esc(p.name)}</div>
        <div class="price">${formatPrice(p.price)}</div>
        <div class="desc">${esc(p.description)}</div>
      </div>
      <div class="product-list-actions">
        <button class="btn btn-outline btn-sm" onclick="openEditProductModal('${p.id}')">
          <i class="fa fa-edit"></i>
        </button>
        <button class="btn btn-danger btn-sm" onclick="confirmDeleteProduct('${p.id}')">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    </div>`).join('');
}

// ── Product Modal ─────────────────────────────────────────────
function openAddProductModal() {
  editingProdId = null;
  prodImgB64    = '';
  document.getElementById('productModalTitle').innerHTML =
    '<i class="fa fa-box-open" style="color:var(--orange)"></i> Add Product';
  document.getElementById('prodName').value  = '';
  document.getElementById('prodPrice').value = '';
  document.getElementById('prodDesc').value  = '';
  document.getElementById('prodImgPreview').style.display = 'none';
  document.getElementById('prodImgInput').value = '';
  clearError('prodName','errProdName');
  document.getElementById('productModal').classList.add('open');
}

function openEditProductModal(prodId) {
  const prods = getProducts(dashBizId);
  const p = prods.find(x => x.id === prodId);
  if (!p) return;

  editingProdId = prodId;
  prodImgB64    = p.image || '';

  document.getElementById('productModalTitle').innerHTML =
    '<i class="fa fa-edit" style="color:var(--orange)"></i> Edit Product';
  document.getElementById('prodName').value  = p.name;
  document.getElementById('prodPrice').value = p.price;
  document.getElementById('prodDesc').value  = p.description;

  const preview = document.getElementById('prodImgPreview');
  if (p.image) { preview.src = p.image; preview.style.display = 'block'; }
  else           preview.style.display = 'none';

  clearError('prodName','errProdName');
  document.getElementById('productModal').classList.add('open');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('open');
}

// Image upload inside product modal
document.addEventListener('DOMContentLoaded', () => {
  const imgInput = document.getElementById('prodImgInput');
  if (imgInput) {
    imgInput.addEventListener('change', async () => {
      const file = imgInput.files[0];
      if (!file) return;
      const b64 = await fileToBase64(file);
      prodImgB64 = await resizeImage(b64, 500, 500);
      const preview = document.getElementById('prodImgPreview');
      preview.src = prodImgB64;
      preview.style.display = 'block';
    });
  }
});

function saveProduct() {
  clearError('prodName','errProdName');
  const name  = (document.getElementById('prodName').value || '').trim();
  const price = (document.getElementById('prodPrice').value || '').trim();
  const desc  = (document.getElementById('prodDesc').value || '').trim();

  if (!name) { showError('prodName','errProdName'); return; }

  const product = {
    id:          editingProdId || genId(),
    name, price, description: desc,
    image:       prodImgB64,
    createdAt:   editingProdId
      ? (getProducts(dashBizId).find(p => p.id === editingProdId)?.createdAt || new Date().toISOString())
      : new Date().toISOString(),
  };

  // Use profile.js saveProduct
  const allProds   = getObj(KEYS.products);
  const list       = allProds[dashBizId] || [];
  const idx        = list.findIndex(p => p.id === product.id);
  if (idx >= 0) list[idx] = product; else list.push(product);
  allProds[dashBizId] = list;
  saveObj(KEYS.products, allProds);

  closeProductModal();
  renderDashProducts();
  renderAnalytics();
  showToast(editingProdId ? 'Product updated ✓' : 'Product added ✓');
}

function confirmDeleteProduct(prodId) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  deleteProduct(dashBizId, prodId);
  renderDashProducts();
  renderAnalytics();
  showToast('Product deleted.');
}

// ── Edit Profile Tab ──────────────────────────────────────────
function populateEditForm(biz) {
  document.getElementById('editBizName').value    = biz.name        || '';
  document.getElementById('editBizCat').value     = biz.category    || '';
  document.getElementById('editBizDesc').value    = biz.description || '';
  document.getElementById('editBizPhone').value   = biz.phone       || '';
  document.getElementById('editBizHours').value   = biz.hours       || '';
  document.getElementById('editBizAddress').value = biz.address     || '';
  document.getElementById('editLat').value        = biz.lat         || '';
  document.getElementById('editLng').value        = biz.lng         || '';
  document.getElementById('editTemplate').value   = biz.template    || 'A';
}

function saveProfileEdits() {
  const biz = getBusinessById(dashBizId);
  if (!biz) return;

  biz.name        = document.getElementById('editBizName').value.trim()    || biz.name;
  biz.category    = document.getElementById('editBizCat').value            || biz.category;
  biz.description = document.getElementById('editBizDesc').value.trim()    || biz.description;
  biz.phone       = document.getElementById('editBizPhone').value.trim()   || biz.phone;
  biz.hours       = document.getElementById('editBizHours').value.trim();
  biz.address     = document.getElementById('editBizAddress').value.trim();
  biz.lat         = parseFloat(document.getElementById('editLat').value)   || biz.lat;
  biz.lng         = parseFloat(document.getElementById('editLng').value)   || biz.lng;
  biz.template    = document.getElementById('editTemplate').value          || biz.template;

  saveBusiness(biz);
  document.getElementById('dashHeroTitle').textContent = `${biz.name} — Dashboard`;
  showAlert('dashAlert', 'Profile updated successfully ✓', 'success');
  showToast('Changes saved ✓');
  setTimeout(() => clearAlert('dashAlert'), 3000);
}

// ── Reviews Tab ───────────────────────────────────────────────
function renderDashReviews() {
  const reviews = getReviews(dashBizId);
  const listEl  = document.getElementById('dashReviewList');
  const emptyEl = document.getElementById('noReviewsDash');

  if (!reviews.length) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  listEl.innerHTML = reviews.map(r => `
    <div class="review-card" style="display:flex;gap:12px;align-items:flex-start;">
      <div style="flex:1;">
        <div class="review-header">
          <span class="reviewer-name">${esc(r.reviewer)}</span>
          <span class="review-date">${formatDate(r.createdAt)}</span>
        </div>
        <div>${renderStars(r.rating)}</div>
        ${r.text ? `<p class="review-text">${esc(r.text)}</p>` : ''}
      </div>
      <button class="btn btn-danger btn-sm" onclick="confirmDeleteReview('${r.id}')" title="Remove review">
        <i class="fa fa-trash"></i>
      </button>
    </div>`).join('');
}

function confirmDeleteReview(reviewId) {
  if (!confirm('Remove this review?')) return;
  deleteReview(dashBizId, reviewId);
  renderDashReviews();
  renderAnalytics();
  showToast('Review removed.');
}

// ── Tab switching ─────────────────────────────────────────────
function switchDashTab(panelId, btn) {
  document.querySelectorAll('[id^="dash-tab-"]').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('dash-tab-' + panelId);
  if (panel) panel.classList.add('active');
  if (btn)   btn.classList.add('active');
}

// ── Helpers ───────────────────────────────────────────────────
function getReviews(bizId) {
  const all = getObj(KEYS.reviews);
  return all[bizId] || [];
}

function deleteReview(bizId, reviewId) {
  const all  = getObj(KEYS.reviews);
  all[bizId] = (all[bizId] || []).filter(r => r.id !== reviewId);
  saveObj(KEYS.reviews, all);
}

function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

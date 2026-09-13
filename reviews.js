/* ============================================================
   MARKITT PH — reviews.js
   Review submission, retrieval, and rendering.
   Used by: profile.html
   Depends on: utils.js
   ============================================================ */

'use strict';

// ── Get reviews for a business ────────────────────────────────
function getReviews(bizId) {
  const all = getObj(KEYS.reviews);
  return all[bizId] || [];
}

// ── Save a new review ─────────────────────────────────────────
function saveReview(bizId, review) {
  const all  = getObj(KEYS.reviews);
  const list = all[bizId] || [];
  list.unshift(review); // newest first
  all[bizId] = list;
  saveObj(KEYS.reviews, all);
}

// ── Delete a review (by index) ────────────────────────────────
function deleteReview(bizId, reviewId) {
  const all  = getObj(KEYS.reviews);
  const list = (all[bizId] || []).filter(r => r.id !== reviewId);
  all[bizId] = list;
  saveObj(KEYS.reviews, all);
}

// ── Average rating ────────────────────────────────────────────
function avgRating(reviews) {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

// ── Modal open / close ────────────────────────────────────────
function openReviewModal() {
  document.getElementById('reviewModal').classList.add('open');
  document.getElementById('reviewerName').focus();
}

function closeReviewModal() {
  document.getElementById('reviewModal').classList.remove('open');
  // Reset form
  document.getElementById('reviewerName').value = '';
  document.getElementById('reviewText').value   = '';
  document.querySelectorAll('#starInput input').forEach(r => r.checked = false);
  clearAlert('reviewAlert');
  ['reviewerName','errReviewerName','s1','errRating'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('error','show');
  });
}

// ── Submit review ─────────────────────────────────────────────
function submitReview() {
  clearAlert('reviewAlert');
  const name   = (document.getElementById('reviewerName').value || '').trim();
  const rating = parseInt(document.querySelector('#starInput input:checked')?.value || '0');
  const text   = (document.getElementById('reviewText').value || '').trim();

  let ok = true;
  if (!name)    { showError('reviewerName','errReviewerName'); ok = false; }
  if (!rating)  { document.getElementById('errRating').classList.add('show'); ok = false; }
  if (!ok) return;

  const bizId = getParam('id');
  if (!bizId) return;

  const review = {
    id:       genId(),
    reviewer: name,
    rating,
    text,
    createdAt: new Date().toISOString(),
  };

  saveReview(bizId, review);
  closeReviewModal();
  renderReviews(bizId);
  showToast('Review submitted — thanks! ⭐');
}

// ── Render reviews section ─────────────────────────────────────
function renderReviews(bizId) {
  const reviews   = getReviews(bizId);
  const listEl    = document.getElementById('reviewsList');
  const noRevEl   = document.getElementById('noReviews');
  const avgEl     = document.getElementById('avgRating');
  const avgStars  = document.getElementById('avgStars');
  const countText = document.getElementById('reviewCountText');
  const tabCount  = document.getElementById('reviewTabCount');

  // Tab badge
  if (tabCount) tabCount.textContent = reviews.length ? `(${reviews.length})` : '';

  if (!reviews.length) {
    if (listEl)  listEl.innerHTML = '';
    if (noRevEl) noRevEl.classList.remove('hidden');
    if (avgEl)   avgEl.textContent  = '—';
    if (avgStars) avgStars.innerHTML = '';
    if (countText) countText.textContent = 'No reviews yet';
    return;
  }

  if (noRevEl) noRevEl.classList.add('hidden');

  const avg = avgRating(reviews);
  if (avgEl)    avgEl.textContent  = avg.toFixed(1);
  if (avgStars) avgStars.innerHTML = renderStars(avg);
  if (countText) countText.textContent = `Based on ${reviews.length} review${reviews.length > 1 ? 's' : ''}`;

  if (listEl) {
    listEl.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <span class="reviewer-name"><i class="fa fa-user-circle" style="color:var(--blue)"></i> ${escHtmlR(r.reviewer)}</span>
          <span class="review-date">${formatDate(r.createdAt)}</span>
        </div>
        <div>${renderStars(r.rating)}</div>
        ${r.text ? `<p class="review-text">${escHtmlR(r.text)}</p>` : ''}
      </div>`).join('');
  }
}

function escHtmlR(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

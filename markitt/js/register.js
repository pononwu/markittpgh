/* ============================================================
   MARKITT PH — register.js
   Drives the 4-step registration form on register.html.
   Depends on: utils.js, profile.js
   ============================================================ */

'use strict';

let currentStep    = 1;
let selectedTpl    = '';
let logoBase64     = '';
let pendingProducts = []; // products added during registration

// ── Step Navigation ───────────────────────────────────────────
function goStep(target) {
  if (target > currentStep && !validateStep(currentStep)) return;

  document.getElementById('step' + currentStep).classList.add('hidden');
  currentStep = target;
  document.getElementById('step' + currentStep).classList.remove('hidden');
  updateProgress();

  // Seed first product row when entering step 3
  if (target === 3 && document.getElementById('productRows').children.length === 0) {
    addProductRow();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
  for (let i = 1; i <= 4; i++) {
    const circle = document.getElementById('sc' + i);
    const line   = document.getElementById('sl' + i);
    circle.classList.remove('active', 'done');
    if (line) line.classList.remove('done');

    if (i < currentStep)  { circle.classList.add('done');   circle.textContent = '✓'; if (line) line.classList.add('done'); }
    if (i === currentStep) { circle.classList.add('active'); circle.textContent = i; }
    if (i > currentStep)   circle.textContent = i;
  }
}

// ── Step Validators ───────────────────────────────────────────
function validateStep(step) {
  clearAlert('alertBox');
  let ok = true;

  if (step === 1) {
    const pairs = [
      ['bizName','errBizName'],
      ['bizCategory','errBizCat'],
      ['bizDesc','errBizDesc'],
      ['bizPhone','errBizPhone'],
      ['ownerName','errOwner'],
      ['ownerPass','errPass'],
    ];
    clearAllErrors(pairs);

    const name  = v('bizName');
    const cat   = v('bizCategory');
    const desc  = v('bizDesc');
    const phone = v('bizPhone');
    const owner = v('ownerName');
    const pass  = v('ownerPass');

    if (!name)                           { showError('bizName',    'errBizName'); ok = false; }
    if (!cat)                            { showError('bizCategory','errBizCat');  ok = false; }
    if (desc.length < 10)                { showError('bizDesc',    'errBizDesc'); ok = false; }
    if (!/^[0-9+\s]{7,14}$/.test(phone)){ showError('bizPhone',   'errBizPhone');ok = false; }
    if (!owner)                          { showError('ownerName',  'errOwner');   ok = false; }
    if (pass.length < 6)                 { showError('ownerPass',  'errPass');    ok = false; }
  }

  if (step === 2) {
    const errEl = document.getElementById('errTemplate');
    if (!selectedTpl) { errEl.classList.add('show'); ok = false; }
    else               errEl.classList.remove('show');
  }

  return ok;
}

// Shorthand value getter
function v(id) { return (document.getElementById(id)?.value || '').trim(); }

// ── Template Selection ────────────────────────────────────────
function selectTemplate(letter) {
  selectedTpl = letter;
  document.getElementById('tplA').classList.toggle('selected', letter === 'A');
  document.getElementById('tplB').classList.toggle('selected', letter === 'B');
  document.getElementById('errTemplate').classList.remove('show');
}

// ── Logo Upload ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const logoInput = document.getElementById('bizLogoInput');
  if (logoInput) {
    logoInput.addEventListener('change', async () => {
      const file = logoInput.files[0];
      if (!file) return;
      const b64 = await fileToBase64(file);
      logoBase64 = await resizeImage(b64, 400, 400);
      const preview = document.getElementById('logoPreview');
      preview.src = logoBase64;
      preview.classList.add('show');
    });
  }
});

// ── Product Rows (Step 3) ──────────────────────────────────────
let productRowCount = 0;

function addProductRow() {
  productRowCount++;
  const rowId = 'prow-' + productRowCount;
  const imgId = 'prowImg-' + productRowCount;
  const preId = 'prowPre-' + productRowCount;

  const html = `
    <div class="product-row" id="${rowId}">
      <button class="product-row-remove" onclick="removeProductRow('${rowId}')" title="Remove">
        <i class="fa fa-times"></i>
      </button>
      <div class="form-group">
        <label class="form-label">Product / Service Name *</label>
        <input type="text" class="form-control prow-name" placeholder="e.g. Braiding – Full Head" maxlength="80" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label class="form-label">Price (₦)</label>
          <input type="number" class="form-control prow-price" placeholder="e.g. 5000" min="0" />
        </div>
        <div class="form-group">
          <label class="form-label">Image (optional)</label>
          <label class="img-upload-label" for="${imgId}" style="font-size:12px;padding:7px 12px;">
            <i class="fa fa-image"></i> Choose
          </label>
          <input type="file" id="${imgId}" class="prow-img-input" accept="image/*" style="display:none" data-preview="${preId}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <input type="text" class="form-control prow-desc" placeholder="Short description..." maxlength="200" />
      </div>
      <img id="${preId}" src="" style="width:60px;height:60px;object-fit:cover;border-radius:6px;display:none;margin-top:4px;" />
    </div>`;

  document.getElementById('productRows').insertAdjacentHTML('beforeend', html);

  // Attach image listener
  document.getElementById(imgId).addEventListener('change', async function () {
    const file = this.files[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    const resized = await resizeImage(b64, 500, 500);
    this.dataset.b64 = resized;
    const preview = document.getElementById(this.dataset.preview);
    preview.src = resized;
    preview.style.display = 'block';
  });
}

function removeProductRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) row.remove();
}

// ── Collect products from step 3 rows ─────────────────────────
function collectProducts() {
  const rows = document.querySelectorAll('.product-row');
  const products = [];
  rows.forEach(row => {
    const name  = row.querySelector('.prow-name')?.value.trim();
    const price = row.querySelector('.prow-price')?.value.trim();
    const desc  = row.querySelector('.prow-desc')?.value.trim();
    const imgInput = row.querySelector('.prow-img-input');
    const image = imgInput?.dataset.b64 || '';
    if (name) {
      products.push(createProductObject({ name, price, desc, image }));
    }
  });
  return products;
}

// ── Final Submission ──────────────────────────────────────────
async function submitRegistration() {
  clearAlert('alertBox');

  // Collect values
  const lat = parseFloat(document.getElementById('bizLat').value) || 4.8156;
  const lng = parseFloat(document.getElementById('bizLng').value) || 7.0498;

  const passwordHash = await hashPassword(v('ownerPass'));

  const biz = createBusinessObject({
    name:         v('bizName'),
    category:     v('bizCategory'),
    description:  v('bizDesc'),
    phone:        v('bizPhone'),
    address:      v('bizAddress'),
    hours:        v('bizHours'),
    lat, lng,
    template:     selectedTpl,
    logo:         logoBase64,
    ownerName:    v('ownerName'),
    passwordHash,
  });

  saveBusiness(biz);

  // Save products
  const products = collectProducts();
  products.forEach(p => saveProduct(biz.id, p));

  // Init analytics
  const analytics = getObj(KEYS.analytics);
  analytics[biz.id] = { views: 0, shares: 0 };
  saveObj(KEYS.analytics, analytics);

  // Show success screen
  showSuccessScreen(biz);
}

function showSuccessScreen(biz) {
  document.getElementById('step4').classList.add('hidden');
  const successEl = document.getElementById('stepSuccess');
  successEl.classList.remove('hidden');

  const url = profileURL(biz.id);
  document.getElementById('successLink').value = url;
  document.getElementById('viewProfileBtn').href = 'profile.html?id=' + biz.id;
  document.getElementById('dashboardBtn').href   = 'dashboard.html?bizId=' + biz.id;

  // Update all step circles to done
  for (let i = 1; i <= 4; i++) {
    const c = document.getElementById('sc' + i);
    c.classList.remove('active');
    c.classList.add('done');
    c.textContent = '✓';
    const l = document.getElementById('sl' + i);
    if (l) l.classList.add('done');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function copySuccessLink() {
  const input = document.getElementById('successLink');
  navigator.clipboard.writeText(input.value).catch(() => {
    input.select();
    document.execCommand('copy');
  });
  showToast('Link copied! Share Your Biz 🎉');
}

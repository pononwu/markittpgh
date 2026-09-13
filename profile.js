/* ============================================================
   MARKITT PH — profile.js
   CRUD for business profiles, products stored in localStorage.
   Used by: register.html, dashboard.html
   ============================================================ */

'use strict';

// ── Business CRUD ─────────────────────────────────────────────
function getAllBusinesses() {
  return getAll(KEYS.businesses);
}

function getBusinessById(id) {
  return getAllBusinesses().find(b => b.id === id) || null;
}

function saveBusiness(biz) {
  const all = getAllBusinesses();
  const idx = all.findIndex(b => b.id === biz.id);
  if (idx >= 0) {
    all[idx] = biz;
  } else {
    all.push(biz);
  }
  saveAll(KEYS.businesses, all);
}

function deleteBusiness(id) {
  // Remove business
  saveAll(KEYS.businesses, getAllBusinesses().filter(b => b.id !== id));
  // Remove its products
  const prods = getObj(KEYS.products);
  delete prods[id];
  saveObj(KEYS.products, prods);
  // Remove its reviews
  const revs = getObj(KEYS.reviews);
  delete revs[id];
  saveObj(KEYS.reviews, revs);
  // Remove analytics
  const analytics = getObj(KEYS.analytics);
  delete analytics[id];
  saveObj(KEYS.analytics, analytics);
}

// ── Product CRUD ──────────────────────────────────────────────
function getProducts(bizId) {
  const all = getObj(KEYS.products);
  return all[bizId] || [];
}

function saveProduct(bizId, product) {
  const all  = getObj(KEYS.products);
  const list = all[bizId] || [];
  const idx  = list.findIndex(p => p.id === product.id);
  if (idx >= 0) {
    list[idx] = product;
  } else {
    list.push(product);
  }
  all[bizId] = list;
  saveObj(KEYS.products, all);
}

function deleteProduct(bizId, productId) {
  const all  = getObj(KEYS.products);
  const list = (all[bizId] || []).filter(p => p.id !== productId);
  all[bizId] = list;
  saveObj(KEYS.products, all);
}

// ── Create new business object ─────────────────────────────────
function createBusinessObject(fields) {
  return {
    id:           genId(),
    name:         fields.name,
    category:     fields.category,
    description:  fields.description,
    phone:        fields.phone,
    address:      fields.address    || '',
    hours:        fields.hours      || '',
    lat:          fields.lat        || '',
    lng:          fields.lng        || '',
    template:     fields.template   || 'A',
    logo:         fields.logo       || '',
    ownerName:    fields.ownerName,
    passwordHash: fields.passwordHash,
    createdAt:    new Date().toISOString(),
  };
}

// ── Create new product object ──────────────────────────────────
function createProductObject(fields) {
  return {
    id:          genId(),
    name:        fields.name,
    price:       fields.price  || '',
    description: fields.desc   || '',
    image:       fields.image  || '',
    createdAt:   new Date().toISOString(),
  };
}

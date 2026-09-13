/* ============================================================
   MARKITT PH — share.js
   Generates and shares the business profile URL.
   Uses the Web Share API with a clipboard fallback.
   Used by: profile.html, dashboard.html
   Depends on: utils.js
   ============================================================ */

'use strict';

// ── Share profile (called from profile.html hero button) ──────
async function shareProfile() {
  const bizId = getParam('id');
  if (!bizId) return;

  const biz = getBusinessById(bizId);
  const url  = profileURL(bizId);

  recordShare(bizId);

  if (navigator.share) {
    try {
      await navigator.share({
        title: biz ? `${biz.name} — Markitt PH` : 'Markitt PH Business',
        text:  biz ? `Check out ${biz.name} on Markitt PH!` : 'Check out this business on Markitt PH!',
        url,
      });
      showToast('Profile shared! 🎉');
    } catch (err) {
      // User cancelled — no error needed
      if (err.name !== 'AbortError') copyToClipboard(url);
    }
  } else {
    copyToClipboard(url);
  }
}

// ── Copy profile link (called from dashboard) ─────────────────
function copyProfileLink() {
  const input = document.getElementById('profileLink');
  if (!input) return;
  copyToClipboard(input.value);

  // Record share
  const session = getSession ? getSession() : null;
  if (session) recordShare(session.bizId);
}

// ── Clipboard helper ──────────────────────────────────────────
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Link copied! Share Your Biz 🔗'))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity  = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    showToast('Link copied! Share Your Biz 🔗');
  } catch {
    showToast('Could not copy — please copy the link manually.');
  }
  document.body.removeChild(ta);
}

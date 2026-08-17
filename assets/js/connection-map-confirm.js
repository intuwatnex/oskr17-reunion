/* ==========================================================
   OSKR17th Anniversary — Connection Map confirm/consent (connection-map-confirm.html)
   ========================================================== */

const CMC_CONFIG = {
  scriptUrl: 'https://script.google.com/macros/s/AKfycbwx8K2FW6T6ifdoe4xW-DWCRbKYbCnen1r8mHvlIaggrkri2AQpRMKphIEe7BClrwCk3w/exec',
};

function cmcGetQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

const cmcRegId = cmcGetQueryParam('id');
const cmcToken = cmcGetQueryParam('token');

function cmcShowState(state) {
  ['loading', 'invalid', 'form', 'active', 'opted-out'].forEach((s) => {
    document.getElementById('state-' + s).classList.toggle('hidden', s !== state);
  });
}

function cmcInitFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear() + 543;
}

async function cmcLoadProfile() {
  if (!cmcRegId || !cmcToken) {
    cmcShowState('invalid');
    return;
  }
  cmcShowState('loading');
  try {
    const url = `${CMC_CONFIG.scriptUrl}?action=confirmLookup&id=${encodeURIComponent(cmcRegId)}&token=${encodeURIComponent(cmcToken)}`;
    const res = await fetch(url);
    const result = await res.json();
    if (result.result !== 'success') {
      cmcShowState('invalid');
      return;
    }
    cmcFillForm(result.profile);
    cmcShowState('form');
  } catch (err) {
    cmcShowState('invalid');
  }
}

function cmcFillForm(p) {
  document.getElementById('nickname').value = p.nickname || '';
  document.getElementById('role').value = p.role || '';
  document.getElementById('industry').value = p.industry || '';
  document.getElementById('field').value = p.field || '';
  document.getElementById('company').value = p.company || '';
  document.getElementById('tags').value = p.tags || '';
  document.getElementById('looking_for').value = p.looking_for || '';
  document.getElementById('phone').value = p.phone || '';
  document.getElementById('email').value = p.email || '';

  const sharePref = p.share_pref || 'hidden';
  const radio = document.querySelector(`input[name="share_pref"][value="${sharePref}"]`);
  if (radio) radio.checked = true;
}

function cmcShowBanner(message) {
  const banner = document.getElementById('confirm-banner');
  banner.textContent = message;
  banner.classList.remove('hidden');
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function cmcHideBanner() {
  document.getElementById('confirm-banner').classList.add('hidden');
}

function cmcSetSaving(isSaving) {
  const btn = document.getElementById('confirm-btn');
  const label = document.getElementById('confirm-btn-label');
  btn.disabled = isSaving;
  label.textContent = isSaving ? 'กำลังบันทึก…' : 'ยืนยันแสดงโปรไฟล์';
}

async function cmcSubmit(decision) {
  cmcHideBanner();

  const payload = {
    action: 'confirmSubmit',
    id: cmcRegId,
    token: cmcToken,
    decision: decision,
  };

  if (decision === 'active') {
    payload.nickname = document.getElementById('nickname').value.trim();
    payload.role = document.getElementById('role').value.trim();
    payload.industry = document.getElementById('industry').value;
    payload.field = document.getElementById('field').value.trim();
    payload.company = document.getElementById('company').value.trim();
    payload.tags = document.getElementById('tags').value.trim();
    payload.looking_for = document.getElementById('looking_for').value.trim();
    payload.phone = document.getElementById('phone').value.trim();
    payload.email = document.getElementById('email').value.trim();
    payload.share_pref = document.querySelector('input[name="share_pref"]:checked')?.value || 'hidden';

    if (!payload.nickname || !payload.industry) {
      cmcShowBanner('กรุณากรอกชื่อเล่นและเลือกสายอาชีพ');
      return;
    }
  }

  try {
    const res = await fetch(CMC_CONFIG.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (result.result !== 'success') {
      cmcShowBanner(result.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      return;
    }
    cmcShowState(result.status === 'opted_out' ? 'opted-out' : 'active');
  } catch (err) {
    cmcShowBanner('เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือติดต่อทีมงานโดยตรง');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cmcInitFooterYear();

  document.getElementById('confirm-form').addEventListener('submit', (e) => {
    e.preventDefault();
    cmcSetSaving(true);
    cmcSubmit('active').finally(() => cmcSetSaving(false));
  });

  document.getElementById('opt-out-btn').addEventListener('click', () => {
    const confirmed = window.confirm('ยืนยันไม่เข้าร่วม Connection Map?\n(ข้อมูลการลงทะเบียน/บัตรเข้างานของคุณจะยังอยู่ตามปกติ)');
    if (!confirmed) return;
    cmcSubmit('opted_out');
  });

  cmcLoadProfile();
});

/* ==========================================================
   OSKR17th Anniversary — Manage Connection Map profile (manage.html)
   ========================================================== */

const MANAGE_CONFIG = {
  // TODO: ต้องเป็น Web App URL เดียวกับ REGISTER_CONFIG.scriptUrl ใน register.js
  scriptUrl: 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE',
};

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

const regId = getQueryParam('id');
const editToken = getQueryParam('token');

function showState(state) {
  ['loading', 'invalid', 'form', 'success'].forEach((s) => {
    document.getElementById('state-' + s).classList.toggle('hidden', s !== state);
  });
}

function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear() + 543; // พ.ศ.
}

async function loadProfile() {
  if (!regId || !editToken || MANAGE_CONFIG.scriptUrl.includes('PASTE_YOUR')) {
    showState('invalid');
    return;
  }
  showState('loading');
  try {
    const url = `${MANAGE_CONFIG.scriptUrl}?action=lookup&id=${encodeURIComponent(regId)}&token=${encodeURIComponent(editToken)}`;
    const res = await fetch(url);
    const result = await res.json();
    if (result.result !== 'success') {
      showState('invalid');
      return;
    }
    fillForm(result.profile);
    showState('form');
  } catch (err) {
    showState('invalid');
  }
}

function fillTicketInfo(ticketType) {
  const title = document.getElementById('ticket-info-title');
  const badge = document.getElementById('ticket-info-badge');
  const detail = document.getElementById('ticket-info-detail');

  if (ticketType === 'early_bird') {
    title.textContent = 'Early Bird Ticket';
    badge.textContent = 'EARLY BIRD';
    badge.className = 'font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full bg-pink/15 text-pink';
    detail.textContent = '🎉 คุณลงทะเบียนภายในช่วง Early Bird ได้รับของพิเศษเพิ่มเติมนอกเหนือจากของที่ระลึกมาตรฐาน';
  } else {
    title.textContent = 'Regular Ticket';
    badge.textContent = 'REGULAR';
    badge.className = 'font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full bg-blue/15 text-blue';
    detail.textContent = '🎁 ได้รับ Standard Gift Set ตามรายการของที่ระลึกในวันงาน';
  }
}

function fillForm(p) {
  fillTicketInfo(p.ticketType);
  document.getElementById('fullName').value = p.fullName || '';
  document.getElementById('nickname').value = p.nickname || '';
  document.getElementById('phone').value = p.phone || '';
  document.getElementById('occupation').value = p.occupation || '';
  document.getElementById('occupationDetail').value = p.occupationDetail || '';

  const hasAllergy = !!p.allergy;
  document.getElementById('hasAllergy').checked = hasAllergy;
  document.getElementById('allergy-field').classList.toggle('hidden', !hasAllergy);
  document.getElementById('allergy').value = p.allergy || '';

  document.getElementById('connectionConsent').checked = !!p.connectionConsent;
  document.getElementById('connection-fields').classList.toggle('hidden', !p.connectionConsent);
  if (p.contactVisibility === 'email_phone') {
    document.getElementById('contactVisibilityEmailPhone').checked = true;
  } else {
    document.getElementById('contactVisibilityEmail').checked = true;
  }
  document.getElementById('talkTopics').value = p.talkTopics || '';
}

function initToggles() {
  const hasAllergy = document.getElementById('hasAllergy');
  const allergyField = document.getElementById('allergy-field');
  hasAllergy.addEventListener('change', () => {
    allergyField.classList.toggle('hidden', !hasAllergy.checked);
    if (!hasAllergy.checked) document.getElementById('allergy').value = '';
  });

  const consent = document.getElementById('connectionConsent');
  const connectionFields = document.getElementById('connection-fields');
  consent.addEventListener('change', () => {
    connectionFields.classList.toggle('hidden', !consent.checked);
    if (!consent.checked) {
      document.getElementById('talkTopics').value = '';
      document.getElementById('contactVisibilityEmail').checked = true;
    }
  });
}

function showBanner(message, type) {
  const banner = document.getElementById('manage-banner');
  banner.textContent = message;
  banner.className = 'form-banner ' + (type === 'success' ? 'form-banner-success' : 'form-banner-error');
  banner.classList.remove('hidden');
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideBanner() {
  document.getElementById('manage-banner').classList.add('hidden');
}

function setSaving(isSaving) {
  const btn = document.getElementById('save-btn');
  const label = document.getElementById('save-btn-label');
  btn.disabled = isSaving;
  label.textContent = isSaving ? 'กำลังบันทึก…' : 'บันทึกการเปลี่ยนแปลง';
  btn.querySelector('.btn-spinner')?.remove();
  if (isSaving) {
    const spinner = document.createElement('span');
    spinner.className = 'btn-spinner';
    btn.appendChild(spinner);
  }
}

async function saveProfile(e) {
  e.preventDefault();
  hideBanner();

  const payload = {
    action: 'update',
    id: regId,
    token: editToken,
    fullName: document.getElementById('fullName').value.trim(),
    nickname: document.getElementById('nickname').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    occupation: document.getElementById('occupation').value,
    occupationDetail: document.getElementById('occupationDetail').value.trim(),
    allergy: document.getElementById('hasAllergy').checked ? document.getElementById('allergy').value.trim() : '',
    connectionConsent: document.getElementById('connectionConsent').checked,
    contactVisibility: document.querySelector('input[name="contactVisibility"]:checked')?.value || '',
    talkTopics: document.getElementById('connectionConsent').checked ? document.getElementById('talkTopics').value.trim() : '',
  };

  setSaving(true);
  try {
    const res = await fetch(MANAGE_CONFIG.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (result.result === 'success') {
      showBanner('บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว', 'success');
    } else {
      showBanner(result.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  } catch (err) {
    showBanner('เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือติดต่อทีมงานโดยตรง', 'error');
  } finally {
    setSaving(false);
  }
}

async function deleteProfile() {
  const confirmed = window.confirm('ยืนยันลบข้อมูล Connection Map ของคุณ?\n(ข้อมูลการลงทะเบียน/บัตรเข้างานของคุณจะยังอยู่ตามปกติ)');
  if (!confirmed) return;

  const btn = document.getElementById('delete-btn');
  btn.disabled = true;
  try {
    const res = await fetch(MANAGE_CONFIG.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'delete', id: regId, token: editToken }),
    });
    const result = await res.json();
    if (result.result === 'success') {
      showState('success');
    } else {
      showBanner(result.message || 'ลบข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  } catch (err) {
    showBanner('เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือติดต่อทีมงานโดยตรง', 'error');
  } finally {
    btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initFooterYear();
  initToggles();
  document.getElementById('manage-form').addEventListener('submit', saveProfile);
  document.getElementById('delete-btn').addEventListener('click', deleteProfile);
  loadProfile();
});

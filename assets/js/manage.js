/* ==========================================================
   OSKR17th Anniversary — Manage Connection Map profile (manage.html)
   ========================================================== */

const MANAGE_CONFIG = {
  // TODO: ต้องเป็น Web App URL เดียวกับ REGISTER_CONFIG.scriptUrl ใน register.js
  scriptUrl: 'https://script.google.com/macros/s/AKfycbwe3cldBEPaTPYn102wAOT8Yq2EyqUIqQ1y7_h4Wjvfg9FggSmmHbmpLnaYXHIHcyiG/exec',
};

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

const regId = getQueryParam('id');
const editToken = getQueryParam('token');

function showState(state) {
  ['loading', 'invalid', 'password-setup', 'password-login', 'form'].forEach((s) => {
    document.getElementById('state-' + s).classList.toggle('hidden', s !== state);
  });
}

function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear() + 543; // พ.ศ.
}

// เรียกครั้งแรกที่โหลดหน้า — เช็กแค่ว่าแถวนี้ตั้งรหัสผ่านไว้หรือยัง (authStage)
// ยังไม่ได้ข้อมูลโปรไฟล์กลับมา ต้องผ่าน setPassword/verifyPassword ก่อน
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
    fillTicketInfo(result.ticketTier);
    showState(result.authStage === 'setup' ? 'password-setup' : 'password-login');
  } catch (err) {
    showState('invalid');
  }
}

// เรียกหลัง setPassword/verifyPassword สำเร็จ — ได้โปรไฟล์กลับมาแล้วค่อยเติมฟอร์ม
function onAuthSuccess(profile) {
  fillForm(profile);
  showState('form');
}

// ต้องตรงกับ ticketTier switch ใน google-apps-script/Code.gs (ticketTierLabel)
const TICKET_TIER_DISPLAY = {
  'First 50': { title: 'First 50 Ticket', badge: 'FIRST 50', className: 'bg-pink/15 text-pink', detail: '🎉 คุณเป็นหนึ่งใน 50 ท่านแรก ได้รับของพิเศษสุดพิเศษนอกเหนือจากของที่ระลึกมาตรฐาน' },
  'Early Bird': { title: 'Early Bird Ticket', badge: 'EARLY BIRD', className: 'bg-pink/15 text-pink', detail: '🎉 คุณลงทะเบียนภายในช่วง Early Bird ได้รับของพิเศษเพิ่มเติมนอกเหนือจากของที่ระลึกมาตรฐาน' },
  'Final Call': { title: 'Final Call Ticket', badge: 'FINAL CALL', className: 'bg-amber-500/15 text-amber-600', detail: '🎁 ได้รับ Standard Gift Set ตามรายการของที่ระลึกในวันงาน' },
  'Regular': { title: 'Regular Ticket', badge: 'REGULAR', className: 'bg-blue/15 text-blue', detail: '' },
};

function fillTicketInfo(ticketTier) {
  const title = document.getElementById('ticket-info-title');
  const badge = document.getElementById('ticket-info-badge');
  const detail = document.getElementById('ticket-info-detail');
  const regIdEl = document.getElementById('ticket-info-regid');

  const display = TICKET_TIER_DISPLAY[ticketTier] || TICKET_TIER_DISPLAY['Regular'];
  title.textContent = display.title;
  badge.textContent = display.badge;
  badge.className = 'font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full ' + display.className;
  detail.textContent = display.detail;
  if (regIdEl) regIdEl.textContent = regId || '';
}

// เผื่อกรณีลงทะเบียนไว้ตอนที่ LOV สายอาชีพยังเป็นชุดเก่า (เช่น "สายไอที/เทคโนโลยี
// (Developer, Data, AI)") แล้วชุดตัวเลือกถูกเปลี่ยนไปแล้ว — ถ้าค่าที่บันทึกไว้
// ไม่ตรงกับตัวเลือกไหนเลย ให้เพิ่มตัวเลือกนั้นเข้าไปชั่วคราวแล้วเลือกไว้ กัน
// ข้อมูลเดิมหายไปเงียบ ๆ หรือถูกบันทึกทับเป็นค่าอื่นโดยไม่ตั้งใจ
function setOccupationValue(value) {
  const select = document.getElementById('occupation');
  if (!value) { select.value = ''; return; }

  const hasOption = Array.from(select.options).some((opt) => opt.value === value);
  if (!hasOption) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value + ' (ค่าเดิม)';
    select.appendChild(opt);
  }
  select.value = value;
}

function fillForm(p) {
  fillTicketInfo(p.ticketTier);
  document.getElementById('fullName').value = p.fullName || '';
  document.getElementById('nickname').value = p.nickname || '';
  document.getElementById('phone').value = p.phone || '';
  setOccupationValue(p.occupation || '');
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
  document.getElementById('province').value = p.province || '';
  document.getElementById('linkedin').value = p.linkedin || '';
  document.getElementById('facebook').value = p.facebook || '';
  document.getElementById('resumeLink').value = p.resumeLink || '';
}

function initProvinceSelect() {
  const select = document.getElementById('province');
  if (!select || typeof THAI_PROVINCES === 'undefined') return;
  THAI_PROVINCES.forEach((pv) => {
    const opt = document.createElement('option');
    opt.value = pv;
    opt.textContent = pv;
    select.appendChild(opt);
  });
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

function showBanner(bannerId, message, type) {
  const banner = document.getElementById(bannerId);
  banner.textContent = message;
  banner.className = 'form-banner ' + (type === 'success' ? 'form-banner-success' : 'form-banner-error');
  banner.classList.remove('hidden');
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideBanner(bannerId) {
  document.getElementById(bannerId).classList.add('hidden');
}

function setButtonLoading(btnId, labelId, isLoading, idleLabel, loadingLabel) {
  const btn = document.getElementById(btnId);
  const label = document.getElementById(labelId);
  btn.disabled = isLoading;
  label.textContent = isLoading ? loadingLabel : idleLabel;
  btn.querySelector('.btn-spinner')?.remove();
  if (isLoading) {
    const spinner = document.createElement('span');
    spinner.className = 'btn-spinner';
    btn.appendChild(spinner);
  }
}

function setSaving(isSaving) {
  setButtonLoading('save-btn', 'save-btn-label', isSaving, 'บันทึกการเปลี่ยนแปลง', 'กำลังบันทึก…');
}

async function submitSetPassword(e) {
  e.preventDefault();
  hideBanner('password-setup-banner');

  const password = document.getElementById('setupPassword').value;
  const confirmPassword = document.getElementById('setupPasswordConfirm').value;
  if (password.length < 8) {
    showBanner('password-setup-banner', 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร', 'error');
    return;
  }
  if (password !== confirmPassword) {
    showBanner('password-setup-banner', 'รหัสผ่านทั้งสองช่องไม่ตรงกัน', 'error');
    return;
  }

  setButtonLoading('password-setup-btn', 'password-setup-btn-label', true, 'ตั้งรหัสผ่านและเข้าใช้งาน', 'กำลังตั้งรหัสผ่าน…');
  try {
    const res = await fetch(MANAGE_CONFIG.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'setPassword', id: regId, token: editToken, password }),
    });
    const result = await res.json();
    if (result.result === 'success') {
      onAuthSuccess(result.profile);
    } else {
      showBanner('password-setup-banner', result.message || 'ตั้งรหัสผ่านไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  } catch (err) {
    showBanner('password-setup-banner', 'เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
  } finally {
    setButtonLoading('password-setup-btn', 'password-setup-btn-label', false, 'ตั้งรหัสผ่านและเข้าใช้งาน', 'กำลังตั้งรหัสผ่าน…');
  }
}

async function submitLoginPassword(e) {
  e.preventDefault();
  hideBanner('password-login-banner');

  const password = document.getElementById('loginPassword').value;
  setButtonLoading('password-login-btn', 'password-login-btn-label', true, 'เข้าสู่ระบบ', 'กำลังตรวจสอบ…');
  try {
    const res = await fetch(MANAGE_CONFIG.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'verifyPassword', id: regId, token: editToken, password }),
    });
    const result = await res.json();
    if (result.result === 'success') {
      onAuthSuccess(result.profile);
    } else {
      showBanner('password-login-banner', result.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  } catch (err) {
    showBanner('password-login-banner', 'เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
  } finally {
    setButtonLoading('password-login-btn', 'password-login-btn-label', false, 'เข้าสู่ระบบ', 'กำลังตรวจสอบ…');
  }
}

async function requestForgotPassword() {
  const btn = document.getElementById('forgot-password-btn');
  hideBanner('password-login-banner');
  btn.disabled = true;
  try {
    const res = await fetch(MANAGE_CONFIG.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'forgotPassword', id: regId, token: editToken }),
    });
    const result = await res.json();
    showBanner('password-login-banner', result.message || (result.result === 'success' ? 'ส่งลิงก์ตั้งรหัสผ่านใหม่แล้ว' : 'ทำรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'), result.result === 'success' ? 'success' : 'error');
  } catch (err) {
    showBanner('password-login-banner', 'เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function submitChangePassword(e) {
  e.preventDefault();
  hideBanner('change-password-banner');

  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const newPasswordConfirm = document.getElementById('newPasswordConfirm').value;

  if (newPassword.length < 8) {
    showBanner('change-password-banner', 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร', 'error');
    return;
  }
  if (newPassword !== newPasswordConfirm) {
    showBanner('change-password-banner', 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน', 'error');
    return;
  }

  setButtonLoading('change-password-btn', 'change-password-btn-label', true, 'บันทึกรหัสผ่านใหม่', 'กำลังบันทึก…');
  try {
    const res = await fetch(MANAGE_CONFIG.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'changePassword', id: regId, token: editToken, currentPassword, newPassword }),
    });
    const result = await res.json();
    if (result.result === 'success') {
      showBanner('change-password-banner', 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', 'success');
      document.getElementById('change-password-form').reset();
    } else {
      showBanner('change-password-banner', result.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  } catch (err) {
    showBanner('change-password-banner', 'เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
  } finally {
    setButtonLoading('change-password-btn', 'change-password-btn-label', false, 'บันทึกรหัสผ่านใหม่', 'กำลังบันทึก…');
  }
}

async function saveProfile(e) {
  e.preventDefault();
  hideBanner('manage-banner');

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
    province: document.getElementById('connectionConsent').checked ? document.getElementById('province').value : '',
    linkedin: document.getElementById('connectionConsent').checked ? document.getElementById('linkedin').value.trim() : '',
    facebook: document.getElementById('connectionConsent').checked ? document.getElementById('facebook').value.trim() : '',
    resumeLink: document.getElementById('connectionConsent').checked ? document.getElementById('resumeLink').value.trim() : '',
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
      showBanner('manage-banner', 'บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว', 'success');
    } else {
      showBanner('manage-banner', result.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  } catch (err) {
    showBanner('manage-banner', 'เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือติดต่อทีมงานโดยตรง', 'error');
  } finally {
    setSaving(false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initFooterYear();
  initToggles();
  initProvinceSelect();
  document.getElementById('manage-form').addEventListener('submit', saveProfile);
  document.getElementById('password-setup-form').addEventListener('submit', submitSetPassword);
  document.getElementById('password-login-form').addEventListener('submit', submitLoginPassword);
  document.getElementById('forgot-password-btn').addEventListener('click', requestForgotPassword);
  document.getElementById('change-password-form').addEventListener('submit', submitChangePassword);
  document.getElementById('change-password-toggle').addEventListener('click', () => {
    const panel = document.getElementById('change-password-panel');
    const nowOpen = panel.classList.toggle('hidden') === false;
    document.getElementById('change-password-toggle').textContent = nowOpen ? 'ยกเลิก' : 'เปลี่ยนรหัสผ่าน';
    if (!nowOpen) {
      document.getElementById('change-password-form').reset();
      hideBanner('change-password-banner');
    }
  });
  loadProfile();
});

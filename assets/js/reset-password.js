/* ==========================================================
   OSKR17th Anniversary — Reset forgotten manage.html password
   (reset-password.html)
   ========================================================== */

const RESET_CONFIG = {
  // ต้องเป็น Web App URL เดียวกับ MANAGE_CONFIG.scriptUrl ใน manage.js
  scriptUrl: 'https://script.google.com/macros/s/AKfycbxCMrM89wRFCUsbYevsuVuHzbWqkRyPGRd9MBrwxd1gTKwXin9VpuMrjzlKCjcxv_2xiA/exec',
};

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

const regId = getQueryParam('id');
const resetToken = getQueryParam('resetToken');

function showState(state) {
  ['invalid', 'form', 'success'].forEach((s) => {
    document.getElementById('state-' + s).classList.toggle('hidden', s !== state);
  });
}

function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear() + 543; // พ.ศ.
}

function showBanner(message, type) {
  const banner = document.getElementById('reset-banner');
  banner.textContent = message;
  banner.className = 'form-banner ' + (type === 'success' ? 'form-banner-success' : 'form-banner-error');
  banner.classList.remove('hidden');
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideBanner() {
  document.getElementById('reset-banner').classList.add('hidden');
}

function setSubmitting(isSubmitting) {
  const btn = document.getElementById('reset-btn');
  const label = document.getElementById('reset-btn-label');
  btn.disabled = isSubmitting;
  label.textContent = isSubmitting ? 'กำลังบันทึก…' : 'ตั้งรหัสผ่านใหม่';
  btn.querySelector('.btn-spinner')?.remove();
  if (isSubmitting) {
    const spinner = document.createElement('span');
    spinner.className = 'btn-spinner';
    btn.appendChild(spinner);
  }
}

async function submitReset(e) {
  e.preventDefault();
  hideBanner();

  const password = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('newPasswordConfirm').value;
  if (password.length < 8) {
    showBanner('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร', 'error');
    return;
  }
  if (password !== confirmPassword) {
    showBanner('รหัสผ่านทั้งสองช่องไม่ตรงกัน', 'error');
    return;
  }

  setSubmitting(true);
  try {
    const res = await fetch(RESET_CONFIG.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'resetPassword', id: regId, resetToken: resetToken, password }),
    });
    const result = await res.json();
    if (result.result === 'success') {
      showState('success');
    } else {
      showBanner(result.message || 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  } catch (err) {
    showBanner('เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
  } finally {
    setSubmitting(false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initFooterYear();

  if (!regId || !resetToken || RESET_CONFIG.scriptUrl.includes('PASTE_YOUR')) {
    showState('invalid');
    return;
  }

  document.getElementById('reset-regid').textContent = regId;
  document.getElementById('reset-password-form').addEventListener('submit', submitReset);
  showState('form');
});

/* ==========================================================
   OSKR17th Anniversary — Registration page (register.html)
   ========================================================== */

const REGISTER_CONFIG = {
  // TODO: วาง Web App URL ที่ได้จากการ Deploy Code.gs (Deploy > New deployment > Web app)
  scriptUrl: 'https://script.google.com/macros/s/AKfycbyNO4LWfXnolCXSDsAHrKjrgeg3mC1j3fsMXV7m1ArC_gbC-RIwc0CS4MnsakZAJfD69g/exec',

  // ข้อมูลบัตร — ให้ตรงกับ CONFIG.tickets.regular ใน assets/js/script.js
  ticket: {
    priceLabel: '1,177',
    periodLabel: '09.08 – 13.09.2026',
    giftSet: 'Standard Gift Set',
    giftDetail: 'ของที่ระลึกตามรายการที่มีในวันงาน (ไม่รวมของที่ต้องสั่งผลิตล่วงหน้า)',
  },

  maxFileSizeMB: 5,
};

function initTicketSummary() {
  const price = document.getElementById('ticket-price');
  const period = document.getElementById('ticket-period');
  const gift = document.getElementById('ticket-gift');
  if (price) price.textContent = REGISTER_CONFIG.ticket.priceLabel;
  if (period) period.textContent = REGISTER_CONFIG.ticket.periodLabel;
  if (gift) gift.textContent = `🎁 ${REGISTER_CONFIG.ticket.giftSet} — ${REGISTER_CONFIG.ticket.giftDetail}`;
}

function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear() + 543; // พ.ศ.
}

/* ----------------------------------------------------------
   QR full-size lightbox
   ---------------------------------------------------------- */
function initQrLightbox() {
  const btn = document.getElementById('qr-recall-btn');
  const lightbox = document.getElementById('qr-lightbox');
  const closeBtn = document.getElementById('qr-lightbox-close');
  if (!btn || !lightbox) return;

  const open = () => {
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  btn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

/* ----------------------------------------------------------
   Conditional fields: แพ้อาหาร toggle, Connection Map (merged into
   the single "agree" checkbox — checking it reveals contact
   visibility + talk topics)
   ---------------------------------------------------------- */
function initConditionalFields() {
  const hasAllergy = document.getElementById('hasAllergy');
  const allergyField = document.getElementById('allergy-field');
  const allergyInput = document.getElementById('allergy');

  hasAllergy.addEventListener('change', () => {
    allergyField.classList.toggle('hidden', !hasAllergy.checked);
    if (!hasAllergy.checked) allergyInput.value = '';
  });

  const agree = document.getElementById('agree');
  const connectionFields = document.getElementById('connection-fields');
  const talkTopics = document.getElementById('talkTopics');

  agree.addEventListener('change', () => {
    connectionFields.classList.toggle('hidden', !agree.checked);
    if (!agree.checked) {
      talkTopics.value = '';
      document.getElementById('contactVisibilityEmail').checked = true;
    }
  });
}

/* ----------------------------------------------------------
   Slip upload: preview + validation
   ---------------------------------------------------------- */
let slipBase64 = null;

function initUpload() {
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('slipFile');
  const previewWrap = document.getElementById('upload-preview-wrap');
  const previewImg = document.getElementById('upload-preview-img');
  const removeBtn = document.getElementById('upload-remove-btn');

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('is-dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('is-dragover');
    if (e.dataTransfer.files[0]) {
      fileInput.files = e.dataTransfer.files;
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  removeBtn.addEventListener('click', () => {
    fileInput.value = '';
    slipBase64 = null;
    previewWrap.classList.add('hidden');
    dropzone.classList.remove('hidden');
  });

  function handleFile(file) {
    const slipField = dropzone.closest('.form-field');

    if (!file.type.startsWith('image/')) {
      showFieldError(slipField, document.getElementById('slip-error-text'), 'กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    if (file.size > REGISTER_CONFIG.maxFileSizeMB * 1024 * 1024) {
      showFieldError(slipField, document.getElementById('slip-error-text'), `ไฟล์ใหญ่เกินไป (ไม่เกิน ${REGISTER_CONFIG.maxFileSizeMB}MB)`);
      return;
    }

    clearFieldError(slipField);

    const reader = new FileReader();
    reader.onload = () => {
      slipBase64 = reader.result;
      previewImg.src = slipBase64;
      previewWrap.classList.remove('hidden');
      dropzone.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }
}

/* ----------------------------------------------------------
   Validation helpers
   ---------------------------------------------------------- */
function showFieldError(fieldEl, errorTextEl, message) {
  fieldEl.classList.add('has-error');
  const input = fieldEl.querySelector('.form-input, .form-select, .form-textarea');
  if (input) input.classList.add('has-error');
  if (errorTextEl && message) errorTextEl.textContent = message;
}

function clearFieldError(fieldEl) {
  fieldEl.classList.remove('has-error');
  const input = fieldEl.querySelector('.form-input, .form-select, .form-textarea');
  if (input) input.classList.remove('has-error');
}

function validateForm() {
  let isValid = true;
  const form = document.getElementById('register-form');

  form.querySelectorAll('.form-field').forEach((field) => {
    const input = field.querySelector('input:not([type=checkbox]), select, textarea');
    if (!input || field.classList.contains('hidden')) return;
    if (input.required && !input.value.trim()) {
      showFieldError(field, field.querySelector('.form-error-text'));
      isValid = false;
    } else if (input.type === 'email' && input.value && !input.checkValidity()) {
      showFieldError(field, field.querySelector('.form-error-text'));
      isValid = false;
    } else if (input.id === 'phone' && input.value && !/^0\d{9}$/.test(input.value.trim())) {
      showFieldError(field, field.querySelector('.form-error-text'));
      isValid = false;
    } else {
      clearFieldError(field);
    }
  });

  const slipField = document.getElementById('upload-dropzone').closest('.form-field');
  if (!slipBase64) {
    showFieldError(slipField, document.getElementById('slip-error-text'), 'กรุณาแนบรูปสลิปโอนเงิน');
    isValid = false;
  } else {
    clearFieldError(slipField);
  }

  const agree = document.getElementById('agree');
  const agreeField = agree.closest('.form-field');
  if (!agree.checked) {
    agreeField.classList.add('has-error');
    isValid = false;
  } else {
    agreeField.classList.remove('has-error');
  }

  return isValid;
}

/* ----------------------------------------------------------
   Submit
   ---------------------------------------------------------- */
function showBanner(message) {
  const banner = document.getElementById('form-banner');
  banner.textContent = message;
  banner.classList.remove('hidden');
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideBanner() {
  document.getElementById('form-banner').classList.add('hidden');
}

function setSubmitting(isSubmitting) {
  const btn = document.getElementById('submit-btn');
  const label = document.getElementById('submit-btn-label');
  btn.disabled = isSubmitting;
  label.textContent = isSubmitting ? 'กำลังส่งข้อมูล…' : 'ยืนยันการลงทะเบียน';
  btn.querySelector('.btn-spinner')?.remove();
  if (isSubmitting) {
    const spinner = document.createElement('span');
    spinner.className = 'btn-spinner';
    btn.appendChild(spinner);
  }
}

async function submitRegistration(payload) {
  const response = await fetch(REGISTER_CONFIG.scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

function showSuccess(registrationId, ticketType) {
  document.getElementById('register-form').classList.add('hidden');
  const success = document.getElementById('register-success');
  success.classList.remove('hidden');
  document.getElementById('success-reg-id').textContent = registrationId;

  const badge = document.getElementById('success-ticket-badge');
  if (ticketType === 'early_bird') {
    badge.textContent = '🎉 EARLY BIRD — ได้รับของพิเศษเพิ่มเติม';
    badge.className = 'inline-block font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full mb-6 bg-pink/15 text-pink';
  } else {
    badge.textContent = 'REGULAR TICKET';
    badge.className = 'inline-block font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full mb-6 bg-blue/15 text-blue';
  }

  success.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initFormSubmit() {
  const form = document.getElementById('register-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideBanner();

    if (!validateForm()) {
      showBanner('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
      return;
    }

    if (REGISTER_CONFIG.scriptUrl.includes('PASTE_YOUR')) {
      showBanner('ระบบยังไม่พร้อมใช้งาน (ยังไม่ได้ตั้งค่า Web App URL) กรุณาติดต่อทีมงาน');
      return;
    }

    const payload = {
      fullName: document.getElementById('fullName').value.trim(),
      nickname: document.getElementById('nickname').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      occupation: document.getElementById('occupation').value,
      occupationDetail: document.getElementById('occupationDetail').value.trim(),
      allergy: document.getElementById('hasAllergy').checked ? document.getElementById('allergy').value.trim() : '',
      transferDate: document.getElementById('transferDate').value,
      transferTime: document.getElementById('transferTime').value,
      slipBase64: slipBase64,
      agree: document.getElementById('agree').checked,
      contactVisibility: document.querySelector('input[name="contactVisibility"]:checked')?.value || '',
      talkTopics: document.getElementById('agree').checked ? document.getElementById('talkTopics').value.trim() : '',
    };

    setSubmitting(true);
    try {
      const result = await submitRegistration(payload);
      if (result.result === 'success') {
        showSuccess(result.registrationId, result.ticketType);
      } else {
        showBanner(result.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง หรือติดต่อทีมงาน');
      }
    } catch (err) {
      showBanner('ส่งข้อมูลไม่สำเร็จ (เครือข่ายมีปัญหา) กรุณาลองใหม่อีกครั้ง หรือติดต่อทีมงานโดยตรง');
    } finally {
      setSubmitting(false);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTicketSummary();
  initFooterYear();
  initQrLightbox();
  initConditionalFields();
  initUpload();
  initFormSubmit();
});

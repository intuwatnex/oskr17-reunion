/* ==========================================================
   OSKR17th Anniversary — Vehicle plate page (vehicle-plate.html)
   ใช้ Web App URL เดียวกับ register.js/manage.js (โปรเจกต์ Apps Script
   เดียวกัน — action: 'vehiclePlate' จัดการโดย VehiclePlate.gs)
   ========================================================== */

const VEHICLE_PLATE_CONFIG = {
  scriptUrl: 'https://script.google.com/macros/s/AKfycbwe3cldBEPaTPYn102wAOT8Yq2EyqUIqQ1y7_h4Wjvfg9FggSmmHbmpLnaYXHIHcyiG/exec',
};

function showPlateBanner(message) {
  const banner = document.getElementById('form-banner');
  banner.textContent = message;
  banner.classList.remove('hidden');
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hidePlateBanner() {
  document.getElementById('form-banner').classList.add('hidden');
}

function setPlateSubmitting(isSubmitting) {
  const btn = document.getElementById('submit-btn');
  const label = document.getElementById('submit-btn-label');
  btn.disabled = isSubmitting;
  label.textContent = isSubmitting ? 'กำลังบันทึก…' : 'บันทึกเลขทะเบียนรถ';
  btn.querySelector('.btn-spinner')?.remove();
  if (isSubmitting) {
    const spinner = document.createElement('span');
    spinner.className = 'btn-spinner';
    btn.appendChild(spinner);
  }
}

async function submitVehiclePlate(payload) {
  const response = await fetch(VEHICLE_PLATE_CONFIG.scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

function showPlateSuccess() {
  document.getElementById('plate-form').classList.add('hidden');
  const success = document.getElementById('plate-success');
  success.classList.remove('hidden');
  success.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetPlateForm() {
  document.getElementById('plate-form').reset();
  document.getElementById('plate-form').classList.remove('hidden');
  document.getElementById('plate-success').classList.add('hidden');
  hidePlateBanner();
  document.getElementById('phone').focus();
}

function initPlateFormSubmit() {
  const form = document.getElementById('plate-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hidePlateBanner();

    const phone = document.getElementById('phone').value.trim();
    const plate = document.getElementById('plate').value.trim();
    const vehicleType = document.querySelector('input[name="vehicleType"]:checked')?.value || '';

    if (!phone || !plate || !vehicleType) {
      showPlateBanner('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const payload = { phone, plate, vehicleType };

    setPlateSubmitting(true);
    try {
      const result = await submitVehiclePlate(payload);
      if (result.result === 'success') {
        showPlateSuccess();
      } else if (result.code === 'not_found') {
        // ไม่พบเบอร์นี้ในระบบ — ไม่มีการบันทึกใด ๆ ให้กรอกเบอร์ใหม่
        showPlateBanner(result.message || 'ไม่พบเบอร์โทรศัพท์นี้ในระบบลงทะเบียน กรุณาตรวจสอบและกรอกใหม่อีกครั้ง');
        document.getElementById('phone').focus();
      } else {
        showPlateBanner(result.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง หรือติดต่อทีมงาน');
      }
    } catch (err) {
      showPlateBanner('ไม่ได้รับการยืนยันจากระบบ (เครือข่ายมีปัญหา) — ข้อมูลอาจบันทึกไปแล้ว กดบันทึกซ้ำได้เลย ไม่ซ้ำซ้อน หากลองหลายครั้งแล้วไม่สำเร็จ กรุณาติดต่อทีมงานโดยตรง');
    } finally {
      setPlateSubmitting(false);
    }
  });

  document.getElementById('plate-again-btn').addEventListener('click', resetPlateForm);
}

document.addEventListener('DOMContentLoaded', () => {
  initPlateFormSubmit();
});

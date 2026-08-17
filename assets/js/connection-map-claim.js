/* ==========================================================
   OSKR17th Anniversary — Connection Map QR fallback claim (connection-map-claim.html)
   ========================================================== */

const CMCL_CONFIG = {
  scriptUrl: 'https://script.google.com/macros/s/AKfycbyMUuPsO8i7uX40eq4Dm5rd9Hl97GExvdwOR_vyE_e5XxBJRvYiK6V2KN9XDdlFhJnV/exec',
};

function cmclEscapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function cmclInitFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear() + 543;
}

function cmclSetPanels({ results = false, empty = false, hint = false, sent = false }) {
  document.getElementById('claim-results').classList.toggle('hidden', !results);
  document.getElementById('claim-empty').classList.toggle('hidden', !empty);
  document.getElementById('claim-hint').classList.toggle('hidden', !hint);
  document.getElementById('claim-sent').classList.toggle('hidden', !sent);
  document.getElementById('claim-search-input').closest('div').classList.toggle('hidden', sent);
}

async function cmclSearch(query) {
  const resultsEl = document.getElementById('claim-results');
  try {
    const url = `${CMCL_CONFIG.scriptUrl}?action=claimSearch&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const result = await res.json();
    const list = (result && result.result === 'success') ? result.results : [];

    if (list.length === 0) {
      resultsEl.innerHTML = '';
      cmclSetPanels({ empty: true });
      return;
    }

    resultsEl.innerHTML = '';
    list.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'cm-card flex items-center justify-between gap-3';
      row.innerHTML = `
        <div>
          <p class="font-display font-medium text-sm">${cmclEscapeHtml(item.name)}</p>
          <p class="text-ink/50 text-xs font-mono">${cmclEscapeHtml(item.masked_email)}</p>
        </div>
      `;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cm-reveal-btn cm-focusable shrink-0';
      btn.textContent = 'ใช่ นี่คือฉัน';
      btn.addEventListener('click', () => cmclRequestLink(item.registration_id, btn));
      row.appendChild(btn);
      resultsEl.appendChild(row);
    });
    cmclSetPanels({ results: true });
  } catch (err) {
    resultsEl.innerHTML = '';
    document.getElementById('claim-empty').textContent = 'ค้นหาไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง';
    cmclSetPanels({ empty: true });
  }
}

async function cmclRequestLink(registrationId, btn) {
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'กำลังส่ง…';
  try {
    const res = await fetch(CMCL_CONFIG.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'claimRequest', registration_id: registrationId }),
    });
    const result = await res.json();
    if (result.result === 'success') {
      cmclSetPanels({ sent: true });
    } else {
      btn.disabled = false;
      btn.textContent = originalText;
      alert(result.message || 'ส่งลิงก์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  } catch (err) {
    btn.disabled = false;
    btn.textContent = originalText;
    alert('เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cmclInitFooterYear();
  cmclSetPanels({ hint: true });

  const input = document.getElementById('claim-search-input');
  let debounceTimer = null;
  input.addEventListener('input', () => {
    const q = input.value.trim();
    clearTimeout(debounceTimer);
    if (q.length < 2) {
      document.getElementById('claim-results').innerHTML = '';
      cmclSetPanels({ hint: true });
      return;
    }
    debounceTimer = setTimeout(() => cmclSearch(q), 250);
  });
});

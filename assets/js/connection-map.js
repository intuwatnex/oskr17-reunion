/* ==========================================================
   OSKR17th Anniversary — Connection Map finder (connection-map.html)
   ========================================================== */

const CM_CONFIG = {
  scriptUrl: 'https://script.google.com/macros/s/AKfycbyMUuPsO8i7uX40eq4Dm5rd9Hl97GExvdwOR_vyE_e5XxBJRvYiK6V2KN9XDdlFhJnV/exec',
};

// กลุ่มสายอาชีพที่ถือว่า "ใกล้เคียงกัน" ใช้กับตัวกรอง "สายใกล้เคียง" —
// ต้องตรงกับตัวเลือกสายอาชีพใน register.html
const INDUSTRY_ADJACENCY = {
  'สายไอที/เทคโนโลยี (Developer, Data, AI)': ['สายวิศวกรรม/ก่อสร้าง', 'สายการเงิน/ธนาคาร/การลงทุน'],
  'สายวิศวกรรม/ก่อสร้าง': ['สายไอที/เทคโนโลยี (Developer, Data, AI)'],
  'สายการเงิน/ธนาคาร/การลงทุน': ['เจ้าของธุรกิจ/ผู้ประกอบการ (SME/Startup)', 'ข้าราชการ/รัฐวิสาหกิจ', 'สายไอที/เทคโนโลยี (Developer, Data, AI)'],
  'เจ้าของธุรกิจ/ผู้ประกอบการ (SME/Startup)': ['สายการเงิน/ธนาคาร/การลงทุน', 'สายการตลาด/สื่อสาร/ครีเอทีฟ', 'ฟรีแลนซ์/รับจ้างอิสระ'],
  'ฟรีแลนซ์/รับจ้างอิสระ': ['เจ้าของธุรกิจ/ผู้ประกอบการ (SME/Startup)', 'ครีเอเตอร์/อินฟลูเอนเซอร์/สื่อออนไลน์'],
  'สายการตลาด/สื่อสาร/ครีเอทีฟ': ['ครีเอเตอร์/อินฟลูเอนเซอร์/สื่อออนไลน์', 'เจ้าของธุรกิจ/ผู้ประกอบการ (SME/Startup)'],
  'ครีเอเตอร์/อินฟลูเอนเซอร์/สื่อออนไลน์': ['สายการตลาด/สื่อสาร/ครีเอทีฟ', 'ฟรีแลนซ์/รับจ้างอิสระ'],
  'ข้าราชการ/รัฐวิสาหกิจ': ['สายการศึกษา/ครู-อาจารย์', 'สายกฎหมาย', 'สายการเงิน/ธนาคาร/การลงทุน'],
  'สายการศึกษา/ครู-อาจารย์': ['ข้าราชการ/รัฐวิสาหกิจ', 'นักเรียน/นักศึกษา'],
  'สายกฎหมาย': ['ข้าราชการ/รัฐวิสาหกิจ'],
  'สายการแพทย์/สาธารณสุข': ['ข้าราชการ/รัฐวิสาหกิจ'],
  'นักเรียน/นักศึกษา': ['สายการศึกษา/ครู-อาจารย์'],
  'พนักงานบริษัทเอกชน': ['เจ้าของธุรกิจ/ผู้ประกอบการ (SME/Startup)', 'สายการเงิน/ธนาคาร/การลงทุน'],
  'อื่นๆ': [],
};

let cmToken = null;
let cmIndustry = '';
let cmMembers = [];
let cmScope = 'all';
let cmSearchTerm = '';
let cmOpenGroups = new Set();

function cmShow(id) {
  ['state-login', 'state-tree-loading', 'state-tree-error', 'state-app'].forEach((s) => {
    document.getElementById(s).classList.toggle('hidden', s !== id);
  });
}

function cmInitFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear() + 543;
}

function cmSaveSession(token, industry) {
  try {
    sessionStorage.setItem('cm_token', token);
    sessionStorage.setItem('cm_industry', industry || '');
  } catch (e) { /* สภาพแวดล้อมที่ปิด storage ไว้ ก็ยังใช้งานต่อได้ในเซสชันนี้ */ }
}
function cmLoadSession() {
  try {
    return { token: sessionStorage.getItem('cm_token'), industry: sessionStorage.getItem('cm_industry') || '' };
  } catch (e) {
    return { token: null, industry: '' };
  }
}
function cmClearSession() {
  try { sessionStorage.removeItem('cm_token'); sessionStorage.removeItem('cm_industry'); } catch (e) { /* noop */ }
}

function cmShowLoginError(message) {
  const banner = document.getElementById('login-banner');
  banner.textContent = message;
  banner.classList.remove('hidden');
}
function cmHideLoginError() {
  document.getElementById('login-banner').classList.add('hidden');
}
function cmSetLoginLoading(isLoading) {
  const btn = document.getElementById('login-btn');
  const label = document.getElementById('login-btn-label');
  btn.disabled = isLoading;
  label.textContent = isLoading ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ';
}

async function cmLogin(regId) {
  cmHideLoginError();
  cmSetLoginLoading(true);
  try {
    const res = await fetch(CM_CONFIG.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'login', reg_id: regId }),
    });
    const result = await res.json();
    if (result.result !== 'success') {
      cmShowLoginError(result.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      return;
    }
    cmToken = result.token;
    cmIndustry = result.industry || '';
    cmSaveSession(cmToken, cmIndustry);
    await cmLoadTree();
  } catch (err) {
    cmShowLoginError('เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง');
  } finally {
    cmSetLoginLoading(false);
  }
}

async function cmLoadTree() {
  cmShow('state-tree-loading');
  try {
    const url = `${CM_CONFIG.scriptUrl}?action=tree&token=${encodeURIComponent(cmToken)}`;
    const res = await fetch(url);
    const result = await res.json();
    if (result.result !== 'success') {
      if (result.code === 'invalid_token') {
        cmClearSession();
        cmToken = null;
        cmShow('state-login');
        cmShowLoginError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        return;
      }
      document.getElementById('tree-error-message').textContent = result.message || 'เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้ง';
      cmShow('state-tree-error');
      return;
    }
    cmMembers = result.members || [];
    if (result.viewerIndustry) cmIndustry = result.viewerIndustry;
    cmShow('state-app');
    cmRenderTree();
  } catch (err) {
    document.getElementById('tree-error-message').textContent = 'เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง';
    cmShow('state-tree-error');
  }
}

function cmMatchesScope(member) {
  if (cmScope === 'all') return true;
  if (cmScope === 'same') return member.industry === cmIndustry;
  if (cmScope === 'nearby') {
    const adjacent = INDUSTRY_ADJACENCY[cmIndustry] || [];
    return adjacent.indexOf(member.industry) !== -1;
  }
  return true;
}

function cmMatchesSearch(member) {
  if (!cmSearchTerm) return true;
  const haystack = [member.nickname, member.detail, member.looking_for]
    .filter(Boolean).join(' ').toLowerCase();
  return haystack.indexOf(cmSearchTerm) !== -1;
}

function cmEscapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function cmBuildTreeData(members) {
  const industries = new Map();
  members.forEach((m) => {
    const industry = m.industry || 'ไม่ระบุสายอาชีพ';
    if (!industries.has(industry)) industries.set(industry, []);
    industries.get(industry).push(m);
  });
  return industries;
}

function cmRenderTree() {
  const filtered = cmMembers.filter((m) => cmMatchesScope(m) && cmMatchesSearch(m));
  const root = document.getElementById('tree-root');
  const empty = document.getElementById('empty-state');

  if (filtered.length === 0) {
    root.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  const tree = cmBuildTreeData(filtered);
  const frag = document.createDocumentFragment();

  tree.forEach((memberList, industry) => {
    const groupId = 'cm-group-' + cmSlug(industry);
    const isOpen = cmOpenGroups.has(industry) || tree.size === 1;

    const groupWrap = document.createElement('div');
    groupWrap.className = 'notebook-card ticket-card !p-0 overflow-hidden';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'cm-group-toggle cm-focusable';
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggleBtn.setAttribute('aria-controls', groupId);
    toggleBtn.innerHTML = `
      <span class="font-display font-semibold text-base">${cmEscapeHtml(industry)}</span>
      <span class="flex items-center gap-2 text-ink/50 text-xs font-mono">
        ${memberList.length} คน
        <svg class="cm-chevron w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
      </span>`;
    toggleBtn.addEventListener('click', () => {
      const nowOpen = toggleBtn.getAttribute('aria-expanded') !== 'true';
      toggleBtn.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
      if (nowOpen) cmOpenGroups.add(industry); else cmOpenGroups.delete(industry);
      body.classList.toggle('is-open', nowOpen);
    });

    const body = document.createElement('div');
    body.id = groupId;
    body.className = 'cm-group-body' + (isOpen ? ' is-open' : '');

    const bodyInner = document.createElement('div');
    bodyInner.className = 'px-4 pb-4 pt-1';

    const cardsWrap = document.createElement('div');
    cardsWrap.className = 'grid sm:grid-cols-2 gap-3';
    memberList.forEach((m) => cardsWrap.appendChild(cmBuildCard(m)));
    bodyInner.appendChild(cardsWrap);

    body.appendChild(bodyInner);
    groupWrap.appendChild(toggleBtn);
    groupWrap.appendChild(body);
    frag.appendChild(groupWrap);
  });

  root.innerHTML = '';
  root.appendChild(frag);
}

function cmSlug(str) {
  return (str || '').replace(/[^a-zA-Z0-9ก-๙]/g, '').slice(0, 24) || 'x';
}

function cmBuildCard(member) {
  const card = document.createElement('div');
  card.className = 'cm-card';

  card.innerHTML = `
    <p class="font-display font-semibold text-base mb-0.5">${cmEscapeHtml(member.nickname || 'ไม่ระบุชื่อ')}</p>
    ${member.detail ? `<p class="text-ink/60 text-xs mb-2">${cmEscapeHtml(member.detail)}</p>` : ''}
    ${member.looking_for ? `<p class="text-xs text-ink/70 mb-3"><span class="text-pink font-medium">กำลังตามหา:</span> ${cmEscapeHtml(member.looking_for)}</p>` : ''}
  `;

  const revealBtn = document.createElement('button');
  revealBtn.type = 'button';
  revealBtn.className = 'cm-reveal-btn cm-focusable';
  revealBtn.textContent = 'ดูช่องทางติดต่อ';
  revealBtn.addEventListener('click', () => cmReveal(member.registration_id, revealBtn));
  card.appendChild(revealBtn);

  return card;
}

async function cmReveal(targetId, btn) {
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'กำลังโหลด…';
  try {
    const res = await fetch(CM_CONFIG.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'reveal', token: cmToken, target_id: targetId }),
    });
    const result = await res.json();
    if (result.result !== 'success') {
      cmShowRevealResult('ไม่สำเร็จ', result.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      return;
    }
    if (result.share === 'phone') {
      cmShowRevealResult('เบอร์โทรศัพท์', result.value || '-');
    } else if (result.share === 'email') {
      cmShowRevealResult('อีเมล', result.value || '-');
    } else {
      cmShowRevealResult('ช่องทางติดต่อ', 'ไม่เปิดเผยช่องทางติดต่อ');
    }
  } catch (err) {
    cmShowRevealResult('ไม่สำเร็จ', 'เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function cmShowRevealResult(title, body) {
  document.getElementById('reveal-title').textContent = title;
  document.getElementById('reveal-body').textContent = body;
  document.getElementById('reveal-lightbox').classList.remove('hidden');
  document.getElementById('reveal-close-btn').focus();
}

function cmInitScopeChips() {
  document.querySelectorAll('#scope-chips .cm-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#scope-chips .cm-chip').forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      cmScope = chip.dataset.scope;
      cmRenderTree();
    });
  });
}

function cmInitSearch() {
  const input = document.getElementById('search-input');
  let debounceTimer = null;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      cmSearchTerm = input.value.trim().toLowerCase();
      cmRenderTree();
    }, 200);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  cmInitFooterYear();
  cmInitScopeChips();
  cmInitSearch();

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const regId = document.getElementById('login-reg-id').value.trim();
    if (!regId) return;
    cmLogin(regId);
  });

  document.getElementById('tree-retry-btn').addEventListener('click', () => {
    if (cmToken) cmLoadTree(); else cmShow('state-login');
  });

  document.getElementById('reveal-close-btn').addEventListener('click', () => {
    document.getElementById('reveal-lightbox').classList.add('hidden');
  });
  document.getElementById('reveal-lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'reveal-lightbox') e.currentTarget.classList.add('hidden');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.getElementById('reveal-lightbox').classList.add('hidden');
  });

  const session = cmLoadSession();
  if (session.token) {
    cmToken = session.token;
    cmIndustry = session.industry;
    cmLoadTree();
  } else {
    cmShow('state-login');
  }
});

/* ==========================================================
   OSKR17th Anniversary — Connection Map finder (connection-map.html)
   ========================================================== */

const CM_CONFIG = {
  scriptUrl: 'https://script.google.com/macros/s/AKfycbxCMrM89wRFCUsbYevsuVuHzbWqkRyPGRd9MBrwxd1gTKwXin9VpuMrjzlKCjcxv_2xiA/exec',
};

// กลุ่มสายอาชีพที่ถือว่า "ใกล้เคียงกัน" ใช้กับตัวกรอง "สายใกล้เคียง" —
// ต้องตรงกับตัวเลือกสายอาชีพใน register.html/manage.html
const INDUSTRY_ADJACENCY = {
  'นักเรียน/นักศึกษา': ['บุคลากรทางการศึกษา'],
  'รับราชการ': ['พนักงานรัฐวิสาหกิจ', 'กฎหมาย', 'บุคลากรทางการศึกษา', 'บุคลากรทางการแพทย์และสาธารณสุข'],
  'พนักงานรัฐวิสาหกิจ': ['รับราชการ', 'วิศวกรรมและเทคโนโลยี', 'การเงิน บัญชี และธนาคาร'],
  'พนักงานบริษัทเอกชน': ['เจ้าของกิจการ / ผู้ประกอบการ', 'ผู้บริหาร / ผู้จัดการ', 'การเงิน บัญชี และธนาคาร'],
  'เจ้าของกิจการ / ผู้ประกอบการ': ['พนักงานบริษัทเอกชน', 'ผู้บริหาร / ผู้จัดการ', 'ฟรีแลนซ์/รับจ้างอิสระ', 'อาหารและเครื่องดื่ม'],
  'ผู้บริหาร / ผู้จัดการ': ['เจ้าของกิจการ / ผู้ประกอบการ', 'พนักงานบริษัทเอกชน'],
  'ฟรีแลนซ์/รับจ้างอิสระ': ['เจ้าของกิจการ / ผู้ประกอบการ', 'ครีเอเตอร์/อินฟลูเอนเซอร์/สื่อออนไลน์'],
  'วิศวกรรมและเทคโนโลยี': ['ก่อสร้างและสถาปัตยกรรม', 'พนักงานรัฐวิสาหกิจ', 'โลจิสติกส์ ขนส่ง และคลังสินค้า'],
  'ก่อสร้างและสถาปัตยกรรม': ['วิศวกรรมและเทคโนโลยี'],
  'การเงิน บัญชี และธนาคาร': ['พนักงานบริษัทเอกชน', 'พนักงานรัฐวิสาหกิจ', 'เจ้าของกิจการ / ผู้ประกอบการ'],
  'กฎหมาย': ['รับราชการ'],
  'บุคลากรทางการแพทย์และสาธารณสุข': ['รับราชการ'],
  'บุคลากรทางการศึกษา': ['นักเรียน/นักศึกษา', 'รับราชการ'],
  'ขาย การตลาด และบริการลูกค้า': ['ครีเอเตอร์/อินฟลูเอนเซอร์/สื่อออนไลน์', 'พนักงานบริษัทเอกชน', 'อาหารและเครื่องดื่ม'],
  'ครีเอเตอร์/อินฟลูเอนเซอร์/สื่อออนไลน์': ['ขาย การตลาด และบริการลูกค้า', 'ฟรีแลนซ์/รับจ้างอิสระ'],
  'ท่องเที่ยว โรงแรม และสายการบิน': ['อาหารและเครื่องดื่ม', 'ขาย การตลาด และบริการลูกค้า'],
  'อาหารและเครื่องดื่ม': ['ท่องเที่ยว โรงแรม และสายการบิน', 'เจ้าของกิจการ / ผู้ประกอบการ'],
  'โลจิสติกส์ ขนส่ง และคลังสินค้า': ['วิศวกรรมและเทคโนโลยี', 'ท่องเที่ยว โรงแรม และสายการบิน'],
  'อื่นๆ': [],
};

const CM_RECENT_DAYS = 14;

// สีประจำกลุ่มสายอาชีพ — ผูกกับสายอาชีพแบบคงที่ (ไม่ใช่ลำดับที่ปรากฏ) เพื่อให้
// สีเดิมของแต่ละสายอาชีพเหมือนกันทั้งมุมมองรายการและกราฟ
const CM_ACCENT_PALETTE = ['#EF4F98', '#2E7FE0', '#21407D', '#F5A623'];
const CM_INDUSTRY_LIST = Object.keys(INDUSTRY_ADJACENCY);
function cmColorForIndustry(industry) {
  const idx = CM_INDUSTRY_LIST.indexOf(industry);
  return CM_ACCENT_PALETTE[(idx === -1 ? CM_INDUSTRY_LIST.length : idx) % CM_ACCENT_PALETTE.length];
}

let cmToken = null;
let cmIndustry = '';
let cmMembers = [];
let cmScope = 'all';
let cmSearchTerm = '';
let cmProvince = '';
let cmOpenGroups = new Set();
let cmViewMode = 'list'; // 'list' | 'graph'
let cmGraphSimulation = null;

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
    cmRenderCurrentView();
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
  if (cmScope === 'recent') {
    const cutoff = Date.now() - CM_RECENT_DAYS * 24 * 60 * 60 * 1000;
    return (member.updated_at || 0) >= cutoff;
  }
  return true;
}

function cmMatchesSearch(member) {
  if (!cmSearchTerm) return true;
  const haystack = [member.nickname, member.detail, member.looking_for]
    .filter(Boolean).join(' ').toLowerCase();
  return haystack.indexOf(cmSearchTerm) !== -1;
}

function cmMatchesProvince(member) {
  if (!cmProvince) return true;
  return member.province === cmProvince;
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
  // ล่าสุดขึ้นก่อนในแต่ละกลุ่ม
  industries.forEach((list) => list.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0)));
  return industries;
}

function cmFilteredMembers() {
  return cmMembers.filter((m) => cmMatchesScope(m) && cmMatchesSearch(m) && cmMatchesProvince(m));
}

// เรียกจากทุกจุดที่ filter เปลี่ยน (chip, search, province, สลับ view) แทนที่
// จะเรียก cmRenderTree()/cmRenderGraph() ตรง ๆ — ให้ทำงานเฉพาะ view ที่กำลังโชว์
function cmRenderCurrentView() {
  if (cmViewMode === 'graph') {
    cmRenderGraph();
  } else {
    cmRenderTree();
  }
}

function cmRenderTree() {
  const filtered = cmFilteredMembers();
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
    const accent = cmColorForIndustry(industry);

    const groupWrap = document.createElement('div');
    groupWrap.className = 'notebook-card ticket-card !p-0 overflow-hidden';
    groupWrap.style.setProperty('--cm-accent', accent);

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'cm-group-toggle cm-focusable';
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggleBtn.setAttribute('aria-controls', groupId);
    toggleBtn.innerHTML = `
      <span class="font-display font-semibold text-base" style="color:${accent}">${cmEscapeHtml(industry)}</span>
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
    memberList.forEach((m) => cardsWrap.appendChild(cmBuildCard(m, accent)));
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

function cmIsRecent(member) {
  const cutoff = Date.now() - CM_RECENT_DAYS * 24 * 60 * 60 * 1000;
  return (member.updated_at || 0) >= cutoff;
}

// อนุญาตเฉพาะลิงก์ http/https เท่านั้น กัน javascript:/data: URI
function cmSafeUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.href : null;
  } catch (e) {
    return null;
  }
}

function cmInitials(name) {
  const trimmed = (name || '').trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

function cmBuildCard(member, accent) {
  const card = document.createElement('div');
  card.className = 'cm-card';
  if (accent) card.style.setProperty('--cm-accent', accent);

  const links = [
    member.linkedin ? { href: cmSafeUrl(member.linkedin), label: 'LinkedIn' } : null,
    member.facebook ? { href: cmSafeUrl(member.facebook), label: 'Facebook' } : null,
    member.resume_link ? { href: cmSafeUrl(member.resume_link), label: 'Resume' } : null,
  ].filter((l) => l && l.href);

  card.innerHTML = `
    <div class="flex items-start gap-3 mb-2">
      <div class="cm-avatar">${cmEscapeHtml(cmInitials(member.nickname))}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <p class="font-display font-semibold text-base">${cmEscapeHtml(member.nickname || 'ไม่ระบุชื่อ')}</p>
          ${cmIsRecent(member) ? '<span class="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-pink/15 text-pink shrink-0">ใหม่</span>' : ''}
        </div>
        ${member.detail ? `<p class="text-ink/60 text-xs">${cmEscapeHtml(member.detail)}</p>` : ''}
      </div>
    </div>
    ${member.province ? `<p class="text-ink/40 text-[11px] font-mono mb-2">📍 ${cmEscapeHtml(member.province)}</p>` : ''}
    ${member.looking_for ? `<p class="text-xs text-ink/70 mb-3"><span class="text-pink font-medium">กำลังตามหา:</span> ${cmEscapeHtml(member.looking_for)}</p>` : ''}
    ${links.length ? `<div class="flex flex-wrap gap-2 mb-3">${links.map((l) => `<a href="${cmEscapeHtml(l.href)}" target="_blank" rel="noopener" class="cm-focusable text-[10px] font-mono px-2 py-1 rounded-full border border-blue/30 text-blue hover:bg-blue hover:text-paper transition-colors">${l.label}</a>`).join('')}</div>` : ''}
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

/* ============================================================
   มุมมองกราฟ (D3, interactive) — จัดกลุ่มตามสายอาชีพ ไม่มีเส้นเชื่อมระหว่าง
   คน เพราะข้อมูลจริงไม่มีความสัมพันธ์ระหว่างสมาชิกให้ใช้ (แค่ nickname/
   industry/detail/looking_for/province ต่อคน) จึงใช้ forceX/forceY ดึงแต่ละ
   คนเข้าหาจุดศูนย์กลางของสายอาชีพตัวเองแทน ให้เห็นเป็นกลุ่มก้อนสีตาม industry
   ============================================================ */
function cmRenderGraph() {
  const filtered = cmFilteredMembers();
  const wrap = document.querySelector('#graph-root .cm-graph-wrap');
  const empty = document.getElementById('empty-state');
  const svg = d3.select('#cm-real-graph-svg');

  if (cmGraphSimulation) { cmGraphSimulation.stop(); cmGraphSimulation = null; }
  svg.selectAll('*').remove();
  document.getElementById('cm-graph-detail-sheet').classList.remove('is-open');

  if (filtered.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  const width = wrap.clientWidth || 300;
  const height = wrap.clientHeight || 420;
  svg.attr('viewBox', [0, 0, width, height]);
  const g = svg.append('g');

  svg.call(
    d3.zoom()
      // event.target.closest('.cm-node') กันไม่ให้ zoom แย่งอีเวนต์ mousedown จาก
      // การลากตัวคนแต่ละจุด (d3.drag ผูกกับ .cm-node) ไม่งั้นลากตัวคนแล้วทั้งกราฟ
      // จะแพนไปแทน กลายเป็นลากอะไรไม่ได้จริง ๆ สักอย่าง
      .filter((event) => (!event.ctrlKey || event.type === 'wheel') && !event.button && !event.target.closest('.cm-node'))
      .scaleExtent([0.4, 3])
      .on('zoom', (event) => g.attr('transform', event.transform))
  );
  svg.on('click', (event) => {
    if (event.target === svg.node()) document.getElementById('cm-graph-detail-sheet').classList.remove('is-open');
  });

  const industries = Array.from(new Set(filtered.map((m) => m.industry || 'ไม่ระบุสายอาชีพ')));
  const clusterRadius = Math.min(width, height) * (industries.length > 1 ? 0.32 : 0);
  const clusterCenters = {};
  industries.forEach((industry, i) => {
    const angle = (i / industries.length) * 2 * Math.PI - Math.PI / 2;
    clusterCenters[industry] = {
      x: width / 2 + clusterRadius * Math.cos(angle),
      y: height / 2 + clusterRadius * Math.sin(angle),
    };
  });

  const nodes = filtered.map((m) => ({ ...m }));

  const simulation = d3.forceSimulation(nodes)
    .force('x', d3.forceX((d) => clusterCenters[d.industry || 'ไม่ระบุสายอาชีพ'].x).strength(0.25))
    .force('y', d3.forceY((d) => clusterCenters[d.industry || 'ไม่ระบุสายอาชีพ'].y).strength(0.25))
    .force('charge', d3.forceManyBody().strength(-45))
    .force('collide', d3.forceCollide(20));
  cmGraphSimulation = simulation;

  // เส้นประระหว่าง hub ของสายอาชีพที่ "ใกล้เคียงกัน" (ตาม INDUSTRY_ADJACENCY) —
  // ตำแหน่งคงที่ ไม่ต้องอัปเดตทุก tick
  const hubLinks = [];
  industries.forEach((a, i) => {
    industries.slice(i + 1).forEach((b) => {
      const adjacentToA = INDUSTRY_ADJACENCY[a] || [];
      const adjacentToB = INDUSTRY_ADJACENCY[b] || [];
      if (adjacentToA.indexOf(b) !== -1 || adjacentToB.indexOf(a) !== -1) {
        hubLinks.push({ source: clusterCenters[a], target: clusterCenters[b] });
      }
    });
  });
  g.append('g')
    .attr('stroke', 'rgba(33,64,125,0.25)')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '4 3')
    .selectAll('line')
    .data(hubLinks)
    .join('line')
    .attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
    .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);

  // จุดยึดตรงกลางของแต่ละกลุ่มสายอาชีพ ให้เห็นเป็น hub จริง ๆ ไม่ใช่แค่ตัวหนังสือลอย
  g.append('g')
    .selectAll('circle')
    .data(industries)
    .join('circle')
    .attr('cx', (d) => clusterCenters[d].x)
    .attr('cy', (d) => clusterCenters[d].y)
    .attr('r', 5)
    .attr('fill', '#FFFDF8')
    .attr('stroke', (d) => cmColorForIndustry(d))
    .attr('stroke-width', 2);

  // เส้นเชื่อมจากแต่ละคนไปยัง hub สายอาชีพของตัวเอง — อัปเดตปลายที่ขยับทุก tick
  const spokes = g.append('g')
    .attr('stroke-width', 1.2)
    .selectAll('line')
    .data(nodes)
    .join('line')
    .attr('stroke', (d) => cmColorForIndustry(d.industry))
    .attr('stroke-opacity', 0.35);

  g.append('g')
    .selectAll('text')
    .data(industries)
    .join('text')
    .attr('class', 'cm-node-label')
    .attr('font-weight', 700)
    .attr('text-anchor', 'middle')
    .attr('x', (d) => clusterCenters[d].x)
    .attr('y', (d) => clusterCenters[d].y - clusterRadius * 0.32 - 8)
    .attr('fill', (d) => cmColorForIndustry(d))
    .text((d) => d);

  function dragBehavior(sim) {
    return d3.drag()
      .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end', (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });
  }

  const node = g.append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('class', 'cm-node')
    .style('cursor', 'pointer')
    .call(dragBehavior(simulation))
    .on('click', (event, d) => { event.stopPropagation(); cmShowGraphDetail(d); });

  node.append('circle')
    .attr('r', 14)
    .attr('fill', (d) => cmColorForIndustry(d.industry))
    .attr('stroke', '#FFFDF8')
    .attr('stroke-width', 2);

  node.append('text')
    .attr('class', 'cm-node-label')
    .attr('text-anchor', 'middle')
    .attr('dy', 14 + 12)
    .text((d) => d.nickname || '?');

  simulation.on('tick', () => {
    spokes
      .attr('x1', (d) => clusterCenters[d.industry || 'ไม่ระบุสายอาชีพ'].x)
      .attr('y1', (d) => clusterCenters[d.industry || 'ไม่ระบุสายอาชีพ'].y)
      .attr('x2', (d) => d.x)
      .attr('y2', (d) => d.y);
    node.attr('transform', (d) => `translate(${d.x},${d.y})`);
  });
}

function cmShowGraphDetail(member) {
  const content = document.getElementById('cm-graph-detail-content');
  content.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.65rem;">
      <div class="cm-avatar" style="--cm-accent:${cmColorForIndustry(member.industry)}">${cmEscapeHtml(cmInitials(member.nickname))}</div>
      <div>
        <p class="font-display font-semibold text-base" style="margin:0;">${cmEscapeHtml(member.nickname || 'ไม่ระบุชื่อ')}</p>
        <p class="text-ink/50 text-xs" style="margin:0;">${cmEscapeHtml(member.industry || '')}</p>
      </div>
    </div>
    ${member.detail ? `<p class="text-ink/60 text-xs mb-2">${cmEscapeHtml(member.detail)}</p>` : ''}
    ${member.province ? `<p class="text-ink/40 text-[11px] font-mono mb-2">📍 ${cmEscapeHtml(member.province)}</p>` : ''}
    ${member.looking_for ? `<p class="text-xs text-ink/70 mb-3"><span class="text-pink font-medium">กำลังตามหา:</span> ${cmEscapeHtml(member.looking_for)}</p>` : ''}
  `;

  const revealBtn = document.createElement('button');
  revealBtn.type = 'button';
  revealBtn.className = 'cm-reveal-btn cm-focusable';
  revealBtn.textContent = 'ดูช่องทางติดต่อ';
  revealBtn.addEventListener('click', () => cmReveal(member.registration_id, revealBtn));
  content.appendChild(revealBtn);

  document.getElementById('cm-graph-detail-sheet').classList.add('is-open');
}

function cmInitViewToggle() {
  document.querySelectorAll('#view-toggle button').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      cmViewMode = btn.dataset.view;
      document.querySelectorAll('#view-toggle button').forEach((b) => b.classList.toggle('is-active', b === btn));
      document.getElementById('tree-root').classList.toggle('hidden', cmViewMode !== 'list');
      document.getElementById('graph-root').classList.toggle('hidden', cmViewMode !== 'graph');
      cmRenderCurrentView();
    });
  });
}

function cmInitScopeChips() {
  document.querySelectorAll('#scope-chips .cm-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#scope-chips .cm-chip').forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      cmScope = chip.dataset.scope;
      cmRenderCurrentView();
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
      cmRenderCurrentView();
    }, 200);
  });
}

function cmInitProvinceFilter() {
  const select = document.getElementById('province-filter');
  if (!select || typeof THAI_PROVINCES === 'undefined') return;
  THAI_PROVINCES.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    select.appendChild(opt);
  });
  select.addEventListener('change', () => {
    cmProvince = select.value;
    cmRenderCurrentView();
  });
}

function cmLogout() {
  cmClearSession();
  cmToken = null;
  cmIndustry = '';
  cmMembers = [];
  cmScope = 'all';
  cmSearchTerm = '';
  cmProvince = '';
  document.getElementById('search-input').value = '';
  const provinceFilter = document.getElementById('province-filter');
  if (provinceFilter) provinceFilter.value = '';
  document.querySelectorAll('#scope-chips .cm-chip').forEach((c) => c.classList.toggle('is-active', c.dataset.scope === 'all'));
  cmViewMode = 'list';
  document.querySelectorAll('#view-toggle button').forEach((b) => b.classList.toggle('is-active', b.dataset.view === 'list'));
  document.getElementById('tree-root').classList.remove('hidden');
  document.getElementById('graph-root').classList.add('hidden');
  document.getElementById('login-reg-id').value = '';
  cmHideLoginError();
  cmShow('state-login');
}

document.addEventListener('DOMContentLoaded', () => {
  cmInitFooterYear();
  cmInitScopeChips();
  cmInitSearch();
  cmInitProvinceFilter();
  cmInitViewToggle();

  document.getElementById('logout-btn').addEventListener('click', cmLogout);

  document.getElementById('cm-graph-detail-close').addEventListener('click', () => {
    document.getElementById('cm-graph-detail-sheet').classList.remove('is-open');
  });

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

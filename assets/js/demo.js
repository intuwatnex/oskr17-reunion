/* ==========================================================
   OSKR17th Anniversary — Internal Demo (demo.html) ONLY.
   ทุกอย่างในไฟล์นี้เป็น mock — ไม่มีการเรียก Web App จริง ไม่มีการส่งอีเมล
   จริง ไม่มีการเขียนข้อมูลลง Google Sheet ใด ๆ ทั้งสิ้น
   ห้าม import ไฟล์นี้ในหน้าเว็บ production ใด ๆ
   ========================================================== */

/* ----------------------------------------------------------
   State machine — ตัวแปรเดียวคุมว่ากำลังอยู่ฉากไหน ไม่ใช้ router เต็มรูปแบบ
   ---------------------------------------------------------- */
const DEMO_STEPS = ['register', 'register-success', 'email-inbox', 'manage-password-setup', 'manage-edit-form', 'connection-map-login', 'connection-map'];
let currentScene = 'register'; // ฉากจริงที่กำลังแสดง (มีมากกว่า DEMO_STEPS เพราะมีฉากย่อย เช่น authenticating)

function captionStepFor(scene) {
  if (scene === 'authenticating') return 'connection-map';
  return scene;
}

function showScene(scene) {
  currentScene = scene;

  document.querySelectorAll('.phone-scene').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.scene === scene);
  });

  const captionStep = captionStepFor(scene);
  const captionIndex = DEMO_STEPS.indexOf(captionStep);
  document.querySelectorAll('#demo-caption-strip li').forEach((li) => {
    const liIndex = DEMO_STEPS.indexOf(li.dataset.step);
    li.classList.toggle('is-current', li.dataset.step === captionStep);
    li.classList.toggle('is-done', liIndex !== -1 && liIndex < captionIndex);
  });

  // ปิด detail sheet ของกราฟทุกครั้งที่เปลี่ยนฉาก กันค้างจากรอบก่อน
  document.getElementById('cm-detail-sheet').classList.remove('is-open');
}

/* ----------------------------------------------------------
   Mock data — เครือข่ายเพื่อนร่วมรุ่นสมมติ สำหรับกราฟ D3
   ---------------------------------------------------------- */
const CM_DEMO_PALETTE = ['#EF4F98', '#2E7FE0', '#21407D', '#F5A623'];
const CM_DEMO_INDUSTRIES = [
  'วิศวกรรมและเทคโนโลยี', 'เจ้าของกิจการ / ผู้ประกอบการ', 'การเงิน บัญชี และธนาคาร',
  'ขาย การตลาด และบริการลูกค้า', 'ครีเอเตอร์/อินฟลูเอนเซอร์/สื่อออนไลน์', 'กฎหมาย',
  'บุคลากรทางการแพทย์และสาธารณสุข', 'บุคลากรทางการศึกษา', 'ก่อสร้างและสถาปัตยกรรม',
];
function cmDemoColorFor(industry) {
  const idx = CM_DEMO_INDUSTRIES.indexOf(industry);
  return CM_DEMO_PALETTE[(idx === -1 ? 0 : idx) % CM_DEMO_PALETTE.length];
}

const MOCK_PEOPLE_RAW = [
  { id: 'me', name: 'ชาย', industry: 'วิศวกรรมและเทคโนโลยี', role: 'Software Engineer', lookingFor: 'หาพาร์ทเนอร์ทำสตาร์ทอัพด้าน AI', isMe: true },
  { id: 'kob', name: 'กบ', industry: 'วิศวกรรมและเทคโนโลยี', role: 'Data Scientist', lookingFor: '' },
  { id: 'mint', name: 'มิ้นท์', industry: 'วิศวกรรมและเทคโนโลยี', role: 'UX Designer', lookingFor: 'เปิดรับงานฟรีแลนซ์' },
  { id: 'boss', name: 'บอส', industry: 'เจ้าของกิจการ / ผู้ประกอบการ', role: 'เจ้าของร้านกาแฟ', lookingFor: 'หาซัพพลายเออร์เมล็ดกาแฟ' },
  { id: 'nan', name: 'แนน', industry: 'เจ้าของกิจการ / ผู้ประกอบการ', role: 'เจ้าของร้านเสื้อผ้าออนไลน์', lookingFor: '' },
  { id: 'james', name: 'เจมส์', industry: 'การเงิน บัญชี และธนาคาร', role: 'นักวิเคราะห์การลงทุน', lookingFor: 'เปิดรับให้คำปรึกษาด้านการลงทุน' },
  { id: 'ploy', name: 'พลอย', industry: 'การเงิน บัญชี และธนาคาร', role: 'เจ้าหน้าที่สินเชื่อธุรกิจ', lookingFor: '' },
  { id: 'film', name: 'ฟิล์ม', industry: 'ครีเอเตอร์/อินฟลูเอนเซอร์/สื่อออนไลน์', role: 'Content Creator', lookingFor: 'หาแบรนด์ร่วมงานคอนเทนต์' },
  { id: 'aom', name: 'ออม', industry: 'ขาย การตลาด และบริการลูกค้า', role: 'Social Media Manager', lookingFor: '' },
  { id: 'tae', name: 'เต้', industry: 'กฎหมาย', role: 'ทนายความ', lookingFor: 'เปิดรับปรึกษากฎหมายธุรกิจเบื้องต้น' },
  { id: 'fern', name: 'ใบเฟิร์น', industry: 'บุคลากรทางการแพทย์และสาธารณสุข', role: 'พยาบาลวิชาชีพ', lookingFor: '' },
  { id: 'arm', name: 'อาร์ม', industry: 'บุคลากรทางการศึกษา', role: 'ครูมัธยม', lookingFor: 'หาเพื่อนติวสอบครูผู้ช่วย' },
  { id: 'nat', name: 'นัท', industry: 'ก่อสร้างและสถาปัตยกรรม', role: 'วิศวกรโยธา', lookingFor: '' },
];
const MOCK_PEOPLE = MOCK_PEOPLE_RAW.map((p) => ({ ...p, color: cmDemoColorFor(p.industry) }));

const MOCK_LINKS = [
  { source: 'me', target: 'kob' }, { source: 'me', target: 'mint' }, { source: 'kob', target: 'mint' },
  { source: 'boss', target: 'nan' }, { source: 'james', target: 'ploy' }, { source: 'film', target: 'aom' },
  { source: 'me', target: 'james' }, { source: 'boss', target: 'film' }, { source: 'me', target: 'boss' },
  { source: 'tae', target: 'james' }, { source: 'fern', target: 'arm' }, { source: 'nat', target: 'boss' },
  { source: 'kob', target: 'aom' }, { source: 'ploy', target: 'nan' },
];

/* ----------------------------------------------------------
   D3 force-directed graph — init ครั้งเดียวตอนเข้าฉาก connection-map
   ครั้งแรก (ต้องรอให้ scene แสดงผลก่อน ไม่งั้นวัดขนาด svg ได้ 0x0)
   ---------------------------------------------------------- */
let cmGraphInitialized = false;

function initConnectionMapGraph() {
  if (cmGraphInitialized) return;
  cmGraphInitialized = true;

  const wrap = document.querySelector('.cm-graph-wrap');
  const width = wrap.clientWidth || 300;
  const height = wrap.clientHeight || 500;

  const svg = d3.select('#cm-graph-svg').attr('viewBox', [0, 0, width, height]);
  const g = svg.append('g');

  svg.call(
    d3.zoom()
      // กันไม่ให้ zoom แย่งอีเวนต์ mousedown จากการลากตัวคน (d3.drag ผูกกับ .cm-node)
      .filter((event) => (!event.ctrlKey || event.type === 'wheel') && !event.button && !event.target.closest('.cm-node'))
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => g.attr('transform', event.transform))
  );
  svg.on('click', (event) => {
    if (event.target === svg.node()) {
      document.getElementById('cm-detail-sheet').classList.remove('is-open');
    }
  });

  const nodes = MOCK_PEOPLE.map((d) => ({ ...d }));
  const links = MOCK_LINKS.map((d) => ({ ...d }));

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id((d) => d.id).distance(65))
    .force('charge', d3.forceManyBody().strength(-150))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide(30));

  const link = g.append('g')
    .attr('stroke', 'rgba(33,64,125,0.28)')
    .attr('stroke-width', 1.5)
    .selectAll('line')
    .data(links)
    .join('line');

  function dragBehavior(sim) {
    return d3.drag()
      .on('start', (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null; d.fy = null;
      });
  }

  const node = g.append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('class', 'cm-node')
    .style('cursor', 'pointer')
    .call(dragBehavior(simulation))
    .on('click', (event, d) => {
      event.stopPropagation();
      showPersonDetail(d);
    });

  node.append('circle')
    .attr('r', (d) => (d.isMe ? 20 : 15))
    .attr('fill', (d) => d.color)
    .attr('stroke', '#FFFDF8')
    .attr('stroke-width', 2);

  node.append('text')
    .attr('class', 'cm-node-label')
    .attr('text-anchor', 'middle')
    .attr('dy', (d) => (d.isMe ? 20 : 15) + 12)
    .text((d) => d.name);

  simulation.on('tick', () => {
    link
      .attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
    node.attr('transform', (d) => `translate(${d.x},${d.y})`);
  });
}

function cmDemoEscapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function showPersonDetail(person) {
  const content = document.getElementById('cm-detail-content');
  content.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.65rem;">
      <div style="width:2.5rem;height:2.5rem;border-radius:50%;background:${person.color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-family:'Kanit',sans-serif;flex-shrink:0;">${cmDemoEscapeHtml(person.name.charAt(0))}</div>
      <div>
        <p style="font-weight:700;margin:0;font-family:'Kanit',sans-serif;color:#1B2130;">${cmDemoEscapeHtml(person.name)}${person.isMe ? ' (คุณ)' : ''}</p>
        <p style="font-size:0.72rem;color:rgba(27,33,48,0.5);margin:0;">${cmDemoEscapeHtml(person.industry)}</p>
      </div>
    </div>
    <p style="font-size:0.8rem;color:rgba(27,33,48,0.7);margin:0 0 0.5rem;">${cmDemoEscapeHtml(person.role)}</p>
    ${person.lookingFor ? `<p style="font-size:0.78rem;margin:0;"><b style="color:#EF4F98;">กำลังตามหา:</b> ${cmDemoEscapeHtml(person.lookingFor)}</p>` : ''}
  `;
  document.getElementById('cm-detail-sheet').classList.add('is-open');
}

/* ----------------------------------------------------------
   Sub-view toggle within the email scene (list vs. opened detail)
   ---------------------------------------------------------- */
function resetSubViews() {
  document.getElementById('mail-list-wrap').classList.remove('hidden');
  document.getElementById('mail-detail-wrap').classList.add('hidden');
}

function setFloatingSwitcher(mode) {
  const toEmail = document.getElementById('switch-to-email-btn');
  toEmail.classList.toggle('hidden', mode !== 'show-email-btn');
}

/* ----------------------------------------------------------
   Wire everything up
   ---------------------------------------------------------- */
function resetDemo() {
  resetSubViews();
  setFloatingSwitcher('none');
  document.getElementById('reg-fullname').value = 'สมชาย ใจดี';
  document.getElementById('reg-nickname').value = 'ชาย';
  document.getElementById('reg-phone').value = '0812345678';
  document.getElementById('reg-cm-consent').checked = true;
  document.getElementById('reg-cm-fields').classList.remove('hidden');
  document.getElementById('cm-login-email').value = 'somchai@example.com';
  document.getElementById('manage-change-password-panel').classList.add('hidden');
  showScene('register');
}

document.addEventListener('DOMContentLoaded', () => {
  showScene('register');

  document.getElementById('demo-reset-btn').addEventListener('click', resetDemo);

  document.getElementById('btn-go-register-success').addEventListener('click', () => {
    showScene('register-success');
    setFloatingSwitcher('show-email-btn');
  });

  // ติ๊ก/ยกเลิกยินยอมแสดงข้อมูลใน Connection Map ตอนลงทะเบียน — เหมือน register.html จริง
  document.getElementById('reg-cm-consent').addEventListener('change', (e) => {
    document.getElementById('reg-cm-fields').classList.toggle('hidden', !e.target.checked);
  });

  document.getElementById('switch-to-email-btn').addEventListener('click', () => {
    resetSubViews();
    showScene('email-inbox');
    setFloatingSwitcher('none');
  });

  document.getElementById('mail-list-item').addEventListener('click', () => {
    document.getElementById('mail-list-wrap').classList.add('hidden');
    document.getElementById('mail-detail-wrap').classList.remove('hidden');
  });

  document.getElementById('btn-mail-back').addEventListener('click', () => {
    document.getElementById('mail-detail-wrap').classList.add('hidden');
    document.getElementById('mail-list-wrap').classList.remove('hidden');
  });

  // เปิดลิงก์ "จัดการข้อมูลของฉัน" จากอีเมล → ครั้งแรกต้องตั้งรหัสผ่านก่อน
  document.getElementById('btn-open-manage-link').addEventListener('click', () => {
    showScene('manage-password-setup');
  });

  document.getElementById('btn-go-manage-edit').addEventListener('click', () => {
    showScene('manage-edit-form');
  });

  // toggle แผงเปลี่ยนรหัสผ่านในหน้าจัดการข้อมูล — เหมือน manage.html จริง
  document.getElementById('btn-toggle-change-password').addEventListener('click', () => {
    document.getElementById('manage-change-password-panel').classList.toggle('hidden');
  });

  document.getElementById('btn-go-cm-login').addEventListener('click', () => {
    showScene('connection-map-login');
  });

  // "แก้ไขโปรไฟล์ของฉัน" จากหน้า login และจาก topbar ของ Connection Map
  // ทั้งคู่พาไปหน้าจัดการข้อมูลเดียวกัน — ตรงกับฟีเจอร์จริง
  document.getElementById('btn-cm-login-edit-profile').addEventListener('click', () => {
    showScene('manage-edit-form');
  });
  document.getElementById('btn-cm-edit-profile').addEventListener('click', () => {
    showScene('manage-edit-form');
  });

  document.getElementById('btn-cm-logout').addEventListener('click', () => {
    showScene('connection-map-login');
  });

  document.getElementById('btn-cm-login-submit').addEventListener('click', () => {
    setFloatingSwitcher('none');
    showScene('authenticating');
    setTimeout(() => {
      showScene('connection-map');
      requestAnimationFrame(() => initConnectionMapGraph());
    }, 1100);
  });
});

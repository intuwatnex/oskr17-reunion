/* ==========================================================
   OSKR17th Anniversary — Time Machine OSKR 17
   Vanilla JS: config, countdown, scroll-reveal, timeline,
   gallery + lightbox, social links
   ========================================================== */

/* ----------------------------------------------------------
   CONFIG — แก้ไขค่าตรงนี้ที่เดียว ไม่ต้องแตะ logic ด้านล่าง
   ---------------------------------------------------------- */
const CONFIG = {
  // ชื่องานอย่างเป็นทางการ (จากโพสต์ IG @oskr17.official)
  eventName: 'สมานฉันท์ 17 คืนสู่เหย้า',

  // คำโปรยจากโปสเตอร์ประกาศ — สไตล์สมุดบันทึก
  quote: 'บางความทรงจำ… ไม่เคยหายไปไหน\nถึงเวลาย้อนกลับไปยังสถานที่ที่ทุกเรื่องราวเริ่มต้น แล้วพบกัน',

  // วันงาน: 17.10.2026 · Doors Open 5:30 PM (ตามโพสต์ประกาศล่าสุด)
  eventDate: '2026-10-17T17:30:00+07:00',

  // เขตเวลา Early Bird ตามโพสต์: 25.07.2026 – 08.08.2026 (ปิดเที่ยงคืน)
  earlyBirdDeadline: '2026-08-08T23:59:59+07:00',
  earlyBirdOpens: '2026-07-25T00:00:00+07:00',

  // ช่วง Regular ตามโพสต์: 09.08.2026 – 13.09.2026
  regularOpens: '2026-08-09T00:00:00+07:00',
  regularCloses: '2026-09-13T23:59:59+07:00',

  // ข้อความวันที่แบบอ่านง่าย แสดงใน section รายละเอียดงาน
  eventDateText: '17 ตุลาคม 2569 · เปิดประตู 17:30 น. (Doors Open 5:30 PM)',

  // สถานที่ + Dress code + ผู้สนับสนุน (จากโปสเตอร์ประกาศล่าสุด)
  venueName: 'โรงเรียนสวนกุหลาบวิทยาลัย รังสิต',
  venueDetail: 'ห้อง Grand Gala Rose อาคาร 2 ชั้น 4',
  dressCode: 'Own Your Style',
  presentedBy: 'Twins Café & Bistro',

  tickets: {
    earlyBird: {
      priceLabel: '1,177',
      giftSet: 'Full Gift Set',
      giftDetail: 'ของที่ระลึกครบชุด พร้อมของที่ผลิตพิเศษ (สั่งจองล่วงหน้า)',
      // TODO: ใส่ลิงก์ปลายทางจริงสำหรับสแกน QR / จองบัตร (Google Form / LINE OA / หน้าชำระเงิน)
      url: '#',
    },
    regular: {
      priceLabel: '1,717',
      giftSet: 'Standard Gift Set',
      giftDetail: 'ของที่ระลึกตามรายการที่มีในวันงาน (ไม่รวมของที่ต้องสั่งผลิตล่วงหน้า)',
      // TODO: ใส่ลิงก์ปลายทางจริงสำหรับสแกน QR / จองบัตร (Google Form / LINE OA / หน้าชำระเงิน)
      url: '#',
    },
    // โปรพิเศษ 50 ท่านแรกที่จองบัตร รับเพิ่ม Special Gift
    first50Bonus: 'พิเศษ! 50 ท่านแรกที่จองบัตร รับเพิ่ม Special Gift',
  },

  // ไฮไลต์ในงาน ตามโพสต์ IG
  highlights: [
    { emoji: '🎁', label: 'Exclusive Souvenir ทุกท่าน' },
    { emoji: '🎤', label: 'Live Concert' },
    { emoji: '📸', label: 'Photo Booth' },
    { emoji: '🎮', label: 'Games & Activities' },
    { emoji: '🍀', label: 'Lucky Draw' },
    { emoji: '🍽️', label: 'Dinner & Reunion' },
  ],

  hashtag: '#OSKR17thAnniversary',

  // ฟอร์มลงทะเบียน + แนบสลิป — ส่งเข้า Google Apps Script Web App
  // (บันทึกลง Google Sheet + เก็บไฟล์สลิปใน Drive อัตโนมัติ)
  // TODO: ใส่ URL ที่ได้จากการ Deploy ตาม google-apps-script/Code.gs
  registration: {
    webAppUrl: '', // เช่น 'https://script.google.com/macros/s/XXXXXXXX/exec'
    maxSlipSizeMB: 5,
    // TODO: ใส่ข้อมูลพร้อมเพย์จริง + รูป QR ที่ /assets/img/promptpay-qr.png
    promptPayId: 'TODO เบอร์/เลขบัญชีพร้อมเพย์',
    promptPayName: 'TODO ชื่อบัญชี',
    termsValue: 'ขอยืนยันว่าข้อมูลทั้งหมดถูกต้อง และยินยอมให้คณะผู้จัดเก็บ/แสดงข้อมูลเพื่อใช้ในการจัดงานตามวัตถุประสงค์',
    occupations: [
      'เจ้าของกิจการ / ผู้ประกอบการ',
      'ผู้บริหาร / ผู้จัดการ',
      'พนักงานบริษัทเอกชน',
      'รับราชการ',
      'พนักงานรัฐวิสาหกิจ',
      'บุคลากรทางการศึกษา',
      'บุคลากรทางการแพทย์และสาธารณสุข',
      'วิศวกรรมและเทคโนโลยี',
      'ก่อสร้างและสถาปัตยกรรม',
      'การเงิน บัญชี และธนาคาร',
      'กฎหมาย',
      'ขาย การตลาด และบริการลูกค้า',
      'ค้าขาย / ออนไลน์ / E-commerce',
      'อุตสาหกรรมและการผลิต',
      'เกษตรกรรม / ประมง / ปศุสัตว์',
      'โลจิสติกส์ ขนส่ง และคลังสินค้า',
      'ท่องเที่ยว โรงแรม และสายการบิน',
      'อาหารและเครื่องดื่ม',
      'ศิลปะ สื่อ และบันเทิง',
      'อื่นๆ',
    ],
  },

  social: [
    { name: 'Instagram', url: 'https://instagram.com/oskr17.official', icon: 'instagram' },
    { name: 'Facebook', url: '#', icon: 'facebook' }, // TODO: ใส่ลิงก์ Facebook เพจ
    { name: 'LINE OA', url: '#', icon: 'line' }, // TODO: ใส่ลิงก์ LINE Official Account
  ],

  // เส้นเวลา — แก้ไขปี/คำโปรยได้อิสระ (เรียงจากอดีต → ปัจจุบัน → วันงาน)
  timeline: [
    {
      year: '2552 (2009)',
      title: 'เข้าเรียนสวนกุหลาบฯ รังสิต',
      text: 'จุดเริ่มต้นการเดินทางสู่ดินแดนชมพู-ฟ้า แห่งคลอง 4 วันแรกที่แอบตื่นเต้นและภูมิใจลึก ๆ ในชุดนักเรียน ส.ก.ร. ใหม่เอี่ยม ยังจำวันแรกในค่ายเสด็จพ่อ ร.5 ได้ไหม? จากเด็ก ม.1 และ ม.4 ที่ยังไม่รู้จักใคร สู่การยืนฝึกร้องเพลงสถาบันร่วมกันเป็นครั้งแรก นั่นคือจุดสตาร์ทของมิตรภาพอันยาวนาน ภายใต้คำสอน "สุวิชาโน ภวํ โหติ" ที่ผูกพันพวกเราตั้งแต่วันแรกจนถึงวันนี้',
    },
    {
      year: '2552–2557',
      title: 'ช่วงเวลาในรั้วโรงเรียน',
      text: 'ที่ประจำ คนสำคัญ และเรื่องราวในความทรงจำ',
      children: [
        {
          title: 'พิกัดที่คิดถึงและไอเทมในตำนาน',
          text: 'โต๊ะหินอ่อนข้าง ตึกสิรินธร 1 (ตึก 9 ชั้น) ที่พวกเราชอบไปนั่งพักผ่อน, มุมสงบแอร์เย็น ๆ ในห้องสมุดตึก 3 และที่ขาดไม่ได้คือการพก "บัตรแลกอาหารกลางวันสุดเท่" ไปต่อแถวซื้อของกินที่โรงอาหาร',
        },
        {
          title: 'อาจารย์ที่เคารพและรัก',
          text: 'นึกถึงคุณครูทุกท่านที่คอยดูแลและอบรมสั่งสอน ยืนดักตรวจระเบียบเครื่องแต่งกายที่ประตูโรงเรียนทุกเช้า ความเข้มงวดในวันนั้นกลายเป็นความทรงจำที่อบอุ่นและน่าระลึกถึงในวันนี้',
        },
        {
          title: 'หน้าบันทึกบนโลกโซเชียล',
          text: 'ยุคที่พวกเราเล่น BlackBerry แล้วค่อย ๆ เปลี่ยนมาใช้ iPhone 4 ยุคที่เริ่มเปิด Facebook อัปสเตตัสเรื่องเรียนดนตรีไทย ไปจนถึงโมเมนต์นั่งล้อมวงดีดกีตาร์ร้องเพลงกันช่วงพักกลางวัน',
        },
        {
          title: 'การรวมใจสู่ "รุ่นสมานฉันทร์" (2552)',
          text: 'บันทึกหน้าสำคัญในช่วงเวลาที่คาบเกี่ยวกับการยึดอำนาจของ คสช. ภายในรั้วโรงเรียนเกิดเหตุการณ์เรียกร้องความถูกต้องจนนำไปสู่การรวมตัวครั้งใหญ่ แต่ด้วยสติ การหันหน้ามาพูดคุยกันด้วยเหตุผลของทุกฝ่าย จึงกลายเป็นที่มาของชื่อ "รุ่นสมานฉันทร์" ที่แสดงถึงความสามัคคีอันบริสุทธิ์ของพวกเรา',
        },
        {
          title: 'วิกฤตน้ำท่วมใหญ่ (2554)',
          text: 'ช่วง ม.3 ที่พวกเราต้องเผชิญกับมหาอุทกภัยที่เปลี่ยนคลอง 4 ให้กลายเป็นพื้นที่ประสบภัย โรงเรียนต้องเลื่อนเปิดเทอมยาวและเรียนชดเชยกันอย่างทรหด แต่วิกฤตครั้งนั้นกลับหล่อหลอมให้คำว่า "เพื่อน" แน่นแฟ้นและมีความหมายที่สุด',
        },
      ],
    },
    {
      year: '2557 (2014)',
      title: 'สำเร็จการศึกษา',
      text: 'วันสุดท้ายในชุดนักเรียน ส.ก.ร. กับบรรยากาศงานปัจฉิมนิเทศสุดซึ้งที่ทำเอาหลายคนแอบน้ำตาซึม กอดคอร้องเพลงอำลาสถาบันร่วมกัน ยืนส่งยิ้มให้กันพร้อมรอยปากกาเมจิกที่เขียนคำอวยพรไว้เต็มเสื้อเฟรนด์ชิพ ก้าวออกจากรั้วโรงเรียนด้วยความภาคภูมิใจ แยกย้ายกันไปเติบโตและตามหาความฝันในเส้นทางของตัวเอง',
    },
    { year: 'วันนี้', title: 'ผ่านมา 17 ปี', text: 'แต่ละคนแยกย้ายไปตามเส้นทางของตัวเอง แต่ความทรงจำยังคงอยู่', active: true },
    { year: 'Reunion · 17.10.2026', title: 'วาร์ปกลับมาเจอกัน', text: 'OSKR17th Anniversary — ย้อนเวลา กลับมาเจอกันอีกครั้ง วันที่ 17 ตุลาคม 2569' },
  ],

  // แกลเลอรี — ใส่ path รูปจริงแทน placeholder ได้เลย (เช่น 'assets/img/gallery/01.jpg')
  gallery: [
    { src: '', alt: 'ภาพความทรงจำ 1' },
    { src: '', alt: 'ภาพความทรงจำ 2' },
    { src: '', alt: 'ภาพความทรงจำ 3' },
    { src: '', alt: 'ภาพความทรงจำ 4' },
    { src: '', alt: 'ภาพความทรงจำ 5' },
    { src: '', alt: 'ภาพความทรงจำ 6' },
    { src: '', alt: 'ภาพความทรงจำ 7' },
    { src: '', alt: 'ภาพความทรงจำ 8' },
  ],
};

/* ----------------------------------------------------------
   Icons (inline SVG paths, minimal set)
   ---------------------------------------------------------- */
const SOCIAL_ICONS = {
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-5 h-5"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v6h3v-6h3l1-3h-4v-2c0-.6.4-1 1-1z"/></svg>',
  line: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-5 h-5"><rect x="3" y="4" width="18" height="14" rx="4"/><path d="M7 10v4M11 10v4M11 10l3 4v-4M17 10h-2.5v4H17M14.5 12H16"/></svg>',
};

/* ----------------------------------------------------------
   Countdown
   ---------------------------------------------------------- */
function startCountdown(targetDateISO, containerEl, onExpire) {
  const target = new Date(targetDateISO).getTime();

  function tick() {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      containerEl.querySelectorAll('.dial-num').forEach((el) => (el.textContent = '00'));
      if (onExpire) onExpire();
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const pad = (n) => String(n).padStart(2, '0');

    containerEl.querySelector('[data-unit="days"]').textContent = pad(days);
    containerEl.querySelector('[data-unit="hours"]').textContent = pad(hours);
    containerEl.querySelector('[data-unit="minutes"]').textContent = pad(minutes);
    containerEl.querySelector('[data-unit="seconds"]').textContent = pad(seconds);

    requestAnimationFrame(() => setTimeout(tick, 1000));
  }

  tick();
}

function initCountdowns() {
  const mainEl = document.getElementById('countdown-main');
  if (mainEl) startCountdown(CONFIG.eventDate, mainEl);

  const ebEl = document.getElementById('countdown-earlybird');
  if (ebEl) startCountdown(CONFIG.earlyBirdDeadline, ebEl, handleEarlyBirdExpired);

  // เช็คตอนโหลดหน้าเลยด้วย เผื่อหมดเขตไปแล้ว
  if (Date.now() > new Date(CONFIG.earlyBirdDeadline).getTime()) {
    handleEarlyBirdExpired();
  }
}

function handleEarlyBirdExpired() {
  const card = document.getElementById('ticket-earlybird');
  const status = document.getElementById('earlybird-status');
  const btn = document.getElementById('btn-earlybird');
  const priceEB = document.getElementById('price-earlybird');
  if (!card || !btn) return;

  card.classList.add('is-disabled');
  if (priceEB && priceEB.parentElement) priceEB.parentElement.style.display = 'none';
  if (status) status.textContent = `หมดเขต ${CONFIG.tickets.earlyBird.giftSet} แล้ว`;
  btn.textContent = 'หมดเขต Early Bird แล้ว';
  btn.disabled = true;
  btn.setAttribute('aria-disabled', 'true');
}

/* ----------------------------------------------------------
   Tickets — เติมราคา/ของที่ระลึก/ลิงก์จาก CONFIG
   ---------------------------------------------------------- */
function initTickets() {
  const priceEB = document.getElementById('price-earlybird');
  const priceReg = document.getElementById('price-regular');
  const btnEB = document.getElementById('btn-earlybird');
  const btnReg = document.getElementById('btn-regular');
  const giftEB = document.getElementById('gift-earlybird');
  const giftReg = document.getElementById('gift-regular');
  const bonusEl = document.getElementById('ticket-bonus-note');

  if (priceEB) priceEB.textContent = CONFIG.tickets.earlyBird.priceLabel;
  if (priceReg) priceReg.textContent = CONFIG.tickets.regular.priceLabel;
  if (btnEB) btnEB.addEventListener('click', () => openRegisterModal('Early Bird'));
  if (btnReg) btnReg.addEventListener('click', () => openRegisterModal('Regular'));
  if (giftEB) giftEB.textContent = `🎁 ${CONFIG.tickets.earlyBird.giftSet} — ${CONFIG.tickets.earlyBird.giftDetail}`;
  if (giftReg) giftReg.textContent = `🎁 ${CONFIG.tickets.regular.giftSet} — ${CONFIG.tickets.regular.giftDetail}`;
  if (bonusEl) bonusEl.textContent = CONFIG.tickets.first50Bonus;
}

/* ----------------------------------------------------------
   Registration modal — ส่งข้อมูลตรงเข้า Google Form
   ---------------------------------------------------------- */
function populateOccupationOptions() {
  const select = document.getElementById('reg-occupation');
  if (!select) return;

  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = '— เลือกสายอาชีพ —';
  select.appendChild(blank);

  CONFIG.registration.occupations.forEach((label) => {
    const opt = document.createElement('option');
    opt.value = label;
    opt.textContent = label;
    select.appendChild(opt);
  });
}

function handleAllergyToggle() {
  const detailInput = document.getElementById('reg-allergy-detail');
  const checked = document.querySelector('input[name="allergy"]:checked');
  if (!detailInput || !checked) return;

  const isOther = checked.value === 'other';
  detailInput.disabled = !isOther;
  if (!isOther) detailInput.value = '';
  else detailInput.focus();
}

// เก็บสลิปที่แปลงเป็น base64 ไว้ระหว่างกรอกฟอร์ม (ล้างทุกครั้งที่เปิด/ปิด modal)
let selectedSlipBase64 = null;
let selectedSlipMimeType = null;

function getTicketPrice(ticketType) {
  const key = ticketType === 'Early Bird' ? 'earlyBird' : 'regular';
  return CONFIG.tickets[key]?.priceLabel || '0';
}

function openRegisterModal(ticketType) {
  const modal = document.getElementById('register-modal');
  const form = document.getElementById('register-form');
  if (!modal || !form) return;

  document.getElementById('register-ticket-type').textContent = ticketType;
  document.getElementById('reg-payment-amount').textContent = getTicketPrice(ticketType);
  document.getElementById('register-form-view').classList.remove('hidden');
  document.getElementById('register-success-view').classList.add('hidden');
  document.getElementById('register-error').classList.add('hidden');

  form.reset();
  form.dataset.ticketType = ticketType;
  const allergyDetail = document.getElementById('reg-allergy-detail');
  if (allergyDetail) allergyDetail.disabled = true;

  selectedSlipBase64 = null;
  selectedSlipMimeType = null;
  const slipPreview = document.getElementById('reg-slip-preview');
  const slipError = document.getElementById('reg-slip-error');
  if (slipPreview) { slipPreview.classList.add('hidden'); slipPreview.src = ''; }
  if (slipError) slipError.classList.add('hidden');

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeRegisterModal() {
  const modal = document.getElementById('register-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  const preview = document.getElementById('reg-slip-preview');
  const errorEl = document.getElementById('reg-slip-error');

  selectedSlipBase64 = null;
  selectedSlipMimeType = null;
  preview.classList.add('hidden');
  errorEl.classList.add('hidden');

  if (!file) return;

  if (!file.type.startsWith('image/')) {
    errorEl.textContent = 'กรุณาแนบไฟล์รูปภาพเท่านั้น';
    errorEl.classList.remove('hidden');
    event.target.value = '';
    return;
  }

  const maxBytes = CONFIG.registration.maxSlipSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    errorEl.textContent = `ไฟล์ใหญ่เกินไป (ไม่เกิน ${CONFIG.registration.maxSlipSizeMB}MB)`;
    errorEl.classList.remove('hidden');
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    selectedSlipBase64 = reader.result;
    selectedSlipMimeType = file.type;
    preview.src = reader.result;
    preview.classList.remove('hidden');
  };
  reader.onerror = () => {
    errorEl.textContent = 'อ่านไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
    errorEl.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function validateRegisterForm() {
  const name = document.getElementById('reg-name').value.trim();
  const nickname = document.getElementById('reg-nickname').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const lineId = document.getElementById('reg-line').value.trim();
  const terms = document.getElementById('reg-terms').checked;
  const phonePattern = /^0[0-9]{9}$/;

  if (!name) return 'กรุณากรอกชื่อ-นามสกุล';
  if (!nickname) return 'กรุณากรอกชื่อเล่น';
  if (!phonePattern.test(phone)) return 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก ขึ้นต้นด้วย 0)';
  if (!lineId) return 'กรุณากรอก LINE ID';
  if (!selectedSlipBase64) return 'กรุณาแนบสลิปโอนเงิน';
  if (!terms) return 'กรุณากดยอมรับเงื่อนไขก่อนลงทะเบียน';
  return null;
}

function showRegisterSuccess(ticketType) {
  document.getElementById('register-form-view').classList.add('hidden');
  document.getElementById('register-success-view').classList.remove('hidden');
  document.getElementById('register-success-type').textContent = ticketType;
}

async function submitRegistration(event) {
  event.preventDefault();
  const errorEl = document.getElementById('register-error');
  const submitBtn = document.getElementById('register-submit-btn');
  errorEl.classList.add('hidden');

  if (!CONFIG.registration.webAppUrl) {
    errorEl.textContent = 'ระบบยังไม่พร้อมรับลงทะเบียน (ยังไม่ได้ตั้งค่า Web App URL) กรุณาติดต่อทีมงานโดยตรงทาง LINE';
    errorEl.classList.remove('hidden');
    return;
  }

  const validationError = validateRegisterForm();
  if (validationError) {
    errorEl.textContent = validationError;
    errorEl.classList.remove('hidden');
    return;
  }

  const form = document.getElementById('register-form');
  const ticketType = form.dataset.ticketType || '';
  const allergyChoice = document.querySelector('input[name="allergy"]:checked').value;
  const allergyDetail = document.getElementById('reg-allergy-detail').value.trim();

  const payload = {
    ticketType,
    price: getTicketPrice(ticketType),
    name: document.getElementById('reg-name').value.trim(),
    nickname: document.getElementById('reg-nickname').value.trim(),
    phone: document.getElementById('reg-phone').value.trim(),
    lineId: document.getElementById('reg-line').value.trim(),
    allergy: allergyChoice === 'none' ? 'ไม่มี' : allergyDetail,
    occupation: document.getElementById('reg-occupation').value,
    detail: document.getElementById('reg-detail').value.trim(),
    slipBase64: selectedSlipBase64,
    slipMimeType: selectedSlipMimeType,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'กำลังส่งข้อมูล...';

  try {
    // ไม่ตั้ง Content-Type เอง เพื่อเลี่ยง CORS preflight — Apps Script อ่าน
    // e.postData.contents ได้โดยไม่สนใจ header ที่ประกาศมา
    const res = await fetch(CONFIG.registration.webAppUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (result.result !== 'success') throw new Error(result.message || 'unknown error');
    showRegisterSuccess(ticketType);
  } catch (err) {
    errorEl.textContent = 'ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือติดต่อทีมงานโดยตรงทาง LINE';
    errorEl.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'ลงทะเบียน';
  }
}

function initRegisterModal() {
  populateOccupationOptions();

  document.querySelectorAll('input[name="allergy"]').forEach((radio) => {
    radio.addEventListener('change', handleAllergyToggle);
  });

  const form = document.getElementById('register-form');
  if (form) form.addEventListener('submit', submitRegistration);

  document.getElementById('reg-slip')?.addEventListener('change', handleFileUpload);

  document.getElementById('register-modal-close')?.addEventListener('click', closeRegisterModal);
  document.getElementById('register-close-success')?.addEventListener('click', closeRegisterModal);
  document.getElementById('register-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'register-modal') closeRegisterModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeRegisterModal();
  });
}

/* ----------------------------------------------------------
   Event details text + hashtag + footer year
   ---------------------------------------------------------- */
function initMisc() {
  const dateTextEl = document.getElementById('event-datetext');
  if (dateTextEl) dateTextEl.textContent = CONFIG.eventDateText;

  const venueEl = document.getElementById('event-venue');
  if (venueEl) venueEl.innerHTML = `${CONFIG.venueName}<br>${CONFIG.venueDetail}`;

  const dressFullEl = document.getElementById('event-dresscode-full');
  if (dressFullEl) dressFullEl.textContent = CONFIG.dressCode;

  const ppIdEl = document.getElementById('reg-promptpay-id');
  if (ppIdEl) ppIdEl.textContent = CONFIG.registration.promptPayId;
  const ppNameEl = document.getElementById('reg-promptpay-name');
  if (ppNameEl) ppNameEl.textContent = CONFIG.registration.promptPayName;

  const heroPresentedEl = document.getElementById('hero-presented');
  if (heroPresentedEl) heroPresentedEl.textContent = `Presented by ${CONFIG.presentedBy}`;

  const heroDressEl = document.getElementById('hero-dresscode');
  if (heroDressEl) heroDressEl.textContent = `Dress Code: ${CONFIG.dressCode}`;

  const heroQuoteEl = document.getElementById('hero-quote');
  if (heroQuoteEl) heroQuoteEl.textContent = CONFIG.quote;

  const footerPresentedEl = document.getElementById('footer-presented');
  if (footerPresentedEl) footerPresentedEl.textContent = `Presented by ${CONFIG.presentedBy}`;

  document.querySelectorAll('#btn-instagram-more').forEach((el) => {
    const ig = CONFIG.social.find((s) => s.icon === 'instagram');
    if (ig) el.href = ig.url;
  });

  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // hero dial ticks (decorative, generated once)
  const ticksGroup = document.getElementById('ticks');
  if (ticksGroup) {
    let svg = '';
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * 360;
      svg += `<line x1="100" y1="10" x2="100" y2="${i % 6 === 0 ? 20 : 16}" transform="rotate(${angle} 100 100)" />`;
    }
    ticksGroup.innerHTML = svg;
  }
}

/* ----------------------------------------------------------
   Event highlights (pills)
   ---------------------------------------------------------- */
function renderHighlights() {
  const el = document.getElementById('highlights-list');
  if (!el) return;

  el.innerHTML = CONFIG.highlights
    .map(
      (h, i) => `
      <div class="highlight-chip" style="animation-delay: ${i * 0.15}s">
        <span class="highlight-emoji" style="animation-delay: ${i * 0.2}s">${h.emoji}</span>
        <span class="text-xs sm:text-sm font-medium text-ink/70 text-center">${h.label}</span>
      </div>`
    )
    .join('');
}

/* ----------------------------------------------------------
   Timeline render
   ---------------------------------------------------------- */
function renderTimeline() {
  const el = document.getElementById('timeline');
  if (!el) return;

  el.innerHTML = CONFIG.timeline
    .map((item) => {
      const children = Array.isArray(item.children) && item.children.length
        ? `<div class="mt-6 space-y-6 border-l-2 border-blue/20 pl-6">
            ${item.children
              .map(
                (child) => `
              <div class="relative">
                <span class="absolute -left-[26px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue/40"></span>
                <h4 class="font-display font-semibold text-base sm:text-lg mb-1">${child.title}</h4>
                <p class="text-ink/60 text-sm sm:text-base leading-relaxed max-w-xl">${child.text}</p>
              </div>`
              )
              .join('')}
          </div>`
        : '';

      return `
      <li class="timeline-item relative reveal ${item.active ? 'is-active' : ''}" data-reveal>
        <p class="text-pink text-xs tracking-widest uppercase mb-1">${item.year}</p>
        <h3 class="font-display font-semibold text-lg sm:text-xl mb-2">${item.title}</h3>
        <p class="text-ink/60 text-sm sm:text-base leading-relaxed max-w-xl">${item.text}</p>
        ${children}
      </li>`;
    })
    .join('');
}

/* ----------------------------------------------------------
   Gallery + Lightbox
   ---------------------------------------------------------- */
function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  grid.innerHTML = CONFIG.gallery
    .map(
      (img, i) => `
      <button type="button" class="gallery-item reveal" data-reveal data-index="${i}" aria-label="เปิดดูภาพ ${img.alt}">
        ${
          img.src
            ? `<img src="${img.src}" alt="${img.alt}" loading="lazy">`
            : `<span class="gallery-placeholder-label">${img.alt}<br>TODO: ใส่รูปจริง</span>`
        }
      </button>`
    )
    .join('');

  grid.querySelectorAll('.gallery-item').forEach((btn) => {
    btn.addEventListener('click', () => openLightbox(Number(btn.dataset.index)));
  });
}

function openLightbox(index) {
  const lightbox = document.getElementById('lightbox');
  const content = document.getElementById('lightbox-content');
  const img = CONFIG.gallery[index];
  if (!lightbox || !content) return;

  content.innerHTML = img.src
    ? `<img src="${img.src}" alt="${img.alt}" class="w-full h-full object-contain">`
    : `<div class="w-full h-full flex items-center justify-center gallery-item"><span class="gallery-placeholder-label text-sm">${img.alt}<br>TODO: ใส่รูปจริง</span></div>`;

  lightbox.classList.remove('hidden');
  lightbox.classList.add('flex');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  lightbox.classList.add('hidden');
  lightbox.classList.remove('flex');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function initLightbox() {
  document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox')?.addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

/* ----------------------------------------------------------
   Social links render
   ---------------------------------------------------------- */
function renderSocial() {
  const el = document.getElementById('social-links');
  if (!el) return;

  el.innerHTML = CONFIG.social
    .map(
      (s) => `
      <a href="${s.url}" target="_blank" rel="noopener" class="social-icon" aria-label="${s.name}" title="${s.name}">
        ${SOCIAL_ICONS[s.icon] || ''}
      </a>`
    )
    .join('');
}

/* ----------------------------------------------------------
   Scroll reveal (IntersectionObserver)
   ---------------------------------------------------------- */
function initScrollReveal() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('[data-reveal]');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((el) => observer.observe(el));
}

/* ----------------------------------------------------------
   Nav show/hide on scroll
   ---------------------------------------------------------- */
function initNav() {
  const nav = document.getElementById('site-nav');
  if (!nav) return;

  window.addEventListener(
    'scroll',
    () => {
      if (window.scrollY > window.innerHeight * 0.6) {
        nav.classList.remove('-translate-y-full');
      } else {
        nav.classList.add('-translate-y-full');
      }
    },
    { passive: true }
  );
}

/* ----------------------------------------------------------
   Init
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initMisc();
  initTickets();
  initCountdowns();
  renderHighlights();
  renderTimeline();
  renderGallery();
  renderSocial();
  initLightbox();
  initRegisterModal();
  initNav();
  // re-run reveal init after dynamic content is in the DOM
  initScrollReveal();
});

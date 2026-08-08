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

  // วันงาน: 17.10.2026 — โพสต์ IG ไม่ได้ระบุเวลา
  // TODO: ใส่เวลาจัดงานจริงแทน 17:00 (ตอนนี้เป็นค่าตั้งต้นชั่วคราว)
  eventDate: '2026-10-17T17:00:00+07:00',

  // เขตเวลา Early Bird ตามโพสต์: 25.07.2026 – 08.08.2026 (ปิดเที่ยงคืน)
  earlyBirdDeadline: '2026-08-08T23:59:59+07:00',
  earlyBirdOpens: '2026-07-25T00:00:00+07:00',

  // ช่วง Regular ตามโพสต์: 09.08.2026 – 13.09.2026
  regularOpens: '2026-08-09T00:00:00+07:00',
  regularCloses: '2026-09-13T23:59:59+07:00',

  // ข้อความวันที่แบบอ่านง่าย แสดงใน section รายละเอียดงาน
  eventDateText: '17 ตุลาคม 2569 (17.10.2026)',

  // ราคาเดียว 1,177 บาท ทั้งสองช่วง — ต่างกันที่ "ของที่ระลึก" ไม่ใช่ราคา
  tickets: {
    earlyBird: {
      price: 1177,
      giftSet: 'Full Gift Set',
      giftDetail: 'ของที่ระลึกครบชุด พร้อมของที่ผลิตพิเศษ (สั่งจองล่วงหน้า)',
      // TODO: ใส่ลิงก์ปลายทางจริงสำหรับสแกน QR / จองบัตร (Google Form / LINE OA / หน้าชำระเงิน)
      url: '#',
    },
    regular: {
      price: 1177,
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
    'Exclusive Souvenirs',
    'Live Concert',
    'Photo Booth',
    'Games & Activities',
    'Lucky Draw',
    'Dinner & Reunion',
  ],

  hashtag: '#OSKR17thAnniversary',

  social: [
    { name: 'Instagram', url: 'https://instagram.com/oskr17.official', icon: 'instagram' },
    { name: 'Facebook', url: '#', icon: 'facebook' }, // TODO: ใส่ลิงก์ Facebook เพจ
    { name: 'LINE OA', url: '#', icon: 'line' }, // TODO: ใส่ลิงก์ LINE Official Account
  ],

  // เส้นเวลา — แก้ไขปี/คำโปรยได้อิสระ (เรียงจากอดีต → ปัจจุบัน → วันงาน)
  timeline: [
    { year: 'TODO', title: 'เข้าเรียนสวนกุหลาบฯ รังสิต', text: 'TODO: ใส่ปีที่เข้าเรียน และคำโปรยความทรงจำแรกเริ่ม' },
    { year: 'TODO', title: 'ช่วงเวลาในรั้วโรงเรียน', text: 'TODO: ใส่เหตุการณ์/ความทรงจำสำคัญระหว่างเรียน' },
    { year: 'TODO', title: 'สำเร็จการศึกษา', text: 'TODO: ใส่ปีที่จบการศึกษา' },
    { year: 'วันนี้', title: 'ผ่านมา 17 ปี', text: 'แต่ละคนแยกย้ายไปตามเส้นทางของตัวเอง แต่ความทรงจำยังคงอยู่', active: true },
    { year: 'Reunion', title: 'วาร์ปกลับมาเจอกัน', text: 'OSKR17th Anniversary — ย้อนเวลา กลับมาเจอกันอีกครั้ง' },
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
  if (!card || !btn) return;

  card.classList.add('is-disabled');
  if (status) status.textContent = `หมดเขต ${CONFIG.tickets.earlyBird.giftSet} แล้ว`;
  btn.textContent = 'หมดเขต Early Bird แล้ว';
  btn.removeAttribute('href');
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

  if (priceEB) priceEB.textContent = CONFIG.tickets.earlyBird.price.toLocaleString('th-TH');
  if (priceReg) priceReg.textContent = CONFIG.tickets.regular.price.toLocaleString('th-TH');
  if (btnEB) btnEB.href = CONFIG.tickets.earlyBird.url;
  if (btnReg) btnReg.href = CONFIG.tickets.regular.url;
  if (giftEB) giftEB.textContent = `🎁 ${CONFIG.tickets.earlyBird.giftSet} — ${CONFIG.tickets.earlyBird.giftDetail}`;
  if (giftReg) giftReg.textContent = `🎁 ${CONFIG.tickets.regular.giftSet} — ${CONFIG.tickets.regular.giftDetail}`;
  if (bonusEl) bonusEl.textContent = CONFIG.tickets.first50Bonus;
}

/* ----------------------------------------------------------
   Event details text + hashtag + footer year
   ---------------------------------------------------------- */
function initMisc() {
  const dateTextEl = document.getElementById('event-datetext');
  if (dateTextEl) dateTextEl.textContent = CONFIG.eventDateText;

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
      (h) => `<span class="font-mono text-xs tracking-wide border border-blue/25 text-ink/70 px-4 py-1.5 rounded-full">${h}</span>`
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
    .map(
      (item) => `
      <li class="timeline-item relative reveal ${item.active ? 'is-active' : ''}" data-reveal>
        <p class="font-mono text-pink text-xs tracking-widest uppercase mb-1">${item.year}</p>
        <h3 class="font-display font-semibold text-lg sm:text-xl mb-2">${item.title}</h3>
        <p class="text-ink/60 text-sm sm:text-base leading-relaxed max-w-xl">${item.text}</p>
      </li>`
    )
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
  initNav();
  // re-run reveal init after dynamic content is in the DOM
  initScrollReveal();
});

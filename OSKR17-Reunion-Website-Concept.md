# OSKR17th Anniversary — เว็บไซต์รวมรุ่น
## Concept: "TIME MACHINE OSKR 17"

---

## 1. แนวคิดหลัก (Design Direction)

**ธีม:** เครื่องย้อนเวลา (Time Machine) — เว็บทำหน้าที่เป็น "หน้าปัดเครื่องย้อนเวลา" ที่พารุ่นพี่รุ่นน้อง OSKR17 กลับไปยังวันวานที่สวนกุหลาบฯ รังสิต แล้ววาร์ปกลับมาเจอกันในงาน reunion

**โทนภาพ:** ทันสมัย + มินิมอล ไม่ใช่ sci-fi จ๋าแบบการ์ตูน แต่เป็น "retro-futurism" แบบเรียบหรู — คิดถึงหน้าปัดนาฬิกา/มาตรวัดเครื่องจักรเก่า ผสมกับ UI ยุคใหม่

**Token ที่แนะนำ (ปรับได้ตามสีโรงเรียนจริง):**
- พื้นหลังหลัก: `#0B0E14` (กรมท่าเข้มเกือบดำ — เหมือนอวกาศ/ห้องเครื่องยนต์เวลา)
- สีทอง-ทองแดงเก่า (dial gold): `#C9A24B`
- สีขาวนวล (ตัวหนังสือหลัก): `#F4F1EA`
- สีเน้น (พลังงานเครื่องเวลา): เขียวมรกตอมฟ้า `#3FBF9F` หรือแดงอิฐ ใช้เพียงจุดเดียวเป็น accent
- ตัวอักษร: display face แบบ geometric/monospace เล็กน้อยให้ความรู้สึก "เครื่องมือวัด" (เช่น Space Grotesk, JetBrains Mono สำหรับตัวเลข/นับถอยหลัง) + ตัวอักษรไทยอ่านง่าย (Noto Sans Thai / IBM Plex Sans Thai) สำหรับเนื้อหา

**Signature element:** วงแหวนนาฬิกา/พอร์ทัลเวลา ล้อมรอบรูปโปรไฟล์จาก IG เป็นวงกลม พร้อมขีด scale แบบมาตรวัด และเข็มที่หมุนช้าๆ ใช้ทั้งเป็นโลโก้เว็บ และเป็นแกนกลางของหน้า Hero

---

## 2. โครงสร้างหน้าเว็บ (Single Page, Scroll-based)

### Section 1 — Hero / Portal
- โลโก้วงแหวนเวลา (จากรูปโปรไฟล์ IG @oskr17.official) อยู่กลางจอ พร้อม glow บางๆ
- หัวข้อใหญ่: **OSKR17th ANNIVERSARY**
- แท็กไลน์: เช่น "ย้อนเวลา กลับมาเจอกันอีกครั้ง"
- Countdown timer แบบมาตรวัด นับถอยหลังสู่วันงาน
- ปุ่ม CTA: "จองบัตรเข้างาน" เลื่อนไปยัง section บัตร
- Hashtag `#OSKR17thAnniversary` เล็กๆ มุมล่าง

### Section 2 — Time Machine Journey (เรื่องราว/ไทม์ไลน์)
- เส้นเวลาแนวตั้ง scroll-reveal จากปีที่เข้าเรียน → ปัจจุบัน → วันงาน
- แต่ละจุดมีปี + คำโปรย/ภาพเล็กประกอบ (ใช้จริงหรือ placeholder ก่อนได้)

### Section 3 — รายละเอียดงาน (Event Details)
- การ์ดข้อมูล: วัน-เวลา, สถานที่จัดงาน, การเดินทาง
- Embed Google Map
- Dress code (ถ้ามี)

### Section 4 — บัตรเข้างาน (Tickets)
- การ์ด 2 ใบ: **Early Bird** vs **Regular**
- แสดงราคาแต่ละแบบชัดเจน
- Countdown แยกของ Early Bird ("เหลือเวลาอีก...") — เมื่อหมดเวลา ปุ่มซื้อ Early Bird จะ disable อัตโนมัติ + ข้อความ "หมดเขตแล้ว" และสลับไปแสดงเฉพาะราคา Regular
- ปุ่มลิงก์ไปหน้าชำระเงิน/ฟอร์มลงทะเบียนจริง (เช่น Google Form, LINE OA, หรือระบบชำระเงิน)

### Section 5 — Gallery (รูปและวิดีโอ)
- Masonry/grid gallery รูปภาพ พร้อม lightbox (คลิกขยาย)
- พื้นที่ embed วิดีโอโปรโมท (YouTube link หรือ IG Reels embed)
- ปุ่ม "ดูเพิ่มเติมบน Instagram" ลิงก์ไป @oskr17.official

### Section 6 — Social & Contact Hub
- ไอคอนลิงก์ไป Instagram, Facebook, LINE OA ฯลฯ (แบบ "link-in-bio" รวมไว้ในเว็บเดียว)
- ช่องทางติดต่อคณะกรรมการจัดงาน

### Footer
- โลโก้เล็ก + hashtag + ปีการศึกษา + "สวนกุหลาบวิทยาลัย รังสิต รุ่นที่ 17"

---

## 3. Prompt สำหรับสั่ง Claude Code (คัดลอกไปใช้ได้เลย)

```
สร้างเว็บไซต์ single-page สำหรับงาน reunion "OSKR17th Anniversary" 
(สวนกุหลาบวิทยาลัย รังสิต รุ่นที่ 17) ธีม "Time Machine OSKR 17"

TECH STACK:
- HTML + Tailwind CSS + JavaScript (vanilla หรือใช้ Framer Motion ผ่าน CDN ถ้าจำเป็น)
- Responsive เต็มรูปแบบ (mobile-first เพราะคนส่วนใหญ่จะเปิดจากมือถือ/IG)
- Deploy ง่าย ๆ ได้บน Vercel/Netlify (static site)

DESIGN DIRECTION:
- โทนสี: พื้นหลังกรมท่าเข้มเกือบดำ (#0B0E14), ทอง (#C9A24B), 
  ขาวนวล (#F4F1EA), accent เขียวมรกต-ฟ้า (#3FBF9F)
- ฟอนต์: Space Grotesk หรือ Sora สำหรับหัวข้อ/ตัวเลข, 
  IBM Plex Sans Thai หรือ Noto Sans Thai สำหรับเนื้อหาไทย
- คอนเซปต์ภาพ: เครื่องย้อนเวลา/พอร์ทัลเวลา มินิมอล ทันสมัย ไม่ใช่ sci-fi การ์ตูน
- Signature: วงแหวนนาฬิกา/มาตรวัดเวลา ล้อมรอบรูปโปรไฟล์ (ใช้ placeholder image 
  ตำแหน่ง /assets/profile.jpg ที่ผมจะเอารูปจาก IG @oskr17.official มาใส่เอง) 
  ใช้เป็นโลโก้หลักของเว็บ พร้อม animation หมุนช้า ๆ หรือ glow เบาๆ

SECTIONS (เรียงตามลำดับ):
1. Hero — โลโก้วงแหวน, หัวข้อ "OSKR17th ANNIVERSARY", แท็กไลน์, 
   countdown timer นับถอยหลังถึงวันงาน (รับ input วันที่/เวลาแบบ config ได้), 
   ปุ่ม CTA เลื่อนไป section บัตร, hashtag #OSKR17thAnniversary
2. Timeline/Journey — เส้นเวลาแนวตั้งแบบ scroll-reveal (ใช้ Intersection Observer) 
   แสดงปีการศึกษา → ปัจจุบัน → วันงาน พร้อมช่องใส่ข้อความ/รูปได้
3. Event Details — การ์ดแสดงวัน เวลา สถานที่ พร้อม embed Google Maps iframe 
   (ใส่ placeholder location ให้แก้ไขง่าย)
4. Tickets — การ์ด 2 แบบ Early Bird / Regular แสดงราคา, 
   มี countdown แยกสำหรับ early bird ที่ต้อง disable ปุ่มซื้ออัตโนมัติ 
   พร้อมเปลี่ยนข้อความเป็น "หมดเขต Early Bird แล้ว" เมื่อเวลาหมด 
   (ใช้ JS เทียบ Date.now() กับวันที่ deadline ที่ config ไว้ต้นไฟล์)
   ปุ่ม "ซื้อบัตร" ให้เป็น <a> link ที่แก้ URL ปลายทางได้ง่าย
5. Gallery — grid/masonry แสดงรูปภาพ (placeholder หลายรูป) พร้อม lightbox 
   เมื่อคลิกขยาย, มีพื้นที่ embed วิดีโอ YouTube แบบ responsive iframe
6. Social Hub — ไอคอนลิงก์ไป Instagram, Facebook, LINE OA (เป็น array ที่แก้ไขง่าย)
7. Footer — โลโก้เล็ก, hashtag, ชื่อโรงเรียน+รุ่น, ลิขสิทธิ์

TECHNICAL REQUIREMENTS:
- ทำให้ config ส่วนสำคัญ (วันที่งาน, deadline early bird, ราคาบัตร, ลิงก์ social, 
  ลิงก์รูป/วิดีโอ) รวมไว้เป็น object/constant ต้นไฟล์ เพื่อให้แก้ไขได้ง่ายโดยไม่ต้อง 
  แตะ logic
- Animation ใช้พอดี ไม่ใช้เยอะเกินจนดูรก เน้น scroll-reveal + hover state เบาๆ
- รองรับ reduced-motion (prefers-reduced-motion)
- Lighthouse performance ดี, รูปภาพใช้ lazy loading
- Comment ในโค้ดเป็นภาษาไทยหรืออังกฤษก็ได้ อธิบายจุดที่ต้องแก้ไข (เช่น "TODO: 
  ใส่ URL Google Form ที่นี่")

เริ่มจากทำโครง HTML/CSS ทั้งหมดก่อน แล้วค่อยเพิ่ม JS (countdown, lightbox, 
scroll-reveal) ทีหลัง
```

---

## 4. สิ่งที่ควรเตรียมก่อนเริ่ม (checklist)

- [ ] วันที่/เวลาจัดงาน + วันหมดเขต Early Bird (exact date-time)
- [ ] ราคาบัตร Early Bird และ Regular
- [ ] สถานที่จัดงาน + ลิงก์ Google Maps
- [ ] รูปโปรไฟล์จาก IG (โหลดมาเซฟไว้ใน `/assets/profile.jpg`)
- [ ] รูปภาพ/วิดีโอที่จะใช้โปรโมทใน Gallery
- [ ] ลิงก์ Social ทั้งหมด (IG, FB, LINE OA)
- [ ] ลิงก์ปลายทางสำหรับปุ่มซื้อบัตร (Google Form / ระบบชำระเงิน)

---

**Tip:** ถ้าอยากให้ Claude Code ทำทีละ section แทนที่จะสั่งทีเดียวหมด สามารถ 
copy prompt ด้านบนไปตัดเหลือแค่ section ที่ต้องการก่อน แล้วค่อยสั่งต่อทีละส่วน 
จะช่วยให้ควบคุมผลลัพธ์และแก้ไขได้ง่ายกว่า

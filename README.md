# ระบบรับสมัครและบริหารจัดการทุนการศึกษาออนไลน์
## ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (KMUTNB)

เว็บแอปพลิเคชันสำหรับการค้นหาทุนการศึกษา สมัครทุนออนไลน์ ตรวจสอบสถานะการพิจารณา (Tracking) และระบบสำหรับคณะกรรมการภาควิชา พัฒนาด้วย React 19, TypeScript, Vite และ Supabase

---

## ✨ ฟีเจอร์หลัก (Features)

- 🎓 **แคตตาล็อกทุนการศึกษา (Scholarship Catalog)**: แสดงรายการทุน 5 หมวดหมู่หลักของภาควิชา พร้อมระบบกรองและค้นหา
- 📝 **ระบบยื่นสมัครทุนออนไลน์แบบหลายขั้นตอน (Multi-step Application Wizard)**: กรอกข้อมูลส่วนตัว ผู้ปกครอง ผลการเรียน ทุนเดิม และแนบเอกสาร
- 🔍 **ระบบติดตามสถานะแบบเรียลไทม์ (Status Tracking Timeline)**: ค้นหาด้วยรหัสนักศึกษา หรือรหัสติดตาม (Tracking ID)
- ☁️ **เชื่อมต่อกับ Supabase Cloud Database**: จัดเก็บข้อมูลลงฐานข้อมูล PostgreSQL พร้อมระบบ Real-time Synchronization
- 🛡️ **ระบบ Dual Mode / Graceful Fallback**: สามารถทำงานในโหมด Local Demo Mode ได้แม้ยังไม่ได้ตั้งค่า Database
- 📄 **เอกสาร & FAQ (Downloads & FAQ)**: รวมแบบฟอร์มดาวน์โหลดและคำถามที่พบบ่อย
- 🎨 **ดีไซน์ตามอัตลักษณ์ภาควิชา**: ใช้โทนสีเขียวตราสัญลักษณ์ภาควิชาคณิตศาสตร์ มจพ. และสีส้มประจำมหาวิทยาลัย

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Modern Vanilla CSS, Glassmorphism, Google Fonts (Prompt & Sarabun)
- **Icons**: Lucide React
- **Backend & Database**: Supabase (PostgreSQL, Realtime, Row Level Security)

---

## 🚀 การติดตั้งและรันในเครื่อง (Local Setup)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
คัดลอกไฟล์ `.env.example` เป็น `.env` แล้วระบุค่า Supabase:
```bash
cp .env.example .env
```
กำหนดค่าใน `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. เริ่มต้นรันเซิร์ฟเวอร์สำหรับพัฒนา
```bash
npm run dev
```

### 4. Build สำหรับ Production
```bash
npm run build
```

---

## 🗄️ โครงสร้างฐานข้อมูล (Database Schema)

สคริปต์ SQL ทั้งหมดพร้อมใช้งานอยู่ที่: [`supabase/schema.sql`](supabase/schema.sql)
ประกอบด้วย 18 ตารางที่มีความสัมพันธ์แบบ Relational เช่น:
- `scholarship_categories`, `scholarship_programs`
- `students`, `scholarship_applications`
- `application_guardians`, `application_loans`, `application_documents`
- `news`, `pdf_documents`

ระบบออกเลขที่ใบสมัครรูปแบบตัวเลข `YYTTYNNN` โดยใช้ปี พ.ศ. 2 หลัก เทอม 2 หลัก ชั้นปี 1 หลัก และลำดับ 3 หลัก (ตัวอย่าง `69014001`) ผ่านฟังก์ชันฐานข้อมูลที่ออกเลขแบบ atomic สคริปต์ [`supabase/application_tracking_id.sql`](supabase/application_tracking_id.sql) ใช้กับฐานข้อมูลเดิม และจะแปลงเลขที่ใบสมัครแบบเก่าให้เป็นรูปแบบใหม่ด้วย

หากใช้ฐานข้อมูลเดิม ให้รัน [`supabase/staff_profile.sql`](supabase/staff_profile.sql) เพื่อเพิ่มช่องตำแหน่งเจ้าหน้าที่ก่อนใช้การบันทึกโปรไฟล์เจ้าหน้าที่

หากใช้ฐานข้อมูลเดิม ให้รัน [`supabase/scholarship_bulk_dates.sql`](supabase/scholarship_bulk_dates.sql) เพื่อเพิ่มวันเริ่มรับสมัคร ซึ่งใช้ร่วมกับการปรับวันรับสมัครแบบกลุ่ม

### ระบบรีเซ็ตรหัสผ่านด้วย OTP

ระบบรีเซ็ตรหัสผ่านใช้ Supabase Edge Function `password-reset` และ Resend ส่ง OTP ทางอีเมลให้ทั้งนักศึกษาและเจ้าหน้าที่ ก่อนเปิดใช้งานกับ Supabase project:

1. รันสคริปต์ [`supabase/password_reset_otp.sql`](supabase/password_reset_otp.sql) ใน Supabase SQL Editor
2. Deploy Edge Function จาก repository ด้วย Supabase CLI:
   ```bash
   supabase functions deploy password-reset
   ```
3. ตั้งค่า Edge Function secrets ใน Supabase Dashboard > Edge Functions > Secrets:
   - `RESEND_API_KEY`: API key ของ Resend
   - `EMAIL_FROM`: อีเมลผู้ส่งบนโดเมนที่ยืนยันกับ Resend เช่น `Scholarship Office <no-reply@example.ac.th>`
   - `OTP_HASH_SECRET`: คีย์สุ่มส่วนตัวอย่างน้อย 32 ตัวอักษร ใช้เก็บ OTP ในฐานข้อมูลเป็น HMAC hash
   - `SUPABASE_URL` และ `SUPABASE_SERVICE_ROLE_KEY`: ค่าของ Supabase project; ห้ามนำ service role key ไปใส่ใน frontend หรือ commit ลง repository

รหัส OTP มีอายุ 10 นาที ใช้ได้ครั้งเดียว จำกัดการขอ 1 ครั้งต่อนาทีและไม่เกิน 5 ครั้งต่อชั่วโมงต่ออีเมล และจำกัดการกรอกผิดไม่เกิน 5 ครั้ง บัญชีที่ไม่พบจะได้รับข้อความตอบกลับแบบเดียวกับบัญชีที่มีอยู่เพื่อไม่เปิดเผยว่ามีบัญชีหรือไม่ การรีเซ็ตนักศึกษายังคงใช้รูปแบบ SHA-256 salted hash เดิมของระบบ

---

## 🏛️ จัดทำโดย
ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์  
มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (มจพ.)
# project

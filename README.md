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

---

## 🏛️ จัดทำโดย
ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์  
มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (มจพ.)

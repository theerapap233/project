-- ===================================================================
-- KMUTNB Mathematics Scholarship Portal Database Schema
-- ปรับจูนตามโครงสร้างตารางใน SQL.md ให้ทำงานได้ 100% พร้อม RLS และ Seed Data
-- ===================================================================

-- เปิดใช้งานส่วนขยายสร้าง UUID (สำหรับ PostgreSQL บน Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================================================
-- หมวดที่ 1: ตารางหลัก / หมวดหมู่ (Master & Category Tables)
-- ===================================================================

-- 1.1 สิทธิ์และบทบาทเจ้าหน้าที่
CREATE TABLE IF NOT EXISTS public.staff_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  role_name CHARACTER VARYING NOT NULL UNIQUE,
  role_title CHARACTER VARYING,
  CONSTRAINT staff_roles_pkey PRIMARY KEY (id)
);

-- 1.2 ข้อมูลนักศึกษา
CREATE TABLE IF NOT EXISTS public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  student_code CHARACTER VARYING UNIQUE,
  first_name CHARACTER VARYING NOT NULL,
  last_name CHARACTER VARYING NOT NULL,
  nickname CHARACTER VARYING,
  year INTEGER,
  phone CHARACTER VARYING,
  email CHARACTER VARYING,
  address_line1 TEXT,
  sub_district CHARACTER VARYING,
  district CHARACTER VARYING,
  province CHARACTER VARYING,
  postal_code CHARACTER VARYING,
  major CHARACTER VARYING,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT students_pkey PRIMARY KEY (id)
);

-- 1.3 หมวดหมู่ทุนการศึกษา
CREATE TABLE IF NOT EXISTS public.scholarship_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name CHARACTER VARYING NOT NULL UNIQUE,
  CONSTRAINT scholarship_categories_pkey PRIMARY KEY (id)
);

-- 1.4 หมวดหมู่ข่าวสาร
CREATE TABLE IF NOT EXISTS public.news_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name CHARACTER VARYING NOT NULL UNIQUE,
  CONSTRAINT news_categories_pkey PRIMARY KEY (id)
);

-- 1.5 หมวดหมู่เอกสารดาวน์โหลด
CREATE TABLE IF NOT EXISTS public.pdf_document_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name CHARACTER VARYING NOT NULL UNIQUE,
  CONSTRAINT pdf_document_categories_pkey PRIMARY KEY (id)
);

-- 1.6 หมวดหมู่ข้อเสนอแนะ / ติดต่อสอบถาม
CREATE TABLE IF NOT EXISTS public.feedbacks_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name CHARACTER VARYING NOT NULL UNIQUE,
  CONSTRAINT feedbacks_categories_pkey PRIMARY KEY (id)
);

-- ===================================================================
-- หมวดที่ 2: ตารางข้อมูลผู้ใช้และโครงการทุน (Level 1 Entities)
-- ===================================================================

-- 2.1 ข้อมูลเจ้าหน้าที่ / กรรมการพิจารณาทุน
CREATE TABLE IF NOT EXISTS public.staff_users (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  username CHARACTER VARYING NOT NULL UNIQUE,
  password CHARACTER VARYING NOT NULL,
  name CHARACTER VARYING NOT NULL,
  email CHARACTER VARYING NOT NULL UNIQUE,
  department CHARACTER VARYING,
  role_id UUID NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT staff_users_pkey PRIMARY KEY (id),
  CONSTRAINT staff_users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.staff_roles(id) ON DELETE RESTRICT
);

-- 2.2 โครงการทุนการศึกษา (Scholarship Programs)
CREATE TABLE IF NOT EXISTS public.scholarship_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name CHARACTER VARYING NOT NULL,
  category_id UUID,
  amount NUMERIC CHECK (amount IS NULL OR amount >= 0::numeric),
  quota INTEGER CHECK (quota IS NULL OR quota >= 0),
  is_open BOOLEAN NOT NULL DEFAULT true,
  scholarship_type CHARACTER VARYING DEFAULT 'internal',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT scholarship_programs_pkey PRIMARY KEY (id),
  CONSTRAINT scholarship_programs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.scholarship_categories(id) ON DELETE SET NULL
);

-- 2.3 ข่าวสารและประกาศทุน
CREATE TABLE IF NOT EXISTS public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(TRIM(BOTH FROM title)) > 0),
  category_id UUID,
  content TEXT,
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT news_pkey PRIMARY KEY (id),
  CONSTRAINT news_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.news_categories(id) ON DELETE SET NULL
);

-- 2.4 เอกสารและแบบฟอร์มดาวน์โหลด (PDF)
CREATE TABLE IF NOT EXISTS public.pdf_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(TRIM(BOTH FROM name)) > 0),
  category_id UUID,
  size TEXT,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT pdf_documents_pkey PRIMARY KEY (id),
  CONSTRAINT pdf_documents_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.pdf_document_categories(id) ON DELETE SET NULL
);

-- 2.5 ข้อเสนอแนะ / ติดต่อสอบถาม
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  category_id UUID,
  message TEXT,
  comments TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT feedbacks_pkey PRIMARY KEY (id),
  CONSTRAINT feedbacks_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.feedbacks_categories(id) ON DELETE SET NULL
);

-- ===================================================================
-- หมวดที่ 3: ตารางใบสมัครทุนการศึกษา (Application Main Table)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.scholarship_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL,
  student_id UUID NOT NULL,
  gpa NUMERIC,
  scholarship_type CHARACTER VARYING,
  status CHARACTER VARYING NOT NULL DEFAULT 'pending'::character varying 
    CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying]::text[])),
  note TEXT,
  reason TEXT,
  form_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT scholarship_applications_pkey PRIMARY KEY (id),
  CONSTRAINT scholarship_applications_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.scholarship_programs(id) ON DELETE CASCADE,
  CONSTRAINT scholarship_applications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE
);

-- ===================================================================
-- หมวดที่ 4: ตารางรายละเอียดประกอบใบสมัคร (Application Child Tables)
-- ===================================================================

-- 4.1 ข้อมูลผู้ปกครอง / บิดา-มารดา
CREATE TABLE IF NOT EXISTS public.application_guardians (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  relation CHARACTER VARYING NOT NULL,
  name CHARACTER VARYING,
  age INTEGER,
  vital_status CHARACTER VARYING,
  occupation CHARACTER VARYING,
  income NUMERIC CHECK (income IS NULL OR income >= 0::numeric),
  phone CHARACTER VARYING,
  is_sponsor BOOLEAN DEFAULT false,
  sponsor_details TEXT,
  CONSTRAINT application_guardians_pkey PRIMARY KEY (id),
  CONSTRAINT application_guardians_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.scholarship_applications(id) ON DELETE CASCADE
);

-- 4.2 เอกสารแนบการสมัคร
CREATE TABLE IF NOT EXISTS public.application_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  doc_type CHARACTER VARYING NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT application_documents_pkey PRIMARY KEY (id),
  CONSTRAINT application_documents_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.scholarship_applications(id) ON DELETE CASCADE
);

-- 4.3 กิจกรรม / ผลงานของนักศึกษา
CREATE TABLE IF NOT EXISTS public.application_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  activity_name CHARACTER VARYING NOT NULL,
  activity_description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT application_activities_pkey PRIMARY KEY (id),
  CONSTRAINT application_activities_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.scholarship_applications(id) ON DELETE CASCADE
);

-- 4.4 ข้อมูลทุนที่เคยได้รับ
CREATE TABLE IF NOT EXISTS public.application_previous_scholarships (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE,
  has_previous_scholarship BOOLEAN NOT NULL DEFAULT false,
  details TEXT,
  amount NUMERIC CHECK (amount IS NULL OR amount >= 0::numeric),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT application_previous_scholarships_pkey PRIMARY KEY (id),
  CONSTRAINT application_previous_scholarships_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.scholarship_applications(id) ON DELETE CASCADE
);

-- 4.5 ข้อมูลเงินกู้ยืมเพื่อการศึกษา (กยศ./กรอ.)
CREATE TABLE IF NOT EXISTS public.application_loans (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE,
  has_student_loan BOOLEAN NOT NULL DEFAULT false,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT application_loans_pkey PRIMARY KEY (id),
  CONSTRAINT application_loans_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.scholarship_applications(id) ON DELETE CASCADE
);

-- 4.6 ข้อมูลการทำงานพิเศษ (Part-time)
CREATE TABLE IF NOT EXISTS public.application_part_time_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE,
  has_part_time_job BOOLEAN NOT NULL DEFAULT false,
  details TEXT,
  income NUMERIC CHECK (income IS NULL OR income >= 0::numeric),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT application_part_time_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT application_part_time_jobs_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.scholarship_applications(id) ON DELETE CASCADE
);

-- ===================================================================
-- หมวดที่ 5: การสร้าง Indexes เพื่อความรวดเร็วในการค้นหา
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_students_student_code ON public.students(student_code);
CREATE INDEX IF NOT EXISTS idx_scholarship_programs_is_open ON public.scholarship_programs(is_open);
CREATE INDEX IF NOT EXISTS idx_scholarship_programs_category_id ON public.scholarship_programs(category_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_student_id ON public.scholarship_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_program_id ON public.scholarship_applications(program_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_status ON public.scholarship_applications(status);
CREATE INDEX IF NOT EXISTS idx_news_is_published ON public.news(is_published);
CREATE INDEX IF NOT EXISTS idx_pdf_documents_category_id ON public.pdf_documents(category_id);

-- ===================================================================
-- หมวดที่ 6: Row Level Security (RLS) Policies
-- ===================================================================

-- เปิดใช้งาน RLS
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_previous_scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_part_time_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- 6.1 นโยบายสำหรับ Public Read (ทุกคนดูทุน ข่าวสาร และเอกสารได้)
CREATE POLICY "Public read scholarship_categories" ON public.scholarship_categories FOR SELECT USING (true);
CREATE POLICY "Public read scholarship_programs" ON public.scholarship_programs FOR SELECT USING (true);
CREATE POLICY "Public read news_categories" ON public.news_categories FOR SELECT USING (true);
CREATE POLICY "Public read news" ON public.news FOR SELECT USING (true);
CREATE POLICY "Public read pdf_document_categories" ON public.pdf_document_categories FOR SELECT USING (true);
CREATE POLICY "Public read pdf_documents" ON public.pdf_documents FOR SELECT USING (true);
CREATE POLICY "Public read staff_roles" ON public.staff_roles FOR SELECT USING (true);

-- 6.2 นโยบายสำหรับนักศึกษา (Public Insert & Select สำหรับยื่นและตรวจสอบสถานะ)
CREATE POLICY "Public insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Public select students" ON public.students FOR SELECT USING (true);

CREATE POLICY "Public insert applications" ON public.scholarship_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select applications" ON public.scholarship_applications FOR SELECT USING (true);
CREATE POLICY "Public update applications" ON public.scholarship_applications FOR UPDATE USING (true);

CREATE POLICY "Public insert guardians" ON public.application_guardians FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select guardians" ON public.application_guardians FOR SELECT USING (true);

CREATE POLICY "Public insert documents" ON public.application_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select documents" ON public.application_documents FOR SELECT USING (true);

CREATE POLICY "Public insert activities" ON public.application_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select activities" ON public.application_activities FOR SELECT USING (true);

CREATE POLICY "Public insert loans" ON public.application_loans FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select loans" ON public.application_loans FOR SELECT USING (true);

CREATE POLICY "Public insert part_time_jobs" ON public.application_part_time_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select part_time_jobs" ON public.application_part_time_jobs FOR SELECT USING (true);

CREATE POLICY "Public insert previous_scholarships" ON public.application_previous_scholarships FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select previous_scholarships" ON public.application_previous_scholarships FOR SELECT USING (true);

CREATE POLICY "Public insert feedbacks" ON public.feedbacks FOR INSERT WITH CHECK (true);

-- ===================================================================
-- หมวดที่ 7: Seed Data เริ่มต้นสำหรับภาควิชาคณิตศาสตร์ มจพ.
-- ===================================================================

-- 7.1 หมวดหมู่ทุนการศึกษา
INSERT INTO public.scholarship_categories (id, name) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'ทุนเรียนดี / วิชาการ'),
  ('a0000000-0000-0000-0000-000000000002', 'ทุนขาดแคลนทุนทรัพย์'),
  ('a0000000-0000-0000-0000-000000000003', 'ทุนทำงาน / ผู้ช่วยสอน-วิจัย (TA)'),
  ('a0000000-0000-0000-0000-000000000004', 'ทุนศิษย์เก่าและผู้มีจิตศรัทธา'),
  ('a0000000-0000-0000-0000-000000000005', 'ทุนกิจกรรมและจิตสาธารณะ')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 7.2 โครงการทุนการศึกษา ภาควิชาคณิตศาสตร์ (ทุนภายใน และ ทุนภายนอก)
INSERT INTO public.scholarship_programs (id, name, category_id, amount, quota, is_open, scholarship_type, description) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'ทุนเรียนดีเด่นและสร้างชื่อเสียงทางคณิตศาสตร์ (MATH-EXC-2567)',
  'a0000000-0000-0000-0000-000000000001',
  35000,
  10,
  true,
  'internal',
  'ทุนสนับสนุนนักศึกษาที่มีผลการเรียนยอดเยี่ยม หรือสร้างชื่อเสียงทางวิชาการและงานวิจัยให้แก่ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มจพ. เกรดเฉลี่ยสะสมไม่ต่ำกว่า 3.25'
),
(
  'b0000000-0000-0000-0000-000000000002',
  'ทุนช่วยเหลือนักศึกษาขาดแคลนทุนทรัพย์ (MATH-AID-2567)',
  'a0000000-0000-0000-0000-000000000002',
  25000,
  25,
  true,
  'internal',
  'ทุนสนับสนุนค่าครองชีพและค่าอุปกรณ์การศึกษาแก่นักศึกษาที่ครอบครัวประสบปัญหาทางเศรษฐกิจ รายได้ครอบครัวไม่เกิน 300,000 บาท/ปี เกรดเฉลี่ยสะสมไม่ต่ำกว่า 2.00'
),
(
  'b0000000-0000-0000-0000-000000000003',
  'ทุนผู้ช่วยสอนประจำรายวิชาพื้นฐาน Teaching Assistant - TA (MATH-TA-2567)',
  'a0000000-0000-0000-0000-000000000003',
  20000,
  15,
  true,
  'internal',
  'เปิดรับนักศึกษาชั้นปีที่ 3-4 หรือบัณฑิตศึกษา ช่วยสอน ตรวจแบบฝึกหัด ในรายวิชา Calculus I, II และ Linear Algebra'
),
(
  'b0000000-0000-0000-0000-000000000004',
  'ทุนศิษย์เก่าคณิตศาสตร์ มจพ. เพื่อการพัฒนาศักยภาพ (MATH-ALUMNI-2567)',
  'a0000000-0000-0000-0000-000000000004',
  20000,
  12,
  true,
  'external',
  'ทุนสนับสนุนจากชมรมศิษย์เก่าภาควิชาคณิตศาสตร์ มจพ. สำหรับนักศึกษาที่มุ่งมั่นพัฒนาทักษะ Data Science, Coding หรือสอบ Certificate วิชาชีพ'
),
(
  'b0000000-0000-0000-0000-000000000005',
  'ทุนจิตสาธารณะและส่งเสริมกิจกรรมนักศึกษา (MATH-VOLUNTEER-2567)',
  'a0000000-0000-0000-0000-000000000005',
  15000,
  8,
  true,
  'internal',
  'มอบแก่นักศึกษาผู้มีจิตอาสา เสียสละเพื่อส่วนรวม และเป็นแกนนำในการจัดกิจกรรมค่ายคณิตศาสตร์สัญจรหรือกิจกรรมของมหาวิทยาลัย'
),
(
  'b0000000-0000-0000-0000-000000000006',
  'ทุนส่งเสริมการแข่งขันและการวิจัยคณิตศาสตร์ระดับชาติ/นานาชาติ (MATH-INNOV-2567)',
  'a0000000-0000-0000-0000-000000000001',
  30000,
  6,
  true,
  'external',
  'ทุนสนับสนุนค่าเดินทาง ค่าลงทะเบียนสำหรับการแข่งขัน Hackathon, Data Competition หรืองานประชุมวิชาการ'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  amount = EXCLUDED.amount,
  quota = EXCLUDED.quota,
  is_open = EXCLUDED.is_open,
  scholarship_type = EXCLUDED.scholarship_type,
  description = EXCLUDED.description,
  updated_at = now();

-- 7.3 หมวดหมู่ข่าวสาร
INSERT INTO public.news_categories (id, name) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'ประกาศรับสมัครทุน'),
  ('c0000000-0000-0000-0000-000000000002', 'ประกาศผลการคัดเลือก'),
  ('c0000000-0000-0000-0000-000000000003', 'กิจกรรมและข่าวสารภาควิชา')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 7.4 ข่าวสารประชาสัมพันธ์
INSERT INTO public.news (id, title, category_id, content, is_published) VALUES
(
  'd0000000-0000-0000-0000-000000000001',
  'เปิดรับสมัครทุนการศึกษาภาควิชาคณิตศาสตร์ ประจำปีการศึกษา 2567',
  'c0000000-0000-0000-0000-000000000001',
  'ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มจพ. เปิดรับสมัครทุนการศึกษาทุกประเภท ยื่นผ่านระบบออนไลน์ได้แล้ววันนี้ถึง 30 ตุลาคม 2567',
  true
),
(
  'd0000000-0000-0000-0000-000000000002',
  'กำหนดการสัมภาษณ์ทุนผู้ช่วยสอน (TA) ภาคเรียนที่ 1/2567',
  'c0000000-0000-0000-0000-000000000002',
  'ขอให้นักศึกษาที่ผ่านการคัดเลือกเอกสารเข้าสัมภาษณ์ ณ ห้องประชุม 704 อาคาร 78 หรือตรวจสอบผ่านระบบ Tracking',
  true
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, is_published = EXCLUDED.is_published;

-- 7.5 หมวดหมู่เอกสารและแบบฟอร์ม
INSERT INTO public.pdf_document_categories (id, name) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'แบบฟอร์มการสมัคร'),
  ('e0000000-0000-0000-0000-000000000002', 'ประกาศและหลักเกณฑ์')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.pdf_documents (name, category_id, size, url) VALUES
  ('แบบฟอร์มรับรองรายได้ครอบครัว.pdf', 'e0000000-0000-0000-0000-000000000001', '245 KB', '/documents/income_cert.pdf'),
  ('เกณฑ์การให้คะแนนและการพิจารณาทุน_2567.pdf', 'e0000000-0000-0000-0000-000000000002', '512 KB', '/documents/scholarship_criteria_2567.pdf')
ON CONFLICT DO NOTHING;

-- 7.6 บทบาทเจ้าหน้าที่
INSERT INTO public.staff_roles (id, role_name, role_title) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'admin', 'ผู้ดูแลระบบสูงสุด'),
  ('f0000000-0000-0000-0000-000000000002', 'committee', 'กรรมการพิจารณาทุนภาควิชา')
ON CONFLICT (id) DO UPDATE SET role_name = EXCLUDED.role_name, role_title = EXCLUDED.role_title;

-- ===================================================================
-- หมวดที่ 8: การตั้งค่าเว็บไซต์ (Site Settings)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  setting_key CHARACTER VARYING NOT NULL UNIQUE,
  academic_year CHARACTER VARYING NOT NULL,
  semester CHARACTER VARYING NOT NULL,
  hero_title TEXT NOT NULL,
  hero_subtitle TEXT NOT NULL,
  contact_phone CHARACTER VARYING NOT NULL,
  contact_email CHARACTER VARYING NOT NULL,
  contact_address TEXT NOT NULL,
  ticker_text TEXT NOT NULL,
  facebook_url CHARACTER VARYING,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (id)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access on site_settings" ON public.site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.site_settings (
  id, setting_key, academic_year, semester, hero_title, hero_subtitle, contact_phone, contact_email, contact_address, ticker_text, facebook_url
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'general',
  '2567',
  '1',
  'เปิดประตูสู่อนาคต
ทุนการศึกษาคณิตศาสตร์ มจพ.',
  'ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มุ่งมั่นสนับสนุนศักยภาพทางวิชาการและช่วยเหลือนักศึกษาทุกระดับชั้น ทั้งทุนเรียนดี ทุนขาดแคลน ทุนผู้ช่วยสอน (TA) และทุนสนับสนุนงานวิจัย',
  '02-555-2000 ต่อ 4601-4602',
  'math@sci.kmutnb.ac.th',
  '1518 ถนนประชาราษฎร์ 1 แขวงวงศ์สว่าง เขตบางซื่อ กรุงเทพฯ 10800',
  '📢 เปิดรับสมัครทุนการศึกษาภาควิชาคณิตศาสตร์ ประจำภาคการศึกษาที่ 1/2567 ยื่นใบสมัครออนไลน์ได้ตั้งแต่วันนี้',
  'https://facebook.com/kmutnb.math'
) ON CONFLICT (setting_key) DO NOTHING;

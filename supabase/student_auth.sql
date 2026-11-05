-- ===================================================================
-- KMUTNB Mathematics Scholarship Portal
-- ส่วนเสริม: บัญชีนักศึกษา (Student Accounts) + ประวัติการเข้าสู่ระบบ (Login Logs)
-- ไฟล์นี้รันซ้ำได้ (idempotent) — ใช้กับฐานข้อมูลที่สร้างจาก schema.sql แล้ว
-- เปิดใช้เมื่อ: ต้องการย้ายข้อมูล login ของนักศึกษาจาก localStorage ขึ้น Supabase
-- ===================================================================

-- เปิดใช้งานส่วนขยายสร้าง UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================================================
-- 1. ตารางบัญชีนักศึกษา (ใช้สำหรับ login / ลงทะเบียนนักศึกษาใหม่)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.student_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  student_code CHARACTER VARYING NOT NULL UNIQUE,
  name CHARACTER VARYING NOT NULL,
  email CHARACTER VARYING NOT NULL UNIQUE,
  phone CHARACTER VARYING,
  faculty CHARACTER VARYING DEFAULT 'คณะวิทยาศาสตร์ประยุกต์',
  major CHARACTER VARYING,
  year CHARACTER VARYING,
  gpax NUMERIC CHECK (gpax IS NULL OR (gpax >= 0::numeric AND gpax <= 4::numeric)),
  personal_info JSONB,
  password_hash CHARACTER VARYING NOT NULL,
  password_salt CHARACTER VARYING NOT NULL,
  avatar_url TEXT,
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT student_accounts_pkey PRIMARY KEY (id)
);

-- ข้อมูลส่วนตัวเชิงลึก (ที่อยู่ ครอบครัว เงินทุน กิจกรรม) ย้ายมาจากใบสมัครทุน
-- คำสั่งนี้ทำให้ฐานข้อมูลเดิมที่มีตารางอยู่แล้วได้รับคอลัมน์ใหม่ด้วย
ALTER TABLE public.student_accounts ADD COLUMN IF NOT EXISTS personal_info JSONB;
COMMENT ON COLUMN public.student_accounts.personal_info IS 'ข้อมูลส่วนตัวเพิ่มเติมของผู้สมัคร (ที่อยู่ ครอบครัว แหล่งเงินทุน กิจกรรม) เก็บเป็น JSONB';

-- ===================================================================
-- 2. ตารางประวัติการเข้าสู่ระบบของนักศึกษา
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.student_login_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  student_account_id UUID,
  student_code CHARACTER VARYING NOT NULL,
  student_name CHARACTER VARYING,
  action CHARACTER VARYING NOT NULL DEFAULT 'login'::character varying
    CHECK (action::text = ANY (ARRAY['login'::character varying, 'logout'::character varying, 'register'::character varying, 'password_change'::character varying]::text[])),
  success BOOLEAN NOT NULL DEFAULT true,
  failure_reason TEXT,
  user_agent TEXT,
  device_type CHARACTER VARYING,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT student_login_logs_pkey PRIMARY KEY (id),
  CONSTRAINT student_login_logs_account_fkey FOREIGN KEY (student_account_id)
    REFERENCES public.student_accounts(id) ON DELETE SET NULL
);

-- ===================================================================
-- 3. Indexes
-- ===================================================================
CREATE INDEX IF NOT EXISTS idx_student_accounts_student_code ON public.student_accounts(student_code);
CREATE INDEX IF NOT EXISTS idx_student_accounts_email ON public.student_accounts(email);
CREATE INDEX IF NOT EXISTS idx_student_login_logs_student_code ON public.student_login_logs(student_code);
CREATE INDEX IF NOT EXISTS idx_student_login_logs_created_at ON public.student_login_logs(created_at DESC);

-- ===================================================================
-- 4. Row Level Security
--    หมายเหตุ: เว็บนี้เรียก Supabase ด้วย publishable/anon key โดยไม่มี Supabase Auth
--    จึงอนุญาตให้หน้าเว็บอ่าน/เขียนได้ตามรูปแบบเดียวกับตาราง students ใน schema.sql
-- ===================================================================
ALTER TABLE public.student_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_login_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select student_accounts" ON public.student_accounts;
DROP POLICY IF EXISTS "Public insert student_accounts" ON public.student_accounts;
DROP POLICY IF EXISTS "Public update student_accounts" ON public.student_accounts;
CREATE POLICY "Public select student_accounts" ON public.student_accounts FOR SELECT USING (true);
CREATE POLICY "Public insert student_accounts" ON public.student_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update student_accounts" ON public.student_accounts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public select student_login_logs" ON public.student_login_logs;
DROP POLICY IF EXISTS "Public insert student_login_logs" ON public.student_login_logs;
CREATE POLICY "Public select student_login_logs" ON public.student_login_logs FOR SELECT USING (true);
CREATE POLICY "Public insert student_login_logs" ON public.student_login_logs FOR INSERT WITH CHECK (true);

-- ===================================================================
-- 5. Seed บัญชีนักศึกษาทดสอบ (Demo)
--    รหัสผ่าน: student123 (SHA-256 ของ "salt:password" => ตรงกับ INITIAL_STUDENT_ACCOUNTS ในฝั่งเว็บ)
-- ===================================================================
INSERT INTO public.student_accounts (
  student_code, name, email, phone, faculty, major, year, gpax, password_hash, password_salt, created_at
) VALUES (
  '6604062610099',
  'นายสมคิด มุ่งมั่นวิทยา',
  's6604062610099@email.kmutnb.ac.th',
  '089-123-4567',
  'คณะวิทยาศาสตร์ประยุกต์',
  'ภาควิชาคณิตศาสตร์ (คณิตศาสตร์ประยุกต์)',
  'ปี 2',
  3.45,
  '0868c0b2cc7537d69f6853bd13f7a43996902c426b1378a9683b463e91ff6309',
  'kmutnb_math_demo_salt',
  '2026-09-01T00:00:00.000Z'
) ON CONFLICT (student_code) DO NOTHING;

-- ===================================================================
-- 6. ตัวอย่างคำสั่งตรวจสอบข้อมูล login
-- ===================================================================
-- SELECT student_code, name, last_login_at, login_count FROM public.student_accounts ORDER BY last_login_at DESC NULLS LAST;
-- SELECT created_at, student_code, student_name, action, success, failure_reason, device_type
--   FROM public.student_login_logs ORDER BY created_at DESC LIMIT 50;

-- =====================================================================
-- ตั้งค่าอีเมลสรุปผู้สมัครทุนรายวัน (ใช้คู่กับ Google Apps Script)
-- รันไฟล์นี้ครั้งเดียวใน Supabase Dashboard > SQL Editor
--
-- หน้าเว็บ (แท็บ "แจ้งเตือนอีเมล" ในหน้าแอดมิน) ใช้ตารางนี้เก็บเวลาส่งและผู้รับ
-- Apps Script อ่านค่าจากตารางนี้ทุก 10 นาที และเขียนผลการส่งกลับมา
-- =====================================================================

-- 1) ตารางตั้งค่า (มีแถวเดียวเสมอ id = 1)
CREATE TABLE IF NOT EXISTS public.email_digest_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled BOOLEAN NOT NULL DEFAULT false,
  send_time CHARACTER VARYING(5) NOT NULL DEFAULT '18:00'
    CHECK (send_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  recipients TEXT[] NOT NULL DEFAULT '{}',
  test_requested_at TIMESTAMP WITH TIME ZONE,   -- กดปุ่ม "ส่งอีเมลทดสอบ" จากหน้าเว็บ
  last_window_end TIMESTAMP WITH TIME ZONE,     -- ใบสมัครหลังเวลานี้จะอยู่ในอีเมลรอบถัดไป
  last_digest_date DATE,                        -- วันที่ (เวลาไทย) ที่ทำรอบประจำวันไปแล้ว
  last_run_at TIMESTAMP WITH TIME ZONE,         -- Apps Script ทำงานล่าสุดเมื่อไร (ใช้เช็กว่ายังทำงานอยู่)
  last_sent_at TIMESTAMP WITH TIME ZONE,
  last_sent_count INTEGER,
  last_status TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO public.email_digest_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- 2) ประวัติการส่ง (แสดงในหน้าเว็บ)
CREATE TABLE IF NOT EXISTS public.email_digest_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ran_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  kind CHARACTER VARYING(10) NOT NULL CHECK (kind IN ('daily', 'test')),
  sent BOOLEAN NOT NULL DEFAULT false,
  application_count INTEGER NOT NULL DEFAULT 0,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  message TEXT
);

CREATE INDEX IF NOT EXISTS email_digest_logs_ran_at_idx ON public.email_digest_logs (ran_at DESC);

-- 3) สิทธิ์การเข้าถึง
-- หมายเหตุ: ระบบนี้ยังล็อกอินเจ้าหน้าที่ด้วยตาราง staff_users เอง (ไม่ใช่ Supabase Auth)
-- จึงต้องเปิดสิทธิ์ให้ anon key แบบเดียวกับตารางอื่นในโปรเจกต์
-- ถ้าย้ายไปใช้ Supabase Auth ภายหลัง ควรจำกัด UPDATE ให้เฉพาะเจ้าหน้าที่
ALTER TABLE public.email_digest_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_digest_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select email_digest_settings" ON public.email_digest_settings;
DROP POLICY IF EXISTS "Public update email_digest_settings" ON public.email_digest_settings;
CREATE POLICY "Public select email_digest_settings" ON public.email_digest_settings FOR SELECT USING (true);
CREATE POLICY "Public update email_digest_settings" ON public.email_digest_settings FOR UPDATE USING (id = 1) WITH CHECK (id = 1);

DROP POLICY IF EXISTS "Public select email_digest_logs" ON public.email_digest_logs;
DROP POLICY IF EXISTS "Public insert email_digest_logs" ON public.email_digest_logs;
CREATE POLICY "Public select email_digest_logs" ON public.email_digest_logs FOR SELECT USING (true);
CREATE POLICY "Public insert email_digest_logs" ON public.email_digest_logs FOR INSERT WITH CHECK (true);

-- ตรวจสอบ: ควรเห็น 1 แถว enabled = false, send_time = 18:00
SELECT * FROM public.email_digest_settings;

-- ===================================================================
-- Migration: รองรับการแนบไฟล์ PDF ประกาศทุนในตาราง scholarship_programs
-- และสร้าง Storage Bucket 'scholarship-pdfs' สำหรับเก็บไฟล์ PDF
-- ===================================================================

ALTER TABLE public.scholarship_programs
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS pdf_name TEXT;

-- สร้าง Storage Bucket แบบ Public สำหรับเก็บไฟล์ PDF ประกาศทุน
INSERT INTO storage.buckets (id, name, public)
VALUES ('scholarship-pdfs', 'scholarship-pdfs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- สิทธิ์อ่าน/อัปโหลด/ลบไฟล์ใน bucket scholarship-pdfs
DROP POLICY IF EXISTS "Public read scholarship-pdfs" ON storage.objects;
CREATE POLICY "Public read scholarship-pdfs" ON storage.objects
  FOR SELECT USING (bucket_id = 'scholarship-pdfs');

DROP POLICY IF EXISTS "Public upload scholarship-pdfs" ON storage.objects;
CREATE POLICY "Public upload scholarship-pdfs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'scholarship-pdfs');

DROP POLICY IF EXISTS "Public update scholarship-pdfs" ON storage.objects;
CREATE POLICY "Public update scholarship-pdfs" ON storage.objects
  FOR UPDATE USING (bucket_id = 'scholarship-pdfs');

DROP POLICY IF EXISTS "Public delete scholarship-pdfs" ON storage.objects;
CREATE POLICY "Public delete scholarship-pdfs" ON storage.objects
  FOR DELETE USING (bucket_id = 'scholarship-pdfs');

-- ===================================================================
-- Migration: เชื่อมต่อส่วนเอกสารและแบบฟอร์มดาวน์โหลด (pdf_documents)
-- รันไฟล์นี้ใน Supabase SQL Editor เพื่อเพิ่มคอลัมน์และสิทธิ์จัดการเอกสาร
-- ===================================================================

ALTER TABLE public.pdf_documents
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS doc_type TEXT DEFAULT 'PDF';

ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read pdf_documents" ON public.pdf_documents;
CREATE POLICY "Public read pdf_documents" ON public.pdf_documents
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert pdf_documents" ON public.pdf_documents;
CREATE POLICY "Public insert pdf_documents" ON public.pdf_documents
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update pdf_documents" ON public.pdf_documents;
CREATE POLICY "Public update pdf_documents" ON public.pdf_documents
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete pdf_documents" ON public.pdf_documents;
CREATE POLICY "Public delete pdf_documents" ON public.pdf_documents
  FOR DELETE USING (true);

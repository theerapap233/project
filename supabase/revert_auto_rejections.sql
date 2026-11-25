-- =====================================================================
-- คืนสถานะใบสมัครที่ "ระบบตั้งไม่ผ่านอัตโนมัติ" กลับเป็น "รอพิจารณา"
-- (ใบสมัครที่อาจารย์ตั้งไม่ผ่านเองจะไม่ถูกแตะ เพราะไม่มีข้อความของระบบในบันทึก)
-- รันใน Supabase Dashboard > SQL Editor ทีละส่วน
-- =====================================================================

-- ส่วนที่ 1: ดูก่อนว่าจะมีใบสมัครไหนถูกเปลี่ยนบ้าง (ยังไม่แก้อะไร)
SELECT
  id,
  form_data->>'trackingId' AS tracking_id,
  form_data->>'fullName' AS full_name,
  form_data->>'scholarshipName' AS scholarship,
  status,
  note
FROM public.scholarship_applications
WHERE status = 'rejected'
  AND note LIKE '%ระบบกำหนดสถานะไม่ผ่านการพิจารณา:%'
ORDER BY created_at DESC;


-- ส่วนที่ 2: คืนสถานะเป็น "รอพิจารณา" และลบข้อความของระบบออกจากบันทึกกรรมการ
UPDATE public.scholarship_applications
SET
  status = 'pending',
  note = NULLIF(btrim(regexp_replace(note, '\n?ระบบกำหนดสถานะไม่ผ่านการพิจารณา:[^\n]*', '', 'g')), ''),
  form_data = jsonb_set(
    jsonb_set(
      COALESCE(form_data, '{}'::jsonb),
      '{subStatus}', '"submitted"'::jsonb, true
    ),
    '{committeeNotes}',
    to_jsonb(COALESCE(NULLIF(btrim(regexp_replace(note, '\n?ระบบกำหนดสถานะไม่ผ่านการพิจารณา:[^\n]*', '', 'g')), ''), '')),
    true
  ),
  updated_at = now()
WHERE status = 'rejected'
  AND note LIKE '%ระบบกำหนดสถานะไม่ผ่านการพิจารณา:%';


-- ส่วนที่ 3: ตรวจผล (ควรได้ 0 แถว)
SELECT count(*) AS remaining_auto_rejections
FROM public.scholarship_applications
WHERE status = 'rejected'
  AND note LIKE '%ระบบกำหนดสถานะไม่ผ่านการพิจารณา:%';

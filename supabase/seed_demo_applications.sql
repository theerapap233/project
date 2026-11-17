-- Demo seed: 20 complete, fictional scholarship applications with embedded SVG avatars.
-- Review and run only in a development Supabase project. No real student or contact data is used.
-- The profilePhoto data URI is stored in form_data, so no Storage bucket or external image host is needed.

BEGIN;

-- Keep the seed independent of existing scholarship categories and programs.
INSERT INTO public.scholarship_programs (
  id, name, amount, quota, is_open, scholarship_type, description,
  academic_year, term, min_gpax, target_years
) VALUES (
  'b0000000-0000-0000-0000-000000000099',
  'ทุนสาธิตสำหรับข้อมูลตัวอย่าง (ไม่นำไปใช้พิจารณาจริง)',
  20000, 20, false, 'internal',
  'โครงการทุนตัวอย่างสำหรับทดสอบหน้าระบบเท่านั้น',
  '2569', 'ภาคการศึกษาที่ 1', 2.00,
  ARRAY['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4']
)
ON CONFLICT (id) DO NOTHING;

DO $seed$
DECLARE
  i integer;
  v_student_id uuid;
  v_application_id uuid;
  v_first_name text;
  v_last_name text;
  v_full_name text;
  v_student_code text;
  v_email text;
  v_major text;
  v_year integer;
  v_gpax numeric;
  v_family_income integer;
  v_loan_status text;
  v_has_job boolean;
  v_job_income integer;
  v_volunteer_hours integer;
  v_activity_name text;
  v_reason text;
  v_photo text;
  v_form_data jsonb;
  v_avatar_color text;
  v_avatar_colors text[] := ARRAY[
    '#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe',
    '#cffafe', '#ffedd5', '#e0e7ff', '#f3e8ff', '#d1fae5'
  ];
  v_majors text[] := ARRAY[
    'วท.บ. คณิตศาสตร์ประยุกต์ (MA) - โครงการปกติ',
    'วท.บ. คณิตศาสตร์ประยุกต์ (MA) - โครงการสมทบพิเศษ',
    'วท.บ. คณิตศาสตร์เชิงคอมพิวเตอร์ (MC) - โครงการปกติ',
    'วท.บ. คณิตศาสตร์เชิงคอมพิวเตอร์ (MC) - โครงการสมทบพิเศษ'
  ];
BEGIN
  FOR i IN 1..20 LOOP
    v_student_id := format('d0000000-0000-0000-0000-%s', lpad(i::text, 12, '0'))::uuid;
    v_application_id := format('c0000000-0000-0000-0000-%s', lpad(i::text, 12, '0'))::uuid;
    v_first_name := 'ผู้สมัครตัวอย่าง';
    v_last_name := format('ข้อมูลสาธิต %s', lpad(i::text, 2, '0'));
    v_full_name := v_first_name || ' ' || v_last_name;
    v_student_code := format('DEMO-STU-%s', lpad(i::text, 3, '0'));
    v_email := format('demo.student.%s@example.invalid', lpad(i::text, 3, '0'));
    v_major := v_majors[((i - 1) % array_length(v_majors, 1)) + 1];
    v_year := ((i - 1) % 4) + 1;
    v_gpax := round((2.40 + ((i - 1) % 15) * 0.10)::numeric, 2);
    v_family_income := 18000 + i * 1250;
    v_loan_status := CASE WHEN i % 3 = 0 THEN 'none' WHEN i % 2 = 0 THEN 'กยศ' ELSE 'กรอ' END;
    v_has_job := i % 3 <> 0;
    v_job_income := CASE WHEN v_has_job THEN 2500 + i * 100 ELSE 0 END;
    v_volunteer_hours := 12 + i * 2;
    v_activity_name := format('กิจกรรมจิตอาสาตัวอย่าง %s', lpad(i::text, 2, '0'));
    v_reason := format(
      'ข้อมูลสาธิต %s: ต้องการทุนสนับสนุนค่าใช้จ่ายด้านการศึกษาและอุปกรณ์การเรียน เพื่อให้สามารถวางแผนการศึกษาได้ต่อเนื่อง',
      lpad(i::text, 2, '0')
    );
    v_avatar_color := v_avatar_colors[((i - 1) % array_length(v_avatar_colors, 1)) + 1];

    -- Create an original, simple illustrated avatar as a data URI (not a real-person photo).
    v_photo := 'data:image/svg+xml;base64,' || encode(
      convert_to(
        format(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="%s"/><circle cx="64" cy="48" r="24" fill="#f2c7a5"/><path d="M22 124c3-25 19-40 42-40s39 15 42 40" fill="#334155"/><path d="M40 43c2-17 11-27 24-27s22 10 24 27c-8-7-16-10-24-10s-16 3-24 10" fill="#334155"/><text x="64" y="119" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#fff">%s</text></svg>',
          v_avatar_color,
          lpad(i::text, 2, '0')
        ),
        'UTF8'
      ),
      'base64'
    );

    INSERT INTO public.students (
      id, student_code, first_name, last_name, nickname, year, phone, email,
      address_line1, sub_district, district, province, postal_code, major
    ) VALUES (
      v_student_id, v_student_code, v_first_name, v_last_name,
      format('ตัวอย่าง%s', lpad(i::text, 2, '0')), v_year, '0000000000', v_email,
      '99/1 (ที่อยู่ตัวอย่าง)', 'ตำบลตัวอย่าง', 'อำเภอตัวอย่าง',
      'กรุงเทพมหานคร', '10000', v_major
    )
    ON CONFLICT (student_code) DO UPDATE SET
      id = EXCLUDED.id,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      nickname = EXCLUDED.nickname,
      year = EXCLUDED.year,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      address_line1 = EXCLUDED.address_line1,
      sub_district = EXCLUDED.sub_district,
      district = EXCLUDED.district,
      province = EXCLUDED.province,
      postal_code = EXCLUDED.postal_code,
      major = EXCLUDED.major,
      updated_at = now();

    -- Re-running the seed refreshes its detail rows without duplicating them.
    DELETE FROM public.application_guardians WHERE application_id = v_application_id;
    DELETE FROM public.application_documents WHERE application_id = v_application_id;
    DELETE FROM public.application_activities WHERE application_id = v_application_id;
    DELETE FROM public.application_previous_scholarships WHERE application_id = v_application_id;
    DELETE FROM public.application_loans WHERE application_id = v_application_id;
    DELETE FROM public.application_part_time_jobs WHERE application_id = v_application_id;

    -- Split key/value pairs into chunks to stay within PostgreSQL's function argument limit.
    v_form_data := jsonb_build_object(
      'demoSeed', true,
      'trackingId', format('DEMO-APP-%s', lpad(i::text, 3, '0')),
      'scholarshipId', 'b0000000-0000-0000-0000-000000000099',
      'scholarshipName', 'ทุนสาธิตสำหรับข้อมูลตัวอย่าง (ไม่นำไปใช้พิจารณาจริง)',
      'studentId', v_student_code,
      'fullName', v_full_name,
      'firstName', v_first_name,
      'lastName', v_last_name,
      'nickname', format('ตัวอย่าง%s', lpad(i::text, 2, '0')),
      'major', v_major,
      'year', format('ปี %s', v_year),
      'gpax', v_gpax,
      'phone', '0000000000',
      'email', v_email,
      'address', jsonb_build_object(
        'houseNo', '99/1', 'moo', '1', 'soi', 'ซอยตัวอย่าง',
        'road', 'ถนนตัวอย่าง', 'subDistrict', 'ตำบลตัวอย่าง',
        'district', 'อำเภอตัวอย่าง', 'province', 'กรุงเทพมหานคร',
        'zipCode', '10000'
      )
    ) || jsonb_build_object(
      'isIdCardAddress', true,
      'idCardAddress', jsonb_build_object(
        'houseNo', '99/1', 'moo', '1', 'soi', 'ซอยตัวอย่าง',
        'road', 'ถนนตัวอย่าง', 'subDistrict', 'ตำบลตัวอย่าง',
        'district', 'อำเภอตัวอย่าง', 'province', 'กรุงเทพมหานคร',
        'zipCode', '10000'
      ),
      'fatherName', format('บิดาตัวอย่าง %s', lpad(i::text, 2, '0')),
      'fatherPhone', '0000000000',
      'fatherJob', 'อาชีพตัวอย่าง',
      'fatherIncome', 9000 + i * 300,
      'fatherAlive', 'alive',
      'motherName', format('มารดาตัวอย่าง %s', lpad(i::text, 2, '0')),
      'motherPhone', '0000000000',
      'motherJob', 'อาชีพตัวอย่าง',
      'motherIncome', 9000 + i * 950,
      'motherAlive', 'alive',
      'parentsRelation', CASE WHEN i % 5 = 0 THEN 'other' ELSE 'together' END,
      'familyIncome', v_family_income,
      'siblings', (i % 4) + 1,
      'sponsor', jsonb_build_array('father', 'mother'),
      'sponsorOther', '',
      'loanStatus', v_loan_status,
      'loanAmount', CASE WHEN v_loan_status = 'none' THEN 0 ELSE 12000 + i * 500 END,
      'hasPartTimeJob', v_has_job,
      'partTimeJobLocation', CASE WHEN v_has_job THEN 'สถานที่ทำงานตัวอย่าง' ELSE '' END,
      'partTimeJobIncome', v_job_income
    ) || jsonb_build_object(
      'hasActivities', true,
      'activities', v_activity_name,
      'activityRole', 'ผู้เข้าร่วมกิจกรรม (ข้อมูลสาธิต)',
      'volunteerHours', v_volunteer_hours,
      'activityList', jsonb_build_array(jsonb_build_object(
        'name', v_activity_name,
        'role', 'ผู้เข้าร่วมกิจกรรม (ข้อมูลสาธิต)',
        'photoBase64', NULL
      )),
      'reason', v_reason,
      'reasonsList', jsonb_build_array(v_reason),
      'consent', true,
      'systemRating', 0,
      'systemComment', '',
      'profilePhoto', v_photo,
      'documents', jsonb_build_array(),
      'subStatus', 'submitted',
      'interviewDate', 'รอประกาศวันสัมภาษณ์',
      'score', NULL,
      'committeeNotes', ''
    );

    INSERT INTO public.scholarship_applications (
      id, program_id, student_id, gpa, scholarship_type, status, reason, form_data,
      created_at, updated_at
    ) VALUES (
      v_application_id,
      'b0000000-0000-0000-0000-000000000099',
      v_student_id,
      v_gpax,
      'general',
      'pending',
      v_reason,
      v_form_data,
      now() - make_interval(days => i),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      program_id = EXCLUDED.program_id,
      student_id = EXCLUDED.student_id,
      gpa = EXCLUDED.gpa,
      scholarship_type = EXCLUDED.scholarship_type,
      status = EXCLUDED.status,
      reason = EXCLUDED.reason,
      form_data = EXCLUDED.form_data,
      updated_at = now();

    INSERT INTO public.application_guardians (
      application_id, relation, name, vital_status, occupation, income, phone, is_sponsor
    ) VALUES
      (v_application_id, 'บิดา', format('บิดาตัวอย่าง %s', lpad(i::text, 2, '0')),
       'alive', 'อาชีพตัวอย่าง', 9000 + i * 300, '0000000000', true),
      (v_application_id, 'มารดา', format('มารดาตัวอย่าง %s', lpad(i::text, 2, '0')),
       'alive', 'อาชีพตัวอย่าง', 9000 + i * 950, '0000000000', true);

    INSERT INTO public.application_activities (
      application_id, activity_name, activity_description
    ) VALUES (
      v_application_id, v_activity_name,
      'กิจกรรมประกอบใบสมัครตัวอย่าง ไม่มีการอ้างอิงกิจกรรมจริง'
    );

    INSERT INTO public.application_previous_scholarships (
      application_id, has_previous_scholarship, details, amount
    ) VALUES (
      v_application_id,
      i % 4 = 0,
      CASE WHEN i % 4 = 0 THEN 'ทุนตัวอย่างในปีก่อน (ข้อมูลสาธิต)' ELSE NULL END,
      CASE WHEN i % 4 = 0 THEN 5000 ELSE NULL END
    );

    INSERT INTO public.application_loans (
      application_id, has_student_loan, details
    ) VALUES (
      v_application_id,
      v_loan_status <> 'none',
      CASE WHEN v_loan_status = 'none' THEN NULL
        ELSE format('กองทุนเงินให้กู้ยืมเพื่อการศึกษา (%s) — ข้อมูลสาธิต', v_loan_status)
      END
    );

    INSERT INTO public.application_part_time_jobs (
      application_id, has_part_time_job, details, income
    ) VALUES (
      v_application_id,
      v_has_job,
      CASE WHEN v_has_job THEN 'สถานที่ทำงานตัวอย่าง (ข้อมูลสาธิต)' ELSE NULL END,
      CASE WHEN v_has_job THEN v_job_income ELSE NULL END
    );
  END LOOP;
END
$seed$;

COMMIT;

-- Verification: both counts should be 20 after a successful run.
SELECT
  count(*) AS seeded_applications,
  count(*) FILTER (WHERE form_data->>'profilePhoto' LIKE 'data:image/svg+xml;base64,%') AS applications_with_avatar
FROM public.scholarship_applications
WHERE form_data->>'demoSeed' = 'true';

-- Optional cleanup (run separately; removes only records owned by this seed):
-- DELETE FROM public.scholarship_applications WHERE form_data->>'demoSeed' = 'true';
-- DELETE FROM public.students WHERE student_code LIKE 'DEMO-STU-%';
-- DELETE FROM public.scholarship_programs
--   WHERE id = 'b0000000-0000-0000-0000-000000000099';

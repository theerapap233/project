-- Remove only the synthetic application seed data.
-- Do not delete the demo scholarship program: real applications reference it.

BEGIN;

CREATE TEMP TABLE demo_applications_to_delete ON COMMIT DROP AS
SELECT application.id, application.student_id
FROM public.scholarship_applications AS application
WHERE application.form_data->>'demoSeed' = 'true'
   OR application.student_id IN (
     SELECT student.id
     FROM public.students AS student
     WHERE student.student_code LIKE 'DEMO-STU-%'
   );

DELETE FROM public.application_guardians AS child
USING demo_applications_to_delete AS demo
WHERE child.application_id = demo.id;

DELETE FROM public.application_documents AS child
USING demo_applications_to_delete AS demo
WHERE child.application_id = demo.id;

DELETE FROM public.application_activities AS child
USING demo_applications_to_delete AS demo
WHERE child.application_id = demo.id;

DELETE FROM public.application_previous_scholarships AS child
USING demo_applications_to_delete AS demo
WHERE child.application_id = demo.id;

DELETE FROM public.application_loans AS child
USING demo_applications_to_delete AS demo
WHERE child.application_id = demo.id;

DELETE FROM public.application_part_time_jobs AS child
USING demo_applications_to_delete AS demo
WHERE child.application_id = demo.id;

DELETE FROM public.scholarship_applications AS application
USING demo_applications_to_delete AS demo
WHERE application.id = demo.id;

DELETE FROM public.students AS student
WHERE student.student_code LIKE 'DEMO-STU-%'
  AND NOT EXISTS (
    SELECT 1
    FROM public.scholarship_applications AS application
    WHERE application.student_id = student.id
  );

COMMIT;

SELECT
  (SELECT count(*) FROM public.scholarship_applications
   WHERE form_data->>'demoSeed' = 'true') AS remaining_tagged_demo_applications,
  (SELECT count(*) FROM public.students
   WHERE student_code LIKE 'DEMO-STU-%') AS remaining_demo_students;

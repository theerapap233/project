-- Remove legacy scholarship codes from program and application names.
UPDATE public.scholarship_programs
SET name = regexp_replace(name, '[[:space:]]*\(MATH-[A-Z0-9-]+\)[[:space:]]*$', '', 'i'),
    updated_at = now()
WHERE name ~* '[[:space:]]*\(MATH-[A-Z0-9-]+\)[[:space:]]*$';

UPDATE public.scholarship_applications
SET form_data = jsonb_set(
  form_data,
  '{scholarshipName}',
  to_jsonb(regexp_replace(form_data->>'scholarshipName', '[[:space:]]*\(MATH-[A-Z0-9-]+\)[[:space:]]*$', '', 'i')),
  false
)
WHERE jsonb_typeof(form_data) = 'object'
  AND form_data ? 'scholarshipName'
  AND form_data->>'scholarshipName' ~* '[[:space:]]*\(MATH-[A-Z0-9-]+\)[[:space:]]*$';

ALTER TABLE public.scholarship_programs
DROP COLUMN IF EXISTS code;

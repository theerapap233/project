-- Atomic application tracking IDs: YY + TT + student year + sequence (3 digits).
-- Example: 69014001 = Buddhist year 2569, term 01, year 4, sequence 001.

CREATE TABLE IF NOT EXISTS public.application_tracking_counters (
  tracking_prefix TEXT PRIMARY KEY,
  last_sequence INTEGER NOT NULL CHECK (last_sequence BETWEEN 0 AND 999)
);

REVOKE ALL ON TABLE public.application_tracking_counters FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.allocate_application_tracking_id(
  p_academic_year TEXT,
  p_term TEXT,
  p_student_year TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_year_digits TEXT;
  v_term_digits TEXT;
  v_student_year_digits TEXT;
  v_prefix TEXT;
  v_existing_max INTEGER;
  v_sequence INTEGER;
BEGIN
  v_year_digits := regexp_replace(COALESCE(p_academic_year, ''), '[^0-9]', '', 'g');
  v_term_digits := regexp_replace(COALESCE(p_term, ''), '[^0-9]', '', 'g');
  v_student_year_digits := regexp_replace(COALESCE(p_student_year, ''), '[^0-9]', '', 'g');

  IF length(v_year_digits) <> 4
    OR length(v_term_digits) NOT BETWEEN 1 AND 2
    OR v_term_digits::INTEGER NOT BETWEEN 1 AND 99
    OR length(v_student_year_digits) <> 1
    OR v_student_year_digits::INTEGER NOT BETWEEN 1 AND 9 THEN
    RAISE EXCEPTION 'Invalid application year, term, or student year';
  END IF;

  v_prefix := right(v_year_digits, 2) || lpad(v_term_digits, 2, '0') || v_student_year_digits;

  SELECT COALESCE(MAX(substring(form_data->>'trackingId' FROM 6 FOR 3)::INTEGER), 0)
  INTO v_existing_max
  FROM public.scholarship_applications
  WHERE form_data->>'trackingId' ~ ('^' || v_prefix || '[0-9]{3}$');

  INSERT INTO public.application_tracking_counters (tracking_prefix, last_sequence)
  VALUES (v_prefix, v_existing_max + 1)
  ON CONFLICT (tracking_prefix) DO UPDATE
    SET last_sequence = GREATEST(
      public.application_tracking_counters.last_sequence,
      v_existing_max
    ) + 1
  RETURNING last_sequence INTO v_sequence;

  RETURN v_prefix || lpad(v_sequence::TEXT, 3, '0');
END;
$$;

-- Convert existing legacy IDs to the numeric format, preserving a unique
-- sequence for each academic year, term, and student year.
WITH legacy_prefixes AS (
  SELECT
    application.id,
    right(
      COALESCE(
        NULLIF(regexp_replace(COALESCE(program.academic_year, ''), '[^0-9]', '', 'g'), ''),
        (EXTRACT(YEAR FROM application.created_at AT TIME ZONE 'Asia/Bangkok')::INTEGER + 543)::TEXT
      ),
      2
    )
    || lpad(
      COALESCE(
        NULLIF(regexp_replace(COALESCE(program.term, ''), '[^0-9]', '', 'g'), ''),
        NULLIF((
          SELECT regexp_replace(COALESCE(settings.semester, ''), '[^0-9]', '', 'g')
          FROM public.site_settings AS settings
          WHERE settings.setting_key = 'general'
          LIMIT 1
        ), ''),
        '1'
      ),
      2,
      '0'
    )
    || left(
      COALESCE(
        NULLIF(regexp_replace(COALESCE(student.year::TEXT, application.form_data->>'year', ''), '[^0-9]', '', 'g'), ''),
        '1'
      ),
      1
    ) AS tracking_prefix,
    application.created_at
  FROM public.scholarship_applications AS application
  LEFT JOIN public.scholarship_programs AS program ON program.id = application.program_id
  LEFT JOIN public.students AS student ON student.id = application.student_id
  WHERE COALESCE(application.form_data->>'trackingId', '') !~ '^[0-9]{8}$'
),
legacy_applications AS (
  SELECT
    legacy_prefixes.*,
    GREATEST(
      COALESCE((
        SELECT MAX(substring(existing.form_data->>'trackingId' FROM 6 FOR 3)::INTEGER)
        FROM public.scholarship_applications AS existing
        WHERE existing.form_data->>'trackingId' ~ '^[0-9]{8}$'
          AND left(existing.form_data->>'trackingId', 5) = legacy_prefixes.tracking_prefix
      ), 0),
      COALESCE((
        SELECT counter.last_sequence
        FROM public.application_tracking_counters AS counter
        WHERE counter.tracking_prefix = legacy_prefixes.tracking_prefix
      ), 0)
    ) AS starting_sequence
  FROM legacy_prefixes
),
numbered_applications AS (
  SELECT
    id,
    tracking_prefix,
    starting_sequence + row_number() OVER (PARTITION BY tracking_prefix ORDER BY created_at, id) AS sequence
  FROM legacy_applications
)
UPDATE public.scholarship_applications AS application
SET form_data = jsonb_set(
  COALESCE(application.form_data, '{}'::JSONB),
  '{trackingId}',
  to_jsonb(numbered.tracking_prefix || lpad(numbered.sequence::TEXT, 3, '0')),
  true
)
FROM numbered_applications AS numbered
WHERE application.id = numbered.id
  AND numbered.sequence <= 999;

INSERT INTO public.application_tracking_counters (tracking_prefix, last_sequence)
SELECT
  left(form_data->>'trackingId', 5),
  MAX(substring(form_data->>'trackingId' FROM 6 FOR 3)::INTEGER)
FROM public.scholarship_applications
WHERE form_data->>'trackingId' ~ '^[0-9]{8}$'
GROUP BY left(form_data->>'trackingId', 5)
ON CONFLICT (tracking_prefix) DO UPDATE
SET last_sequence = GREATEST(
  public.application_tracking_counters.last_sequence,
  EXCLUDED.last_sequence
);

REVOKE ALL ON FUNCTION public.allocate_application_tracking_id(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.allocate_application_tracking_id(TEXT, TEXT, TEXT) TO anon, authenticated;

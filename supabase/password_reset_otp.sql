-- Password reset OTP storage and service-role-only RPCs.
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  scope text NOT NULL CHECK (scope IN ('student', 'staff')),
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  window_started_at timestamp with time zone NOT NULL DEFAULT now(),
  send_count integer NOT NULL DEFAULT 1 CHECK (send_count >= 1),
  CONSTRAINT password_reset_otps_pkey PRIMARY KEY (scope, email)
);

ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.password_reset_otps FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.password_reset_otps TO service_role;

CREATE OR REPLACE FUNCTION public.request_password_reset_otp(
  p_scope text,
  p_email text,
  p_code_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_record public.password_reset_otps%ROWTYPE;
  next_window_started_at timestamp with time zone;
  next_send_count integer;
  active_account_count integer;
BEGIN
  IF p_scope IS NULL
    OR p_scope NOT IN ('student', 'staff')
    OR p_email IS NULL
    OR length(trim(p_email)) = 0
    OR length(p_email) > 254
    OR p_code_hash IS NULL
    OR p_code_hash !~ '^[0-9a-f]{64}$'
  THEN
    RAISE EXCEPTION 'Invalid password reset request';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_scope || ':' || lower(p_email)));
  IF p_scope = 'staff' THEN
    SELECT count(*) INTO active_account_count
    FROM public.staff_users
    WHERE lower(email) = lower(p_email) AND is_active = true;
  ELSE
    SELECT count(*) INTO active_account_count
    FROM public.student_accounts
    WHERE lower(email) = lower(p_email) AND is_active = true;
  END IF;

  IF active_account_count <> 1 THEN
    RETURN false;
  END IF;

  DELETE FROM public.password_reset_otps
  WHERE expires_at < now() - interval '1 day';

  SELECT * INTO current_record
  FROM public.password_reset_otps
  WHERE scope = p_scope AND email = lower(p_email)
  FOR UPDATE;

  IF FOUND THEN
    IF current_record.sent_at > now() - interval '60 seconds'
      OR (
        current_record.window_started_at > now() - interval '1 hour'
        AND current_record.send_count >= 5
      )
    THEN
      RETURN false;
    END IF;

    IF current_record.window_started_at <= now() - interval '1 hour' THEN
      next_window_started_at := now();
      next_send_count := 1;
    ELSE
      next_window_started_at := current_record.window_started_at;
      next_send_count := current_record.send_count + 1;
    END IF;

    UPDATE public.password_reset_otps
    SET code_hash = p_code_hash,
        expires_at = now() + interval '10 minutes',
        attempt_count = 0,
        sent_at = now(),
        window_started_at = next_window_started_at,
        send_count = next_send_count
    WHERE scope = p_scope AND email = lower(p_email);
  ELSE
    INSERT INTO public.password_reset_otps (
      scope, email, code_hash, expires_at, attempt_count, sent_at, window_started_at, send_count
    )
    VALUES (p_scope, lower(p_email), p_code_hash, now() + interval '10 minutes', 0, now(), now(), 1);
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_password_reset_with_otp(
  p_scope text,
  p_email text,
  p_code_hash text,
  p_new_password text,
  p_student_password_hash text,
  p_student_password_salt text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_record public.password_reset_otps%ROWTYPE;
  affected_rows integer;
  active_account_count integer;
  account_id uuid;
BEGIN
  IF p_scope IS NULL
    OR p_scope NOT IN ('student', 'staff')
    OR p_email IS NULL
    OR length(trim(p_email)) = 0
    OR length(p_email) > 254
    OR p_code_hash IS NULL
    OR p_code_hash !~ '^[0-9a-f]{64}$'
    OR p_new_password IS NULL
    OR length(p_new_password) < 8
    OR length(p_new_password) > 128
  THEN
    RAISE EXCEPTION 'Invalid password reset request';
  END IF;

  IF p_scope = 'student'
    AND (
      p_student_password_hash IS NULL
      OR p_student_password_hash !~ '^[0-9a-f]{64}$'
      OR p_student_password_salt IS NULL
      OR p_student_password_salt !~ '^[0-9a-f]{32}$'
    )
  THEN
    RAISE EXCEPTION 'Invalid student password hash';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_scope || ':' || lower(p_email)));
  SELECT * INTO current_record
  FROM public.password_reset_otps
  WHERE scope = p_scope AND email = lower(p_email)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'invalid';
  END IF;

  IF current_record.expires_at <= now() THEN
    DELETE FROM public.password_reset_otps WHERE scope = p_scope AND email = lower(p_email);
    RETURN 'invalid';
  END IF;

  IF current_record.attempt_count >= 5 THEN
    RETURN 'locked';
  END IF;

  IF current_record.code_hash <> p_code_hash THEN
    UPDATE public.password_reset_otps
    SET attempt_count = attempt_count + 1
    WHERE scope = p_scope AND email = lower(p_email);
    IF current_record.attempt_count + 1 >= 5 THEN
      RETURN 'locked';
    END IF;
    RETURN 'invalid';
  END IF;

  IF p_scope = 'staff' THEN
    SELECT count(*) INTO active_account_count
    FROM public.staff_users
    WHERE lower(email) = lower(p_email) AND is_active = true;
    SELECT id INTO account_id
    FROM public.staff_users
    WHERE lower(email) = lower(p_email) AND is_active = true
    ORDER BY id
    LIMIT 1
    FOR UPDATE;
  ELSE
    SELECT count(*) INTO active_account_count
    FROM public.student_accounts
    WHERE lower(email) = lower(p_email) AND is_active = true;
    SELECT id INTO account_id
    FROM public.student_accounts
    WHERE lower(email) = lower(p_email) AND is_active = true
    ORDER BY id
    LIMIT 1
    FOR UPDATE;
  END IF;

  IF active_account_count <> 1 OR account_id IS NULL THEN
    DELETE FROM public.password_reset_otps WHERE scope = p_scope AND email = lower(p_email);
    RETURN 'invalid';
  END IF;

  IF p_scope = 'staff' THEN
    UPDATE public.staff_users
    SET password = p_new_password
    WHERE id = account_id AND is_active = true;
  ELSE
    UPDATE public.student_accounts
    SET password_hash = p_student_password_hash,
        password_salt = p_student_password_salt,
        updated_at = now()
    WHERE id = account_id AND is_active = true;
  END IF;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  DELETE FROM public.password_reset_otps WHERE scope = p_scope AND email = lower(p_email);

  IF affected_rows = 0 THEN
    RETURN 'invalid';
  END IF;

  RETURN 'success';
END;
$$;

REVOKE ALL ON FUNCTION public.request_password_reset_otp(text, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_password_reset_with_otp(text, text, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_password_reset_otp(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_password_reset_with_otp(text, text, text, text, text, text)
  TO service_role;

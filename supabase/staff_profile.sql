-- Persist staff profile fields from the staff profile editor.
ALTER TABLE public.staff_users
  ADD COLUMN IF NOT EXISTS position CHARACTER VARYING;

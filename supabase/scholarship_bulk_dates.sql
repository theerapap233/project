-- Add scholarship application start dates for individual and bulk date updates.
ALTER TABLE public.scholarship_programs
  ADD COLUMN IF NOT EXISTS application_start_date DATE;

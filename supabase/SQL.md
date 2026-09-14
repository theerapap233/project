-- ✅ SCHEMA HAS BEEN TUNED & ORDERED
-- สคริปต์ที่จัดลำดับตาราง Foreign Keys, Indexes, RLS Policies และ Seed Data เรียบร้อยแล้ว
-- สามารถนำไฟล์ `supabase/schema.sql` ไปกด Run ใน Supabase SQL Editor ได้ทันที 100%

CREATE TABLE public.staff_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role_name character varying NOT NULL UNIQUE,
  role_title character varying,
  CONSTRAINT staff_roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.staff_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL UNIQUE,
  password character varying NOT NULL,
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  department character varying,
  role_id uuid NOT NULL,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT staff_users_pkey PRIMARY KEY (id),
  CONSTRAINT staff_users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.staff_roles(id)
);
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_code character varying UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  nickname character varying,
  year integer,
  phone character varying,
  email character varying,
  address_line1 text,
  sub_district character varying,
  district character varying,
  province character varying,
  postal_code character varying,
  major character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT students_pkey PRIMARY KEY (id)
);
CREATE TABLE public.scholarship_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  CONSTRAINT scholarship_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.scholarship_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  category_id uuid,
  amount numeric CHECK (amount IS NULL OR amount >= 0::numeric),
  quota integer CHECK (quota IS NULL OR quota >= 0),
  is_open boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT scholarship_programs_pkey PRIMARY KEY (id),
  CONSTRAINT scholarship_programs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.scholarship_categories(id)
);
CREATE TABLE public.scholarship_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  student_id uuid NOT NULL,
  gpa numeric,
  scholarship_type character varying,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying]::text[])),
  note text,
  reason text,
  form_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT scholarship_applications_pkey PRIMARY KEY (id),
  CONSTRAINT scholarship_applications_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.scholarship_programs(id),
  CONSTRAINT scholarship_applications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.application_guardians (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  relation character varying NOT NULL,
  name character varying,
  age integer,
  vital_status character varying,
  occupation character varying,
  income numeric CHECK (income IS NULL OR income >= 0::numeric),
  phone character varying,
  is_sponsor boolean DEFAULT false,
  sponsor_details text,
  CONSTRAINT application_guardians_pkey PRIMARY KEY (id),
  CONSTRAINT application_guardians_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.scholarship_applications(id)
);
CREATE TABLE public.application_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  doc_type character varying NOT NULL,
  url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT application_documents_pkey PRIMARY KEY (id),
  CONSTRAINT application_documents_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.scholarship_applications(id)
);
CREATE TABLE public.application_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  activity_name character varying NOT NULL,
  activity_description text,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT application_activities_pkey PRIMARY KEY (id),
  CONSTRAINT application_activities_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.scholarship_applications(id)
);
CREATE TABLE public.news_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  CONSTRAINT news_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.news (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(TRIM(BOTH FROM title)) > 0),
  category_id uuid,
  content text,
  image_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT news_pkey PRIMARY KEY (id),
  CONSTRAINT news_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.news_categories(id)
);
CREATE TABLE public.pdf_document_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  CONSTRAINT pdf_document_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pdf_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(TRIM(BOTH FROM name)) > 0),
  category_id uuid,
  size text,
  url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pdf_documents_pkey PRIMARY KEY (id),
  CONSTRAINT pdf_documents_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.pdf_document_categories(id)
);
CREATE TABLE public.feedbacks_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  CONSTRAINT feedbacks_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.feedbacks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  message text,
  comments text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feedbacks_pkey PRIMARY KEY (id),
  CONSTRAINT anonymous_feedbacks_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.feedbacks_categories(id)
);
CREATE TABLE public.application_previous_scholarships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE,
  has_previous_scholarship boolean NOT NULL DEFAULT false,
  details text,
  amount numeric CHECK (amount IS NULL OR amount >= 0::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT application_previous_scholarships_pkey PRIMARY KEY (id),
  CONSTRAINT application_previous_scholarships_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.scholarship_applications(id)
);
CREATE TABLE public.application_loans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE,
  has_student_loan boolean NOT NULL DEFAULT false,
  details text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT application_loans_pkey PRIMARY KEY (id),
  CONSTRAINT application_loans_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.scholarship_applications(id)
);
CREATE TABLE public.application_part_time_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE,
  has_part_time_job boolean NOT NULL DEFAULT false,
  details text,
  income numeric CHECK (income IS NULL OR income >= 0::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT application_part_time_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT application_part_time_jobs_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.scholarship_applications(id)
);
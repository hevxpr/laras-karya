-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.sectors (
  code text NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT sectors_pkey PRIMARY KEY (code)
);
CREATE TABLE public.skills (
  code text NOT NULL,
  label text NOT NULL,
  category text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_language boolean NOT NULL DEFAULT false,
  embedding USER-DEFINED,
  CONSTRAINT skills_pkey PRIMARY KEY (code)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  phone text,
  province text,
  city text,
  headline text,
  bio text,
  career_path text CHECK (career_path = ANY (ARRAY['switch_or_return'::text, 'practical_experience'::text, 'fresh_start'::text])),
  experience_level text CHECK (experience_level = ANY (ARRAY['entry'::text, 'junior'::text, 'mid'::text, 'senior'::text])),
  work_arrangement_pref text CHECK (work_arrangement_pref = ANY (ARRAY['onsite'::text, 'hybrid'::text, 'remote'::text])),
  interest_sectors ARRAY NOT NULL DEFAULT '{}'::text[],
  open_to_relocate boolean NOT NULL DEFAULT false,
  certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  assessment_step smallint NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  linkedin_url text,
  languages jsonb NOT NULL DEFAULT '[]'::jsonb,
  role text NOT NULL DEFAULT 'seeker'::text CHECK (role = ANY (ARRAY['seeker'::text, 'admin'::text])),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.educations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  institution text NOT NULL,
  degree_level text CHECK (degree_level = ANY (ARRAY['sma'::text, 'd3'::text, 's1'::text, 's2'::text, 's3'::text])),
  major text,
  start_year smallint,
  end_year smallint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  gpa numeric,
  CONSTRAINT educations_pkey PRIMARY KEY (id),
  CONSTRAINT educations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.work_experiences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_name text NOT NULL,
  job_title text NOT NULL,
  start_date date,
  end_date date,
  is_current boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT work_experiences_pkey PRIMARY KEY (id),
  CONSTRAINT work_experiences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company_name text NOT NULL,
  sector text,
  description text,
  requirements text,
  benefits ARRAY DEFAULT '{}'::text[],
  employment_type text NOT NULL DEFAULT 'full_time'::text CHECK (employment_type = ANY (ARRAY['full_time'::text, 'part_time'::text, 'contract'::text, 'internship'::text])),
  work_arrangement text CHECK (work_arrangement = ANY (ARRAY['onsite'::text, 'hybrid'::text, 'remote'::text])),
  city text,
  province text,
  salary_min integer,
  salary_max integer,
  experience_level text CHECK (experience_level = ANY (ARRAY['entry'::text, 'junior'::text, 'mid'::text, 'senior'::text])),
  min_education text CHECK (min_education = ANY (ARRAY['sma'::text, 'd3'::text, 's1'::text, 's2'::text, 's3'::text])),
  deadline date,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'closed'::text])),
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  source_url text,
  source_origin text,
  verified_at date,
  address text,
  is_green_job boolean NOT NULL,
  company_logo_url text,
  company_website_url text,
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_sector_fkey FOREIGN KEY (sector) REFERENCES public.sectors(code)
);
CREATE TABLE public.job_skills (
  job_id uuid NOT NULL,
  skill_code text NOT NULL,
  is_required boolean DEFAULT true,
  required_level text CHECK (required_level IS NULL OR (required_level = ANY (ARRAY['Dasar'::text, 'Menengah'::text, 'Mahir'::text]))),
  CONSTRAINT job_skills_pkey PRIMARY KEY (job_id, skill_code),
  CONSTRAINT job_skills_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_skills_skill_code_fkey FOREIGN KEY (skill_code) REFERENCES public.skills(code)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  level text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  verified_at date,
  provider text,
  category text,
  duration_text text,
  is_featured boolean NOT NULL DEFAULT false,
  format text CHECK (format IS NULL OR (format = ANY (ARRAY['online'::text, 'hybrid'::text, 'offline'::text]))),
  image_url text,
  CONSTRAINT courses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.course_skills (
  course_id uuid NOT NULL,
  skill_code text NOT NULL,
  CONSTRAINT course_skills_pkey PRIMARY KEY (course_id, skill_code),
  CONSTRAINT course_skills_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT course_skills_skill_code_fkey FOREIGN KEY (skill_code) REFERENCES public.skills(code)
);
CREATE TABLE public.saved_jobs (
  user_id uuid NOT NULL,
  job_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT saved_jobs_pkey PRIMARY KEY (user_id, job_id),
  CONSTRAINT saved_jobs_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT saved_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid NOT NULL,
  resume_url text,
  cover_letter text NOT NULL CHECK (length(btrim(cover_letter)) > 0),
  current_status text NOT NULL DEFAULT 'diproses'::text CHECK (current_status = ANY (ARRAY['diproses'::text, 'interview'::text, 'diterima'::text, 'ditolak'::text])),
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  portfolio_url text,
  profile_snapshot jsonb NOT NULL CHECK (jsonb_typeof(profile_snapshot) = 'object'::text),
  terms_accepted_at timestamp with time zone NOT NULL,
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'in_progress'::text CHECK (status = ANY (ARRAY['in_progress'::text, 'completed'::text])),
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  consent_at timestamp with time zone,
  CONSTRAINT assessments_pkey PRIMARY KEY (id),
  CONSTRAINT assessments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.job_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  assessment_id uuid,
  job_id uuid NOT NULL,
  match_score numeric NOT NULL CHECK (match_score >= 0::numeric AND match_score <= 100::numeric),
  known_dimensions smallint,
  breakdown jsonb,
  reason text,
  input_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT job_recommendations_pkey PRIMARY KEY (id),
  CONSTRAINT job_recommendations_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id),
  CONSTRAINT job_recommendations_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_course_progress (
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'planned'::text CHECK (status = ANY (ARRAY['planned'::text, 'in_progress'::text, 'completed'::text])),
  completed_at timestamp with time zone,
  CONSTRAINT user_course_progress_pkey PRIMARY KEY (user_id, course_id),
  CONSTRAINT user_course_progress_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT user_course_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_skills (
  user_id uuid NOT NULL,
  skill_code text NOT NULL,
  source text NOT NULL DEFAULT 'manual'::text CHECK (source = ANY (ARRAY['manual'::text, 'ai'::text, 'course'::text])),
  level text CHECK (level IS NULL OR (level = ANY (ARRAY['Dasar'::text, 'Menengah'::text, 'Mahir'::text]))),
  document_id uuid,
  CONSTRAINT user_skills_pkey PRIMARY KEY (user_id, skill_code),
  CONSTRAINT user_skills_skill_code_fkey FOREIGN KEY (skill_code) REFERENCES public.skills(code),
  CONSTRAINT user_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_skills_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.application_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  status text NOT NULL,
  note text,
  changed_by uuid,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT application_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT application_status_history_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id),
  CONSTRAINT application_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['certificate'::text, 'portfolio'::text])),
  title text NOT NULL,
  issuer text,
  year smallint,
  file_path text NOT NULL,
  file_name text,
  file_size integer,
  extracted_skills jsonb,
  created_at timestamp with time zone DEFAULT now(),
  kind text CHECK (kind = ANY (ARRAY['certificate'::text, 'portfolio'::text])),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.ai_job_explanations (
  user_id uuid NOT NULL,
  job_id uuid NOT NULL,
  input_hash text NOT NULL,
  explanation text NOT NULL CHECK (length(btrim(explanation)) > 0),
  model text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_job_explanations_pkey PRIMARY KEY (user_id, job_id),
  CONSTRAINT ai_job_explanations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT ai_job_explanations_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.ai_usage_daily (
  user_id uuid NOT NULL,
  day date NOT NULL,
  feature text NOT NULL,
  count integer NOT NULL DEFAULT 0 CHECK (count >= 0),
  CONSTRAINT ai_usage_daily_pkey PRIMARY KEY (user_id, day, feature),
  CONSTRAINT ai_usage_daily_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
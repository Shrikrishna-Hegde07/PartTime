-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('student', 'client', 'admin');
CREATE TYPE public.job_category AS ENUM ('Catering', 'Stock Audit', 'Event Mgmt');
CREATE TYPE public.job_status AS ENUM ('open', 'filled', 'completed', 'cancelled');
CREATE TYPE public.application_status AS ENUM ('confirmed', 'completed', 'no_show', 'cancelled');
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');

-- =========================================================
-- UTILITY: updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  city TEXT DEFAULT 'Bengaluru',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- USER ROLES (separate table — never store role on profile)
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- STUDENT DETAILS
-- =========================================================
CREATE TABLE public.student_details (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  college_name TEXT,
  course TEXT,
  year_of_study INT,
  college_email TEXT,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  no_show_count INT NOT NULL DEFAULT 0,
  suspended_until TIMESTAMPTZ,
  rating NUMERIC(2,1) DEFAULT 5.0,
  total_shifts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student details viewable by authenticated"
ON public.student_details FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Students can update own details"
ON public.student_details FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own details"
ON public.student_details FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER student_details_updated_at
BEFORE UPDATE ON public.student_details
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- CLIENT DETAILS
-- =========================================================
CREATE TABLE public.client_details (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  contact_person TEXT,
  gstin TEXT,
  business_type TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client details viewable by authenticated"
ON public.client_details FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Clients can update own details"
ON public.client_details FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Clients can insert own details"
ON public.client_details FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER client_details_updated_at
BEFORE UPDATE ON public.client_details
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- JOBS
-- =========================================================
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category job_category NOT NULL,
  shift_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  pay_amount NUMERIC(10,2) NOT NULL,
  pay_unit TEXT NOT NULL DEFAULT 'shift' CHECK (pay_unit IN ('shift', 'hour')),
  slots_total INT NOT NULL CHECK (slots_total > 0),
  slots_filled INT NOT NULL DEFAULT 0,
  location_text TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Bengaluru',
  is_flash BOOLEAN NOT NULL DEFAULT false,
  flash_expires_at TIMESTAMPTZ,
  status job_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_status_date ON public.jobs(status, shift_date);
CREATE INDEX idx_jobs_client ON public.jobs(client_id);
CREATE INDEX idx_jobs_city ON public.jobs(city);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jobs viewable by authenticated"
ON public.jobs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Clients can post jobs"
ON public.jobs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_id AND public.has_role(auth.uid(), 'client'));

CREATE POLICY "Clients can update own jobs"
ON public.jobs FOR UPDATE
TO authenticated
USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete own jobs"
ON public.jobs FOR DELETE
TO authenticated
USING (auth.uid() = client_id);

CREATE TRIGGER jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- APPLICATIONS
-- =========================================================
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'confirmed',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (job_id, student_id)
);

CREATE INDEX idx_applications_student ON public.applications(student_id);
CREATE INDEX idx_applications_job ON public.applications(job_id);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students see own applications"
ON public.applications FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "Clients see applications to own jobs"
ON public.applications FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.client_id = auth.uid()
));

CREATE POLICY "Students apply to jobs"
ON public.applications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id AND public.has_role(auth.uid(), 'student'));

CREATE POLICY "Students can cancel own applications"
ON public.applications FOR UPDATE
TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "Clients can update applications to own jobs"
ON public.applications FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.client_id = auth.uid()
));

-- =========================================================
-- BUSINESS RULE: 8 jobs/month + 3-strike suspension
-- Function called when applying for a job
-- =========================================================
CREATE OR REPLACE FUNCTION public.check_student_can_apply(_student_id UUID)
RETURNS TABLE (can_apply BOOLEAN, reason TEXT, jobs_this_month INT, no_shows INT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _suspended_until TIMESTAMPTZ;
  _no_shows INT;
  _monthly_count INT;
BEGIN
  SELECT suspended_until, no_show_count
    INTO _suspended_until, _no_shows
  FROM public.student_details
  WHERE user_id = _student_id;

  SELECT COUNT(*)::INT
    INTO _monthly_count
  FROM public.applications
  WHERE student_id = _student_id
    AND applied_at >= date_trunc('month', now())
    AND status IN ('confirmed', 'completed');

  IF _suspended_until IS NOT NULL AND _suspended_until > now() THEN
    RETURN QUERY SELECT false, 'Account suspended for no-shows. Try again after ' || _suspended_until::DATE, _monthly_count, _no_shows;
    RETURN;
  END IF;

  IF _monthly_count >= 8 THEN
    RETURN QUERY SELECT false, 'Monthly limit reached. Focus on your studies!', _monthly_count, _no_shows;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'OK'::TEXT, _monthly_count, _no_shows;
END;
$$;

-- =========================================================
-- TRIGGER: when application status flips to no_show, increment counter & suspend if 3rd
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_no_show()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'no_show' AND (OLD.status IS NULL OR OLD.status <> 'no_show') THEN
    UPDATE public.student_details
    SET no_show_count = no_show_count + 1,
        suspended_until = CASE
          WHEN no_show_count + 1 >= 3 THEN now() + INTERVAL '90 days'
          ELSE suspended_until
        END
    WHERE user_id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER applications_no_show_trigger
AFTER UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.handle_no_show();

-- =========================================================
-- TRIGGER: keep slots_filled in sync
-- =========================================================
CREATE OR REPLACE FUNCTION public.sync_job_slots_filled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status IN ('confirmed', 'completed')) THEN
    UPDATE public.jobs SET slots_filled = slots_filled + 1 WHERE id = NEW.job_id;
  ELSIF (TG_OP = 'DELETE' AND OLD.status IN ('confirmed', 'completed')) THEN
    UPDATE public.jobs SET slots_filled = GREATEST(slots_filled - 1, 0) WHERE id = OLD.job_id;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.status IN ('confirmed', 'completed') AND NEW.status NOT IN ('confirmed', 'completed') THEN
      UPDATE public.jobs SET slots_filled = GREATEST(slots_filled - 1, 0) WHERE id = NEW.job_id;
    ELSIF OLD.status NOT IN ('confirmed', 'completed') AND NEW.status IN ('confirmed', 'completed') THEN
      UPDATE public.jobs SET slots_filled = slots_filled + 1 WHERE id = NEW.job_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER applications_sync_slots
AFTER INSERT OR UPDATE OR DELETE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.sync_job_slots_filled();

-- =========================================================
-- AUTO-CREATE profile + default student role on signup
-- Reads role from user metadata: { role: 'student' | 'client' }
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );

  -- Determine role from metadata, default to student
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student');

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  -- Create role-specific record
  IF _role = 'student' THEN
    INSERT INTO public.student_details (user_id, college_name, college_email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'college_name', ''),
      NEW.email
    );
  ELSIF _role = 'client' THEN
    INSERT INTO public.client_details (user_id, business_name, contact_person)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
      COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
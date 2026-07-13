
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin','staff','patient');
CREATE TYPE public.insurance_type AS ENUM ('BPJS','Private','Self-Pay','Corporate');
CREATE TYPE public.patient_status AS ENUM ('Active','Inactive');
CREATE TYPE public.registration_status AS ENUM ('Pending','Confirmed','InQueue','InProgress','Completed','Cancelled');
CREATE TYPE public.queue_status AS ENUM ('Waiting','Called','Serving','Done','Skipped');
CREATE TYPE public.doctor_status AS ENUM ('Available','OnLeave','Inactive');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self upsert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============ TIMESTAMP TRIGGER ============
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============ NEW USER SIGNUP HOOK ============
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'patient');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ PATIENTS ============
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  medical_record_no TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  phone TEXT,
  address TEXT,
  insurance insurance_type NOT NULL DEFAULT 'Self-Pay',
  bpjs_number TEXT,
  status patient_status NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_patients_user ON public.patients(user_id);
CREATE INDEX idx_patients_mrn ON public.patients(medical_record_no);
CREATE TRIGGER trg_patients_touch BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patients self read" ON public.patients FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "patients admin write" ON public.patients FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));

-- ============ CLINICS ============
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  location TEXT,
  icon TEXT DEFAULT 'stethoscope',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_clinics_touch BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
GRANT SELECT ON public.clinics TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.clinics TO authenticated;
GRANT ALL ON public.clinics TO service_role;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinics public read" ON public.clinics FOR SELECT USING (true);
CREATE POLICY "clinics admin write" ON public.clinics FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ DOCTORS ============
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  photo_url TEXT,
  bio TEXT,
  license_no TEXT,
  status doctor_status NOT NULL DEFAULT 'Available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doctors_clinic ON public.doctors(clinic_id);
CREATE TRIGGER trg_doctors_touch BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
GRANT SELECT ON public.doctors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO service_role;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doctors public read" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "doctors admin write" ON public.doctors FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ SCHEDULES ============
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  quota INT NOT NULL DEFAULT 20,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);
CREATE INDEX idx_schedules_doctor_day ON public.schedules(doctor_id, day_of_week);
CREATE TRIGGER trg_schedules_touch BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
GRANT SELECT ON public.schedules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.schedules TO authenticated;
GRANT ALL ON public.schedules TO service_role;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules public read" ON public.schedules FOR SELECT USING (true);
CREATE POLICY "schedules admin write" ON public.schedules FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ REGISTRATIONS ============
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  schedule_id UUID REFERENCES public.schedules(id),
  visit_date DATE NOT NULL,
  complaint TEXT,
  insurance insurance_type NOT NULL DEFAULT 'Self-Pay',
  bpjs_number TEXT,
  referral_number TEXT,
  status registration_status NOT NULL DEFAULT 'Pending',
  queue_number INT,
  estimated_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reg_patient ON public.registrations(patient_id);
CREATE INDEX idx_reg_doctor_date ON public.registrations(doctor_id, visit_date);
CREATE INDEX idx_reg_status ON public.registrations(status);
CREATE TRIGGER trg_reg_touch BEFORE UPDATE ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO authenticated;
GRANT ALL ON public.registrations TO service_role;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reg patient read own" ON public.registrations FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.patients p WHERE p.id=patient_id AND p.user_id=auth.uid())
  OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')
);
CREATE POLICY "reg patient insert own" ON public.registrations FOR INSERT TO authenticated WITH CHECK (
  EXISTS(SELECT 1 FROM public.patients p WHERE p.id=patient_id AND p.user_id=auth.uid())
  OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')
);
CREATE POLICY "reg admin update" ON public.registrations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "reg admin delete" ON public.registrations FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));

-- Auto-generate queue number per (doctor, date)
CREATE OR REPLACE FUNCTION public.assign_queue_number() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE next_no INT;
BEGIN
  IF NEW.queue_number IS NULL THEN
    SELECT COALESCE(MAX(queue_number),0)+1 INTO next_no
    FROM public.registrations
    WHERE doctor_id = NEW.doctor_id AND visit_date = NEW.visit_date;
    NEW.queue_number = next_no;
    NEW.estimated_time = (NEW.visit_date::timestamptz + TIME '08:00' + (next_no * INTERVAL '15 minutes'));
    NEW.status = 'InQueue';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_assign_queue BEFORE INSERT ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.assign_queue_number();

-- ============ QUEUES (live serving state per doctor/date) ============
CREATE TABLE public.queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  queue_number INT NOT NULL,
  status queue_status NOT NULL DEFAULT 'Waiting',
  called_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_queue_doctor_date ON public.queues(doctor_id, visit_date);
CREATE TRIGGER trg_queue_touch BEFORE UPDATE ON public.queues FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
GRANT SELECT ON public.queues TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.queues TO authenticated;
GRANT ALL ON public.queues TO service_role;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "queues public read" ON public.queues FOR SELECT USING (true);
CREATE POLICY "queues staff write" ON public.queues FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));

-- Auto-create queue on registration insert
CREATE OR REPLACE FUNCTION public.create_queue_entry() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  INSERT INTO public.queues(registration_id, doctor_id, visit_date, queue_number)
  VALUES (NEW.id, NEW.doctor_id, NEW.visit_date, NEW.queue_number);
  RETURN NEW;
END $$;
CREATE TRIGGER trg_create_queue AFTER INSERT ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.create_queue_entry();

-- ============ MEDICAL HISTORY ============
CREATE TABLE public.medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id),
  visit_date DATE NOT NULL,
  diagnosis TEXT NOT NULL,
  doctor_notes TEXT,
  prescription TEXT,
  lab_results TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mh_patient ON public.medical_history(patient_id);
CREATE TRIGGER trg_mh_touch BEFORE UPDATE ON public.medical_history FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_history TO authenticated;
GRANT ALL ON public.medical_history TO service_role;
ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mh patient read own" ON public.medical_history FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.patients p WHERE p.id=patient_id AND p.user_id=auth.uid())
  OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')
);
CREATE POLICY "mh staff write" ON public.medical_history FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));

-- ============ ANNOUNCEMENTS ============
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_ann_touch BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann public read" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "ann admin write" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.queues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;

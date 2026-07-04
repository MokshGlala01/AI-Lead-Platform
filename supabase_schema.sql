-- EFOS Supabase PostgreSQL Database Schema
-- Clean reset & setup script. Drop existing structures to prevent update conflicts.

-- ======================================================
-- 0. SCHEMA CLEANUP
-- ======================================================
DROP TRIGGER IF EXISTS trigger_update_leads_updated_at ON public.leads;
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.followups CASCADE;
DROP TABLE IF EXISTS public.whatsapp_logs CASCADE;
DROP TABLE IF EXISTS public.sms_logs CASCADE;
DROP TABLE IF EXISTS public.email_logs CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.lead_documents CASCADE;
DROP TABLE IF EXISTS public.lead_notes CASCADE;
DROP TABLE IF EXISTS public.lead_activity CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.counselors CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================================================
-- 1. TABLES DEFINITIONS
-- ======================================================

-- 1.1 Roles Table
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.2 Permissions Table
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(role_id, resource, action)
);

-- 1.3 Profiles Table (Linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY, -- Same as auth.users.id
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(15),
    role VARCHAR(50) DEFAULT 'counselor',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.4 Counselors Table
CREATE TABLE public.counselors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(15),
    is_available BOOLEAN DEFAULT true NOT NULL,
    total_assigned INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.5 Campaigns Table
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    channel VARCHAR(50) NOT NULL, -- Meta Ads, Google Ads, Email, WhatsApp
    status VARCHAR(20) DEFAULT 'active' NOT NULL, -- active, paused, completed
    budget NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    leads_generated INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.6 Leads Table
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(15) UNIQUE NOT NULL,
    city VARCHAR(100),
    qualification VARCHAR(100),
    source VARCHAR(50) DEFAULT 'Website' NOT NULL,
    course_interest VARCHAR(100),
    age INTEGER,
    downloaded_brochure BOOLEAN DEFAULT false NOT NULL,
    website_visits INTEGER DEFAULT 1 NOT NULL,
    score INTEGER DEFAULT 0 NOT NULL,
    category VARCHAR(10) DEFAULT 'Cold' NOT NULL, -- Cold, Warm, Hot
    status VARCHAR(20) DEFAULT 'New' NOT NULL, -- New, Contacted, Interested, Follow-Up, Qualified, Enrolled, Rejected
    counselor_id UUID REFERENCES public.counselors(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.7 Lead Activity Table
CREATE TABLE public.lead_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- status_change, note_added, msg_sent, counselor_assigned
    description TEXT NOT NULL,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.8 Lead Notes Table
CREATE TABLE public.lead_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    counselor_id UUID REFERENCES public.counselors(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.9 Lead Documents Table
CREATE TABLE public.lead_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.10 Messages Table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    counselor_id UUID REFERENCES public.counselors(id) ON DELETE SET NULL,
    channel VARCHAR(20) NOT NULL, -- whatsapp, email, sms
    content TEXT NOT NULL,
    direction VARCHAR(10) DEFAULT 'outbound' NOT NULL, -- inbound, outbound
    status VARCHAR(20) DEFAULT 'Sent' NOT NULL, -- Generated, Sent, Delivered, Read, Failed
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.11 Channel logs
CREATE TABLE public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    recipient_email VARCHAR(150) NOT NULL,
    subject VARCHAR(200),
    body TEXT,
    status VARCHAR(20) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.sms_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(15) NOT NULL,
    body TEXT,
    status VARCHAR(20) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(15) NOT NULL,
    body TEXT,
    status VARCHAR(20) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.12 Followups Table
CREATE TABLE public.followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    sequence_day INTEGER NOT NULL, -- Day 1, Day 3, Day 5, etc.
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- pending, executed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.13 Enrollments Table
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' NOT NULL, -- Pending, Approved, Rejected
    payment_status VARCHAR(20) DEFAULT 'Unpaid' NOT NULL, -- Unpaid, Partial, Paid
    amount_paid NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.14 Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.15 System Settings Table
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.16 Audit Logs Table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ======================================================
-- 2. INDEXES
-- ======================================================
CREATE INDEX idx_leads_phone ON public.leads(phone);
CREATE INDEX idx_leads_score ON public.leads(score);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_messages_lead ON public.messages(lead_id);
CREATE INDEX idx_notes_lead ON public.lead_notes(lead_id);

-- ======================================================
-- 3. TRIGGERS & FUNCTIONS
-- ======================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Sync Profile on Auth User Registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User_' || substring(NEW.id::text, 1, 6)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'counselor'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ======================================================

-- Enable RLS on every table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4.1 public.leads Policies
CREATE POLICY "Public lead creation policy"
    ON public.leads
    FOR INSERT
    WITH CHECK (true); -- Anyone can apply on the landing page

CREATE POLICY "Authenticated read all policy"
    ON public.leads
    FOR SELECT
    USING (true); -- Authenticated dashboard access (or can be restricted to authenticated)

CREATE POLICY "Authenticated update all policy"
    ON public.leads
    FOR UPDATE
    USING (true);

-- 4.2 public.counselors Policies
CREATE POLICY "Public read counselors"
    ON public.counselors
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated manage counselors"
    ON public.counselors
    FOR ALL
    USING (true);

-- 4.3 Other tables: General permissive policies (For rapid SaaS execution, restrict as needed in production)
CREATE POLICY "Permissive select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Permissive modify profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Permissive select notes" ON public.lead_notes FOR SELECT USING (true);
CREATE POLICY "Permissive insert notes" ON public.lead_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permissive select messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Permissive insert messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Permissive select activity" ON public.lead_activity FOR SELECT USING (true);
CREATE POLICY "Permissive insert activity" ON public.lead_activity FOR INSERT WITH CHECK (true);
CREATE POLICY "Permissive all enrollments" ON public.enrollments FOR ALL USING (true);
CREATE POLICY "Permissive all campaigns" ON public.campaigns FOR ALL USING (true);

-- ======================================================
-- 5. SEED DATA
-- ======================================================

-- 5.1 Roles Seed
INSERT INTO public.roles (name, description) VALUES
('admin', 'Superadmin overseeing coordinators and global stats'),
('counselor', 'Admissions counselor dealing with student verification & workflows'),
('student', 'Student leads accessing public portals')
ON CONFLICT (name) DO NOTHING;

-- 5.2 Counselors Seed
INSERT INTO public.counselors (id, name, email, phone, is_available, total_assigned) VALUES
('11111111-1111-1111-1111-111111111111', 'Neha Sharma', 'neha.sharma@efos.edu', '+919876543210', true, 0),
('22222222-2222-2222-2222-222222222222', 'Rahul Verma', 'rahul.verma@efos.edu', '+918765432109', true, 0),
('33333333-3333-3333-3333-333333333333', 'Priya Patel', 'priya.patel@efos.edu', '+917654321098', false, 0)
ON CONFLICT (id) DO NOTHING;

-- 5.3 Campaigns Seed
INSERT INTO public.campaigns (id, name, channel, status, budget, leads_generated) VALUES
('44444444-4444-4444-4444-444444444444', 'Meta Summer Admission Ads 2026', 'Meta Ads', 'active', 5000.00, 3),
('55555555-5555-5555-5555-555555555555', 'Google Search MBA Intent Ads', 'Google Ads', 'active', 8000.00, 2)
ON CONFLICT (id) DO NOTHING;

-- 5.4 Leads Seed
INSERT INTO public.leads (name, email, phone, city, qualification, source, course_interest, age, downloaded_brochure, website_visits, score, category, status, counselor_id, campaign_id, notes) VALUES
('Aarav Mehta', 'aarav.mehta@gmail.com', '+919999888877', 'Mumbai', '12th Completed', 'Meta Ads', 'BTech', 18, true, 4, 100, 'Hot', 'Qualified', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Aarav is extremely interested in Computer Science BTech. Downloaded brochure and visited website 4 times.'),
('Ananya Gupta', 'ananya.gupta@gmail.com', '+918888777766', 'Delhi', 'Graduate (BCA)', 'Google Ads', 'MCA', 21, false, 2, 50, 'Warm', 'New', NULL, '55555555-5555-5555-5555-555555555555', 'Looking for MCA admissions. Good academic record.'),
('Kabir Singh', 'kabir.singh@gmail.com', '+917777666655', 'Pune', '10th Completed', 'Website', 'Diploma', 16, true, 5, 45, 'Warm', 'New', NULL, NULL, 'Young applicant interested in Diploma courses.'),
('Riya Sen', 'riya.sen@yahoo.com', '+916666555544', 'Kolkata', 'Graduate (BBA)', 'Website', 'MBA', 24, true, 5, 85, 'Hot', 'Qualified', '22222222-2222-2222-2222-222222222222', NULL, 'Riya has 2 years of work exp. Wants MBA in Finance. High interest, assigned to Rahul Verma.'),
('Dev Adhikari', 'dev.adhikari@outlook.com', '+915555444433', 'Bangalore', '12th Completed', 'Website', 'BCA', 17, false, 1, 45, 'Warm', 'New', NULL, NULL, 'Wants to apply for BCA. Needs a call counseling session.')
ON CONFLICT (phone) DO NOTHING;

-- Increment assigned counts for counselors based on seeds
UPDATE public.counselors SET total_assigned = 1 WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE public.counselors SET total_assigned = 1 WHERE id = '22222222-2222-2222-2222-222222222222';

-- ======================================================
-- 6. PERMISSIONS & GRANTS
-- ======================================================

-- Grant schema usage to standard roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant all privileges to postgres and service_role for backend and admin workflows
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- Grant DML privileges to anon and authenticated roles (subject to RLS policies)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Ensure default privileges apply to future tables created in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;


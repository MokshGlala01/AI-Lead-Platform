-- =====================
-- TABLE: counselors
-- =====================
CREATE TABLE counselors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(15),
  is_available BOOLEAN DEFAULT true,
  total_assigned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- TABLE: leads
-- =====================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(15) NOT NULL UNIQUE,
  city VARCHAR(100),
  qualification VARCHAR(100),
  source VARCHAR(50) DEFAULT 'Website',
  course_interest VARCHAR(100),
  age INTEGER,
  downloaded_brochure BOOLEAN DEFAULT false,
  website_visits INTEGER DEFAULT 1,
  score INTEGER DEFAULT 0,
  category VARCHAR(10) DEFAULT 'Cold',
  status VARCHAR(20) DEFAULT 'New',
  counselor_id UUID REFERENCES counselors(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- TABLE: messages
-- =====================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  channel VARCHAR(20) CHECK (channel IN ('whatsapp', 'email', 'sms')),
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'Generated'
);

-- =====================
-- TABLE: followup_sequences
-- =====================
CREATE TABLE followup_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- INDEXES for performance
-- =====================
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_category ON leads(category);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

-- =====================
-- AUTO-UPDATE trigger for updated_at
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- SEED: Sample counselors
-- =====================
INSERT INTO counselors (name, email, phone) VALUES
  ('Priya Sharma',  'priya@efos.in',  '9999000001'),
  ('Amit Verma',    'amit@efos.in',   '9999000002'),
  ('Sneha Patel',   'sneha@efos.in',  '9999000003');

-- =====================
-- RLS: Allow all operations for anon key (student project)
-- =====================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselors ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on leads" ON leads FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on messages" ON messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on counselors" ON counselors FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on followup_sequences" ON followup_sequences FOR ALL TO anon USING (true) WITH CHECK (true);

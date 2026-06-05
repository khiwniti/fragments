-- ══════════════════════════════════════════════
-- KHIW.DEV PLATFORM SCHEMA
-- ══════════════════════════════════════════════
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ══════════════════════════════════════════════
-- PORTFOLIO TABLES
-- ══════════════════════════════════════════════

-- ── Profile (singleton) ──
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL DEFAULT 'ikkyu',
  full_name_en  TEXT NOT NULL DEFAULT 'Khiw (Ikkyu) Nitithadachot',
  full_name_th  TEXT DEFAULT 'คิว (อิคคิว) นิติธาดาโชติ',
  display_name  TEXT NOT NULL DEFAULT 'Ikkyu',
  title_en      TEXT NOT NULL DEFAULT 'AI Agent Architect & Multi-Agent Systems Engineer',
  title_th      TEXT DEFAULT 'สถาปนิก AI Agent และวิศวกรระบบ Multi-Agent',
  tagline_en    TEXT DEFAULT 'AI-Augmented Full-Stack Developer',
  tagline_th    TEXT DEFAULT 'นักพัฒนา Full-Stack ที่ขับเคลื่อนด้วย AI',
  bio_short_en  TEXT,
  bio_short_th  TEXT,
  bio_long_en   TEXT,
  bio_long_th   TEXT,
  email         TEXT DEFAULT 'kiw.brw@gmail.com',
  phone         TEXT DEFAULT '+66829971887',
  location_en   TEXT DEFAULT 'Bangkok, Thailand',
  location_th   TEXT DEFAULT 'กรุงเทพมหานคร, ประเทศไทย',
  available     BOOLEAN DEFAULT true,
  socials       JSONB DEFAULT '{
    "github": "https://github.com/getintheQ",
    "linkedin": "https://linkedin.com/in/getintheq",
    "portfolio": "https://getintheq.space",
    "facebook": "https://facebook.com/kp1visible",
    "datacamp": "https://datacamp.com/portfolio/getintheq"
  }'::JSONB,
  stats         JSONB DEFAULT '{
    "live_projects": 29,
    "total_projects": 50,
    "cloudflare_workers": 47,
    "industries": 9,
    "years_experience": 7
  }'::JSONB,
  og_image_url  TEXT,
  resume_url    TEXT DEFAULT '/api/resume',
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Career ──
CREATE TABLE IF NOT EXISTS careers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title_en        TEXT NOT NULL,
  title_th        TEXT,
  company_en      TEXT NOT NULL,
  company_th      TEXT,
  company_url     TEXT,
  start_date      DATE NOT NULL,
  end_date        DATE,
  is_current      BOOLEAN DEFAULT false,
  is_concurrent   BOOLEAN DEFAULT false,
  description_en  TEXT,
  description_th  TEXT,
  achievements    JSONB DEFAULT '[]'::JSONB,
  employment_type TEXT CHECK (employment_type IN ('full_time', 'contract', 'freelance', 'internship', 'program')),
  industry        TEXT,
  location_en     TEXT,
  skills_used     TEXT[] DEFAULT '{}',
  highlight       BOOLEAN DEFAULT false,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Projects ──
CREATE TABLE IF NOT EXISTS projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  description_en  TEXT,
  description_th  TEXT,
  tagline_en      TEXT,
  live_url        TEXT,
  github_url      TEXT,
  vercel_slug     TEXT,
  category        TEXT CHECK (category IN (
    'ai_agent', 'weather', 'disaster', 'construction', 'facility',
    'hospitality', 'healthcare', 'government', 'data', 'simulation',
    'portfolio', 'education', 'iot', 'chatbot', 'realtime', 'utility', 'test'
  )),
  framework       TEXT,
  tech_stack      TEXT[] DEFAULT '{}',
  status          TEXT CHECK (status IN ('live', 'error', 'empty', 'archived', 'wip')) DEFAULT 'wip',
  is_showcase     BOOLEAN DEFAULT false,
  platform        TEXT CHECK (platform IN ('vercel', 'cloudflare', 'docker', 'other')) DEFAULT 'vercel',
  custom_domain   TEXT,
  thumbnail_url   TEXT,
  screenshots     TEXT[] DEFAULT '{}',
  readme_md       TEXT,
  client_en       TEXT,
  client_th       TEXT,
  metrics         JSONB DEFAULT '{}'::JSONB,
  sort_order      INT DEFAULT 0,
  featured_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_tags (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tag        TEXT NOT NULL,
  PRIMARY KEY (project_id, tag)
);

-- ── Skills ──
CREATE TABLE IF NOT EXISTS skills (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  category      TEXT CHECK (category IN (
    'ai_agent', 'ml_framework', 'frontend', 'backend', 'database',
    'cloud', 'devops', 'data', 'simulation', 'cad', 'platform', 'protocol', 'language'
  )),
  level         TEXT CHECK (level IN ('expert', 'advanced', 'intermediate', 'beginner')) DEFAULT 'intermediate',
  years_used    NUMERIC(3,1),
  icon_url      TEXT,
  sort_order    INT DEFAULT 0,
  is_featured   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Domains ──
CREATE TABLE IF NOT EXISTS domains (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  slug            TEXT UNIQUE NOT NULL,
  name_en         TEXT NOT NULL,
  name_th         TEXT,
  icon            TEXT,
  description_en  TEXT,
  description_th  TEXT,
  key_tech        TEXT[] DEFAULT '{}',
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Education ──
CREATE TABLE IF NOT EXISTS education (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  degree_en       TEXT NOT NULL,
  degree_th       TEXT,
  institution_en  TEXT NOT NULL,
  institution_th  TEXT,
  field_en        TEXT,
  field_th        TEXT,
  start_year      INT,
  end_year        INT,
  gpa             NUMERIC(3,2),
  honors_en       TEXT,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Certifications ──
CREATE TABLE IF NOT EXISTS certifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name_en         TEXT NOT NULL,
  name_th         TEXT,
  issuer          TEXT,
  issue_date      DATE,
  expiry_date     DATE,
  credential_url  TEXT,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Workers ──
CREATE TABLE IF NOT EXISTS workers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT,
  description_en  TEXT,
  worker_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════
-- BLOG TABLES (completions / enhancements)
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS post_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_id     UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  author_name   TEXT NOT NULL,
  author_email  TEXT,
  author_url    TEXT,
  body          TEXT NOT NULL,
  is_approved   BOOLEAN DEFAULT false,
  is_pinned     BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  reaction    TEXT CHECK (reaction IN ('like', 'insightful', 'fire', 'clap', 'bookmark')) NOT NULL,
  visitor_id  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, visitor_id, reaction)
);

CREATE TABLE IF NOT EXISTS media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  filename      TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  public_url    TEXT NOT NULL,
  mime_type     TEXT,
  size_bytes    BIGINT,
  width         INT,
  height        INT,
  alt_text      TEXT,
  caption       TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════
-- AI AGENT TABLES
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type   TEXT NOT NULL CHECK (source_type IN (
    'career', 'project', 'skill', 'domain', 'education',
    'certification', 'post', 'profile', 'custom'
  )),
  source_id     UUID,
  source_title  TEXT,
  content       TEXT NOT NULL,
  embedding     vector(1024),
  metadata      JSONB DEFAULT '{}'::JSONB,
  chunk_index   INT DEFAULT 0,
  token_count   INT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- HNSW index for fast similarity search (1024 dims for NVIDIA NIM)
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE TABLE IF NOT EXISTS conversations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id            TEXT,
  visitor_name          TEXT,
  title                 TEXT,
  language              TEXT DEFAULT 'en' CHECK (language IN ('en', 'th')),
  status                TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'archived')),
  context_summary       TEXT,
  message_count         INT DEFAULT 0,
  total_tokens          INT DEFAULT 0,
  total_cost_usd        NUMERIC(10,6) DEFAULT 0,
  rating                INT CHECK (rating BETWEEN 1 AND 5),
  started_at            TIMESTAMPTZ DEFAULT now(),
  last_active           TIMESTAMPTZ DEFAULT now(),
  ended_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content           TEXT NOT NULL,
  thinking          TEXT,
  tool_name         TEXT,
  tool_input        JSONB,
  tool_output       JSONB,
  cited_chunks      UUID[] DEFAULT '{}',
  input_tokens      INT,
  output_tokens     INT,
  latency_ms        INT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_memory (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_type       TEXT CHECK (memory_type IN (
    'visitor_preference', 'faq', 'correction',
    'conversation_summary', 'learned_fact'
  )),
  content           TEXT NOT NULL,
  visitor_id        TEXT,
  conversation_id   UUID REFERENCES conversations(id),
  weight            NUMERIC(3,2) DEFAULT 1.0,
  embedding         vector(1024),
  expires_at        TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id        UUID REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id   UUID REFERENCES conversations(id) ON DELETE CASCADE,
  rating            TEXT CHECK (rating IN ('positive', 'negative')) NOT NULL,
  comment           TEXT,
  issue_type        TEXT CHECK (issue_type IN (
    'wrong_fact', 'outdated', 'irrelevant', 'too_long', 'too_short',
    'wrong_language', 'missing_context', 'hallucination', 'other'
  )),
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_configs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT UNIQUE NOT NULL DEFAULT 'portfolio-agent',
  model             TEXT DEFAULT 'nvidia/meta/llama-3.3-70b-instruct',
  temperature       NUMERIC(3,2) DEFAULT 0.3,
  max_tokens        INT DEFAULT 2048,
  system_prompt     TEXT NOT NULL,
  rag_top_k         INT DEFAULT 8,
  rag_threshold     NUMERIC(3,2) DEFAULT 0.7,
  max_conversation_turns  INT DEFAULT 50,
  max_tokens_per_conversation INT DEFAULT 100000,
  enable_thinking   BOOLEAN DEFAULT true,
  enable_citations  BOOLEAN DEFAULT true,
  enable_memory     BOOLEAN DEFAULT true,
  enable_blog_search BOOLEAN DEFAULT true,
  enable_project_deep_dive BOOLEAN DEFAULT true,
  is_active         BOOLEAN DEFAULT true,
  version           INT DEFAULT 1,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_careers_profile ON careers(profile_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_careers_current ON careers(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_showcase ON projects(is_showcase) WHERE is_showcase = true;
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_featured ON skills(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_series ON posts(series_id);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_ai ON posts(is_ai_knowledge) WHERE is_ai_knowledge = true;

CREATE INDEX IF NOT EXISTS idx_knowledge_source ON knowledge_chunks(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_active ON knowledge_chunks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_conversations_visitor ON conversations(visitor_id, last_active DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_memory_visitor ON agent_memory(visitor_id) WHERE is_active = true;

-- Full-text search on posts
CREATE INDEX IF NOT EXISTS idx_posts_fts ON posts USING gin(
  to_tsvector('english', coalesce(title_en, '') || ' ' || coalesce(body_en, ''))
);

-- ══════════════════════════════════════════════
-- VECTOR SEARCH RPC
-- ══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 8,
  filter_source_types text[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_title TEXT,
  content TEXT,
  metadata JSONB,
  token_count INT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.source_type,
    kc.source_title,
    kc.content,
    kc.metadata,
    kc.token_count,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE
    kc.is_active = true
    AND (filter_source_types IS NULL OR kc.source_type = ANY(filter_source_types))
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ══════════════════════════════════════════════
-- RLS POLICIES
-- ══════════════════════════════════════════════

-- Public read access for portfolio data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "public_read_profiles" ON profiles FOR SELECT USING (true);

ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "public_read_careers" ON careers FOR SELECT USING (true);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "public_read_projects" ON projects FOR SELECT USING (true);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "public_read_skills" ON skills FOR SELECT USING (true);

ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "public_read_domains" ON domains FOR SELECT USING (true);

ALTER TABLE education ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "public_read_education" ON education FOR SELECT USING (true);

ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "public_read_certifications" ON certifications FOR SELECT USING (true);

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "public_read_workers" ON workers FOR SELECT USING (true);

-- Blog: only published posts are public
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "public_read_published_posts" ON posts FOR SELECT USING (status = 'published');
CREATE POLICY IF NOT EXISTS "admin_all_posts" ON posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "public_read_approved_comments" ON post_comments FOR SELECT USING (is_approved = true);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "public_read_reactions" ON post_reactions FOR SELECT USING (true);

-- Conversations: visitors can only see their own (simplified via service role)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "service_read_knowledge" ON knowledge_chunks FOR SELECT USING (is_active = true);
CREATE POLICY IF NOT EXISTS "service_read_conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "service_read_messages" ON messages FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "service_read_memory" ON agent_memory FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY IF NOT EXISTS "admin_all_conversations" ON conversations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "admin_all_messages" ON messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "admin_all_feedback" ON feedback FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════
-- TRIGGERS
-- ══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER IF NOT EXISTS trg_careers_updated BEFORE UPDATE ON careers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER IF NOT EXISTS trg_projects_updated BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER IF NOT EXISTS trg_posts_updated BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER IF NOT EXISTS trg_workers_updated BEFORE UPDATE ON workers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER IF NOT EXISTS trg_agent_configs_updated BEFORE UPDATE ON agent_configs FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER IF NOT EXISTS trg_knowledge_chunks_updated BEFORE UPDATE ON knowledge_chunks FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Auto-calculate reading time
CREATE OR REPLACE FUNCTION calculate_reading_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.word_count = array_length(regexp_split_to_array(coalesce(NEW.body_en, ''), '\s+'), 1);
  NEW.reading_time_min = GREATEST(1, COALESCE(NEW.word_count, 0) / 200);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trg_post_reading_time BEFORE INSERT OR UPDATE OF body_en ON posts
FOR EACH ROW EXECUTE FUNCTION calculate_reading_time();

-- Auto-increment message count on conversations
CREATE OR REPLACE FUNCTION increment_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET
    message_count = message_count + 1,
    last_active = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trg_message_count AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION increment_message_count();

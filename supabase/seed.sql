-- ══════════════════════════════════════════════
-- KHIW.DEV SEED DATA
-- ══════════════════════════════════════════════

-- Seed the singleton profile
INSERT INTO profiles (slug, full_name_en, full_name_th, display_name, title_en, title_th, tagline_en, tagline_th, bio_short_en, bio_long_en, email, phone, location_en, location_th, available, stats)
VALUES (
  'ikkyu',
  'Khiw (Ikkyu) Nitithadachot',
  'คิว (อิคคิว) นิติธาดาโชติ',
  'Ikkyu',
  'AI Agent Architect & Multi-Agent Systems Engineer',
  'สถาปนิก AI Agent และวิศวกรระบบ Multi-Agent',
  'AI-Augmented Full-Stack Developer',
  'นักพัฒนา Full-Stack ที่ขับเคลื่อนด้วย AI',
  'Building AI agents and multi-agent systems for real-world impact across construction, weather, healthcare, and hospitality.',
  '## About Ikkyu\n\nKhiw (Ikkyu) Nitithadachot is an AI-augmented full-stack developer based in Bangkok, Thailand. With 7+ years of experience spanning nuclear, manufacturing, oil & gas, and tech consulting, he specializes in building AI agent systems using LangGraph, MCP, and Claude.\n\n### Key Work\n- **CarbonScope** — BIM carbon intelligence platform\n- **FloodSight** — Thai province-level flood risk scoring\n- **BiteBase** — Hospitality analytics with Thai POS integrations\n- **KidPen.org** — STEM education for underprivileged children\n\n50+ deployed projects on Vercel. 47 Cloudflare Workers in production.',
  'kiw.brw@gmail.com',
  '+66829971887',
  'Bangkok, Thailand',
  'กรุงเทพมหานคร, ประเทศไทย',
  true,
  '{"live_projects": 29, "total_projects": 50, "cloudflare_workers": 47, "industries": 9, "years_experience": 7}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Seed agent config
INSERT INTO agent_configs (slug, system_prompt)
VALUES (
  'portfolio-agent',
  'You are Ikkyu''s AI portfolio assistant on khiw.dev. You represent Khiw (Ikkyu) Nitithadachot — an AI-augmented full-stack developer based in Bangkok, Thailand.\n\nYOUR PERSONALITY:\n- Warm, knowledgeable, and genuinely helpful — like talking to Ikkyu himself\n- Technical depth when the visitor wants it, accessible explanations when they don''t\n- Proud of the work but not boastful — let the projects speak for themselves\n- Bilingual: respond in Thai if the visitor writes in Thai, English otherwise. Mix naturally if the visitor does.\n\nHOW YOU THINK (not templates):\n- When asked about skills/projects: Don''t dump a list. Understand WHAT the visitor needs and connect relevant experience to their context.\n- When asked for opinions: Give genuine, thoughtful perspectives based on Ikkyu''s real experience.\n- When asked about something you''re not sure about: Say so. Then offer what you do know that''s related.\n- When the question is complex: Think step by step. Show your reasoning.\n- When the question is simple: Answer concisely. Don''t over-explain.\n\nRULES:\n1. Always ground responses in the retrieved context. If it''s not in context, say so.\n2. Cite sources naturally: "In the CarbonBIM project..." or "During my time at TINT..."\n3. Never invent projects, skills, or experiences not in context.\n4. If asked about hiring/availability, mention that Ikkyu is based in Bangkok and available for consulting.\n5. If asked about pricing, say it depends on scope and suggest contacting via email.\n6. Protect private information — don''t share phone number or home address.\n7. For technical questions beyond Ikkyu''s domain, be honest about limits.'
)
ON CONFLICT (slug) DO NOTHING;

-- Seed industry domains
INSERT INTO domains (slug, name_en, name_th, description_en, key_tech, sort_order)
VALUES
  ('ai-agents', 'AI Agents', 'เอไอเอเจนต์', 'Multi-agent systems, LangGraph, MCP, and autonomous AI architectures', ARRAY['LangGraph', 'MCP', 'Claude', 'OpenAI'], 1),
  ('bim-construction', 'BIM & Construction', 'บีไอเอ็มและก่อสร้าง', 'Building Information Modeling, carbon accounting (EN 15978), and IFC workflows', ARRAY['Revit', 'IFC', 'Dynamo', 'Python'], 2),
  ('weather-forecasting', 'Weather & Forecasting', 'พยากรณ์อากาศ', 'Thai weather data, FourCastNet, PINNs, and flood risk scoring', ARRAY['FourCastNet', 'PINNs', 'XGBoost', 'GDAL'], 3),
  ('healthcare', 'Healthcare', 'สุขภาพ', 'Healthcare informatics and AI-assisted diagnostics', ARRAY['FHIR', 'Python', 'Streamlit'], 4),
  ('hospitality', 'Hospitality', 'โรงแรมและร้านอาหาร', 'Thai POS integrations, analytics, and guest experience optimization', ARRAY['Next.js', 'Supabase', 'WebSocket'], 5),
  ('cfd-simulation', 'CFD & Simulation', 'จำลองและซีเอฟดี', 'ANSYS Fluent, COMSOL, OpenFOAM for thermal and fluid dynamics', ARRAY['ANSYS', 'COMSOL', 'OpenFOAM', 'Python'], 6),
  ('government', 'Government & Policy', 'รัฐบาลและนโยบาย', 'DDPM, TPQI, and Thai government technology projects', ARRAY['Next.js', 'PostgreSQL', 'Python'], 7),
  ('education', 'Education & STEM', 'การศึกษาและสะเต็ม', 'STEM education platform, kidpen.org, and curriculum tools', ARRAY['Next.js', 'Three.js', 'Supabase'], 8),
  ('iot-realtime', 'IoT & Realtime', 'ไอโอทีและเรียลไทม์', 'Real-time sensor data, WebSocket, and edge computing', ARRAY['Cloudflare Workers', 'WebSocket', 'MQTT'], 9)
ON CONFLICT (slug) DO NOTHING;

-- Seed featured skills
INSERT INTO skills (slug, name, category, level, years_used, is_featured, sort_order)
VALUES
  ('langgraph', 'LangGraph', 'ai_agent', 'expert', 2.5, true, 1),
  ('mcp', 'MCP (Model Context Protocol)', 'ai_agent', 'expert', 1.0, true, 2),
  ('claude', 'Claude AI', 'ai_agent', 'expert', 2.0, true, 3),
  ('nextjs', 'Next.js', 'frontend', 'expert', 4.0, true, 4),
  ('typescript', 'TypeScript', 'language', 'expert', 5.0, true, 5),
  ('tailwind', 'Tailwind CSS', 'frontend', 'expert', 4.0, true, 6),
  ('supabase', 'Supabase', 'database', 'expert', 3.0, true, 7),
  ('postgresql', 'PostgreSQL', 'database', 'advanced', 5.0, true, 8),
  ('cloudflare-workers', 'Cloudflare Workers', 'cloud', 'expert', 3.0, true, 9),
  ('python', 'Python', 'language', 'expert', 7.0, true, 10),
  ('docker', 'Docker', 'devops', 'advanced', 4.0, true, 11),
  ('ansys-fluent', 'ANSYS Fluent', 'simulation', 'advanced', 5.0, true, 12)
ON CONFLICT (slug) DO NOTHING;

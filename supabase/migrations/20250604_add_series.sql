-- Series table for blog post collections
CREATE TABLE IF NOT EXISTS series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add series_id FK to posts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'series_id'
  ) THEN
    ALTER TABLE posts ADD COLUMN series_id UUID REFERENCES series(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on series
ALTER TABLE series ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY IF NOT EXISTS "Allow public read on series" ON series
  FOR SELECT USING (true);

-- Admin full access policy (service role bypasses RLS, but explicit policy helps for future auth methods)
CREATE POLICY IF NOT EXISTS "Allow admin full access on series" ON series
  FOR ALL USING (true) WITH CHECK (true);

-- RPC for getting blog tag counts
CREATE OR REPLACE FUNCTION get_blog_tags()
RETURNS TABLE(name TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(tags) AS name,
    COUNT(*) AS count
  FROM posts
  WHERE status = 'published'
  GROUP BY name
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

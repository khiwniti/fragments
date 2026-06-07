-- Ensure anon and authenticated roles have schema and table permissions.
--
-- Supabase auto-grants these for new projects, but a migration that runs
-- CREATE TABLE / ALTER TABLE through a direct DB connection (not the
-- Supabase dashboard) can leave the anon role without USAGE on the public
-- schema, producing error 42501 "permission denied for schema public"
-- on every public read query (e.g. /blog).
--
-- This migration is idempotent and safe to re-run.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Future-proof: also grant on objects created by later migrations.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;

-- Tighten RLS: require an `is_admin` claim on the authenticated user.
-- The `auth.users.raw_app_meta_data` JSONB carries app-level claims.
-- The admin app uses cookie-based JWTs (not Supabase Auth), so this is
-- a defense-in-depth measure: it stops any future Supabase-authenticated
-- user (e.g. a /chat user who signs up) from gaining full CRUD on
-- posts/series via the public Supabase client.

-- Posts: only admin app users can write.
DROP POLICY IF EXISTS "admin_all_posts" ON posts;
CREATE POLICY "admin_all_posts" ON posts FOR ALL TO authenticated
  USING ((SELECT (raw_app_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT (raw_app_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()) = true);

-- Series: only admin app users can write. Public read remains open.
DROP POLICY IF EXISTS "Allow admin full access on series" ON series;
CREATE POLICY "admin_all_series" ON series FOR ALL TO authenticated
  USING ((SELECT (raw_app_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT (raw_app_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()) = true);

-- Other admin-only tables (conversations, messages, feedback) tightened the same way.
DROP POLICY IF EXISTS "admin_all_conversations" ON conversations;
CREATE POLICY "admin_all_conversations" ON conversations FOR ALL TO authenticated
  USING ((SELECT (raw_app_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT (raw_app_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()) = true);

DROP POLICY IF EXISTS "admin_all_messages" ON messages;
CREATE POLICY "admin_all_messages" ON messages FOR ALL TO authenticated
  USING ((SELECT (raw_app_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT (raw_app_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()) = true);

DROP POLICY IF EXISTS "admin_all_feedback" ON feedback;
CREATE POLICY "admin_all_feedback" ON feedback FOR ALL TO authenticated
  USING ((SELECT (raw_app_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT (raw_app_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()) = true);

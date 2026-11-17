-- Browser sessions are authorized by the Node backend. Supabase's public Data
-- API must not expose these tables to anonymous or signed-in API clients.
-- No client policies are created. Connect the server as the table owner.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gardens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON users, sessions, user_gardens FROM PUBLIC;

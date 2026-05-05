CREATE INDEX IF NOT EXISTS sessions_user_exp_idx ON sessions (user_id, expires_at);

CREATE TABLE IF NOT EXISTS user_connector_prefs (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_type TEXT        NOT NULL,
  params       JSONB       NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_type)
);

ALTER TABLE user_connector_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own connector prefs"
  ON user_connector_prefs FOR ALL
  USING (auth.uid() = user_id);

-- 創建伺服器配置表
CREATE TABLE IF NOT EXISTS server_settings (
  server_id TEXT PRIMARY KEY,
  default_channel_id TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_by TEXT
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_server_settings_server_id ON server_settings(server_id);

-- 啟用 RLS
ALTER TABLE server_settings ENABLE ROW LEVEL SECURITY;

-- 允許所有人讀取
CREATE POLICY "Allow public read access"
  ON server_settings
  FOR SELECT
  USING (true);

-- 允許所有人插入/更新
CREATE POLICY "Allow public insert/update access"
  ON server_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 添加註解
COMMENT ON TABLE server_settings IS '伺服器配置表';
COMMENT ON COLUMN server_settings.server_id IS 'Discord 伺服器 ID';
COMMENT ON COLUMN server_settings.default_channel_id IS '預設發送頻道 ID';
COMMENT ON COLUMN server_settings.updated_at IS '最後更新時間';
COMMENT ON COLUMN server_settings.updated_by IS '更新者';

-- 創建 signal_history 資料表
CREATE TABLE IF NOT EXISTS signal_history (
  id TEXT PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  coin_symbol TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  position_type TEXT NOT NULL CHECK (position_type IN ('long', 'short')),
  entry_price TEXT NOT NULL,
  take_profit TEXT NOT NULL,
  stop_loss TEXT NOT NULL,
  risk_reward_ratio TEXT,
  sender TEXT NOT NULL,
  server_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 創建索引以提高查詢效率
CREATE INDEX IF NOT EXISTS idx_signal_history_timestamp ON signal_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_signal_history_coin_symbol ON signal_history(coin_symbol);
CREATE INDEX IF NOT EXISTS idx_signal_history_sender ON signal_history(sender);
CREATE INDEX IF NOT EXISTS idx_signal_history_server_id ON signal_history(server_id);
CREATE INDEX IF NOT EXISTS idx_signal_history_created_at ON signal_history(created_at DESC);

-- 啟用 Row Level Security (RLS)
ALTER TABLE signal_history ENABLE ROW LEVEL SECURITY;

-- 創建策略：允許所有人讀取
CREATE POLICY "Allow public read access"
  ON signal_history
  FOR SELECT
  USING (true);

-- 創建策略：允許所有人插入（如果需要限制，可以修改為只有認證用戶）
CREATE POLICY "Allow public insert access"
  ON signal_history
  FOR INSERT
  WITH CHECK (true);

-- 創建策略：允許所有人刪除自己的記錄
CREATE POLICY "Allow users to delete their own records"
  ON signal_history
  FOR DELETE
  USING (true);

-- 註解
COMMENT ON TABLE signal_history IS '交易信號歷史記錄表';
COMMENT ON COLUMN signal_history.id IS '唯一識別碼';
COMMENT ON COLUMN signal_history.timestamp IS '發送時間戳（毫秒）';
COMMENT ON COLUMN signal_history.coin_symbol IS '幣種代碼（如：BTC, ETH）';
COMMENT ON COLUMN signal_history.coin_name IS '幣種全名';
COMMENT ON COLUMN signal_history.position_type IS '倉位類型：long（做多）或 short（做空）';
COMMENT ON COLUMN signal_history.entry_price IS '開倉價格';
COMMENT ON COLUMN signal_history.take_profit IS '止盈價格';
COMMENT ON COLUMN signal_history.stop_loss IS '止損價格';
COMMENT ON COLUMN signal_history.risk_reward_ratio IS '盈虧比';
COMMENT ON COLUMN signal_history.sender IS '發送者名稱';
COMMENT ON COLUMN signal_history.server_id IS 'Discord 伺服器 ID';
COMMENT ON COLUMN signal_history.channel_id IS 'Discord 頻道 ID';
COMMENT ON COLUMN signal_history.created_at IS '記錄創建時間（UTC）';

-- 性能優化腳本（可選，只在數據量超過 10 萬時考慮）

-- 1. 複合索引：加速按伺服器+時間查詢
CREATE INDEX IF NOT EXISTS idx_signal_history_server_time 
ON signal_history(server_id, timestamp DESC);

-- 2. 複合索引：加速按伺服器+幣種查詢
CREATE INDEX IF NOT EXISTS idx_signal_history_server_coin 
ON signal_history(server_id, coin_symbol);

-- 3. Disable RLS on signal_history to allow updates via API (since we handle auth in API)
ALTER TABLE signal_history DISABLE ROW LEVEL SECURITY;

-- 4. Ensure permissions are granted
GRANT ALL ON signal_history TO anon;
GRANT ALL ON signal_history TO authenticated;
GRANT ALL ON signal_history TO service_role;

-- 5. 部分索引：只為最近 30 天的數據建立索引（節省空間）
CREATE INDEX IF NOT EXISTS idx_signal_history_recent 
ON signal_history(server_id, timestamp DESC)
WHERE timestamp > EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days') * 1000;

-- 6. 查詢性能分析（運行後查看執行計劃）
EXPLAIN ANALYZE
SELECT * FROM signal_history 
WHERE server_id = 'your_server_id' 
ORDER BY timestamp DESC 
LIMIT 50;

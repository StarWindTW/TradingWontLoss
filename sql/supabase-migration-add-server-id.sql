-- 遷移腳本：添加 server_id 欄位到現有的 signal_history 表
-- 執行日期：2025-11-03
-- 說明：為了支援按伺服器過濾歷史記錄功能

-- 1. 添加 server_id 欄位（允許 NULL 以便現有記錄不會失敗）
ALTER TABLE signal_history 
ADD COLUMN IF NOT EXISTS server_id TEXT;

-- 2. 添加 thread_id 欄位（用於刪除 Discord 訊息）
ALTER TABLE signal_history 
ADD COLUMN IF NOT EXISTS thread_id TEXT;

-- 3. 為 server_id 創建索引以提高查詢效率
CREATE INDEX IF NOT EXISTS idx_signal_history_server_id ON signal_history(server_id);

-- 4. 添加註解
COMMENT ON COLUMN signal_history.server_id IS 'Discord 伺服器 ID';
COMMENT ON COLUMN signal_history.thread_id IS 'Discord Thread ID (用於刪除訊息)';

-- 4. (可選) 如果需要將現有記錄設定預設值，可以執行：
-- UPDATE signal_history SET server_id = 'default_server_id' WHERE server_id IS NULL;

-- 5. (可選) 如果確定所有記錄都有 server_id 後，可以設定為 NOT NULL：
-- ALTER TABLE signal_history ALTER COLUMN server_id SET NOT NULL;

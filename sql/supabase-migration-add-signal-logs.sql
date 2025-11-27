CREATE TABLE IF NOT EXISTS signal_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    signal_id TEXT NOT NULL,
    old_take_profit TEXT,
    new_take_profit TEXT,
    old_stop_loss TEXT,
    new_stop_loss TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signal_logs_signal_id ON signal_logs(signal_id);
-- Add logs column to signal_history
ALTER TABLE signal_history ADD COLUMN IF NOT EXISTS logs JSONB DEFAULT '[]'::jsonb;

-- Migrate existing logs from signal_logs table to signal_history.logs
UPDATE signal_history s
SET logs = (
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', l.id,
            'oldTakeProfit', l.old_take_profit,
            'newTakeProfit', l.new_take_profit,
            'oldStopLoss', l.old_stop_loss,
            'newStopLoss', l.new_stop_loss,
            'updatedAt', l.updated_at,
            'updatedBy', l.updated_by
        ) ORDER BY l.updated_at DESC
    ), '[]'::jsonb)
    FROM signal_logs l
    WHERE l.signal_id = s.id::text
);

-- Optional: Drop signal_logs table if you want to clean up
-- DROP TABLE signal_logs;

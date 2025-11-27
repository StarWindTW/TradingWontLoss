-- Add user_id column to signal_history table
ALTER TABLE signal_history ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_signal_history_user_id ON signal_history(user_id);

-- Comment
COMMENT ON COLUMN signal_history.user_id IS 'Discord User ID';

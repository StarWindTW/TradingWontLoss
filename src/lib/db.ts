import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase/Heroku etc.
  }
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};

export const TABLES = {
  SIGNAL_HISTORY: 'signal_history',
  SERVER_SETTINGS: 'server_settings', // Assuming this table exists based on usage
};

ALTER TABLE books ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE books ADD COLUMN format TEXT;
ALTER TABLE books ADD COLUMN stripe_session_id TEXT;

-- Add status column to admin_users table to handle approval flow
-- Set existing admins to 'approved' to preserve their access

BEGIN;

-- Add the status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'admin_users'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE admin_users ADD COLUMN status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;
END
$$;

-- Ensure is_active is false for pending admins, and handle trigger/logic changes later if needed
UPDATE admin_users SET status = 'approved' WHERE status IS NULL;

COMMIT;

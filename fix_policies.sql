-- Add Paystack-specific columns for webhook integration
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS paystack_customer_code text,
ADD COLUMN IF NOT EXISTS paystack_subscription_code text,
ADD COLUMN IF NOT EXISTS paystack_reference text;

-- Create indexes for faster lookups during webhook events
CREATE INDEX IF NOT EXISTS idx_subscriptions_paystack_customer_code ON public.subscriptions(paystack_customer_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paystack_reference ON public.subscriptions(paystack_reference);

-- Add treatment column to scripts table
ALTER TABLE public.scripts
ADD COLUMN IF NOT EXISTS treatment text;

-- Add status column to admin_users table to handle approval flow
BEGIN;
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

UPDATE admin_users SET status = 'approved' WHERE status IS NULL;
COMMIT;

-- Enable full CRUD operations for authorized admins on the admin_roles table
BEGIN;
DROP POLICY IF EXISTS "Admins can create roles" ON public.admin_roles;
CREATE POLICY "Admins can create roles" ON public.admin_roles
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update roles" ON public.admin_roles;
CREATE POLICY "Admins can update roles" ON public.admin_roles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete roles" ON public.admin_roles;
CREATE POLICY "Admins can delete roles" ON public.admin_roles
  FOR DELETE
  USING (public.is_admin());
COMMIT;

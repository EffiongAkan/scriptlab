# Running the Column Rename Migration

## Critical Fix for Script Element Reordering

This migration fixes the schema mismatch between the database column `"order"` and the code's use of `position`.

## Steps to Apply Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# Navigate to project directory
cd /Users/mac/Documents/naija-script-scribe-main

# Apply the migration
npx supabase db push
```

### Option 2: Using Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of:
   ```
   supabase/migrations/20260124000000_rename_order_to_position.sql
   ```
5. Click **Run**

### Option 3: Direct Database Connection

If you have direct database access:

```bash
psql "$DATABASE_URL" -f supabase/migrations/20260124000000_rename_order_to_position.sql
```

## What This Migration Does

1. **Renames** `"order"` → `position` in `script_elements` table
2. **Creates** index on `(script_id, position)` for performance
3. **Adds** constraint to ensure positions are non-negative
4. **Documents** the column with a comment

## Expected Result

After running this migration:
- ✅ Script elements will load in correct order
- ✅ Position updates will persist correctly
- ✅ Scripts will maintain element order when closed/reopened
- ✅ No more scrambled dialogue or scenes

## Verification

After applying the migration, test by:
1. Opening an existing script
2. Closing and reopening it
3. Verifying elements remain in correct order

## Rollback (If Needed)

If you need to rollback:

```sql
ALTER TABLE public.script_elements RENAME COLUMN position TO "order";
DROP INDEX IF EXISTS idx_script_elements_position;
ALTER TABLE public.script_elements DROP CONSTRAINT IF EXISTS position_non_negative;
```

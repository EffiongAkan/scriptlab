# Testing Multi-Step Script Creation with Film Industry Selection

## Prerequisites
✅ All code changes are complete
⚠️ **MUST RUN DATABASE MIGRATION FIRST**

## Step 1: Run Database Migration

**Run this in your Supabase SQL Editor:**
```sql
-- File: supabase/migrations/20251212_add_script_type_industry.sql
ALTER TABLE public.scripts
ADD COLUMN IF NOT EXISTS script_type TEXT,
ADD COLUMN IF NOT EXISTS film_industry TEXT;

CREATE INDEX IF NOT EXISTS idx_scripts_script_type ON public.scripts(script_type);
CREATE INDEX IF NOT EXISTS idx_scripts_film_industry ON public.scripts(film_industry);

COMMENT ON COLUMN public.scripts.script_type IS 'Type of script: Short Film, Feature Film, Skit, or Documentary';
COMMENT ON COLUMN public.scripts.film_industry IS 'Film industry style: Hollywood, Bollywood, Nollywood, etc.';
```

---

## Step 2: Test "Write from Scratch" Workflow

1. **Navigate to Dashboard**
   - Go to `http://localhost:8080/dashboard`

2. **Click "New Script" button**
   -  You should see the choice dialog

3. **Select "Write Script"**
   - Should navigate to Script Type & Industry selector

4. **Select Script Details:**
   - **Script Type:** Choose any (e.g., "Feature Film")
   - **Film Industry:** Choose any (e.g., "Bollywood 🇮🇳")
   - Click "Continue"

5. **Verify:**
   - ✅ Should navigate to script editor
   - ✅ New script created in database with script_type and film_industry
   - ✅ Check browser Network tab to see the database insert included the new fields

---

## Step 3: Test "AI Generate" Workflow

1. **Click "New Script" again**

2. **Select "Generate with AI"**
   - Should navigate to Script Type & Industry selector

3. **Select Script Details:**
   - **Script Type:** "Short Film"
   - **Film Industry:** "Nollywood 🇳🇬"
   - Click "Continue"

4. **Fill AI Input Form:**
   - **Title:** "The Village Secret"
   - **Genre:** "Drama"
   - **Story Idea:** "A young woman returns to her village to uncover family secrets"
   - Click "Continue to Plot Generator"

5. **Verify Plot Generator:**
   - ✅ Should redirect to Plot Generator
   - ✅ Wait for 3 synopsis options to generate
   - ✅ **CHECK:** Synopsis should include Nollywood-specific elements:
     - Nigerian names (Yoruba, Igbo, Hausa)
     - Pidgin English dialogue mentions
     - Village-city dynamics
     - Proverbs and cultural references
     - Family/community focus

6. **Select a Synopsis & Configure Settings:**
   - Choose one synopsis
   - Click "Continue to Production Settings"
   - Fill in settings (tone, period, setting, pace, language, scenes)
   - Click "Generate Professional Screenplay"

7. **Verify Script Generation:**
   - ✅ Script should generate in batches
   - ✅ **CHECK:** Generated scenes should reflect Nollywood style:
     - Cultural dialogue patterns
     - Appropriate character interactions
     - Nigerian cultural context
   - ✅ Navigate to editor when complete
   - ✅ Database should have script_type and film_industry saved

---

## Step 4: Test Different Film Industries

Try creating scripts with different industries to verify cultural customization:

### Hollywood Test:
- **Industry:** Hollywood 🇺🇸
- **Expected:** Three-act structure, American English, Western cultural refs
- **Story:** "Tech startup founder faces moral dilemma"

### Bollywood Test:
- **Industry:** Bollywood 🇮🇳  
- **Expected:** Family drama, Hindi names, emotional dialogue, song sequence mentions
- **Story:** "Arranged marriage between rival families"

### Hallyuwood Test:
- **Industry:** Hallyuwood 🇰🇷
- **Expected:** Korean names, honorifics, subtle emotions, social class themes
- **Story:** "Office worker and CEO secret romance"

---

## Verification Checklist

- [ ] Database migration ran successfully
- [ ] "Write from Scratch" flow works (3 steps)
- [ ] "AI Generate" flow works (4 steps)
- [ ] Script type is saved to database
- [ ] Film industry is saved to database
- [ ] Synopsis generation includes industry context
- [ ] Scene generation includes industry context
- [ ] Different industries produce different cultural content
- [ ] UI components render correctly
- [ ] No console errors

---

## Known Limitations

- Industry context is a guide for AI, not a guarantee
- AI output quality depends on the AI model's training
- Some industries may have more authentic results than others
- The more detailed the story idea, the better the cultural adaptation

---

## If Something Fails

1. **Check browser console** for errors
2. **Check Network tab** for failed requests
3. **Verify database migration** ran successfully
4. **Hard refresh browser** (Ctrl+Shift+R)
5. **Check dev server** is running without errors

Report any issues with:
- Screenshot of error
- Steps to reproduce
- Expected vs actual behavior

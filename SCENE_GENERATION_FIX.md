# Scene Generation Fix - Detailed Summary

## Issue
Users reported that when requesting more than 25 scenes (e.g., 26+), the app would only generate 24 scenes. This was likely due to:
1.  **Implicit Prompts**: The AI prompts simply asked for "scenes 26-30" without forcing a specific count.
2.  **AI Truncation**: The AI might have "decided" the story ended or got lazy without explicit instructions.

## Solution Implemented

### 1. Explicit AI Prompts
We significantly upgraded the prompts sent to the DeepSeek AI model in `src/pages/PlotGenerator.tsx`.

**New Prompt Features:**
*   **Exact Count Enforcement**: "Generate EXACTLY ${scenesToGenerate} scenes, no more, no less"
*   **Explicit Numbering**: "Start with SCENE X and continue sequentially to SCENE Y"
*   **Critical Requirements Section**: A new, capitalized section listing strict rules.
*   **Quality Standards**: Added requirements for "minimum 3-4 lines of action" and "substantial content".

### 2. Edge Function Verification
Verified `supabase/functions/generate-plot-content/index.ts`:
*   **Token Limit**: Validated that `max_tokens` is set to **8000** for script generation. This is sufficient for batches of 5 dense scenes (approx 1500-2500 tokens).

### 3. Logic Flow
The batching logic remains:
*   Scenes are generated in batches of 5.
*   If you request 26 scenes:
    *   Batch 1-5 (5 scenes)
    *   ...
    *   Batch 21-25 (5 scenes)
    *   Batch 26-26 (1 scene)
*   The new prompt now explicitly calculates `endScene - startScene + 1` (e.g., 1 scene for the last batch) and forces the AI to generate exactly that amount.

## Verification
You can now try generating a script with **26 scenes**.
*   **Expected Behavior**: The generator will run 6 batches. The final batch will generate exactly 1 scene ("SCENE 26"), completing the script.
*   **Quality**: Scenes should be more Detailed and consistent due to the updated formatting rules.

## File Modified
*   [PlotGenerator.tsx](file:///Users/mac/Documents/naija-script-scribe-main/src/pages/PlotGenerator.tsx)

# Comprehensive Script Generation Fix

## Problems Addressed
1.  **Cultural Inconsistency**: Scripts for non-Nigerian industries (e.g., Chinese) were reverting to Nollywood style after the first scene.
2.  **Scene Limit**: Users needed up to 150 scenes, but the limit was 50.
3.  **Truncation**: Generation stopped around 24 scenes.

## Solutions Implemented

### 1. Dynamic Cultural Context
*   **Root Cause**: The system was hardcoded to default to "Lagos" and "Traditional African Elements" if specific settings weren't provided. It also only sent the story synopsis for the first scene, causing the AI to "forget" the context for subsequent scenes.
*   **Fix**: 
    *   `includeTraditional` is now **false** unless the industry is explicitly "Nollywood".
    *   Default region is now **"International"** for non-Nollywood scripts.
    *   **Context Injection**: The story context (synopsis) is now sent with **EVERY** scene request, ensuring the AI remembers it's writing a Chinese/Hollywood/etc. script from start to finish.

### 2. Scene Limit Increased to 150
*   **Fix**: Updated the UI to allow inputting up to **150 scenes**.

### 3. Reliability & Truncation
*   **Fix**: Combined with the previous "Single Scene Batch" mode, the new context injection ensures that long generation runs (45+ scenes) don't degrade in quality or fail due to lost context.

## Verification
1.  **Test Chinese Script**:
    *   Select "Chinese Cinema" industry.
    *   Generate 45 scenes.
    *   **Expected**: All 45 scenes should maintain Chinese cultural elements, character names, and setting. No random switch to Lagos.
2.  **Test Limit**:
    *   Enter "150" in the scene count.
    *   **Expected**: It accepts the value.

## File Modified
*   [PlotGenerator.tsx](file:///Users/mac/Documents/naija-script-scribe-main/src/pages/PlotGenerator.tsx)

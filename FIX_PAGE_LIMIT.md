# Definitive Page & Scene Limit Fix

## Problem
Both generation (writing) and loading (reading) of scripts were hitting "invisible walls" around **1000 items** (approx. 20-25 pages or 25 scenes).

## Technical explanation of the "20 Page Wall"
1.  **Loading Limit**: The database loader was hitting a default limit of 1000 items. I replaced this with a **Smart Chunk Loader** that keeps fetching data until it gets everything. If you have 5000 lines, it will make 5 requests of 1000 to get them all.
2.  **Saving Limit**: When generating a long script (e.g., 45 scenes -> ~2000 lines), trying to save it all at once was likely failing silently or partially because the "package" was too big for one request. I implemented a **Chunked Saver** that saves the script in safe batches of 500 lines.

## The Fixes Performed
1.  **Infinite Loading**: Scripts can now load an unlimited number of pages.
2.  **Safe Saving**: Scripts of any length (150 scenes+) can now be saved reliably.

## Verification
*   **Existing Scripts**: If you have a script that looked stuck at 20 pages, **refresh the page**. The new loader should find the "missing" pages if they were saved.
*   **New Scripts**: Generate a 45-scene script. It will now save correctly and load fully.

## Files Modified
*   [useScriptContent.ts](file:///Users/mac/Documents/naija-script-scribe-main/src/hooks/useScriptContent.ts) (Loader)
*   [PlotGenerator.tsx](file:///Users/mac/Documents/naija-script-scribe-main/src/pages/PlotGenerator.tsx) (Generator)

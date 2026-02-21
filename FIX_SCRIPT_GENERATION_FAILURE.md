# Persistent Script Generation Failure Fix

## Problem
Script generation was still failing for some users despite previous optimizations. This indicated that generating even 3 scenes at once could cause timeouts or network instability under certain conditions.

## Enhanced Solution Implemented

### 1. Single-Scene Batches (Maximum Reliability)
We drastically reduced the batch size from **3 scenes** to **1 scene**.
*   **Why**: This is the absolute safest approach. Generating a single scene is very fast and unlikely to time out.
*   **Trade-off**: The progress bar will move in smaller increments (e.g., "Batch 1 of 50"), but the overall process is much more robust.

### 2. Client-Side Retry Logic
We implemented a robust **Retry Mechanism** with exponential backoff.
*   **How it works**: If a scene generation fails (due to network blip or temporary AI service overload), the app will:
    1.  Wait 2 seconds and try again.
    2.  If that fails, wait 4 seconds and try again.
    3.  If that fails, wait 8 seconds and try again.
    4.  Only then will it show an error.
*   **Benefit**: Temporary glitches won't ruin the entire script generation process.

### 3. Deep Debug Logging
We added detailed console logging.
*   **Purpose**: If you still encounter issues, you can open the browser console (F12) and see exactly *why* it failed (e.g., Auth Error, Network Timeout, or specific API error codes).

## Verification
1.  Refresh the page.
2.  Generate a script with **10 scenes** (for a quick test) or **50 scenes** (full test).
3.  Watch the progress bar. It should advance steadily.
4.  If you have a network glitch, you might see it pause for a few seconds (retrying) before continuing.

## File Modified
*   [PlotGenerator.tsx](file:///Users/mac/Documents/naija-script-scribe-main/src/pages/PlotGenerator.tsx)

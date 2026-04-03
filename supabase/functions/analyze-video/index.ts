// Video Analysis Edge Function
// Analyzes video content from URL and extracts screenplay elements

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { YoutubeTranscript } from 'npm:youtube-transcript'

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Authentication required");

        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) throw new Error(`Auth failed: ${userError?.message}`);

        const { videoUrl, forceRefresh, focusFilter } = await req.json()

        if (!videoUrl) {
            return new Response(
                JSON.stringify({ success: false, error: 'Video URL is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: settings, error: settingsError } = await supabaseAdmin.from('system_settings').select('key, value');
        console.log('[VideoAnalysis] Settings loaded:', settings?.length || 0, 'items', settingsError ? `(Error: ${settingsError.message})` : '');

        const getSetting = (key: string) => {
            const setting = settings?.find(s => s.key === key);
            if (!setting) return null;
            let val = setting.value;
            if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
            if (typeof val === 'string') val = val.replace(/^"+|"+$/g, '').replace(/\\"/g, '"');
            return val;
        };

        const activeProvider = getSetting('active_ai_provider') || 'deepseek';
        const activeModel = getSetting('active_ai_model') || (activeProvider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o');
        console.log('[VideoAnalysis] Provider:', activeProvider, ', Model:', activeModel);
        const apiKey = activeProvider === 'openai'
            ? Deno.env.get("OPENAI_API_KEY") || getSetting('openai_api_key')
            : activeProvider === 'anthropic'
                ? Deno.env.get("ANTHROPIC_API_KEY") || getSetting('anthropic_api_key')
                : Deno.env.get("DEEPSEEK_API_KEY") || getSetting('deepseek_api_key');

        console.log('[VideoAnalysis] API key found:', !!apiKey, ', Length:', apiKey?.length || 0);

        if (!apiKey) {
            console.error('[VideoAnalysis] Missing API key for provider:', activeProvider);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: `${activeProvider} API key not configured. Please add it to your Supabase project secrets.`
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        const rawVideoUrl = videoUrl;
        const videoInfo = extractVideoInfo(rawVideoUrl);
        const normalizedUrl = normalizeUrl(rawVideoUrl, videoInfo);

        console.log('[VideoAnalysis] Request details:', {
            rawUrl: rawVideoUrl,
            normalizedUrl: normalizedUrl,
            platform: videoInfo.platform,
            videoId: videoInfo.videoId,
            forceRefresh
        });

        // Check cache first - Normalize URL in cache key
        const cacheVersion = "v7"; // v7: Added threeActBreakdown, focusFilter and transcript
        const cacheKey = `video_analysis:${cacheVersion}:${normalizedUrl}:${focusFilter || 'none'}`;

        if (!forceRefresh) {
            const { data: cachedData } = await supabaseAdmin
                .from('ai_cache')
                .select('response_content')
                .eq('cache_key', cacheKey)
                .maybeSingle();

            if (cachedData) {
                console.log('[VideoAnalysis] Cache hit for:', normalizedUrl);
                const analysis = JSON.parse(cachedData.response_content);
                analysis.isCached = true;
                return new Response(
                    JSON.stringify({ success: true, analysis, requestedUrl: normalizedUrl, debugTrace: { source: 'cache', version: cacheVersion } }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        // Fetch real metadata (more robust now)
        console.log('[VideoAnalysis] Fetching metadata for:', normalizedUrl);
        const metadata = await fetchVideoMetadata(normalizedUrl, videoInfo);
        console.log('[VideoAnalysis] Metadata result:', {
            title: metadata.title,
            hasDescription: !!metadata.description,
            hasThumbnail: !!metadata.thumbnail_url,
            isFallback: metadata.title === "Unknown Video"
        });

        // Construct prompt for AI
        const systemPrompt = `You are a headless JSON API. You have NO HUMAN PERSONALITY. You ONLY output valid JSON.
      
FORBIDDEN:
- NO "Expert Analysis" headers
- NO introduction or conclusion
- NO markdown formatting (bold, italic)
- NO conversational text

OUTPUT STRUCTURE:
{
  "videoTitle": "string",
  "logline": "string",
  "synopsis": "string",
  "videoDuration": number,
  "extractedGenre": "string",
  "detectedTone": "string",
  "storyStructure": "string",
  "themes": ["string"],
  "keyCharacters": [
    {
      "name": "string",
      "role": "string",
      "description": "string"
    }
  ],
  "threeActBreakdown": {
    "setup": "string",
    "incitingIncident": "string",
    "confrontation": "string",
    "resolution": "string"
  },
  "characterTypes": ["string"],
  "dialogueStyle": "string",
  "visualElements": ["string"],
  "culturalContext": "string",
  "pacing": "string",
  "keyInsights": "string",
  "suggestedScriptType": "string",
  "suggestedIndustry": "string"
}

RULES:
- Start response with { and end with }
- If you output any text that is not valid JSON, the system will crash.`;

        const userPrompt = `INSTRUCTION: Respond ONLY with a valid JSON object. No conversational text.

DATA TO PROCESS:
VIDEO URL: ${normalizedUrl}
VIDEO TITLE: ${metadata.title}
VIDEO AUTHOR: ${metadata.author_name || 'Individual Creator'}
PLATFORM: ${videoInfo.platform}
VIDEO TAGS: ${metadata.tags?.length > 0 ? metadata.tags.join(', ') : 'No tags available'}
VIDEO CATEGORY: ${metadata.category || 'Unknown'}
VIDEO DESCRIPTION: ${metadata.description || 'No detailed description available. Analyze based on title and tags only. DO NOT guess from memory.'}
${metadata.transcript ? `\nVIDEO TRANSCRIPT (SPOKEN DIALOGUE):\n${metadata.transcript.substring(0, 8000)}\n` : ''}
${focusFilter ? `\nUSER ANALYTICAL FOCUS: Please heavily emphasize the following aspect in your analysis: ${focusFilter}\n` : ''}

CRITICAL: Your analysis MUST be about the video described above. Do NOT substitute details from a different video.
REQUIRED FIELDS:
- logline: A one-sentence summary of the video's core conflict or premise.
- synopsis: A brief paragraph (3-4 sentences) summarizing the full narrative arc.
- keyCharacters: A list of the specific characters identified in the video (if any), with their names (or functional names like "The Host", "The Protagonist"), roles, and brief descriptions.
- threeActBreakdown: A highly specific breakdown defining Act 1 (Setup), the Inciting Incident, Act 2 (Confrontation), and Act 3 (Resolution).

Return ONLY the JSON object.`;

        let apiUrl = "", apiData: any = {}, aiHeaders: Record<string, string> = { "Content-Type": "application/json" };

        if (activeProvider === 'openai') {
            apiUrl = "https://api.openai.com/v1/chat/completions";
            aiHeaders["Authorization"] = `Bearer ${apiKey}`;
            apiData = {
                model: activeModel,
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
                response_format: { type: "json_object" }
            };
        } else if (activeProvider === 'anthropic') {
            apiUrl = "https://api.anthropic.com/v1/messages";
            aiHeaders["x-api-key"] = apiKey;
            aiHeaders["anthropic-version"] = "2023-06-01";
            apiData = {
                model: activeModel,
                max_tokens: 4000,
                messages: [{ role: "user", content: userPrompt }],
                system: systemPrompt
            };
        } else {
            // Default to DeepSeek
            apiUrl = "https://api.deepseek.com/v1/chat/completions";
            aiHeaders["Authorization"] = `Bearer ${apiKey}`;
            apiData = {
                model: activeModel,
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
                response_format: { type: "json_object" }
            };
        }

        console.log('[VideoAnalysis] Calling AI provider:', activeProvider, 'with model:', activeModel);
        const aiResponse = await fetch(apiUrl, { method: "POST", headers: aiHeaders, body: JSON.stringify(apiData) });

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error('[VideoAnalysis] AI API error:', { status: aiResponse.status, error: errorText });
            return new Response(
                JSON.stringify({
                    success: false,
                    error: `AI Provider (${activeProvider}) error ${aiResponse.status}: ${errorText.substring(0, 200)}`
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        const aiDataResponse = await aiResponse.json();
        console.log('[VideoAnalysis] AI response received, extracting content...');

        let content = activeProvider === 'anthropic' ? aiDataResponse.content[0].text : aiDataResponse.choices[0].message.content;

        // Parse the AI content
        let analysis;
        try {
            // Cleanup and repair logic
            let jsonStr = content.replace(/```json|```/gi, '').trim();
            const startIdx = jsonStr.indexOf('{');
            const endIdx = jsonStr.lastIndexOf('}');

            if (startIdx !== -1 && endIdx !== -1) {
                jsonStr = jsonStr.substring(startIdx, endIdx + 1);
            }

            analysis = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error('[VideoAnalysis] JSON parse error:', parseError);
            console.log('[VideoAnalysis] Raw content:', content);
            throw new Error("Failed to parse AI response as JSON");
        }

        analysis.sourceUrl = normalizedUrl;
        analysis.thumbnailUrl = metadata.thumbnail_url;
        analysis.timestamp = new Date();
        analysis.metadataStatus = metadata.isFallback ? 'fallback' : 'real';

        // Cache the result
        try {
            await supabaseAdmin.from('ai_cache').upsert({
                cache_key: cacheKey,
                provider: activeProvider,
                model: activeModel,
                prompt_hash: btoa(normalizedUrl).substring(0, 100), // Use URL as hash basis
                response_content: JSON.stringify(analysis),
                tokens_used: aiDataResponse.usage?.total_tokens || 0,
                user_id: user.id,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
            });
            console.log('[VideoAnalysis] Result cached successfully');
        } catch (cacheError) {
            console.error('[VideoAnalysis] Caching error:', cacheError);
        }

        console.log('[VideoAnalysis] Successfully completed analysis for:', normalizedUrl);

        return new Response(
            JSON.stringify({
                success: true,
                analysis,
                requestedUrl: normalizedUrl,
                debugTrace: {
                    source: 'live',
                    metadataTitle: metadata.title,
                    isFallback: metadata.isFallback,
                    platform: videoInfo.platform,
                    version: cacheVersion
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('[VideoAnalysis] Error:', error);
        console.error('[VideoAnalysis] Error stack:', error.stack);
        return new Response(
            JSON.stringify({
                success: false,
                error: `Analysis failed: ${error.message || 'Unknown error'}`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }
})

function extractVideoInfo(url: string): { platform: string; videoId?: string } {
    try {
        const urlObj = new URL(url)

        // YouTube
        if (urlObj.hostname.includes('youtube.com')) {
            const videoId = urlObj.searchParams.get('v')
            return { platform: 'youtube', videoId: videoId || undefined }
        }

        // YouTube short URL
        if (urlObj.hostname.includes('youtu.be')) {
            const videoId = urlObj.pathname.slice(1)
            return { platform: 'youtube', videoId }
        }

        // Vimeo
        if (urlObj.hostname.includes('vimeo.com')) {
            const videoId = urlObj.pathname.split('/')[1]
            return { platform: 'vimeo', videoId }
        }

        // Direct video file
        if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
            return { platform: 'direct' }
        }

        return { platform: 'unknown' }
    } catch {
        return { platform: 'unknown' }
    }
}

function normalizeUrl(url: string, info: { platform: string; videoId?: string }): string {
    if (info.platform === 'youtube' && info.videoId) {
        return `https://www.youtube.com/watch?v=${info.videoId}`;
    }
    if (info.platform === 'vimeo' && info.videoId) {
        return `https://vimeo.com/video/${info.videoId}`;
    }
    return url;
}

async function fetchVideoMetadata(url: string, info: { platform: string; videoId?: string }): Promise<any> {
    const defaultMetadata = {
        title: "Unknown Video",
        author_name: "Unknown Author",
        description: "",
        thumbnail_url: "",
        tags: [] as string[],
        category: "",
        isFallback: true
    };

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    try {
        let metadata = { ...defaultMetadata };

        if (info.platform === 'youtube' && info.videoId) {
            // === NEW: TRANSCRIPT EXTRACTION ===
            try {
                console.log('[VideoAnalysis] Attempting to fetch transcript for:', info.videoId);
                // @ts-ignore Deno NPM import
                const transcriptData = await YoutubeTranscript.fetchTranscript(info.videoId);
                if (transcriptData && transcriptData.length > 0) {
                    // @ts-ignore Element type
                    const fullTranscript = transcriptData.map(t => t.text).join(' ');
                    // @ts-ignore Dynamic property
                    metadata.transcript = fullTranscript;
                    console.log('[VideoAnalysis] Successfully fetched transcript, text length:', fullTranscript.length);
                }
            } catch (transcriptErr: any) {
                console.warn('[VideoAnalysis] Could not fetch transcript (may not have captions):', transcriptErr.message);
            }

            // === STRATEGY 1: Invidious API (free, no key, returns FULL description + tags) ===
            const invidiousInstances = [
                'https://vid.puffyan.us',
                'https://invidious.fdn.fr',
                'https://y.com.sb',
                'https://invidious.nerdvpn.de'
            ];

            let invidiousSuccess = false;
            for (const instance of invidiousInstances) {
                try {
                    console.log(`[VideoAnalysis] Trying Invidious: ${instance}/api/v1/videos/${info.videoId}`);
                    const invRes = await fetch(`${instance}/api/v1/videos/${info.videoId}?fields=title,author,description,descriptionHtml,keywords,genre,lengthSeconds,viewCount`, {
                        headers,
                        signal: AbortSignal.timeout(5000) // 5s timeout per instance
                    });
                    if (invRes.ok) {
                        const invData = await invRes.json();
                        console.log('[VideoAnalysis] Invidious success! Title:', invData.title, 'Desc length:', invData.description?.length);
                        metadata.title = invData.title || metadata.title;
                        metadata.author_name = invData.author || metadata.author_name;
                        metadata.description = invData.description || "";
                        metadata.tags = invData.keywords || [];
                        metadata.category = invData.genre || "";
                        metadata.thumbnail_url = `https://i.ytimg.com/vi/${info.videoId}/hqdefault.jpg`;
                        metadata.isFallback = false;
                        invidiousSuccess = true;
                        break;
                    }
                } catch (invErr: any) {
                    console.warn(`[VideoAnalysis] Invidious instance ${instance} failed:`, invErr.message);
                }
            }

            // === STRATEGY 2: YouTube oEmbed (title + author only, no description) ===
            if (!invidiousSuccess) {
                console.log('[VideoAnalysis] All Invidious instances failed, falling back to oEmbed...');
                const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
                const response = await fetch(oembedUrl, { headers });
                if (response.ok) {
                    const data = await response.json();
                    metadata.title = data.title || metadata.title;
                    metadata.author_name = data.author_name || metadata.author_name;
                    metadata.thumbnail_url = data.thumbnail_url || metadata.thumbnail_url;
                    metadata.isFallback = false;
                }
            }

            // === STRATEGY 3: Page scrape (for description if still missing) ===
            if (!metadata.description || metadata.description.length < 20) {
                console.log('[VideoAnalysis] Description still missing, attempting page scrape...');
                try {
                    const pageResponse = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
                    if (pageResponse.ok) {
                        const html = await pageResponse.text();

                        // Try og:description first (most reliable for YouTube)
                        const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*?)"/i) ||
                            html.match(/<meta\s+content="([^"]*?)"\s+property="og:description"/i);
                        if (ogDescMatch && ogDescMatch[1].length > 30 && !ogDescMatch[1].includes('Enjoy the videos')) {
                            metadata.description = ogDescMatch[1].substring(0, 2000);
                        }

                        // Try meta description
                        if (!metadata.description || metadata.description.length < 20) {
                            const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*?)"/i) ||
                                html.match(/<meta\s+content="([^"]*?)"\s+name="description"/i);
                            if (descMatch && descMatch[1].length > 30 && !descMatch[1].includes('Enjoy the videos')) {
                                metadata.description = descMatch[1].substring(0, 2000);
                            }
                        }

                        // Try to extract keywords meta tag
                        if (metadata.tags.length === 0) {
                            const kwMatch = html.match(/<meta\s+name="keywords"\s+content="([^"]*?)"/i);
                            if (kwMatch) {
                                metadata.tags = kwMatch[1].split(',').map(t => t.trim()).filter(t => t.length > 0);
                            }
                        }
                    }
                } catch (scrapeErr: any) {
                    console.warn('[VideoAnalysis] Page scrape failed:', scrapeErr.message);
                }
            }
        } else if (info.platform === 'vimeo') {
            const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
            const response = await fetch(oembedUrl, { headers });
            if (response.ok) {
                const data = await response.json();
                metadata = { ...metadata, ...data, isFallback: false };
            }

            // Vimeo page scrape for description
            if (!metadata.description) {
                try {
                    const pageResponse = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
                    if (pageResponse.ok) {
                        const html = await pageResponse.text();
                        const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*?)"/i);
                        if (descMatch) metadata.description = descMatch[1].substring(0, 2000);
                    }
                } catch { }
            }
        } else if (info.platform === 'direct') {
            metadata.title = url.split('/').pop() || "Direct Video File";
            metadata.description = "Direct video file analysis.";
            metadata.isFallback = false;
        } else {
            // Unknown platform - try page scrape
            try {
                const pageResponse = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
                if (pageResponse.ok) {
                    const html = await pageResponse.text();
                    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
                    if (titleMatch) {
                        metadata.title = titleMatch[1].trim();
                        metadata.isFallback = false;
                    }
                    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*?)"/i) ||
                        html.match(/<meta\s+name="description"\s+content="([^"]*?)"/i);
                    if (descMatch) metadata.description = descMatch[1].substring(0, 2000);
                    const thumbMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*?)"/i);
                    if (thumbMatch) metadata.thumbnail_url = thumbMatch[1];
                }
            } catch { }
        }

        console.log('[VideoAnalysis] Final metadata:', {
            title: metadata.title,
            descLength: metadata.description?.length || 0,
            tagsCount: metadata.tags?.length || 0,
            category: metadata.category,
            isFallback: metadata.isFallback
        });

        return metadata;
    } catch (error) {
        console.error('[VideoAnalysis] Error fetching metadata:', error);
        return defaultMetadata;
    }
}

// Mock analysis function - Still kept for reference or fallback
async function analyzeMockVideo(url: string, info: { platform: string; videoId?: string }) {
    // This is now a true fallback (rarely used if AI is available)
    return {
        sourceUrl: url,
        videoTitle: "Sample Video Title",
        videoDuration: 300,
        extractedGenre: "DRAMA",
        detectedTone: "Dramatic and emotionally intense",
        storyStructure: "Three-act structure with clear setup, confrontation, and resolution.",
        themes: ["Family bonds", "Personal growth"],
        characterTypes: ["Protagonist", "Mentor"],
        dialogueStyle: "Natural speech",
        visualElements: ["Cinematic lighting"],
        culturalContext: "Contemporary",
        pacing: "Moderate",
        keyInsights: "Grounding the story in character and emotional truth.",
        suggestedScriptType: "FEATURE_FILM",
        suggestedIndustry: "NOLLYWOOD",
        timestamp: new Date()
    }
}

// Supabase Edge Function: gemini-proxy
// The Gemini API key lives ONLY here as an env secret — never in the APK.
// This function validates the user's JWT, enforces per-user rate limits,
// then proxies the request to Gemini and returns the result.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Rate limit config ──────────────────────────────────────────────────────
// Adjust these to control how much each user can spend per day.
const RATE_LIMITS = {
    REQUESTS_PER_HOUR: 20,   // max 20 calls per hour (food/workout analysis)
    REQUESTS_PER_DAY: 80,    // max 80 calls per day total
    CHAT_PER_HOUR: 30,       // chat messages are lighter, allow a bit more
    CHAT_PER_DAY: 120,
};

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ── CORS headers ───────────────────────────────────────────────────────────
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // ── 1. Validate JWT ────────────────────────────────────────────────────
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return jsonError('Unauthorized', 401);
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

        if (!geminiApiKey) {
            return jsonError('Server misconfigured', 500);
        }

        // Use the user's JWT to verify their identity
        const userJwt = authHeader.replace('Bearer ', '');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: { user }, error: authError } = await supabase.auth.getUser(userJwt);

        if (authError || !user) {
            return jsonError('Invalid auth token', 401);
        }

        const userId = user.id;

        // ── 2. Parse request body ──────────────────────────────────────────────
        const body = await req.json();
        const { type, payload } = body; // type: 'food' | 'food_image' | 'workout' | 'chat'

        if (!type || !payload) {
            return jsonError('Missing type or payload', 400);
        }

        const isChat = type === 'chat';
        const hourLimit = isChat ? RATE_LIMITS.CHAT_PER_HOUR : RATE_LIMITS.REQUESTS_PER_HOUR;
        const dayLimit = isChat ? RATE_LIMITS.CHAT_PER_DAY : RATE_LIMITS.REQUESTS_PER_DAY;

        // ── 3. Check rate limits ───────────────────────────────────────────────
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const hourKey = `${dateStr}T${now.getUTCHours().toString().padStart(2, '0')}`;

        // Upsert & fetch usage counters in a single round-trip
        const { data: usage, error: usageError } = await supabase
            .from('api_usage')
            .upsert(
                { user_id: userId, date: dateStr, hour_key: hourKey },
                { onConflict: 'user_id,date,hour_key', ignoreDuplicates: false }
            )
            .select()
            .single();

        // If the row already existed, just fetch it
        const { data: currentUsage } = await supabase
            .from('api_usage')
            .select('requests_this_hour, requests_today')
            .eq('user_id', userId)
            .eq('date', dateStr)
            .eq('hour_key', hourKey)
            .single();

        const requestsThisHour = currentUsage?.requests_this_hour ?? 0;
        const requestsToday = currentUsage?.requests_today ?? 0;

        if (requestsThisHour >= hourLimit) {
            return jsonError(`Rate limit: max ${hourLimit} AI requests per hour. Try again soon.`, 429);
        }
        if (requestsToday >= dayLimit) {
            return jsonError(`Daily limit reached (${dayLimit} requests). Resets at midnight UTC.`, 429);
        }

        // ── 4. Build Gemini request ────────────────────────────────────────────
        const geminiBody = buildGeminiRequest(type, payload);
        if (!geminiBody) {
            return jsonError('Unsupported request type', 400);
        }

        // ── 5. Call Gemini API ─────────────────────────────────────────────────
        const geminiRes = await fetch(`${GEMINI_API_URL}?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiBody),
        });

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error('[gemini-proxy] Gemini API error:', geminiRes.status, errText);

            if (geminiRes.status === 429) {
                return jsonError('AI service is busy. Please try again in a moment.', 503);
            }
            return jsonError('AI request failed', 502);
        }

        const geminiData = await geminiRes.json();

        // ── 6. Increment usage counters ────────────────────────────────────────
        await supabase.rpc('increment_api_usage', {
            p_user_id: userId,
            p_date: dateStr,
            p_hour_key: hourKey,
        });

        // ── 7. Return result ───────────────────────────────────────────────────
        const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err) {
        console.error('[gemini-proxy] Unexpected error:', err);
        return jsonError('Internal server error', 500);
    }
});

// ── Helpers ────────────────────────────────────────────────────────────────

function jsonError(message: string, status: number) {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

function buildGeminiRequest(type: string, payload: any) {
    switch (type) {
        case 'food': {
            // Text-only food analysis
            return {
                contents: [{
                    parts: [{ text: payload.prompt }],
                }],
                generationConfig: { responseMimeType: 'application/json' },
            };
        }
        case 'food_image': {
            // Food analysis with image
            return {
                contents: [{
                    parts: [
                        {
                            inline_data: {
                                mime_type: 'image/jpeg',
                                data: payload.imageBase64,
                            },
                        },
                        { text: payload.prompt },
                    ],
                }],
                generationConfig: { responseMimeType: 'application/json' },
            };
        }
        case 'workout': {
            return {
                contents: [{
                    parts: [{ text: payload.prompt }],
                }],
                generationConfig: { responseMimeType: 'application/json' },
            };
        }
        case 'chat': {
            // Multi-turn chat with history
            return {
                contents: payload.contents, // full history from client
                systemInstruction: payload.systemInstruction
                    ? { parts: [{ text: payload.systemInstruction }] }
                    : undefined,
            };
        }
        default:
            return null;
    }
}

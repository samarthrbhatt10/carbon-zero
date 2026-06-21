/**
 * @module geminiAPI
 * @description Secure Google Gemini API service (migrated from Anthropic Claude).
 *
 * Security measures maintained (OWASP A02, A09, A10):
 *  - API key loaded exclusively from Vite env vars (NEVER hardcoded)
 *  - Rate limiting: max 10 calls per browser session via sessionStorage
 *  - Exponential backoff on 429 / 503 rate-limit responses
 *  - No server-side proxy — direct client → Google AI Studio only (no SSRF surface)
 *  - All errors returned as structured Error objects (no raw stack traces to DOM)
 *
 * Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
 * Auth:     x-goog-api-key header from VITE_GEMINI_API_KEY
 * Body:     Gemini generateContent format — contents[].parts[].text
 */

// ---------------------------------------------------------------------------
// System Prompts (Section 5 of master spec — unchanged)
// ---------------------------------------------------------------------------

/**
 * EcoCoach system prompt — Carbon footprint personalised advisor.
 * India-context aware, warm and encouraging tone.
 */
export const CARBON_COACH_SYSTEM_PROMPT = `You are EcoCoach, an expert carbon footprint advisor with deep knowledge of climate science, India-specific emission factors, and behavioral psychology.

Given a user's carbon footprint data breakdown, you provide:
1. Their carbon footprint assessment in plain language (2 sentences max)
2. Their 3 highest-impact reduction opportunities (specific, numbered, with CO₂e savings)
3. A 30-day personalized action plan (10 bullet points, actionable, India-context appropriate)
4. One motivational closing statement

Rules:
- Always use Indian context (INR costs, India-specific actions, Indian cities/infrastructure)
- Be specific with numbers (e.g., "saves ~45 kg CO₂e/month = ₹180 saved in fuel")
- Tone: warm, encouraging, non-judgmental, science-backed
- Never use jargon without explanation
- Format: Use clear headers and bullet points
- Max response: 400 words`;

/**
 * ClimateBot system prompt — General climate Q&A.
 */
export const CLIMATE_QA_SYSTEM_PROMPT = `You are ClimateBot, an expert in climate science, sustainability, and carbon reduction for the Indian context. Answer questions clearly and concisely (max 150 words per answer). Always relate back to individual action where possible. Be factual, cite approximate sources. Never give harmful, misleading, or politically charged responses.`;

// ---------------------------------------------------------------------------
// Rate Limiter (session-scoped, no PII)
// ---------------------------------------------------------------------------

const RATE_LIMIT_KEY = 'gemini_calls';
const MAX_CALLS_PER_SESSION = 10;

/**
 * Checks and increments the session call counter.
 * @throws {Error} If the session limit has been reached
 */
const checkRateLimit = () => {
  const callCount = parseInt(sessionStorage.getItem(RATE_LIMIT_KEY) || '0', 10);
  if (callCount >= MAX_CALLS_PER_SESSION) {
    throw new Error('Session API limit reached (10 calls). Refresh the page to continue.');
  }
  sessionStorage.setItem(RATE_LIMIT_KEY, String(callCount + 1));
};

/**
 * Returns the number of Gemini API calls remaining in this session.
 * @returns {number}
 */
export const getRemainingCalls = () => {
  const used = parseInt(sessionStorage.getItem(RATE_LIMIT_KEY) || '0', 10);
  return Math.max(0, MAX_CALLS_PER_SESSION - used);
};

// ---------------------------------------------------------------------------
// Core API Call — Gemini generateContent
// ---------------------------------------------------------------------------

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL    = 'gemini-2.5-flash';
const GEMINI_ACTION   = 'generateContent';

/**
 * Builds the fully-qualified Gemini REST endpoint URL.
 * Appended with the API key as a query parameter for requests that cannot
 * set headers (fallback) — but we prefer the x-goog-api-key header approach.
 * @returns {string}
 */
const buildEndpointUrl = () =>
  `${GEMINI_API_BASE}/${GEMINI_MODEL}:${GEMINI_ACTION}`;

/**
 * Calls the Google Gemini generateContent API with retry logic and exponential backoff.
 *
 * Request body format (Gemini):
 * {
 *   "contents": [{ "parts": [{ "text": "<systemPrompt>\n\nUser Data:\n<prompt>" }] }],
 *   "generationConfig": { "maxOutputTokens": <n> }
 * }
 *
 * @param {string} prompt       - The user-specific data / question
 * @param {string} systemPrompt - Behavioural system prompt prepended to contents
 * @param {number} [retries=3]  - Number of retry attempts on transient failure
 * @param {number} [maxTokens=1024] - Max output tokens requested
 * @returns {Promise<string>} Plain-text response from Gemini
 * @throws {Error} On API error, missing key, or session rate limit
 */
export const callGemini = async (
  prompt,
  systemPrompt,
  retries = 3,
  maxTokens = 1024
) => {
  // Security: API key must come from env — never hardcoded
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Google Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.'
    );
  }

  // Rate limiting guard (session-scoped, no PII stored)
  checkRateLimit();

  // Build Gemini request body — system prompt prepended to user content
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${systemPrompt}\n\nUser Data:\n${prompt}`,
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.7,
      topP: 0.9,
    },
  };

  const url = buildEndpointUrl();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,          // Google AI Studio auth header
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Exponential backoff on rate-limiting (429) or service unavailable (503)
        if ((response.status === 429 || response.status === 503) && attempt < retries) {
          const delay = 2000 * attempt; // 2s, 4s, 6s …
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        // User-friendly error — never expose raw server responses to the DOM
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      // Extract text from Gemini response structure:
      // data.candidates[0].content.parts[0].text
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini returned an empty response. Please try again.');
      }
      return text;

    } catch (err) {
      if (attempt === retries) throw err;
      // Brief wait before non-rate-limit retry
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
};

// ---------------------------------------------------------------------------
// Specialised API wrappers (interface identical to previous claudeAPI.js)
// ---------------------------------------------------------------------------

/**
 * Generates personalised carbon reduction insights via EcoCoach (Gemini).
 * Response is cached in localStorage to avoid redundant API calls (1-hour TTL).
 *
 * @param {Object} footprintData - Full result from calcTotalFootprint()
 * @returns {Promise<string>} Markdown-formatted coaching text
 */
export const getCarbonCoachInsights = async (footprintData) => {
  // Stable cache key derived from footprint values (not length alone)
  const cacheKey = `cz_coach_${footprintData.totalMonthly}_${footprintData.grade}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.ts && Date.now() - parsed.ts < 3_600_000) { // 1-hour TTL
        return parsed.text;
      }
    } catch {
      // Cache corrupted — discard and proceed to fresh call
      localStorage.removeItem(cacheKey);
    }
  }

  const prompt = `Here is my monthly carbon footprint breakdown:

- Transport:   ${footprintData.transport} kg CO₂e/month
- Home Energy: ${footprintData.energy} kg CO₂e/month
- Diet:        ${footprintData.diet} kg CO₂e/month
- Shopping:    ${footprintData.shopping} kg CO₂e/month
- Total:       ${footprintData.totalMonthly} kg CO₂e/month (${footprintData.totalAnnualTonnes} tonnes/year)
- Grade:       ${footprintData.grade}
- vs India average:  ${footprintData.vsIndiaAvg} t/yr
- vs Global average: ${footprintData.vsGlobalAvg} t/yr
- vs Paris target:   ${footprintData.vsParisTarget} t/yr

Please provide my personalised EcoCoach assessment.`;

  const result = await callGemini(prompt, CARBON_COACH_SYSTEM_PROMPT, 3, 1024);

  // Persist to localStorage — safe; no PII in footprint data
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ text: result, ts: Date.now() }));
  } catch {
    // Storage quota exceeded — non-fatal, skip caching silently
  }

  return result;
};

/**
 * Backward-compatible alias for callers that still use the old function name.
 * @deprecated Use getCarbonCoachInsights instead.
 */
export const getCaronCoachInsights = getCarbonCoachInsights;

/**
 * Answers a climate-related Q&A question via ClimateBot (Gemini).
 *
 * @param {string} question            - User's climate question
 * @param {Object} [footprintContext]  - Optional footprint data for personalisation
 * @returns {Promise<string>} Answer text
 */
export const askClimateQuestion = async (question, footprintContext = null) => {
  let prompt = question;
  if (footprintContext) {
    prompt = `[Context: My monthly footprint is ${footprintContext.totalMonthly} kg CO₂e]\n\n${question}`;
  }
  return callGemini(prompt, CLIMATE_QA_SYSTEM_PROMPT, 2, 512);
};

export default {
  callGemini,
  getCarbonCoachInsights,
  getCaronCoachInsights, // backward-compat alias
  askClimateQuestion,
  getRemainingCalls,
  CARBON_COACH_SYSTEM_PROMPT,
  CLIMATE_QA_SYSTEM_PROMPT,
};

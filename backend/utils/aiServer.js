import { GoogleGenerativeAI } from "@google/generative-ai";

const FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
];

const resolveModelName = () => {
    const configured = process.env.GEMINI_MODEL?.trim();
    if (configured) return configured;
    return FALLBACK_MODELS[0];
};

let client = null;
const getClient = () => {
    if (client) return client;
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    client = new GoogleGenerativeAI(key);
    return client;
};

export const isAIEnabled = () => !!process.env.GEMINI_API_KEY;

export const parseJSON = (text) => {
    let cleaned = (text || "").trim();
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/```json\n?/g, "").replace(/```\n?$/g,"");
    } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/```\n?/g, "");
    }
    return JSON.parse(cleaned.trim())
};

export const chatCompletion = async ({ system, user, temperature = 0.7 }) => {
    const c = getClient();
    if (!c) {
        return {
            ok: false,
            content:
                "AI is disabled — set GEMINI_API_KEY in the backend .env to enable real AI responses."
        };
    }

    const candidateModels = [resolveModelName(), ...FALLBACK_MODELS.filter((m) => m !== resolveModelName())];

    for (const modelName of candidateModels) {
        try {
            const model = c.getGenerativeModel({ model: modelName });
            const result = await model.generateContent({
                contents: [{
                    role: "user",
                    parts: [{
                        text: `${system}\n\n${user}`
                    }]
                }],
                generationConfig: {
                    temperature,
                    maxOutputTokens: 1024,
                }
            });

            const text = await result.response.text();
            return { ok: true, content: (text || "").trim() };
        } catch (err) {
            const message = err?.message || "Unknown AI error";
            const likelyModelIssue = /model.*not found|unsupported.*model|invalid.*model|404/i.test(message);
            if (!likelyModelIssue) {
                console.error("AI error:", message);
                return { ok: false, content: "AI request failed. Please try again later." };
            }
            console.warn(`Falling back from model ${modelName}:`, message);
        }
    }

    return {
        ok: false,
        content: "AI request failed because the configured Gemini model is unavailable. Please update GEMINI_MODEL in backend/.env."
    };
};

export const SYSTEM_PROMPTS = {
    weekly:
         "You are a warm, encouraging habit coach. Analyse the user's last 7 days of habit data and write a short personalised report (100-120 words). Mention: what went well, what they struggled with, patterns noticed, and one specific piece of encouragement. Use the user's actual habit names. Be human, not generic. No markdown headers - use plain prose with line breaks.",
    suggestion:
        "You are a helpful habit coach. Based on the user's goals, productive time, and past struggles, suggest exactly 3 personalised habits. Return valid JSON only with this shape: {\"suggestions\":[{\"name\":\"...\",\"description\":\"...\",\"frequency\":\"daily|weekly\",\"category\":\"Health|Fitness|Learning|Mindfulness|Productivity|Social|Finance|Creative|Other\",\"icon\":\"<emoji>\",\"reason\":\"...\"}]}. No prose outside JSON.",
    recovery:
        "You are a compassionate habit recovery coach. The user broke a streak. Write a 3-day recovery plan tailored to this specific habit. Be warm but actionable. Use this structure: start with empathetic opening (1-2 sentences), then Day 1 / Day 2 / Day 3 sections with one concrete action each, then a closing line of encouragement. 150-220 words total.",
    chat:
        "You are a helpful habit analysis assistant. Answer the user's question using ONLY the provided habit data as context. Be specific - cite actual habit names, days, percentages. Keep replies under 120 words. If the data is insufficient, say so briefly.",
    morning:
        "You are a warm, motivating friend. Write a single short morning message (30-60 words) using the user's actual habit names and current streaks. Mention 1-2 specific habits. Energetic but not cheesy. No emoji overload - max 1.",
};
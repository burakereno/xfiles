import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { PROVIDER_MODELS, PROVIDER_LABELS } from "@/lib/ai-providers";

// Re-export for convenience
export { PROVIDER_MODELS, PROVIDER_LABELS };

// Provider base URLs for OpenAI-compatible APIs
const PROVIDER_BASE_URLS: Record<string, string> = {
    kimi: "https://api.moonshot.cn/v1",
    minimax: "https://api.minimaxi.chat/v1",
};

interface AiConfig {
    provider: string;
    apiKey: string;
    model: string;
}

/**
 * Get the active AI config from DB
 */
async function getActiveConfig(): Promise<AiConfig> {
    const dbConfig = await prisma.aiConfig.findFirst({
        where: { isActive: true },
    });

    if (!dbConfig) {
        throw new Error("No active AI configuration found. Please configure an AI provider in Settings.");
    }

    return {
        provider: dbConfig.provider,
        apiKey: dbConfig.apiKey,
        model: dbConfig.model,
    };
}

/**
 * Generate text using Gemini SDK
 */
async function generateWithGemini(prompt: string, apiKey: string, model: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const aiModel = genAI.getGenerativeModel({ model });
    const result = await aiModel.generateContent(prompt);
    return result.response.text();
}

/**
 * Generate text using OpenAI SDK (also for Kimi and MiniMax via baseURL)
 */
async function generateWithOpenAI(
    prompt: string,
    apiKey: string,
    model: string,
    baseURL?: string
): Promise<string> {
    const client = new OpenAI({
        apiKey,
        ...(baseURL && { baseURL }),
    });

    const response = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0]?.message?.content || "";
}

/**
 * Generate text using Anthropic SDK
 */
async function generateWithAnthropic(prompt: string, apiKey: string, model: string): Promise<string> {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
        model,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((c) => c.type === "text");
    return textBlock?.text || "";
}

/**
 * Provider-agnostic text generation.
 * Reads the active AI config from DB and routes the prompt to the correct SDK.
 */
export async function generateText(prompt: string): Promise<string> {
    const config = await getActiveConfig();

    if (!config.apiKey) {
        throw new Error(`API key not configured for provider: ${config.provider}`);
    }

    switch (config.provider) {
        case "gemini":
            return generateWithGemini(prompt, config.apiKey, config.model);

        case "openai":
            return generateWithOpenAI(prompt, config.apiKey, config.model);

        case "kimi":
            return generateWithOpenAI(prompt, config.apiKey, config.model, PROVIDER_BASE_URLS.kimi);

        case "minimax":
            return generateWithOpenAI(prompt, config.apiKey, config.model, PROVIDER_BASE_URLS.minimax);

        case "anthropic":
            return generateWithAnthropic(prompt, config.apiKey, config.model);

        default:
            throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
}

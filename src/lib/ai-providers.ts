/**
 * Shared AI provider constants — provider labels, models, etc.
 * Separated from ai.ts to avoid importing heavy AI SDKs in config routes.
 */

// Default models per provider
export const PROVIDER_MODELS: Record<string, { id: string; label: string }[]> = {
    gemini: [
        { id: "gemini-3-pro-preview", label: "Gemini 3 Pro" },
        { id: "gemini-3-flash-preview", label: "Gemini 3 Flash" },
        { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
        { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
        { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
    ],
    openai: [
        { id: "gpt-5.2", label: "GPT-5.2" },
        { id: "gpt-5", label: "GPT-5" },
        { id: "gpt-5-mini", label: "GPT-5 Mini" },
        { id: "o3", label: "o3" },
        { id: "o4-mini", label: "o4-mini" },
        { id: "gpt-4.1", label: "GPT-4.1" },
        { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    ],
    anthropic: [
        { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
        { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
        { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
        { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    ],
    kimi: [
        { id: "moonshot-v1-8k", label: "Moonshot V1 8K" },
        { id: "moonshot-v1-32k", label: "Moonshot V1 32K" },
        { id: "moonshot-v1-128k", label: "Moonshot V1 128K" },
    ],
    minimax: [
        { id: "MiniMax-M2.5", label: "MiniMax M2.5" },
        { id: "MiniMax-M2.1", label: "MiniMax M2.1" },
        { id: "MiniMax-M2.5-highspeed", label: "MiniMax M2.5 Highspeed" },
    ],
};

export const PROVIDER_LABELS: Record<string, string> = {
    gemini: "Google Gemini",
    openai: "OpenAI",
    anthropic: "Anthropic",
    kimi: "Kimi AI",
    minimax: "MiniMax",
};

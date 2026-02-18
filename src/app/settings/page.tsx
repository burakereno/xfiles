"use client";

import { useState, useEffect } from "react";
import { Settings, User, Trash2, Star, Plus, Loader2, Eye, EyeOff, Zap, CheckCircle, AlertCircle, Brain, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface XAccount {
    id: string;
    xUserId: string;
    username: string;
    displayName: string;
    profileImage: string | null;
    isDefault: boolean;
    createdAt: string;
}

interface ProviderModel {
    id: string;
    label: string;
}

interface ProviderInfo {
    id: string;
    label: string;
    models: ProviderModel[];
}

interface AiConfigData {
    id: string;
    provider: string;
    providerLabel: string;
    model: string;
    apiKey: string;
    isActive: boolean;
}

export default function SettingsPage() {
    const [accounts, setAccounts] = useState<XAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // AI Config state
    const [aiConfig, setAiConfig] = useState<AiConfigData | null>(null);
    const [providers, setProviders] = useState<ProviderInfo[]>([]);
    const [selectedProvider, setSelectedProvider] = useState("gemini");
    const [apiKeyInput, setApiKeyInput] = useState("");
    const [selectedModel, setSelectedModel] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const [aiLoading, setAiLoading] = useState(true);
    const [aiSaving, setAiSaving] = useState(false);
    const [aiTesting, setAiTesting] = useState(false);
    const [aiMessage, setAiMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);


    useEffect(() => {
        loadAccounts();
        loadAiConfig();
    }, []);

    // ─── X Accounts ────────────────────────────────────
    const loadAccounts = async () => {
        try {
            const res = await fetch("/api/x/accounts");
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts);
            }
        } catch {
            console.error("Failed to load accounts");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = () => {
        window.location.href = "/api/x/auth";
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/x/accounts?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setAccounts((prev) => prev.filter((a) => a.id !== id));
            }
        } catch {
            console.error("Failed to delete account");
        } finally {
            setDeletingId(null);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const res = await fetch(`/api/x/accounts`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isDefault: true }),
            });
            if (res.ok) {
                setAccounts((prev) =>
                    prev.map((a) => ({ ...a, isDefault: a.id === id }))
                );
            }
        } catch {
            console.error("Failed to set default");
        }
    };

    // ─── AI Config ─────────────────────────────────────
    const loadAiConfig = async () => {
        try {
            const res = await fetch("/api/ai-config");
            if (res.ok) {
                const data = await res.json();
                setProviders(data.providers || []);

                if (data.config) {
                    setAiConfig(data.config);
                    setSelectedProvider(data.config.provider);
                    setSelectedModel(data.config.model);
                    setApiKeyInput(""); // Don't pre-fill key for security
                }
            }
        } catch {
            console.error("Failed to load AI config");
        } finally {
            setAiLoading(false);
        }
    };

    const handleProviderChange = (provider: string) => {
        setSelectedProvider(provider);
        setApiKeyInput("");
        setAiMessage(null);
        // Set first model as default for the new provider
        const providerInfo = providers.find((p) => p.id === provider);
        if (providerInfo?.models.length) {
            setSelectedModel(providerInfo.models[0].id);
        }
    };

    const handleSaveAiConfig = async () => {
        if (!apiKeyInput.trim()) {
            setAiMessage({ type: "error", text: "API key boş olamaz." });
            return;
        }

        setAiSaving(true);
        setAiMessage(null);

        try {
            const res = await fetch("/api/ai-config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: selectedProvider,
                    apiKey: apiKeyInput.trim(),
                    model: selectedModel,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setAiMessage({ type: "success", text: `${data.config.providerLabel} başarıyla kaydedildi.` });
                setApiKeyInput("");
                await loadAiConfig(); // Reload to get masked key
            } else {
                const errData = await res.json();
                setAiMessage({ type: "error", text: errData.error || "Kaydetme başarısız." });
            }
        } catch {
            setAiMessage({ type: "error", text: "Bağlantı hatası." });
        } finally {
            setAiSaving(false);
        }
    };

    const handleTestAiConfig = async () => {
        setAiTesting(true);
        setAiMessage(null);

        try {
            // If user has entered a new key but hasn't saved, save first
            if (apiKeyInput.trim()) {
                const saveRes = await fetch("/api/ai-config", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        provider: selectedProvider,
                        apiKey: apiKeyInput.trim(),
                        model: selectedModel,
                    }),
                });
                if (!saveRes.ok) {
                    setAiMessage({ type: "error", text: "Kaydetme başarısız oldu, test yapılamadı." });
                    setAiTesting(false);
                    return;
                }
            }

            const res = await fetch("/api/ai-config/test", { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                setAiMessage({ type: "success", text: `✓ Bağlantı başarılı! Yanıt: "${data.response?.substring(0, 80)}..."` });
                await loadAiConfig();
            } else {
                const errData = await res.json();
                setAiMessage({ type: "error", text: errData.error || "Test başarısız." });
            }
        } catch {
            setAiMessage({ type: "error", text: "Test sırasında hata oluştu." });
        } finally {
            setAiTesting(false);
        }
    };

    const handleRemoveAiConfig = async () => {
        try {
            const res = await fetch("/api/ai-config", { method: "DELETE" });
            if (res.ok) {
                setAiConfig(null);
                setApiKeyInput("");
                setSelectedProvider("gemini");
                setSelectedModel("gemini-2.5-flash");
                setAiMessage({ type: "success", text: "AI ayarları kaldırıldı. .env fallback kullanılacak." });
                await loadAiConfig();
            }
        } catch {
            setAiMessage({ type: "error", text: "Silme başarısız." });
        }
    };

    const currentProviderModels = providers.find((p) => p.id === selectedProvider)?.models || [];

    return (
        <div className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-2xl space-y-6">
                {/* X Accounts Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-5 w-5" />
                            X Hesapları
                        </CardTitle>
                        <CardDescription>
                            Tweet paylaşmak için X hesaplarınızı bağlayın.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : accounts.length > 0 ? (
                            <div className="space-y-2">
                                {accounts.map((account) => (
                                    <div
                                        key={account.id}
                                        className="flex items-center justify-between rounded-lg border border-border p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            {account.profileImage ? (
                                                <img
                                                    src={account.profileImage}
                                                    alt={account.username}
                                                    className="h-10 w-10 rounded-full"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                    <User className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {account.displayName}
                                                    </span>
                                                    {account.isDefault && (
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            Varsayılan
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    @{account.username}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {!account.isDefault && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSetDefault(account.id)}
                                                    title="Varsayılan yap"
                                                >
                                                    <Star className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(account.id)}
                                                disabled={deletingId === account.id}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                {deletingId === account.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                                Henüz bağlı hesap yok.
                            </div>
                        )}

                        <Button
                            onClick={handleConnect}
                            className="w-full"
                            variant="outline"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            X Hesabı Bağla
                        </Button>
                    </CardContent>
                </Card>

                <Separator />

                {/* AI Provider Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Brain className="h-5 w-5" />
                            AI Sağlayıcı
                        </CardTitle>
                        <CardDescription>
                            Tweet üretimi için kullanılacak AI sağlayıcısını seçin ve API key&apos;inizi girin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {aiLoading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                {/* Active config badge */}
                                {aiConfig && (
                                    <div className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span className="text-sm font-medium">{aiConfig.providerLabel}</span>
                                            <Badge variant="secondary" className="text-[10px]">
                                                {aiConfig.model}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {aiConfig.apiKey}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleRemoveAiConfig}
                                                className="text-destructive hover:text-destructive h-7 w-7 p-0"
                                                title="AI ayarını kaldır"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}



                                {/* Provider Select */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Sağlayıcı</label>
                                    <Select value={selectedProvider} onValueChange={handleProviderChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Sağlayıcı seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {providers.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* API Key Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">API Key</label>
                                    <div className="relative">
                                        <input
                                            type={showApiKey ? "text" : "password"}
                                            value={apiKeyInput}
                                            onChange={(e) => setApiKeyInput(e.target.value)}
                                            placeholder={aiConfig ? "Yeni key girin (değiştirmek için)" : "API key girin..."}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-10 font-mono"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showApiKey ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Model Select */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Model</label>
                                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Model seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currentProviderModels.map((m) => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Status Message */}
                                {aiMessage && (
                                    <div
                                        className={`flex items-start gap-2 rounded-lg p-3 text-sm ${aiMessage.type === "success"
                                            ? "border border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400"
                                            : "border border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-400"
                                            }`}
                                    >
                                        {aiMessage.type === "success" ? (
                                            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                        )}
                                        <span>{aiMessage.text}</span>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleSaveAiConfig}
                                        disabled={aiSaving || !apiKeyInput.trim()}
                                        className="flex-1"
                                    >
                                        {aiSaving ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Zap className="mr-2 h-4 w-4" />
                                        )}
                                        Kaydet
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleTestAiConfig}
                                        disabled={aiTesting || (!aiConfig && !apiKeyInput.trim())}
                                    >
                                        {aiTesting ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <FlaskConical className="mr-2 h-4 w-4" />
                                        )}
                                        Test Et
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Separator />

                {/* API Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">API Durumu</CardTitle>
                        <CardDescription>Bağlı servislerin durumu</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">X API (OAuth 2.0)</span>
                            <span className="flex items-center gap-2 text-sm">
                                <span
                                    className={`h-2 w-2 rounded-full ${accounts.length > 0 ? "bg-green-500" : "bg-yellow-500"
                                        }`}
                                />
                                {accounts.length > 0
                                    ? `${accounts.length} hesap bağlı`
                                    : "Hesap bağlanmadı"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">AI Sağlayıcı</span>
                            <span className="flex items-center gap-2 text-sm">
                                <span className={`h-2 w-2 rounded-full ${aiConfig ? "bg-green-500" : "bg-red-500"}`} />
                                {aiConfig
                                    ? `${aiConfig.providerLabel} (${aiConfig.model})`
                                    : "Ayarlanmadı"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Veritabanı (SQLite)</span>
                            <span className="flex items-center gap-2 text-sm">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                Aktif
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Version */}
                <div className="pt-6 text-center text-xs text-muted-foreground">
                    XFiles v0.1.0 - AI Tweet Automation Platform
                </div>
            </div>
        </div>
    );
}

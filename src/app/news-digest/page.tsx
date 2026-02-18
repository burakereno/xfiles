"use client";

import { useState, useEffect, useRef } from "react";
import { Newspaper, RefreshCw, Sparkles, Clock, Check, ExternalLink, ChevronDown, ChevronUp, Briefcase, Heart, Laugh, Minus, Equal, Plus, Info, Send, Loader2, ExternalLink as LinkIcon, Image as ImageIcon, X, Trash2, User, Settings as SettingsIcon, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { XTabs } from "@/components/ui/x-tabs";
import { XButtonGroup } from "@/components/ui/x-button-group";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Section Label with Info Tooltip (same as GeneratorPanel)
function SectionLabel({ label, info }: { label: string; info: string }) {
    return (
        <div className="mb-2 flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground/50 cursor-help hover:text-muted-foreground transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                        <p>{info}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

interface NewsSource {
    id: string;
    name: string;
    url: string;
    category: string;
    isActive: boolean;
    newsCount?: number;
}

interface NewsItem {
    id: string;
    title: string;
    link: string;
    description: string | null;
    imageUrl: string | null;
    category: string | null;
    publishedAt: string;
    sourceId: string;
    sourceName?: string;
    isSelected: boolean;
}

interface NewsDigest {
    id: string;
    content: string;
    status: string;
    createdAt: string;
}

interface XAccountSummary {
    id: string;
    username: string;
    displayName: string;
    profileImage: string | null;
    isDefault: boolean;
}

// News categories
const CATEGORIES = [
    { id: "tümü", label: "Tümü", icon: "📋" },
    { id: "teknoloji", label: "Teknoloji", icon: "💻" },
    { id: "siyaset", label: "Siyaset", icon: "🏛️" },
    { id: "ekonomi", label: "Ekonomi", icon: "💰" },
    { id: "dünya", label: "Dünya", icon: "🌍" },
    { id: "spor", label: "Spor", icon: "⚽" },
    { id: "yaşam", label: "Yaşam", icon: "🌿" },
];

// Default Turkish news sources with categories
const DEFAULT_SOURCES: Omit<NewsSource, "id" | "newsCount">[] = [
    { name: "NTV", url: "https://www.ntv.com.tr/teknoloji.rss", category: "teknoloji", isActive: true },
    { name: "Webtekno", url: "https://www.webtekno.com/rss.xml", category: "teknoloji", isActive: true },
    { name: "T24", url: "https://t24.com.tr/rss/haber/bilim-teknoloji", category: "teknoloji", isActive: true },
    { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/teknoloji", category: "teknoloji", isActive: true },
    { name: "T24", url: "https://t24.com.tr/rss/haber/politika", category: "siyaset", isActive: true },
    { name: "NTV", url: "https://www.ntv.com.tr/turkiye.rss", category: "siyaset", isActive: true },
    { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/siyaset", category: "siyaset", isActive: true },
    { name: "NTV", url: "https://www.ntv.com.tr/ekonomi.rss", category: "ekonomi", isActive: true },
    { name: "T24", url: "https://t24.com.tr/rss/haber/ekonomi", category: "ekonomi", isActive: true },
    { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/ekonomi", category: "ekonomi", isActive: true },
    { name: "NTV", url: "https://www.ntv.com.tr/dunya.rss", category: "dünya", isActive: true },
    { name: "T24", url: "https://t24.com.tr/rss/haber/dunya", category: "dünya", isActive: true },
    { name: "BBC Türkçe", url: "https://feeds.bbci.co.uk/turkce/rss.xml", category: "dünya", isActive: true },
    { name: "Euronews Türkçe", url: "https://tr.euronews.com/rss", category: "dünya", isActive: true },
    { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/dunya", category: "dünya", isActive: true },
    { name: "NTV", url: "https://www.ntv.com.tr/spor.rss", category: "spor", isActive: true },
    { name: "T24", url: "https://t24.com.tr/rss/haber/spor", category: "spor", isActive: true },
    { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/spor", category: "spor", isActive: true },
    { name: "NTV", url: "https://www.ntv.com.tr/yasam.rss", category: "yaşam", isActive: true },
    { name: "T24", url: "https://t24.com.tr/rss/haber/yasam", category: "yaşam", isActive: true },
    { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/yasam", category: "yaşam", isActive: true },
];

// Settings options
const toneOptions = [
    { id: "professional", label: "Profesyonel", icon: Briefcase, description: "Resmi ve iş odaklı ton" },
    { id: "friendly", label: "Samimi", icon: Heart, description: "Sıcak ve arkadaşça yaklaşım" },
    { id: "humorous", label: "Esprili", icon: Laugh, description: "Eğlenceli ve mizahi içerik" },
];

const lengthOptions = [
    { id: "short", label: "Kısa", icon: Minus, description: "< 200 karakter" },
    { id: "medium", label: "Orta", icon: Equal, description: "200-260 karakter" },
    { id: "long", label: "Uzun", icon: Plus, description: "260-280 karakter" },
];

const tweetCountOptions = [
    { id: "1", label: "1" },
    { id: "3", label: "3" },
    { id: "5", label: "5" },
    { id: "7", label: "7" },
    { id: "10", label: "10" },
];

const hashtagCountOptions = [
    { id: "0", label: "Yok" },
    { id: "2", label: "2" },
    { id: "3", label: "3" },
];

export default function NewsDigestPage() {
    const [sources, setSources] = useState<NewsSource[]>([]);
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [digest, setDigest] = useState<NewsDigest | null>(null);
    const [isLoadingSources, setIsLoadingSources] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("tümü");
    const [isPosting, setIsPosting] = useState(false);
    const [postResult, setPostResult] = useState<{ success: boolean; threadUrl?: string; error?: string } | null>(null);
    const [showExamples, setShowExamples] = useState(false);
    const [digestImageUrls, setDigestImageUrls] = useState<(string | null)[]>([]);

    // X Account selection
    const [xAccounts, setXAccounts] = useState<XAccountSummary[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);
    const accountDropdownRef = useRef<HTMLDivElement>(null);

    // AI Settings
    const [tweetCount, setTweetCount] = useState("5");
    const [tone, setTone] = useState("professional");
    const [length, setLength] = useState("medium");
    const [hashtagCount, setHashtagCount] = useState("2");
    const [exampleTweets, setExampleTweets] = useState("");

    // CTA settings
    const [ctaEnabled, setCtaEnabled] = useState(true);
    const [ctaText, setCtaText] = useState("🔔 Takip et, günlük özet kaçırma!");

    // Computed values
    const selectedCount = newsItems.filter(item => item.isSelected).length;
    const charLimit = length === "short" ? 180 : length === "medium" ? 220 : 250;

    // Load sources on mount
    useEffect(() => {
        loadSources();
        loadNews();
        loadXAccounts();
    }, []);

    // Close account dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
                setShowAccountDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadXAccounts = async () => {
        try {
            const res = await fetch("/api/x/accounts");
            if (res.ok) {
                const data = await res.json();
                setXAccounts(data.accounts);
                const defaultAcc = data.accounts.find((a: XAccountSummary) => a.isDefault);
                if (defaultAcc) setSelectedAccountId(defaultAcc.id);
                else if (data.accounts.length > 0) setSelectedAccountId(data.accounts[0].id);
            }
        } catch {
            console.error("Failed to load X accounts");
        }
    };

    const loadSources = async () => {
        try {
            const res = await fetch("/api/news-digest/sources");
            if (res.ok) {
                const data = await res.json();
                setSources(data.sources);
            }
        } catch {
            console.error("Failed to load sources");
        } finally {
            setIsLoadingSources(false);
        }
    };

    const loadNews = async () => {
        try {
            const res = await fetch("/api/news-digest/news");
            if (res.ok) {
                const data = await res.json();
                setNewsItems(data.news);
            }
        } catch {
            console.error("Failed to load news");
        }
    };

    const handleFetchNews = async () => {
        setIsFetching(true);
        try {
            const res = await fetch("/api/news-digest/fetch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sources: DEFAULT_SOURCES }),
            });
            if (res.ok) {
                await loadSources();
                await loadNews();
            }
        } catch {
            console.error("Failed to fetch news");
        } finally {
            setIsFetching(false);
        }
    };

    const handleResetNews = async () => {
        try {
            const res = await fetch("/api/news-digest/reset", { method: "DELETE" });
            if (res.ok) {
                setNewsItems([]);
                setSources([]);
                setDigest(null);
                await loadSources();
            }
        } catch {
            console.error("Failed to reset news");
        }
    };

    const handleToggleNewsItem = async (id: string, isSelected: boolean) => {
        try {
            await fetch(`/api/news-digest/news/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isSelected }),
            });
            setNewsItems(items =>
                items.map(item => (item.id === id ? { ...item, isSelected } : item))
            );
        } catch {
            console.error("Failed to toggle news item");
        }
    };

    const handleClearSelection = async () => {
        const selectedItems = newsItems.filter(item => item.isSelected);
        if (selectedItems.length === 0) return;
        // Optimistic UI update
        setNewsItems(items => items.map(item => ({ ...item, isSelected: false })));
        // Parallel PATCH calls
        await Promise.allSettled(
            selectedItems.map(item =>
                fetch(`/api/news-digest/news/${item.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isSelected: false }),
                })
            )
        );
    };

    const handleGenerateDigest = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/news-digest/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    format: parseInt(tweetCount) === 1 ? "single" : "thread",
                    tweetCount: parseInt(tweetCount),
                    tone,
                    charLimit,
                    hashtagCount: parseInt(hashtagCount),
                    exampleTweets,
                    ctaEnabled,
                    ctaText,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setDigest(data.digest);
                setDigestImageUrls(data.imageUrls || []);
                setPostResult(null);
            }
        } catch {
            console.error("Failed to generate digest");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePostThread = async () => {
        if (!digest) return;

        setIsPosting(true);
        setPostResult(null);

        try {
            const tweets = digest.content
                .split(/---/)
                .filter(t => t.trim())
                .map(t => t.trim());

            // Map image URLs: first tweet (summary) gets no image, subsequent tweets get images from selected news
            const imageUrlsForPosting: (string | null)[] = tweets.map((_, i) => {
                if (i === 0) return null; // Summary tweet has no image
                return digestImageUrls[i - 1] || null;
            });

            const res = await fetch("/api/x/post-thread", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    digestId: digest.id,
                    tweets,
                    imageUrls: imageUrlsForPosting,
                    accountId: selectedAccountId || undefined,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setPostResult({ success: true, threadUrl: data.threadUrl });
                // Update digest status locally
                setDigest(prev => prev ? { ...prev, status: "posted" } : null);
            } else {
                setPostResult({ success: false, error: data.error || "Bilinmeyen hata" });
            }
        } catch (error) {
            setPostResult({ success: false, error: error instanceof Error ? error.message : "Bağlantı hatası" });
        } finally {
            setIsPosting(false);
        }
    };

    const today = new Date().toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
            {/* Left Sidebar - AI Settings (matching GeneratorPanel style) */}
            <div className="flex h-full w-80 shrink-0 flex-col border-r border-border bg-card">
                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {/* Tweet Count */}
                    <div className="mb-6">
                        <SectionLabel label="Tweet Sayısı" info="1 = Tek tweet, 3+ = Thread formatı." />
                        <XTabs value={tweetCount} onValueChange={setTweetCount} options={tweetCountOptions} />
                        <p className="mt-1.5 text-[10px] text-muted-foreground/60">
                            {parseInt(tweetCount) === 1 ? "📝 Tek tweet olarak paylaşılır" : `🧵 ${tweetCount} tweet'lik thread olarak paylaşılır`}
                        </p>
                    </div>

                    {/* Hashtag Count */}
                    <div className="mb-6">
                        <SectionLabel label="Hashtag" info="Tweet sonuna eklenecek hashtag sayısı. Phoenix: Max 3 önerilir." />
                        <XTabs value={hashtagCount} onValueChange={setHashtagCount} options={hashtagCountOptions} />
                        <p className="mt-1.5 text-[10px] text-muted-foreground/60">
                            {parseInt(hashtagCount) === 0 ? "🚫 Hashtag kullanılmaz" : `#️⃣ ${hashtagCount} hashtag eklenecek`}
                        </p>
                    </div>

                    <Separator className="my-4" />

                    {/* Tone */}
                    <div className="mb-6">
                        <SectionLabel label="Ton" info="İçeriğin genel havası. Hedef kitleye uygun ton seçin." />
                        <XButtonGroup
                            value={tone}
                            onValueChange={setTone}
                            options={toneOptions}
                            columns={3}
                        />
                    </div>

                    {/* Length */}
                    <div className="mb-6">
                        <SectionLabel label="Uzunluk" info="Daha uzun içerik = Daha fazla dwell time = Daha iyi algoritma skoru." />
                        <XButtonGroup
                            value={length}
                            onValueChange={setLength}
                            options={lengthOptions}
                            columns={3}
                        />
                    </div>

                    <Separator className="my-4" />

                    {/* Example Tweets (Collapsible) */}
                    <div className="mb-6">
                        <button
                            onClick={() => setShowExamples(!showExamples)}
                            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showExamples ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            <span>Örnek Tweetler (Gelişmiş)</span>
                        </button>
                        {showExamples && (
                            <div className="mt-3 space-y-2">
                                <textarea
                                    value={exampleTweets}
                                    onChange={(e) => setExampleTweets(e.target.value)}
                                    placeholder="Kendi tarzınızda örnek tweetler yazın...&#10;&#10;Örnek:&#10;🔥 Piyasalar bugün hareketli! Dolar 32 TL'yi gördü."
                                    className="h-24 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <p className="text-xs text-muted-foreground">
                                    💡 2-3 örnek tweet yazarsanız AI daha iyi öğrenir
                                </p>
                            </div>
                        )}
                    </div>

                    <Separator className="my-4" />

                    {/* CTA */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                                <span className="text-xs font-medium text-muted-foreground">CTA (Call-to-Action)</span>
                            </div>
                            <button
                                onClick={() => setCtaEnabled(!ctaEnabled)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${ctaEnabled ? "bg-primary" : "bg-muted"
                                    }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${ctaEnabled ? "translate-x-4" : "translate-x-0"
                                        }`}
                                />
                            </button>
                        </div>
                        {ctaEnabled && (
                            <div className="mt-2">
                                <input
                                    type="text"
                                    value={ctaText}
                                    onChange={(e) => setCtaText(e.target.value)}
                                    placeholder="Thread sonuna eklenecek CTA metni..."
                                    className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">Thread sonuna eklenir</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Generate Button */}
                <div className="border-t border-border p-4">
                    <Button
                        onClick={handleGenerateDigest}
                        disabled={selectedCount === 0 || isGenerating}
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        size="lg"
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isGenerating ? "Oluşturuluyor..." : "AI Özet Oluştur"}
                    </Button>
                    {selectedCount === 0 && (
                        <p className="mt-2 text-center text-xs text-muted-foreground">
                            Önce haber seçin
                        </p>
                    )}
                </div>
            </div>

            {/* Middle Panel - News Sources & List */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden border-r border-border">
                {/* Header */}
                <header className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Newspaper className="h-5 w-5 text-primary" />
                        <h1 className="text-lg font-semibold">Haber Özeti</h1>
                        <span className="text-sm text-muted-foreground">{today}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleFetchNews}
                            disabled={isFetching}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                            Haberleri Çek
                        </Button>
                        {newsItems.length > 0 && (
                            <Button
                                variant="destructive-ghost"
                                size="sm"
                                onClick={handleResetNews}
                            >
                                <Trash2 className="mr-1.5 h-4 w-4" />
                                Sıfırla
                            </Button>
                        )}
                    </div>
                </header>

                {/* Sources Section */}
                <div className="border-b border-border px-4 py-2">
                    <h2 className="mb-2 text-sm font-medium text-muted-foreground">Haber Kaynakları</h2>
                    <div className="grid grid-cols-2 gap-1.5">
                        {isLoadingSources ? (
                            <div className="col-span-2 py-4 text-center text-sm text-muted-foreground">
                                Yükleniyor...
                            </div>
                        ) : sources.length > 0 ? (
                            Object.values(
                                sources.reduce((acc, source) => {
                                    if (!acc[source.name]) {
                                        acc[source.name] = { ...source, newsCount: source.newsCount || 0 };
                                    } else {
                                        acc[source.name].newsCount = (acc[source.name].newsCount || 0) + (source.newsCount || 0);
                                        acc[source.name].isActive = acc[source.name].isActive || source.isActive;
                                    }
                                    return acc;
                                }, {} as Record<string, NewsSource>)
                            ).map((source) => (
                                <Card key={source.name} className="px-3 py-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`h-2 w-2 rounded-full ${source.isActive ? "bg-green-500" : "bg-muted"
                                                    }`}
                                            />
                                            <span className="text-sm font-medium">{source.name}</span>
                                        </div>
                                        {source.newsCount !== undefined && (
                                            <Badge variant="secondary" className="text-xs">
                                                {source.newsCount} haber
                                            </Badge>
                                        )}
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-2 py-4 text-center text-sm text-muted-foreground">
                                Kaynak bulunamadı. &quot;Haberleri Çek&quot; butonuna tıklayın.
                            </div>
                        )}
                    </div>
                </div>

                {/* News List */}
                <div className="flex-1 overflow-auto">
                    <div className="sticky top-0 z-10 border-b border-border/50 bg-background/70 backdrop-blur-md">
                        <div className="flex items-center justify-between px-4 py-3">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Son Haberler
                                {newsItems.length > 0 && (
                                    <span className="ml-2 text-xs">({selectedCount} seçili)</span>
                                )}
                            </h2>
                            {selectedCount > 0 && (
                                <Button
                                    variant="destructive-ghost"
                                    size="sm"
                                    onClick={handleClearSelection}
                                    className="h-7 gap-1 text-xs"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Seçimi Temizle
                                </Button>
                            )}
                        </div>
                        {/* Category Filter Tabs */}
                        {newsItems.length > 0 && (
                            <div className="flex gap-1 overflow-x-auto px-4 pb-3 scrollbar-hide">
                                {CATEGORIES.map((cat) => {
                                    const count = cat.id === "tümü"
                                        ? newsItems.length
                                        : newsItems.filter((n) => n.category === cat.id).length;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${selectedCategory === cat.id
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                                }`}
                                        >
                                            <span>{cat.icon}</span>
                                            <span>{cat.label}</span>
                                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${selectedCategory === cat.id
                                                ? "bg-primary-foreground/20 text-primary-foreground"
                                                : "bg-background/50 text-muted-foreground"
                                                }`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="space-y-2 p-4">
                        {newsItems.length > 0 ? (
                            newsItems
                                .filter((item) => selectedCategory === "tümü" || item.category === selectedCategory)
                                .map((item) => (
                                    <Card
                                        key={item.id}
                                        className={`cursor-pointer p-0 transition-colors ${item.isSelected ? "border-primary/50 bg-primary/5" : ""
                                            }`}
                                        onClick={() => handleToggleNewsItem(item.id, !item.isSelected)}
                                    >
                                        <CardContent className="p-2.5">
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    checked={item.isSelected}
                                                    onCheckedChange={(checked) =>
                                                        handleToggleNewsItem(item.id, checked as boolean)
                                                    }
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-medium leading-tight">{item.title}</h3>
                                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>{item.sourceName}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(item.publishedAt).toLocaleTimeString("tr-TR", {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </span>
                                                        {item.imageUrl && (
                                                            <span className="flex items-center gap-1 text-primary">
                                                                <ImageIcon className="h-3 w-3" />
                                                            </span>
                                                        )}
                                                        <a
                                                            href={item.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="ml-auto flex items-center gap-1 text-primary hover:underline"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    </div>
                                                </div>
                                                {item.imageUrl && (
                                                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                                                        <img
                                                            src={item.imageUrl}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                        ) : (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                Henüz haber yok. &quot;Haberleri Çek&quot; butonuna tıklayarak başlayın.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel - Tweet Preview */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <Card className="flex flex-1 flex-col overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <span className="text-lg">🐦</span>
                            Tweet Önizleme
                        </CardTitle>
                        <CardDescription>
                            {selectedCount > 0
                                ? `${selectedCount} haber seçildi. AI özet oluşturulabilir.`
                                : "Özet için haber seçin."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        {digest ? (() => {
                            const tweets = digest.content
                                .split(/---/)
                                .filter(t => t.trim())
                                .map(t => t.trim());

                            const X_CHAR_LIMIT = 280;
                            const totalChars = digest.content.length;
                            const overLimitCount = tweets.filter(t => t.length > X_CHAR_LIMIT).length;

                            return (
                                <div className="space-y-4">
                                    {/* Summary Stats */}
                                    <div className="flex items-center gap-3">
                                        <Badge variant="secondary">
                                            {tweets.length} Tweet
                                        </Badge>
                                        <Badge variant="secondary">
                                            Toplam: {totalChars.toLocaleString()} karakter
                                        </Badge>
                                        {overLimitCount > 0 ? (
                                            <Badge variant="destructive">
                                                {overLimitCount} tweet limit aşıyor!
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-green-600 hover:bg-green-600">
                                                ✓ Tüm tweetler uygun
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Tweet List */}
                                    <div className="space-y-3">
                                        {tweets.map((tweet, index) => {
                                            const charCount = tweet.length;
                                            const isOverLimit = charCount > X_CHAR_LIMIT;
                                            const percentage = Math.min((charCount / X_CHAR_LIMIT) * 100, 100);

                                            return (
                                                <div
                                                    key={index}
                                                    className={`rounded-lg border p-3 ${isOverLimit
                                                        ? 'border-red-500/50 bg-red-500/5'
                                                        : 'border-border bg-muted/30'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-medium text-muted-foreground">
                                                            Tweet {index + 1}
                                                        </span>
                                                        <span className={`text-xs font-mono ${isOverLimit ? 'text-red-500' :
                                                            charCount > X_CHAR_LIMIT * 0.9 ? 'text-yellow-500' :
                                                                'text-green-500'
                                                            }`}>
                                                            {charCount}/{X_CHAR_LIMIT}
                                                        </span>
                                                    </div>

                                                    <div className="h-1 w-full bg-muted rounded-full mb-2 overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all ${isOverLimit ? 'bg-red-500' :
                                                                charCount > X_CHAR_LIMIT * 0.9 ? 'bg-yellow-500' :
                                                                    'bg-green-500'
                                                                }`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>

                                                    {/* Image preview for non-first tweets */}
                                                    {index > 0 && digestImageUrls[index - 1] && (
                                                        <div className="mb-2 overflow-hidden rounded-lg border border-border">
                                                            <img
                                                                src={digestImageUrls[index - 1]!}
                                                                alt=""
                                                                className="h-32 w-full object-cover"
                                                                onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                                                            />
                                                        </div>
                                                    )}

                                                    <pre className="whitespace-pre-wrap font-sans text-sm">
                                                        {tweet}
                                                    </pre>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })() : isGenerating ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center">
                                    <Sparkles className="mx-auto mb-3 h-8 w-8 animate-pulse text-primary" />
                                    <p className="text-sm text-muted-foreground">AI özet oluşturuluyor...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center text-muted-foreground">
                                    <Newspaper className="mx-auto mb-3 h-8 w-8 opacity-50" />
                                    <p className="text-sm">
                                        Haber seçin ve &quot;AI Özet Oluştur&quot; butonuna tıklayın.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    {/* Sticky Share Footer */}
                    {digest && (() => {
                        const tweets = digest.content.split(/---/).filter(t => t.trim());
                        const X_CHAR_LIMIT = 280;
                        const overLimitCount = tweets.filter(t => t.trim().length > X_CHAR_LIMIT).length;

                        return (
                            <div className="border-t border-border px-4 py-3">
                                {/* Post result feedback */}
                                {postResult && (
                                    <div className={`mb-3 rounded-lg border p-3 text-sm ${postResult.success
                                        ? 'border-green-500/50 bg-green-500/10 text-green-400'
                                        : 'border-red-500/50 bg-red-500/10 text-red-400'
                                        }`}>
                                        {postResult.success ? (
                                            <div className="flex items-center gap-2">
                                                <Check className="h-4 w-4" />
                                                <span>Thread başarıyla paylaşıldı!</span>
                                                {postResult.threadUrl && (
                                                    <a
                                                        href={postResult.threadUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ml-auto flex items-center gap-1 underline hover:text-green-300"
                                                    >
                                                        X&apos;te Görüntüle
                                                        <LinkIcon className="h-3 w-3" />
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span>❌ {postResult.error}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Check className="h-4 w-4 text-green-500" />
                                        {digest.status === 'posted' ? 'Paylaşıldı' : 'Özet oluşturuldu'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Account Selector */}
                                        {xAccounts.length > 0 ? (
                                            <div className="relative" ref={accountDropdownRef}>
                                                <button
                                                    onClick={() => setShowAccountDropdown(prev => !prev)}
                                                    className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors"
                                                >
                                                    {(() => {
                                                        const selected = xAccounts.find(a => a.id === selectedAccountId);
                                                        if (!selected) return <span className="text-muted-foreground">Hesap seç</span>;
                                                        return (
                                                            <>
                                                                {selected.profileImage ? (
                                                                    <img src={selected.profileImage} alt="" className="h-5 w-5 rounded-full" />
                                                                ) : (
                                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                                )}
                                                                <span className="font-medium">@{selected.username}</span>
                                                            </>
                                                        );
                                                    })()}
                                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                </button>
                                                {showAccountDropdown && (
                                                    <div className="absolute bottom-full right-0 mb-1 w-52 rounded-md border border-border bg-popover p-1 shadow-md z-50">
                                                        {xAccounts.map(account => (
                                                            <button
                                                                key={account.id}
                                                                onClick={() => {
                                                                    setSelectedAccountId(account.id);
                                                                    setShowAccountDropdown(false);
                                                                }}
                                                                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors ${selectedAccountId === account.id ? 'bg-muted' : ''
                                                                    }`}
                                                            >
                                                                {account.profileImage ? (
                                                                    <img src={account.profileImage} alt="" className="h-5 w-5 rounded-full" />
                                                                ) : (
                                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                                )}
                                                                <div className="flex flex-col items-start">
                                                                    <span className="font-medium">{account.displayName}</span>
                                                                    <span className="text-muted-foreground">@{account.username}</span>
                                                                </div>
                                                                {selectedAccountId === account.id && (
                                                                    <Check className="ml-auto h-3 w-3 text-primary" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <a
                                                href="/settings"
                                                className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
                                            >
                                                <SettingsIcon className="h-3.5 w-3.5" />
                                                Hesap Bağla
                                            </a>
                                        )}
                                        <Button
                                            size="sm"
                                            disabled={overLimitCount > 0 || isPosting || digest.status === 'posted' || xAccounts.length === 0}
                                            onClick={handlePostThread}
                                            className={digest.status === 'posted'
                                                ? 'bg-green-600 hover:bg-green-600'
                                                : 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70'
                                            }
                                        >
                                            {isPosting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Paylaşılıyor...
                                                </>
                                            ) : digest.status === 'posted' ? (
                                                <>
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Paylaşıldı
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    X&apos;e Paylaş
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </Card>
            </div>
        </div>
    );
}

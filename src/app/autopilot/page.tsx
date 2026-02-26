"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Zap, Play, Info, Clock, Check,
    AlertTriangle, ExternalLink, User, ChevronDown, Globe, Loader2,
    Rss, Sparkles, Shield, Send, CheckCircle2, Pause, RotateCw, Trash2, PlayCircle,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { XTabs } from "@/components/ui/x-tabs";
import { XButtonGroup } from "@/components/ui/x-button-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Briefcase, Heart, Laugh, Minus, Equal, Plus } from "lucide-react";

function SectionLabel({ label, info }: { label: string; info: string }) {
    return (
        <div className="mb-2 flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground/50 cursor-help hover:text-muted-foreground transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]"><p>{info}</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

// Types
interface AutopilotConfig {
    id: string;
    name: string;
    isActive: boolean;
    paused: boolean;
    categories: string;
    selectedSources: string | null;
    format: string;
    tone: string;
    tweetCount: number;
    charLimit: number;
    hashtagCount: number;
    customPrompt: string | null;
    tweetsPerDay: number;
    timezone: string;
    preferredHours: string | null;
    ctaEnabled: boolean;
    ctaText: string | null;
    xAccountId: string;
    lastPostAt: string | null;
    todayPostCount: number;
    lastResetDate: string | null;
    createdAt: string;
    updatedAt: string;
    xAccount?: { id: string; username: string; displayName: string; profileImage: string | null };
}

interface AutopilotLog {
    id: string;
    configId: string;
    action: string;
    details: string;
    tweetUrl: string | null;
    createdAt: string;
}

interface XAccountSummary {
    id: string;
    username: string;
    displayName: string;
    profileImage: string | null;
    isDefault: boolean;
}

interface InstanceState {
    configId: string;
    xAccountId: string;
    username: string;
    isActive: boolean;
    paused: boolean;
    configCategories: string[];
    configTone: string;
    configTweetCount: number;
    configSources: string[];
    configTimezone: string;
    configTweetsPerDay: number;
    configLength: string;
    configHashtagCount: number;
    lastPostAt?: string | null;
    todayPostCount?: number;
}

const CATEGORIES = [
    { id: "teknoloji", label: "Teknoloji", icon: "💻" },
    { id: "siyaset", label: "Siyaset", icon: "🏛️" },
    { id: "ekonomi", label: "Ekonomi", icon: "💰" },
    { id: "dünya", label: "Dünya", icon: "🌍" },
    { id: "spor", label: "Spor", icon: "⚽" },
    { id: "yaşam", label: "Yaşam", icon: "🌿" },
];

const SOURCE_MAP: Record<string, { name: string; url: string }[]> = {
    teknoloji: [
        { name: "NTV", url: "https://www.ntv.com.tr/teknoloji.rss" },
        { name: "Webtekno", url: "https://www.webtekno.com/rss.xml" },
        { name: "T24", url: "https://t24.com.tr/rss/haber/bilim-teknoloji" },
        { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/teknoloji" },
    ],
    siyaset: [
        { name: "T24", url: "https://t24.com.tr/rss/haber/politika" },
        { name: "NTV", url: "https://www.ntv.com.tr/turkiye.rss" },
        { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/siyaset" },
    ],
    ekonomi: [
        { name: "NTV", url: "https://www.ntv.com.tr/ekonomi.rss" },
        { name: "T24", url: "https://t24.com.tr/rss/haber/ekonomi" },
        { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/ekonomi" },
    ],
    dünya: [
        { name: "NTV", url: "https://www.ntv.com.tr/dunya.rss" },
        { name: "T24", url: "https://t24.com.tr/rss/haber/dunya" },
        { name: "BBC Türkçe", url: "https://feeds.bbci.co.uk/turkce/rss.xml" },
        { name: "Euronews Türkçe", url: "https://tr.euronews.com/rss" },
        { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/dunya" },
    ],
    spor: [
        { name: "NTV", url: "https://www.ntv.com.tr/spor.rss" },
        { name: "T24", url: "https://t24.com.tr/rss/haber/spor" },
        { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/spor" },
    ],
    yaşam: [
        { name: "NTV", url: "https://www.ntv.com.tr/yasam.rss" },
        { name: "T24", url: "https://t24.com.tr/rss/haber/yasam" },
        { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/yasam" },
    ],
};

const ALL_SOURCE_NAMES = [...new Set(Object.values(SOURCE_MAP).flatMap(sources => sources.map(s => s.name)))];

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
    { id: "1", label: "1" }, { id: "3", label: "3" }, { id: "5", label: "5" },
    { id: "7", label: "7" }, { id: "10", label: "10" },
];

const hashtagCountOptions = [
    { id: "0", label: "Yok" }, { id: "2", label: "2" }, { id: "3", label: "3" },
];

const TIMEZONE_OPTIONS = [
    { id: "Europe/Istanbul", label: "🇹🇷 Türkiye (UTC+3)" },
    { id: "America/New_York", label: "🇺🇸 New York (UTC-5)" },
    { id: "Europe/London", label: "🇬🇧 Londra (UTC+0)" },
    { id: "Europe/Berlin", label: "🇩🇪 Berlin (UTC+1)" },
    { id: "Asia/Tokyo", label: "🇯🇵 Tokyo (UTC+9)" },
];



function getActionBadge(action: string) {
    const map: Record<string, { dot: string; label: string; text: string }> = {
        post: { dot: "bg-green-500", label: "Paylaşıldı", text: "text-green-400" },
        fetch: { dot: "bg-slate-400", label: "Çekildi", text: "text-muted-foreground" },
        summarize: { dot: "bg-blue-500", label: "AI Özet", text: "text-blue-400" },
        hook_check: { dot: "bg-purple-500", label: "Hook", text: "text-purple-400" },
        error: { dot: "bg-red-500", label: "Hata", text: "text-red-400" },
        skipped: { dot: "bg-yellow-500", label: "Atlandı", text: "text-yellow-400" },
        activated: { dot: "bg-emerald-500", label: "Aktif", text: "text-emerald-400" },
        deactivated: { dot: "bg-red-400", label: "Kapalı", text: "text-red-400" },
    };
    const info = map[action] || { dot: "bg-muted-foreground/40", label: action, text: "text-muted-foreground" };
    return (
        <span className="inline-flex items-center gap-1.5 shrink-0">
            <span className={`h-1.5 w-1.5 rounded-full ${info.dot}`} />
            <span className={`text-[10px] font-medium ${info.text}`}>{info.label}</span>
        </span>
    );
}

export default function AutopilotPage() {
    // Data
    const [xAccounts, setXAccounts] = useState<XAccountSummary[]>([]);
    const [configs, setConfigs] = useState<Map<string, AutopilotConfig>>(new Map());
    const [logs, setLogs] = useState<AutopilotLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Selected account
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);
    const accountDropdownRef = useRef<HTMLDivElement>(null);

    // Form state (per selected account)
    const [selectedCategories, setSelectedCategories] = useState<string[]>(["teknoloji"]);
    const [tweetCount, setTweetCount] = useState("5");
    const [tone, setTone] = useState("professional");
    const [length, setLength] = useState("medium");
    const [hashtagCount, setHashtagCount] = useState("2");
    const [tweetsPerDay, setTweetsPerDay] = useState("2");
    const [selectedSources, setSelectedSources] = useState<string[]>(ALL_SOURCE_NAMES);
    const [timezone, setTimezone] = useState("Europe/Istanbul");

    const [ctaEnabled, setCtaEnabled] = useState(true);
    const [ctaText, setCtaText] = useState("🔔 Takip et, günlük özet kaçırma!");

    const DEFAULT_PROMPT = `PERSONA: Sen Türkiye'nin en çok takip edilen teknoloji/gündem içerik üreticisisin. Tonun bilgili ama samimi — bir arkadaşın sana önemli haberleri anlatıyormuş gibi. Haber ajansı spikeri gibi DEĞİL.

HEDEF KİTLE: Teknoloji ve gündem takip eden, 25-40 yaş, profesyonel Türk X kullanıcıları.

HOOK (İLK CÜMLE — THREAD'İN KADERİNİ BELİRLER):
Kullanıcı feed'de kaydırırken 3 saniyede karar verir. İlk cümle MUTLAKA şu tekniklerden birini kullansın:
• Şaşırtıcı rakam: "Türkiye'de her 3 kişiden 1'i bunu bilmiyor"
• Merak boşluğu: "Herkes yapay zekayı konuşuyor ama kimse şunu sormuyor"
• Aciliyet: "Son 24 saatte teknoloji dünyasında 3 büyük kırılma yaşandı"
• Liste daveti: "Bugün 5 kritik gelişme var, 3.'sü herkesi etkileyecek 👇"
• Kontrast: "Apple bunu yaparken, Samsung tam tersini yaptı"

✅ İYİ HOOK: "Türkiye'nin internet hızı dünya sıralamasında 15 basamak düştü — sebebi çoğu kişinin tahmin edemeyeceği bir şey"
❌ KÖTÜ HOOK: "Bugünkü gündem özetimize hoş geldiniz! İşte günün önemli haberleri"

THREAD AKIŞI:
1. İLK TWEET: Dikkat çekici hook + haberlerin tek satırlık başlıkları
2. ORTA TWEETLER: Her biri TEK bir haberi özetlesin — en ilginç detayı öne çıkar
3. SON TWEET: Hashtag + takipçiyi konuşmaya davet eden soru ("Siz ne düşünüyorsunuz?" veya "En çok hangisi dikkatinizi çekti?")

YAPMA:
• Tweet numarası KOYMA (1/, 2/ gibi)
• "Bu yazıda şunları bulacaksınız" gibi klişelerle başlama
• NTV/CNN haber bülteni gibi resmi yazma
• Provokatif, troll veya kutuplaştırıcı ifade kullanma

YAP:
• Her tweet sonunda ilgili emoji kullan
• Paylaşılabilir insight ver (okuyucu RT yapmak istesin)
• Niche tutarlılığını koru — sadece seçilen kategorilerle ilgili yaz
• Tweetleri --- (üç tire) ile ayır

HABERLER:
{{NEWS}}

Sadece thread metnini döndür, başka açıklama ekleme. Tweetleri --- ile ayır.`;

    const [customPrompt, setCustomPrompt] = useState("");
    const [showPromptEditor, setShowPromptEditor] = useState(false);
    const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
    const timezoneDropdownRef = useRef<HTMLDivElement>(null);
    const [isManualTesting, setIsManualTesting] = useState(false);
    const [manualTestResult, setManualTestResult] = useState<{ success: boolean; message: string; threadUrl?: string } | null>(null);

    // Active instances
    const [instances, setInstances] = useState<Map<string, InstanceState>>(new Map());

    const charLimit = length === "short" ? 180 : length === "medium" ? 220 : 250;

    // Load data
    useEffect(() => {
        Promise.all([loadXAccounts(), loadAllConfigs(), loadLogs()]).then(() => setIsLoading(false));
    }, []);

    // Close dropdowns
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) setShowAccountDropdown(false);
            if (timezoneDropdownRef.current && !timezoneDropdownRef.current.contains(event.target as Node)) setShowTimezoneDropdown(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const DEMO_ACCOUNTS: XAccountSummary[] = [
        {
            id: "demo-account",
            username: "demo_user",
            displayName: "Demo Hesap",
            profileImage: null,
            isDefault: true,
        },
        {
            id: "demo-account-2",
            username: "tech_news_bot",
            displayName: "Tech News Bot",
            profileImage: null,
            isDefault: false,
        },
    ];

    const loadXAccounts = async () => {
        try {
            const res = await fetch("/api/x/accounts");
            if (res.ok) {
                const data = await res.json();
                const accounts = data.accounts.length > 0 ? data.accounts : DEMO_ACCOUNTS;
                setXAccounts(accounts);
                if (accounts.length > 0 && !selectedAccountId) {
                    const def = accounts.find((a: XAccountSummary) => a.isDefault) || accounts[0];
                    setSelectedAccountId(def.id);
                }
            } else {
                setXAccounts(DEMO_ACCOUNTS);
                setSelectedAccountId(DEMO_ACCOUNTS[0].id);
            }
        } catch {
            console.error("Failed to load X accounts");
            setXAccounts(DEMO_ACCOUNTS);
            setSelectedAccountId(DEMO_ACCOUNTS[0].id);
        }
    };

    const loadAllConfigs = async () => {
        try {
            const res = await fetch("/api/autopilot/config");
            if (res.ok) {
                const data = await res.json();
                const map = new Map<string, AutopilotConfig>();
                (data.configs || []).forEach((c: AutopilotConfig) => map.set(c.xAccountId, c));
                setConfigs(map);

                // Initialize active instances from loaded configs
                const newInstances = new Map<string, InstanceState>();
                (data.configs || []).forEach((c: AutopilotConfig) => {
                    if (c.isActive || c.paused) {
                        newInstances.set(c.xAccountId, {
                            configId: c.id, xAccountId: c.xAccountId,
                            username: c.xAccount?.username || "unknown",
                            isActive: c.isActive, paused: c.paused ?? false,
                            configCategories: c.categories ? c.categories.split(",").map(s => s.trim()) : [],
                            configTone: c.tone || "professional",
                            configTweetCount: c.tweetCount || 5,
                            configSources: c.selectedSources ? c.selectedSources.split(",").map(s => s.trim()) : [],
                            configTimezone: c.timezone || "Europe/Istanbul",
                            configTweetsPerDay: c.tweetsPerDay || 2,
                            configLength: c.charLimit <= 180 ? "short" : c.charLimit <= 220 ? "medium" : "long",
                            configHashtagCount: c.hashtagCount ?? 2,
                            lastPostAt: c.lastPostAt,
                            todayPostCount: c.todayPostCount ?? 0,
                        });
                    }
                });
                setInstances(newInstances);
            }
        } catch { console.error("Failed to load configs"); }
    };

    const loadLogs = async () => {
        try {
            const res = await fetch("/api/autopilot/logs?limit=30");
            if (res.ok) { const data = await res.json(); setLogs(data.logs); }
        } catch { console.error("Failed to load logs"); }
    };

    // When selected account changes, populate form from its config
    useEffect(() => {
        if (!selectedAccountId) return;
        const cfg = configs.get(selectedAccountId);
        if (cfg) {
            setSelectedCategories(cfg.categories.split(",").map(c => c.trim()));
            setTweetCount(String(cfg.tweetCount));
            setTone(cfg.tone);
            setTweetsPerDay(String(cfg.tweetsPerDay));
            if (cfg.charLimit <= 200) setLength("short");
            else if (cfg.charLimit <= 260) setLength("medium");
            else setLength("long");
            if (cfg.selectedSources) setSelectedSources(cfg.selectedSources.split(",").map(s => s.trim()));
            else setSelectedSources(ALL_SOURCE_NAMES);
            if (cfg.timezone) setTimezone(cfg.timezone);
            setCtaEnabled(cfg.ctaEnabled ?? true);
            setCtaText(cfg.ctaText || "🔔 Takip et, günlük özet kaçırma!");
            setCustomPrompt(cfg.customPrompt || "");
        } else {
            // Reset to defaults for new account
            setSelectedCategories(["teknoloji"]);
            setTweetCount("5"); setTone("professional"); setLength("medium");
            setHashtagCount("2"); setTweetsPerDay("2");
            setSelectedSources(ALL_SOURCE_NAMES);
            setTimezone("Europe/Istanbul");
            setCtaEnabled(true); setCtaText("🔔 Takip et, günlük özet kaçırma!");
            setCustomPrompt("");
        }
    }, [selectedAccountId, configs]);

    // Save config
    const handleSave = async () => {
        if (!selectedAccountId || selectedCategories.length === 0) return;
        setIsSaving(true);
        try {
            const existingConfig = configs.get(selectedAccountId);
            const res = await fetch("/api/autopilot/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: existingConfig?.id,
                    categories: selectedCategories.join(","),
                    selectedSources: selectedSources.join(","),
                    format: parseInt(tweetCount) === 1 ? "single" : "thread",
                    tone, tweetCount: parseInt(tweetCount), charLimit,
                    hashtagCount: parseInt(hashtagCount),
                    tweetsPerDay: parseInt(tweetsPerDay),
                    timezone,
                    ctaEnabled, ctaText, xAccountId: selectedAccountId,
                    customPrompt: customPrompt || null,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setConfigs(prev => new Map(prev).set(selectedAccountId, data.config));
            }
        } catch { console.error("Failed to save config"); }
        finally { setIsSaving(false); }
    };

    // Start autopilot for selected account
    const handleStart = async () => {
        if (!selectedAccountId) return;
        // Save config first
        await handleSave();
        const cfg = configs.get(selectedAccountId);
        const account = xAccounts.find(a => a.id === selectedAccountId);
        if (!account) return;

        const configId = cfg?.id;
        if (!configId) return;

        // Persist isActive: true to backend
        const newConfig = { ...cfg, isActive: true };
        setConfigs(prev => new Map(prev).set(selectedAccountId, newConfig));
        fetch("/api/autopilot/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: configId, isActive: true, xAccountId: selectedAccountId }),
        }).catch(() => { });

        // Create instance card
        const inst: InstanceState = {
            configId, xAccountId: selectedAccountId,
            username: account.username, isActive: true, paused: false,
            configCategories: [...selectedCategories],
            configTone: tone,
            configTweetCount: parseInt(tweetCount),
            configSources: [...selectedSources],
            configTimezone: timezone,
            configTweetsPerDay: parseInt(tweetsPerDay),
            configLength: length,
            configHashtagCount: parseInt(hashtagCount),
            lastPostAt: cfg.lastPostAt,
            todayPostCount: cfg.todayPostCount ?? 0,
        };
        setInstances(prev => new Map(prev).set(selectedAccountId, inst));

        // Reload logs
        loadLogs();
    };

    // Pause a specific instance (keep card visible)
    const handleStop = (accountId: string) => {
        setInstances(prev => {
            const m = new Map(prev);
            const inst = m.get(accountId);
            if (inst) m.set(accountId, { ...inst, isActive: false, paused: true });
            return m;
        });
        const cfg = configs.get(accountId);
        if (cfg) {
            setConfigs(prev => new Map(prev).set(accountId, { ...cfg, isActive: false, paused: true }));
            if (cfg.id) {
                fetch("/api/autopilot/config", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: cfg.id, isActive: false, paused: true, xAccountId: accountId }),
                }).catch(() => { });
            }
        }

        const account = xAccounts.find(a => a.id === accountId);
        const newLog: AutopilotLog = {
            id: `demo-stop-${Date.now()}`, configId: cfg?.id || `demo-${accountId}`,
            action: "deactivated",
            details: JSON.stringify({ message: `@${account?.username || "?"} Autopilot duraklatıldı` }),
            tweetUrl: null, createdAt: new Date().toISOString(),
        };
        setLogs(prev => [newLog, ...prev]);
    };

    // Resume a paused instance
    const handleResume = (accountId: string) => {
        setInstances(prev => {
            const m = new Map(prev);
            const inst = m.get(accountId);
            if (inst) m.set(accountId, { ...inst, isActive: true, paused: false });
            return m;
        });
        const cfg = configs.get(accountId);
        if (cfg) {
            setConfigs(prev => new Map(prev).set(accountId, { ...cfg, isActive: true, paused: false }));
            if (cfg.id) {
                fetch("/api/autopilot/config", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: cfg.id, isActive: true, paused: false, xAccountId: accountId }),
                }).catch(() => { });
            }
        }

        const account = xAccounts.find(a => a.id === accountId);
        const newLog: AutopilotLog = {
            id: `demo-resume-${Date.now()}`, configId: cfg?.id || `demo-${accountId}`,
            action: "activated",
            details: JSON.stringify({ message: `@${account?.username || "?"} Autopilot devam ettirildi` }),
            tweetUrl: null, createdAt: new Date().toISOString(),
        };
        setLogs(prev => [newLog, ...prev]);
    };

    // Delete an instance (remove from map)
    const handleDelete = (accountId: string) => {
        setInstances(prev => {
            const m = new Map(prev);
            m.delete(accountId);
            return m;
        });
        const cfg = configs.get(accountId);
        if (cfg) {
            setConfigs(prev => new Map(prev).set(accountId, { ...cfg, isActive: false }));
            // Persist isActive: false to backend
            if (cfg.id) {
                fetch("/api/autopilot/config", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: cfg.id, isActive: false, xAccountId: accountId }),
                }).catch(() => { });
            }
        }

        const account = xAccounts.find(a => a.id === accountId);
        const newLog: AutopilotLog = {
            id: `demo-delete-${Date.now()}`, configId: cfg?.id || `demo-${accountId}`,
            action: "deactivated",
            details: JSON.stringify({ message: `@${account?.username || "?"} Autopilot işlemi silindi` }),
            tweetUrl: null, createdAt: new Date().toISOString(),
        };
        setLogs(prev => [newLog, ...prev]);
    };

    // Confirm dialog state for delete
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; accountId: string | null }>({ open: false, accountId: null });



    // Helpers
    const toggleCategory = (catId: string) => setSelectedCategories(prev => prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]);
    const toggleSource = (name: string) => setSelectedSources(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);


    const filteredSources = selectedCategories.flatMap(cat => (SOURCE_MAP[cat] || []).map(s => ({ ...s, category: cat })));
    const groupedSources = filteredSources.reduce((acc, s) => {
        if (!acc[s.name]) acc[s.name] = { name: s.name, categories: [] };
        const catInfo = CATEGORIES.find(c => c.id === s.category);
        if (catInfo && !acc[s.name].categories.includes(catInfo.label)) acc[s.name].categories.push(catInfo.label);
        return acc;
    }, {} as Record<string, { name: string; categories: string[] }>);

    const selectedAccount = xAccounts.find(a => a.id === selectedAccountId);
    const selectedConfig = selectedAccountId ? configs.get(selectedAccountId) : null;
    const isSelectedActive = instances.get(selectedAccountId || "")?.isActive || false;

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
                <div className="text-center">
                    <Zap className="mx-auto mb-3 h-8 w-8 animate-pulse text-primary" />
                    <p className="text-sm text-muted-foreground">Autopilot yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
                {/* Column 1: Settings Sidebar (unified) */}
                <div className="flex h-full w-80 shrink-0 flex-col border-r border-border bg-card">
                    <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-border px-4">
                        <div className="flex items-center gap-2">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${isSelectedActive ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"}`}>
                                <Zap className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">Autopilot</h2>
                                <p className="text-[10px] text-muted-foreground">
                                    {selectedAccount ? (
                                        <>
                                            <span className="font-medium">@{selectedAccount.username}</span>
                                            {isSelectedActive ? <span className="ml-1 text-green-500">● Aktif</span> : <span className="ml-1">○ Pasif</span>}
                                        </>
                                    ) : "Hesap seçin"}
                                </p>
                            </div>
                        </div>
                        {Array.from(instances.values()).filter(i => i.isActive).length > 0 && (
                            <Badge variant="secondary" className="text-[10px]">
                                {Array.from(instances.values()).filter(i => i.isActive).length} aktif
                            </Badge>
                        )}
                    </div>
                    {/* Sticky X Account Selector */}
                    <div className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-md p-4">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1" ref={accountDropdownRef}>
                                <button
                                    onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                                    className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
                                >
                                    {selectedAccount ? (
                                        <>
                                            {selectedAccount.profileImage ? (
                                                <img src={selectedAccount.profileImage} alt="" className="h-5 w-5 rounded-full" />
                                            ) : (
                                                <User className="h-5 w-5 text-muted-foreground" />
                                            )}
                                            <span className="flex-1 truncate">@{selectedAccount.username}</span>
                                            {isSelectedActive && <span className="h-2 w-2 rounded-full bg-green-500" />}
                                        </>
                                    ) : (
                                        <span className="flex-1 text-muted-foreground">Hesap seçin...</span>
                                    )}
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                                {showAccountDropdown && (
                                    <div className="absolute left-0 right-0 top-full z-50 mt-1 flex flex-col gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-lg">
                                        {xAccounts.map(acc => (
                                            <button
                                                key={acc.id}
                                                onClick={() => { setSelectedAccountId(acc.id); setShowAccountDropdown(false); }}
                                                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${selectedAccountId === acc.id ? "bg-primary/10 text-primary" : ""}`}
                                            >
                                                {acc.profileImage ? (
                                                    <img src={acc.profileImage} alt="" className="h-5 w-5 rounded-full" />
                                                ) : (
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span className="flex-1 truncate">@{acc.username}</span>
                                                {instances.get(acc.id)?.isActive && <span className="h-2 w-2 rounded-full bg-green-500" />}
                                            </button>
                                        ))}
                                        {xAccounts.length === 0 && (
                                            <p className="px-3 py-2 text-xs text-muted-foreground">Henüz bağlı hesap yok</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => { /* TODO: navigate to account connection page */ }}
                                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-primary hover:border-primary/50 transition-all"
                                title="Yeni hesap ekle"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4">

                        {/* Categories */}
                        <div className="mb-4">
                            <div className="mb-2 flex items-center justify-between">
                                <SectionLabel label="Kategoriler" info="İçerik üretilecek konular." />
                                <span className="text-[10px] text-muted-foreground">{selectedCategories.length}/{CATEGORIES.length}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => toggleCategory(cat.id)}
                                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${selectedCategories.includes(cat.id) ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sources grouped by category */}
                        {selectedCategories.length > 0 && (
                            <div className="mb-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <SectionLabel label="Kaynaklar" info="Kaynak siteler. Seçili kategorilere göre filtrelenir." />
                                    <button
                                        onClick={() => {
                                            const allNames = Object.keys(groupedSources);
                                            const allSelected = allNames.every(n => selectedSources.includes(n));
                                            if (allSelected) setSelectedSources(prev => prev.filter(s => !allNames.includes(s)));
                                            else setSelectedSources(prev => [...new Set([...prev, ...allNames])]);
                                        }}
                                        className="text-[10px] text-primary hover:underline"
                                    >
                                        {Object.keys(groupedSources).every(n => selectedSources.includes(n)) ? "Hiçbirini seçme" : "Tümünü seç"}
                                    </button>
                                </div>
                                <div className="space-y-0.5">
                                    {Object.values(groupedSources).map(source => (
                                        <button
                                            key={source.name}
                                            onClick={() => toggleSource(source.name)}
                                            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-all ${selectedSources.includes(source.name) ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
                                        >
                                            <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors ${selectedSources.includes(source.name) ? "border-primary bg-primary" : "border-muted-foreground/30"}`}
                                            >
                                                {selectedSources.includes(source.name) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                                            </div>
                                            <span className="flex-1 text-left">{source.name}</span>
                                            <span className="text-[9px] text-muted-foreground">{source.categories.join(", ")}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Separator className="my-7" />

                        {/* Tweet Count */}
                        <div className="mb-5">
                            <SectionLabel label="Tweet Sayısı" info="1 = Tek tweet, 3+ = Thread formatı." />
                            <XTabs value={tweetCount} onValueChange={setTweetCount} options={tweetCountOptions} />
                        </div>

                        {/* Hashtag */}
                        <div className="mb-5">
                            <SectionLabel label="Hashtag" info="Phoenix: Max 3 önerilir." />
                            <XTabs value={hashtagCount} onValueChange={setHashtagCount} options={hashtagCountOptions} />
                        </div>

                        <Separator className="my-7" />

                        {/* Tone */}
                        <div className="mb-5">
                            <SectionLabel label="Ton" info="İçeriğin genel havası." />
                            <XButtonGroup value={tone} onValueChange={setTone} options={toneOptions} columns={3} />
                        </div>

                        {/* Length */}
                        <div className="mb-5">
                            <SectionLabel label="Uzunluk" info="Uzun = Daha fazla dwell time." />
                            <XButtonGroup value={length} onValueChange={setLength} options={lengthOptions} columns={3} />
                        </div>

                        <Separator className="my-7" />

                        {/* Tweets Per Day */}
                        <div className="mb-5">
                            <SectionLabel label="Günlük Tweet" info="Phoenix: Max 2 tweet/gün." />
                            <XTabs
                                value={tweetsPerDay}
                                onValueChange={setTweetsPerDay}
                                options={[{ id: "1", label: "1" }, { id: "2", label: "2" }]}
                            />
                        </div>

                        <Separator className="my-7" />



                        {/* Scheduling */}
                        <div className="mb-4">
                            <SectionLabel label="Zamanlama" info="Saat dilimi ve tercih edilen saatler." />
                            <div className="relative mb-3" ref={timezoneDropdownRef}>
                                <button
                                    onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                                    className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                                >
                                    <span>{TIMEZONE_OPTIONS.find(t => t.id === timezone)?.label || timezone}</span>
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                                {showTimezoneDropdown && (
                                    <div className="absolute left-0 right-0 top-full z-50 mt-1 flex flex-col gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-lg">
                                        {TIMEZONE_OPTIONS.map(tz => (
                                            <button key={tz.id} onClick={() => { setTimezone(tz.id); setShowTimezoneDropdown(false); }}
                                                className={`block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${timezone === tz.id ? "bg-primary/10 text-primary" : ""}`}>
                                                {tz.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground">Phoenix algoritması, seçili timezone ve günlük tweet sayısına göre optimal saatleri otomatik belirler.</p>
                        </div>

                        <Separator className="my-7" />

                        {/* CTA */}
                        <div className="mb-4">
                            <div className="mb-2 flex items-center justify-between">
                                <SectionLabel label="CTA (Call-to-Action)" info="Thread sonuna takipçi çekmek için CTA." />
                                <button onClick={() => setCtaEnabled(!ctaEnabled)}
                                    className={`relative h-5 w-9 rounded-full transition-colors ${ctaEnabled ? "bg-primary" : "bg-muted"}`}>
                                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${ctaEnabled ? "left-[18px]" : "left-0.5"}`} />
                                </button>
                            </div>
                            {ctaEnabled && (
                                <div className="rounded-lg border border-border bg-background p-2.5">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-500" />
                                        <input
                                            value={ctaText}
                                            onChange={e => setCtaText(e.target.value)}
                                            className="flex-1 bg-transparent text-xs outline-none"
                                            placeholder="CTA metnini girin..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator className="my-7" />

                        {/* AI Prompt Editor */}
                        <div>
                            <button
                                onClick={() => setShowPromptEditor(!showPromptEditor)}
                                className="mb-2 flex w-full items-center justify-between text-left"
                            >
                                <SectionLabel label="AI Prompt" info="Tweet üretiminde kullanılan AI talimatları." />
                                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showPromptEditor ? 'rotate-180' : ''}`} />
                            </button>
                            {showPromptEditor && (
                                <div className="space-y-2">
                                    <textarea
                                        value={customPrompt || DEFAULT_PROMPT}
                                        onChange={e => setCustomPrompt(e.target.value === DEFAULT_PROMPT ? "" : e.target.value)}
                                        className="w-full min-h-[200px] rounded-lg border border-border bg-background p-3 text-xs leading-relaxed outline-none focus:ring-1 focus:ring-primary resize-y"
                                        rows={10}
                                    />
                                    <div className="flex items-center justify-end">
                                        {customPrompt && (
                                            <button
                                                onClick={() => setCustomPrompt("")}
                                                className="text-[10px] text-orange-400 hover:text-orange-300 transition-colors"
                                            >
                                                Varsayılana Dön
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="border-t border-border p-4 space-y-2">
                        <Button
                            onClick={handleStart}
                            disabled={!selectedAccountId || isSelectedActive || isSaving || selectedCategories.length === 0}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                        >
                            <Play className="mr-1.5 h-3.5 w-3.5" />
                            Başlat
                        </Button>

                        {/* Manuel Tweet Test Butonu */}
                        <Button
                            onClick={async () => {
                                if (!selectedAccountId) return;
                                setIsManualTesting(true);
                                setManualTestResult(null);
                                try {
                                    // Önce config'i kaydet
                                    await handleSave();
                                    const cfg = configs.get(selectedAccountId);
                                    if (!cfg?.id) {
                                        setManualTestResult({ success: false, message: "Config bulunamadı. Önce kaydedin." });
                                        return;
                                    }
                                    // Config'i aktif yap
                                    const account = xAccounts.find(a => a.id === selectedAccountId);
                                    fetch("/api/autopilot/config", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ id: cfg.id, isActive: true, xAccountId: selectedAccountId }),
                                    }).catch(() => { });
                                    setConfigs(prev => {
                                        const m = new Map(prev);
                                        m.set(selectedAccountId, { ...cfg, isActive: true });
                                        return m;
                                    });

                                    // Manuel trigger çağır
                                    const res = await fetch("/api/autopilot/run", {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            "x-manual-trigger": "true",
                                        },
                                        body: JSON.stringify({ configId: cfg.id }),
                                    });
                                    const data = await res.json();
                                    if (data.results && data.results.length > 0) {
                                        const r = data.results[0];
                                        if (r.success) {
                                            setManualTestResult({ success: true, message: `Tweet gönderildi! Hook: ${r.hookScore}/10`, threadUrl: r.threadUrl });
                                            // Instance card oluştur
                                            if (account) {
                                                const inst: InstanceState = {
                                                    configId: cfg.id, xAccountId: selectedAccountId,
                                                    username: account.username, isActive: true, paused: false,
                                                    configCategories: selectedCategories,
                                                    configTone: tone,
                                                    configTweetCount: parseInt(tweetCount),
                                                    configSources: selectedSources,
                                                    configTimezone: timezone,
                                                    configTweetsPerDay: parseInt(tweetsPerDay),
                                                    configLength: length,
                                                    configHashtagCount: parseInt(hashtagCount),
                                                    lastPostAt: new Date().toISOString(),
                                                    todayPostCount: (cfg.todayPostCount ?? 0) + 1,
                                                };
                                                setInstances(prev => new Map(prev).set(selectedAccountId, inst));
                                            }
                                        } else if (r.skipped) {
                                            setManualTestResult({ success: false, message: r.message || r.reason || "Atlandı" });
                                        } else {
                                            setManualTestResult({ success: false, message: r.error || "Bilinmeyen hata" });
                                        }
                                    } else if (data.skipped) {
                                        setManualTestResult({ success: false, message: data.message || data.reason || "Config bulunamadı veya aktif değil" });
                                    } else if (data.error) {
                                        setManualTestResult({ success: false, message: data.error + (data.details ? `: ${data.details}` : "") });
                                    } else if (data.message) {
                                        setManualTestResult({ success: false, message: data.message });
                                    } else {
                                        setManualTestResult({ success: false, message: "Beklenmeyen yanıt: " + JSON.stringify(data).slice(0, 100) });
                                    }
                                    // Logları yenile
                                    loadLogs();
                                } catch (err) {
                                    setManualTestResult({ success: false, message: err instanceof Error ? err.message : "Bağlantı hatası" });
                                } finally {
                                    setIsManualTesting(false);
                                }
                            }}
                            disabled={!selectedAccountId || isSaving || isManualTesting || selectedCategories.length === 0}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            size="sm"
                            variant="outline"
                        >
                            {isManualTesting ? (
                                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Test ediliyor...</>
                            ) : (
                                <><Send className="mr-1.5 h-3.5 w-3.5" /> Manuel Test — Şimdi Tweet At</>
                            )}
                        </Button>

                        {/* Manuel test sonucu */}
                        {manualTestResult && (
                            <div className={`p-2.5 rounded-md text-xs ${manualTestResult.success ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
                                <p>{manualTestResult.message}</p>
                                {manualTestResult.threadUrl && (
                                    <a href={manualTestResult.threadUrl} target="_blank" rel="noopener noreferrer"
                                        className="underline text-primary hover:text-primary/80 mt-1 inline-block">
                                        → Thread&apos;i görüntüle
                                    </a>
                                )}
                            </div>
                        )}

                    </div>
                </div >

                {/* Column 2: Active Instances */}
                < div className="flex h-full min-w-0 flex-1 flex-col border-l border-border bg-card/50" >
                    <div className="flex h-[52px] shrink-0 flex-col justify-center border-b border-border px-4">
                        <h2 className="text-sm font-semibold flex items-center gap-1.5">
                            <Zap className="h-4 w-4 text-primary" /> Aktif İşlemler
                        </h2>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Çalışan autopilot görevleri</p>
                    </div>
                    <div className="flex-1 overflow-auto p-3"><div className="grid grid-cols-2 gap-3">
                        {Array.from(instances.values()).filter(i => i.isActive || i.paused).map(inst => {
                            const toneLabel = toneOptions.find(t => t.id === inst.configTone)?.label || inst.configTone;
                            const categoryLabels = inst.configCategories.map(c => CATEGORIES.find(cat => cat.id === c)?.label || c);

                            return (
                                <div key={inst.xAccountId} className={`relative rounded-xl border overflow-hidden transition-all duration-300 ${inst.paused ? "border-orange-500/50" :
                                    inst.isActive ? "border-green-500/40" : "border-border/50"
                                    }`}>
                                    <div className="absolute inset-0 bg-zinc-900/80" />

                                    <div className="relative p-4">
                                        {/* Header */}
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${inst.isActive ? "bg-green-500/20" : "bg-muted"}`}>
                                                    <span className="text-sm font-bold">{'@'}</span>
                                                    {inst.isActive && !inst.paused && <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 animate-pulse border-2 border-background" />}
                                                </div>
                                                <div>
                                                    <span className="text-sm font-bold">@{inst.username}</span>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {inst.paused ? "⏸ Duraklatıldı" : inst.isActive ? "✅ Aktif — Cron bekliyor" : "○ Pasif"}
                                                    </p>
                                                </div>
                                            </div>
                                            {inst.paused ? (
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/20 ring-1 ring-orange-500/30">
                                                    <Pause className="h-3.5 w-3.5 text-orange-400" />
                                                </div>
                                            ) : inst.isActive && (
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/20 ring-1 ring-green-500/30">
                                                    <Zap className="h-3.5 w-3.5 text-green-400" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Status info */}
                                        <div className="mb-3 rounded-lg bg-muted/30 p-2.5">
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-muted-foreground">Bugün</span>
                                                <span className="font-medium">{inst.todayPostCount ?? 0}/{inst.configTweetsPerDay} tweet</span>
                                            </div>
                                            {inst.lastPostAt && (
                                                <div className="flex items-center justify-between text-[10px] mt-1">
                                                    <span className="text-muted-foreground">Son post</span>
                                                    <span className="font-medium">{new Date(inst.lastPostAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Config Summary */}
                                        <div className="mb-3 flex flex-wrap gap-1.5">
                                            {categoryLabels.map(cat => (
                                                <span key={cat} className="inline-flex items-center rounded-md bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                                                    {cat}
                                                </span>
                                            ))}
                                            <span className="inline-flex items-center rounded-md bg-purple-500/15 px-2 py-0.5 text-[10px] font-medium text-purple-400">
                                                {toneLabel}
                                            </span>
                                            <span className="inline-flex items-center rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                                                {inst.configTweetCount} tweet
                                            </span>
                                            <span className="inline-flex items-center rounded-md bg-cyan-500/15 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
                                                {inst.configSources.length} kaynak
                                            </span>
                                            <span className="inline-flex items-center rounded-md bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-400">
                                                {inst.configTweetsPerDay}/gün
                                            </span>
                                            <span className="inline-flex items-center rounded-md bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium text-indigo-400">
                                                #{inst.configHashtagCount}
                                            </span>
                                            <span className="inline-flex items-center rounded-md bg-slate-500/15 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                                                {TIMEZONE_OPTIONS.find(t => t.id === inst.configTimezone)?.label?.split(" ").pop() || inst.configTimezone}
                                            </span>
                                        </div>

                                        {/* Action buttons */}
                                        {inst.paused ? (
                                            <div className="flex gap-2">
                                                <Button size="sm" className="flex-1 h-8 text-xs bg-primary/20 text-primary hover:bg-primary/30 border-0 rounded-lg"
                                                    onClick={() => handleResume(inst.xAccountId)}>
                                                    <PlayCircle className="mr-1.5 h-3.5 w-3.5" /> Devam Et
                                                </Button>
                                                <Button size="sm" className="flex-1 h-8 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border-0 rounded-lg"
                                                    onClick={() => setDeleteConfirm({ open: true, accountId: inst.xAccountId })}>
                                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Sil
                                                </Button>
                                            </div>
                                        ) : inst.isActive && (
                                            <Button size="sm" className="w-full h-8 text-xs bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 hover:text-orange-300 border-0 rounded-lg"
                                                onClick={() => handleStop(inst.xAccountId)}>
                                                <Pause className="mr-1.5 h-3.5 w-3.5" /> Durdur
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                    </div>{Array.from(instances.values()).filter(i => i.isActive || i.paused).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                                <Zap className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                            <p className="text-xs text-muted-foreground">Henüz aktif işlem yok</p>
                            <p className="mt-1 text-[10px] text-muted-foreground/60">Bir hesap seçip &quot;Başlat&quot; butonuna basın</p>
                        </div>
                    )}
                    </div>
                </div >

                {/* Column 3: Activity Logs */}
                < div className="flex h-full w-72 shrink-0 flex-col border-l border-border bg-card" >
                    <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-border px-4">
                        <div>
                            <h2 className="text-sm font-semibold">Aktivite Logları</h2>
                            <p className="text-[10px] text-muted-foreground">Son 30 aksiyon</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={loadLogs}>
                            <RotateCw className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        {logs.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <p className="text-xs text-muted-foreground">Henüz log yok</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {logs.map(log => {
                                    let details: Record<string, unknown> = {};
                                    try { details = JSON.parse(log.details); } catch { /* */ }
                                    const username = (details.username as string) || configs.get(log.configId)?.xAccount?.username;
                                    return (
                                        <div key={log.id} className="px-4 py-2.5 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-2">
                                                {getActionBadge(log.action)}
                                                <span className="flex-1 truncate text-xs">
                                                    {username && <span className="text-muted-foreground">@{username} </span>}
                                                    {(details.message as string) || (details.newsCount ? `${details.newsCount} haber` : (details.tweetCount ? `${details.tweetCount} tweet` : (details.score ? `Score: ${details.score}/10` : log.action)))}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(log.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} {new Date(log.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                                {log.tweetUrl && (
                                                    <a href={log.tweetUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                                                        <ExternalLink className="h-2.5 w-2.5" /> Görüntüle
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div >
            </div >

            {/* Delete Confirmation Modal */}
            < ConfirmDialog
                open={deleteConfirm.open}
                onOpenChange={(open) => setDeleteConfirm({ open, accountId: open ? deleteConfirm.accountId : null })
                }
                title="İşlemi Sil"
                description="Bu autopilot işlemini silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmLabel="Sil"
                cancelLabel="Vazgeç"
                variant="destructive"
                onConfirm={() => {
                    if (deleteConfirm.accountId) handleDelete(deleteConfirm.accountId);
                }}
            />
        </>
    );
}


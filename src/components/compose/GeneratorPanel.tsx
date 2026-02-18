"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { XTabs } from "@/components/ui/x-tabs";
import { XButtonGroup } from "@/components/ui/x-button-group";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Sparkles,
    HelpCircle,
    List,
    BookOpen,
    Flame,
    Briefcase,
    Heart,
    Laugh,
    // New icons
    Minus,
    Equal,
    Plus,
    ImageOff,
    Image,
    Video,
    FileImage,
    MessageCircle,
    HelpCircle as QuestionIcon,
    Share2,
    Bookmark,
    Globe,
    Users,
    GraduationCap,
    Tv,
    Target,
    Languages,
    SmilePlus,
    Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Section Label with Info Tooltip
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

interface GeneratorPanelProps {
    onGenerate: (settings: GeneratorSettings) => void;
    isGenerating: boolean;
}

export interface GeneratorSettings {
    topic: string;
    format: "standard" | "thread" | "viral";
    hookType: "question" | "list" | "story" | "controversial";
    tone: "professional" | "friendly" | "humorous";
    length: "short" | "medium" | "long";
    mediaType: "none" | "image" | "video" | "gif";
    cta: "none" | "question" | "opinion" | "share" | "save";
    audience: "general" | "niche" | "professional" | "education" | "entertainment";
    language: "tr" | "en" | "both";
    emoji: "none" | "low" | "medium" | "high";
}

const formatOptions = [
    { id: "standard", label: "Standart" },
    { id: "thread", label: "Thread" },
    { id: "viral", label: "Viral" },
];

const hookOptions = [
    { id: "question", label: "Soru", icon: HelpCircle, description: "Merak uyandıran sorularla başla" },
    { id: "list", label: "Liste", icon: List, description: "Numaralı liste formatında içerik" },
    { id: "story", label: "Hikaye", icon: BookOpen, description: "Kişisel deneyim ve anlatı" },
    { id: "controversial", label: "Tartışmalı", icon: Flame, description: "Dikkat çeken cesur görüşler" },
];

const toneOptions = [
    { id: "professional", label: "Profesyonel", icon: Briefcase, description: "Resmi ve iş odaklı ton" },
    { id: "friendly", label: "Samimi", icon: Heart, description: "Sıcak ve arkadaşça yaklaşım" },
    { id: "humorous", label: "Esprili", icon: Laugh, description: "Eğlenceli ve mizahi içerik" },
];

const contentTypeOptions = [
    { id: "tweet", label: "Tweet" },
    { id: "quote", label: "Quote" },
    { id: "reply", label: "Reply" },
];

const lengthOptions = [
    { id: "short", label: "Kısa", icon: Minus, description: "< 100 karakter" },
    { id: "medium", label: "Orta", icon: Equal, description: "100-200 karakter" },
    { id: "long", label: "Uzun", icon: Plus, description: "200-280 karakter" },
];

const mediaOptions = [
    { id: "none", label: "Yok", icon: ImageOff, description: "Medya olmadan sadece metin" },
    { id: "image", label: "Görsel", icon: Image, description: "Dikkat çekici görsel ekle" },
    { id: "video", label: "Video", icon: Video, description: "Dwell time'ı artırır" },
    { id: "gif", label: "GIF", icon: FileImage, description: "Hareketli görsel" },
];

const ctaOptions = [
    { id: "none", label: "Yok", icon: MessageCircle, description: "CTA olmadan paylaş" },
    { id: "question", label: "Soru Sor", icon: QuestionIcon, description: "Okuyucuya soru sor" },
    { id: "opinion", label: "Fikir İste", icon: Users, description: "Görüş ve yorum iste" },
    { id: "share", label: "Paylaş", icon: Share2, description: "Paylaşmaya teşvik et" },
    { id: "save", label: "Kaydet", icon: Bookmark, description: "Kaydetmeye teşvik et" },
];

const audienceOptions = [
    { id: "general", label: "Genel", icon: Globe, description: "Geniş kitleye hitap" },
    { id: "niche", label: "Niş", icon: Target, description: "Belirli ilgi alanı" },
    { id: "professional", label: "Profesyonel", icon: Briefcase, description: "İş dünyası" },
    { id: "education", label: "Eğitim", icon: GraduationCap, description: "Öğretici içerik" },
    { id: "entertainment", label: "Eğlence", icon: Tv, description: "Eğlendirici içerik" },
];

const languageOptions = [
    { id: "tr", label: "Türkçe", icon: Languages, description: "Türkçe içerik" },
    { id: "en", label: "İngilizce", icon: Languages, description: "English content" },
    { id: "both", label: "Karışık", icon: Languages, description: "Her iki dil" },
];

const emojiOptions = [
    { id: "none", label: "Yok", icon: SmilePlus, description: "Emoji kullanma" },
    { id: "low", label: "Az", icon: SmilePlus, description: "1-2 emoji" },
    { id: "medium", label: "Orta", icon: SmilePlus, description: "3-5 emoji" },
    { id: "high", label: "Çok", icon: SmilePlus, description: "6+ emoji" },
];

export function GeneratorPanel({ onGenerate, isGenerating }: GeneratorPanelProps) {
    const [contentType, setContentType] = useState("tweet");
    const [settings, setSettings] = useState<GeneratorSettings>({
        topic: "",
        format: "standard",
        hookType: "question",
        tone: "professional",
        length: "medium",
        mediaType: "none",
        cta: "none",
        audience: "general",
        language: "tr",
        emoji: "low",
    });

    const handleGenerate = () => {
        if (settings.topic.trim()) {
            onGenerate(settings);
        }
    };

    return (
        <div className="flex h-full w-80 shrink-0 flex-col border-r border-border bg-card">
            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                {/* Content Type Tabs */}
                <div className="mb-6">
                    <XTabs
                        value={contentType}
                        onValueChange={setContentType}
                        options={contentTypeOptions}
                    />
                </div>

                {/* Topic Input */}
                <div className="mb-6">
                    <SectionLabel label="Konu" info="Tweet'in ana konusu. Net ve ilgi çekici bir konu seçin." />
                    <textarea
                        value={settings.topic}
                        onChange={(e) => setSettings({ ...settings, topic: e.target.value })}
                        placeholder="Tweet konusunu girin..."
                        className="h-24 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                {/* Format */}
                <div className="mb-6">
                    <SectionLabel label="Format" info="Standart tek tweet, Thread (dizi tweet) veya viral potansiyeli yüksek içerik." />
                    <XTabs
                        value={settings.format}
                        onValueChange={(value) => setSettings({ ...settings, format: value as any })}
                        options={formatOptions}
                    />
                </div>

                <Separator className="my-4" />

                {/* Hook Type */}
                <div className="mb-6">
                    <SectionLabel label="Hook Tipi" info="İlk satırda dikkat çekme stratejisi. Hook kullanımı kritik öneme sahip." />
                    <XButtonGroup
                        value={settings.hookType}
                        onValueChange={(value) => setSettings({ ...settings, hookType: value as any })}
                        options={hookOptions}
                        columns={2}
                    />
                </div>

                {/* Tone */}
                <div className="mb-6">
                    <SectionLabel label="Ton" info="İçeriğin genel havası. Hedef kitleye uygun ton seçin." />
                    <XButtonGroup
                        value={settings.tone}
                        onValueChange={(value) => setSettings({ ...settings, tone: value as any })}
                        options={toneOptions}
                        columns={3}
                    />
                </div>

                {/* Length */}
                <div className="mb-6">
                    <SectionLabel label="Uzunluk" info="Daha uzun içerik = Daha fazla dwell time = Daha iyi algoritma skoru." />
                    <XButtonGroup
                        value={settings.length}
                        onValueChange={(value) => setSettings({ ...settings, length: value as any })}
                        options={lengthOptions}
                        columns={3}
                    />
                </div>

                <Separator className="my-4" />

                {/* Media Type */}
                <div className="mb-6">
                    <SectionLabel label="Medya Tipi" info="Görsel/video içerik dwell time'ı artırır ve etkileşimi yükseltir." />
                    <XButtonGroup
                        value={settings.mediaType}
                        onValueChange={(value) => setSettings({ ...settings, mediaType: value as any })}
                        options={mediaOptions}
                        columns={4}
                    />
                </div>

                {/* CTA */}
                <div className="mb-6">
                    <SectionLabel label="CTA (Eylem Çağrısı)" info="Reply en yüksek ağırlıklı aksiyon. Etkileşim teşvik eden CTA kullanın." />
                    <XButtonGroup
                        value={settings.cta}
                        onValueChange={(value) => setSettings({ ...settings, cta: value as any })}
                        options={ctaOptions}
                        columns={3}
                    />
                </div>

                {/* Target Audience */}
                <div className="mb-6">
                    <SectionLabel label="Hedef Kitle" info="Phoenix algoritması doğru kitleyi bulur. Net hedef kitleniz olsun." />
                    <XButtonGroup
                        value={settings.audience}
                        onValueChange={(value) => setSettings({ ...settings, audience: value as any })}
                        options={audienceOptions}
                        columns={3}
                    />
                </div>

                {/* Language */}
                <div className="mb-6">
                    <SectionLabel label="Dil" info="Hedef kitlenize uygun dil seçimi yapın." />
                    <XButtonGroup
                        value={settings.language}
                        onValueChange={(value) => setSettings({ ...settings, language: value as any })}
                        options={languageOptions}
                        columns={3}
                    />
                </div>

                {/* Emoji */}
                <div className="mb-6">
                    <SectionLabel label="Emoji Kullanımı" info="Doğru emoji kullanımı görsel ilgi artırır ama aşırıya kaçmayın." />
                    <XButtonGroup
                        value={settings.emoji}
                        onValueChange={(value) => setSettings({ ...settings, emoji: value as any })}
                        options={emojiOptions}
                        columns={4}
                    />
                </div>
            </div>

            {/* Generate Button */}
            <div className="border-t border-border p-4">
                <Button
                    onClick={handleGenerate}
                    disabled={!settings.topic.trim() || isGenerating}
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    size="lg"
                >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isGenerating ? "Oluşturuluyor..." : "Oluştur"}
                </Button>
            </div>
        </div>
    );
}

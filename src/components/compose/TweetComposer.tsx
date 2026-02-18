"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Sparkles,
    Send,
    Clock,
    ImagePlus,
    ListOrdered,
    MessageCircle,
    Zap,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_CHARS = 280;

const formatOptions = [
    { id: "standard", label: "Standart", icon: MessageCircle },
    { id: "thread", label: "Thread", icon: ListOrdered },
    { id: "viral", label: "Viral", icon: TrendingUp },
];

export function TweetComposer() {
    const [content, setContent] = useState("");
    const [selectedFormat, setSelectedFormat] = useState("standard");
    const [topic, setTopic] = useState("");

    const charCount = content.length;
    const charPercentage = (charCount / MAX_CHARS) * 100;
    const isOverLimit = charCount > MAX_CHARS;
    const isOptimalLength = charCount >= 71 && charCount <= 100;

    // Mock viral score - will be calculated by AI later
    const viralScore = content.length > 20 ? Math.min(Math.floor(content.length / 3), 85) : 0;

    return (
        <div className="flex h-full flex-col gap-6 p-6">
            {/* Topic Input */}
            <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Konu
                </label>
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Tweet konusunu girin..."
                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            {/* Format Selector */}
            <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Format
                </label>
                <div className="flex gap-2">
                    {formatOptions.map((format) => {
                        const Icon = format.icon;
                        return (
                            <button
                                key={format.id}
                                onClick={() => setSelectedFormat(format.id)}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                                    selectedFormat === format.id
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {format.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Composer Area */}
            <div className="flex flex-1 gap-6">
                {/* Left: Text Area */}
                <div className="flex flex-1 flex-col">
                    <div className="relative flex-1">
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Ne düşünüyorsun? AI ile tweet oluşturmak için 'Oluştur' butonuna tıkla..."
                            className="h-full min-h-[200px] resize-none text-base"
                        />

                        {/* Character Counter */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                            {isOptimalLength && (
                                <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                                    Optimal
                                </Badge>
                            )}
                            <span
                                className={cn(
                                    "text-sm font-medium",
                                    isOverLimit
                                        ? "text-destructive"
                                        : charCount > MAX_CHARS * 0.9
                                            ? "text-yellow-500"
                                            : "text-muted-foreground"
                                )}
                            >
                                {charCount}/{MAX_CHARS}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon">
                                <ImagePlus className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline">
                                <Clock className="mr-2 h-4 w-4" />
                                Zamanla
                            </Button>
                            <Button variant="outline">
                                <Sparkles className="mr-2 h-4 w-4" />
                                AI Oluştur
                            </Button>
                            <Button disabled={isOverLimit || charCount === 0}>
                                <Send className="mr-2 h-4 w-4" />
                                Paylaş
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right: Viral Score Panel */}
                <Card className="w-72 shrink-0">
                    <CardContent className="p-4">
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            Viral Skor
                        </h3>

                        {/* Score Circle */}
                        <div className="mb-6 flex justify-center">
                            <div className="relative flex h-32 w-32 items-center justify-center">
                                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        className="text-muted"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${viralScore * 2.83} 283`}
                                        className={cn(
                                            viralScore >= 70
                                                ? "text-green-500"
                                                : viralScore >= 40
                                                    ? "text-yellow-500"
                                                    : "text-muted-foreground"
                                        )}
                                    />
                                </svg>
                                <span className="absolute text-3xl font-bold">{viralScore}</span>
                            </div>
                        </div>

                        {/* Score Breakdown */}
                        <div className="space-y-3">
                            <ScoreItem label="Hook Gücü" value={Math.min(viralScore * 0.3, 30)} max={30} />
                            <ScoreItem label="Yorum Potansiyeli" value={Math.min(viralScore * 0.3, 30)} max={30} />
                            <ScoreItem label="Paylaşılabilirlik" value={Math.min(viralScore * 0.2, 20)} max={20} />
                            <ScoreItem label="Medya Bonusu" value={0} max={10} />
                            <ScoreItem label="Format Bonusu" value={Math.min(viralScore * 0.1, 10)} max={10} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ScoreItem({ label, value, max }: { label: string; value: number; max: number }) {
    const percentage = (value / max) * 100;

    return (
        <div>
            <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{Math.floor(value)}/{max}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                    className={cn(
                        "h-full rounded-full transition-all",
                        percentage >= 70
                            ? "bg-green-500"
                            : percentage >= 40
                                ? "bg-yellow-500"
                                : "bg-muted-foreground"
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

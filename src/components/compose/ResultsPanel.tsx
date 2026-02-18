"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Copy,
    Clock,
    Send,
    Zap,
    Sparkles,
    RefreshCw,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface GeneratedTweet {
    id: string;
    content: string;
    viralScore: number;
    hookStrength: number;
    replyPotential: number;
    shareability: number;
}

interface ResultsPanelProps {
    tweets: GeneratedTweet[];
    isLoading: boolean;
    onRegenerate?: () => void;
}

export function ResultsPanel({ tweets, isLoading, onRegenerate }: ResultsPanelProps) {
    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-muted" />
                        <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                    <p className="text-sm">Tweet'ler oluşturuluyor...</p>
                </div>
            </div>
        );
    }

    if (tweets.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                        <Sparkles className="h-10 w-10" />
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-medium text-foreground">Tweet Oluştur</p>
                        <p className="text-sm">
                            Sol panelden bir konu girin ve Oluştur&apos;a tıklayın
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
                <div className="flex items-center gap-2">
                    <h2 className="font-semibold">Sonuçlar</h2>
                    <Badge variant="secondary">{tweets.length} varyasyon</Badge>
                </div>
                {onRegenerate && (
                    <Button variant="outline" size="sm" onClick={onRegenerate}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Yeniden Oluştur
                    </Button>
                )}
            </div>

            {/* Results Grid */}
            <div className="flex-1 overflow-auto p-6">
                <div className="grid gap-4 lg:grid-cols-1 xl:grid-cols-2">
                    {tweets.map((tweet, index) => (
                        <TweetCard key={tweet.id} tweet={tweet} index={index + 1} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function TweetCard({ tweet, index }: { tweet: GeneratedTweet; index: number }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(tweet.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const scoreColor =
        tweet.viralScore >= 70
            ? "text-green-500"
            : tweet.viralScore >= 50
                ? "text-yellow-500"
                : "text-muted-foreground";

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-0">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
                    <span className="text-sm font-medium">Varyasyon {index}</span>
                    <div className="flex items-center gap-2">
                        <Zap className={cn("h-4 w-4", scoreColor)} />
                        <span className={cn("text-sm font-bold", scoreColor)}>
                            {tweet.viralScore}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <p className="mb-4 text-sm leading-relaxed">{tweet.content}</p>

                    {/* Stats */}
                    <div className="mb-4 flex gap-4 text-xs text-muted-foreground">
                        <span>{tweet.content.length}/280 karakter</span>
                        <span>Hook: {tweet.hookStrength}/30</span>
                        <span>Reply: {tweet.replyPotential}/30</span>
                    </div>

                    {/* Viral Score Bar */}
                    <div className="mb-4">
                        <div className="mb-1 flex justify-between text-xs">
                            <span className="text-muted-foreground">Viral Potansiyel</span>
                            <span className={scoreColor}>{tweet.viralScore}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all",
                                    tweet.viralScore >= 70
                                        ? "bg-green-500"
                                        : tweet.viralScore >= 50
                                            ? "bg-yellow-500"
                                            : "bg-muted-foreground"
                                )}
                                style={{ width: `${tweet.viralScore}%` }}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <>
                                    <Check className="mr-2 h-4 w-4 text-green-500" />
                                    Kopyalandı
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Kopyala
                                </>
                            )}
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                            <Clock className="mr-2 h-4 w-4" />
                            Zamanla
                        </Button>
                        <Button size="sm" className="flex-1">
                            <Send className="mr-2 h-4 w-4" />
                            Paylaş
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

"use client";

import { usePathname } from "next/navigation";
import { Sparkles, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const PAGE_TITLES: Record<string, string> = {
    "/": "Tweet Oluştur",
    "/autopilot": "Autopilot",
    "/news-digest": "Haber Özeti",
    "/settings": "Ayarlar",
};

export function TopBar() {
    const pathname = usePathname();
    const title = PAGE_TITLES[pathname] || "XFiles";

    return (
        <TooltipProvider delayDuration={0}>
            <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center border-b border-border bg-sidebar">
                {/* Left: Logo */}
                <div className="flex h-full w-16 shrink-0 items-center justify-center border-r border-border">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <Sparkles className="h-4 w-4 text-primary-foreground" />
                    </div>
                </div>

                {/* Center: Title */}
                <div className="flex flex-1 items-center px-4">
                    <h1 className="text-sm font-semibold">{title}</h1>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 px-4">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-4 w-4" />
                                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Bildirimler</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                                    <User className="h-4 w-4" />
                                </div>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Hesap</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </header>
        </TooltipProvider>
    );
}

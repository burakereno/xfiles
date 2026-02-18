"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PenSquare,
  Zap,
  Newspaper,
  Settings,
  User,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const mainNavItems: NavItem[] = [
  { icon: PenSquare, label: "Tweet Oluştur", href: "/" },
  { icon: Zap, label: "Autopilot", href: "/autopilot" },
  { icon: Newspaper, label: "Haber Özeti", href: "/news-digest" },
];

const bottomNavItems: NavItem[] = [
  { icon: Settings, label: "Ayarlar", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed left-0 top-14 z-40 flex h-[calc(100vh-3.5rem)] w-16 flex-col border-r border-border bg-sidebar">
        {/* Main Navigation */}
        <nav className="flex flex-1 flex-col items-center gap-2 py-4">
          {mainNavItems.map((item) => (
            <NavButton key={item.href} item={item} isActive={pathname === item.href} />
          ))}
        </nav>

        {/* Account Switcher */}
        <div className="flex flex-col items-center gap-2 pb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                <User className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Hesap Değiştir</p>
            </TooltipContent>
          </Tooltip>
        </div>



        {/* Bottom Navigation */}
        <nav className="flex flex-col items-center gap-2 py-4">
          {bottomNavItems.map((item) => (
            <NavButton key={item.href} item={item} isActive={pathname === item.href} />
          ))}
        </nav>
      </aside>
    </TooltipProvider>
  );
}

function NavButton({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{item.label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

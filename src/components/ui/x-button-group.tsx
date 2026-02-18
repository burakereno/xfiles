"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface XButtonGroupOption {
    id: string;
    label: string;
    icon?: LucideIcon;
    description?: string;
}

interface XButtonGroupProps {
    value: string;
    onValueChange: (value: string) => void;
    options: XButtonGroupOption[];
    columns?: 2 | 3 | 4;
    className?: string;
}

export function XButtonGroup({
    value,
    onValueChange,
    options,
    columns = 3,
    className,
}: XButtonGroupProps) {
    const gridCols = {
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-4",
    };

    return (
        <TooltipProvider delayDuration={300}>
            <div className={cn("grid gap-2", gridCols[columns], className)}>
                {options.map((option) => {
                    const Icon = option.icon;
                    const buttonContent = (
                        <button
                            key={option.id}
                            onClick={() => onValueChange(option.id)}
                            className={cn(
                                "flex items-center justify-center gap-1.5 rounded-lg p-1.5 text-xs transition-colors cursor-pointer",
                                value === option.id
                                    ? "bg-primary/10 text-primary"
                                    : "bg-accent text-muted-foreground hover:bg-accent/70"
                            )}
                        >
                            {Icon && <Icon className="h-3.5 w-3.5" />}
                            {option.label}
                        </button>
                    );

                    if (option.description) {
                        return (
                            <Tooltip key={option.id}>
                                <TooltipTrigger asChild>
                                    {buttonContent}
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{option.description}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    }

                    return buttonContent;
                })}
            </div>
        </TooltipProvider>
    );
}

"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface XTabsOption {
    id: string;
    label: string;
    description?: string;
}

interface XTabsProps {
    value: string;
    onValueChange: (value: string) => void;
    options: XTabsOption[];
    className?: string;
}

export function XTabs({ value, onValueChange, options, className }: XTabsProps) {
    return (
        <TooltipProvider delayDuration={300}>
            <TabsPrimitive.Root value={value} onValueChange={onValueChange} className={cn("w-full", className)}>
                <TabsPrimitive.List className="inline-flex h-7 w-full items-center justify-center rounded-lg bg-muted p-0.5">
                    {options.map((option) => {
                        const trigger = (
                            <TabsPrimitive.Trigger
                                key={option.id}
                                value={option.id}
                                className={cn(
                                    "inline-flex h-6 flex-1 items-center justify-center rounded-md px-2 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer",
                                    "data-[state=inactive]:text-muted-foreground",
                                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                )}
                            >
                                {option.label}
                            </TabsPrimitive.Trigger>
                        );

                        if (option.description) {
                            return (
                                <Tooltip key={option.id}>
                                    <TooltipTrigger asChild>
                                        {trigger}
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{option.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }

                        return trigger;
                    })}
                </TabsPrimitive.List>
            </TabsPrimitive.Root>
        </TooltipProvider>
    );
}

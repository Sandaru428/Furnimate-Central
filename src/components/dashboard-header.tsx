
'use client';

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/auth/user-nav";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function DashboardHeader() {
    const { theme, setTheme } = useTheme();

    return (
        <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
            <div className="flex items-center">
                <SidebarTrigger />
            </div>
            <div className="flex items-center gap-4">
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    >
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
                <UserNav />
            </div>
        </header>
    );
}

    
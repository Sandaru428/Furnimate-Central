
'use client';

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/auth/user-nav";

export function DashboardHeader() {
    return (
        <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
            <div className="flex items-center">
                <SidebarTrigger />
            </div>
            <UserNav />
        </header>
    );
}

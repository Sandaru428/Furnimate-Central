
'use client';

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/auth/user-nav";

type DashboardHeaderProps = {
    title: string;
};

export function DashboardHeader({ title }: DashboardHeaderProps) {
    return (
        <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold ml-4">{title}</h1>
            </div>
            <UserNav />
        </header>
    );
}

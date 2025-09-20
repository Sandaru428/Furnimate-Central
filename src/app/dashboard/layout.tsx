
'use client';

import { useAtom } from 'jotai';
import { companyProfileAtom } from '@/lib/store';
import { Logo } from "@/components/icons/logo";
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
    SidebarGroup,
    SidebarGroupLabel,
  } from "@/components/ui/sidebar";
import { Home, Settings, FileText, Database, Users, Building, FileQuestion, ShoppingCart, ClipboardList, BookUser, BookOpenCheck, Landmark, UserCog, UserRound, Server } from "lucide-react";
import { DashboardHeader } from '@/components/dashboard-header';
import { MAIN_TABS, MainTab, AuthProfile } from '@/lib/roles';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const menuConfig = {
    dashboard: { icon: Home, label: 'Dashboard', href: '/dashboard' },
    development: { icon: Server, label: 'Development', href: '/dashboard/development'},
    reporting: { icon: BookOpenCheck, label: 'Reporting', href: '/dashboard/reporting' },
    admin: {
        label: 'Admin',
        items: {
            'company-profile': { icon: Settings, label: 'Company Profile', href: '/dashboard/admin/company-profile' },
            users: { icon: UserCog, label: 'Users', href: '/dashboard/admin/users' },
            'notification-templates': { icon: FileText, label: 'Notification Templates', href: '/dashboard/admin/notification-templates' },
            'cash-book': { icon: BookUser, label: 'Cash Book', href: '/dashboard/admin/cash-book' },
        }
    },
    data: {
        label: 'Data Management',
        items: {
            'income-expenses': { icon: Landmark, label: 'Income & Expenses', href: '/dashboard/data/income-expenses' },
            'stocks': { icon: Database, label: 'Stocks', href: '/dashboard/data/stocks' },
            staff: { icon: UserRound, label: 'Staff', href: '/dashboard/data/staff' },
            suppliers: { icon: Building, label: 'Suppliers', href: '/dashboard/data/suppliers' },
            customers: { icon: Users, label: 'Customers', href: '/dashboard/data/customers' },
            'purchase-orders': { icon: ClipboardList, label: 'Purchase Orders', href: '/dashboard/data/purchase-orders' },
        }
    },
    sales: {
        label: 'Sales',
        items: {
            quotations: { icon: FileQuestion, label: 'Quotations', href: '/dashboard/sales/quotations' },
            orders: { icon: ShoppingCart, label: 'Sale Orders', href: '/dashboard/sales/orders' },
        }
    }
};

const hasAccess = (tabId: MainTab, authProfile: AuthProfile | null | undefined, loading: boolean) => {
    if (loading || !authProfile) return false;
    if (authProfile.role === 'Super Admin') return true;
    return authProfile.accessOptions?.includes(tabId);
};


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [companyProfile] = useAtom(companyProfileAtom);
    const { authProfile, loading, handleSignOut } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const inactivityTimer = useRef<NodeJS.Timeout>();

    const resetInactivityTimer = () => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

        const logoutMinutes = companyProfile.autoLogoutMinutes || 0;
        if (logoutMinutes <= 0) return;

        inactivityTimer.current = setTimeout(() => {
            handleSignOut();
            toast({
                title: "Session Expired",
                description: "You have been logged out due to inactivity.",
            });
            router.push('/login');
        }, logoutMinutes * 60 * 1000);
    };

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
        
        events.forEach(event => window.addEventListener(event, resetInactivityTimer));
        resetInactivityTimer();

        return () => {
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
            events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
        };
    }, [companyProfile.autoLogoutMinutes]);

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-4 text-lg font-medium p-2">
                        <Logo />
                        <span className="font.headline text-2xl">{companyProfile.companyName}</span>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                         {hasAccess('dashboard', authProfile, loading) && (
                            <SidebarMenuItem>
                                <SidebarMenuButton href={menuConfig.dashboard.href}>
                                    <menuConfig.dashboard.icon />
                                    {menuConfig.dashboard.label}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                         )}
                         {hasAccess('development', authProfile, loading) && (
                            <SidebarMenuItem>
                                <SidebarMenuButton href={menuConfig.development.href}>
                                    <menuConfig.development.icon />
                                    {menuConfig.development.label}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                         )}
                         {hasAccess('reporting', authProfile, loading) && (
                            <SidebarMenuItem>
                                <SidebarMenuButton href={menuConfig.reporting.href}>
                                    <menuConfig.reporting.icon />
                                    {menuConfig.reporting.label}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                         )}

                        {/* Admin Group */}
                        <SidebarGroup>
                            <SidebarGroupLabel>{menuConfig.admin.label}</SidebarGroupLabel>
                            {Object.entries(menuConfig.admin.items).map(([key, item]) => 
                                hasAccess(key as MainTab, authProfile, loading) && (
                                <SidebarMenuItem key={key}>
                                    <SidebarMenuButton href={item.href}>
                                        <item.icon />
                                        {item.label}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarGroup>
                        
                        {/* Data Management Group */}
                        <SidebarGroup>
                            <SidebarGroupLabel>{menuConfig.data.label}</SidebarGroupLabel>
                            {Object.entries(menuConfig.data.items).map(([key, item]) => 
                                hasAccess(key as MainTab, authProfile, loading) && (
                                <SidebarMenuItem key={key}>
                                    <SidebarMenuButton href={item.href}>
                                        <item.icon />
                                        {item.label}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarGroup>
                        
                        {/* Sales Group */}
                        <SidebarGroup>
                            <SidebarGroupLabel>{menuConfig.sales.label}</SidebarGroupLabel>
                            {Object.entries(menuConfig.sales.items).map(([key, item]) => 
                                hasAccess(key as MainTab, authProfile, loading) && (
                                <SidebarMenuItem key={key}>
                                    <SidebarMenuButton href={item.href}>
                                        <item.icon />
                                        {item.label}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarGroup>
                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>
            <SidebarInset>
                <DashboardHeader />
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}

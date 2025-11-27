
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
import { Home, Settings, FileText, Database, Users, Building, FileQuestion, ShoppingCart, ClipboardList, BookUser, BookOpenCheck, Landmark, UserCog, UserRound, Server, ChevronDown, ChevronUp } from "lucide-react";
import { DashboardHeader } from '@/components/dashboard-header';
import { MAIN_TABS, MainTab, AuthProfile } from '@/lib/roles';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const menuConfig = {
    
    admin: {
        label: 'Admin',
        items: {
            dashboard: { icon: Home, label: 'Dashboard', href: '/dashboard' },
            staff: { icon: UserRound, label: 'Staff', href: '/dashboard/data/staff' },
            users: { icon: UserCog, label: 'Users', href: '/dashboard/admin/users' },
            reporting: { icon: BookOpenCheck, label: 'Reporting', href: '/dashboard/reporting' },
            'notification-templates': { icon: FileText, label: 'Notification Templates', href: '/dashboard/admin/notification-templates' },
            'company-profile': { icon: Settings, label: 'Company Profile', href: '/dashboard/admin/company-profile' },
        }
    },

    cash: {
        label: 'Cash Management',
        items: {
            'income-expenses': { icon: Landmark, label: 'Income & Expenses', href: '/dashboard/data/income-expenses' },
            'cash-book': { icon: BookUser, label: 'Cash Book', href: '/dashboard/admin/cash-book' },
            'bank-book': { icon: BookUser, label: 'Bank Book', href: '/dashboard/admin/bank-book' },
            'credit-book': { icon: BookUser, label: 'Credit Book', href: '/dashboard/admin/credit-book' },
        }
    },

    data: {
        label: 'Purchase',
        items: {
            
            'stocks': { icon: Database, label: 'Stocks', href: '/dashboard/data/stocks' },
            suppliers: { icon: Building, label: 'Suppliers', href: '/dashboard/data/suppliers' },
            'purchase-orders': { icon: ClipboardList, label: 'Purchase Orders', href: '/dashboard/data/purchase-orders' },
            creditors: { icon: ClipboardList, label: 'Creditors', href: '/dashboard/data/creditors' },
        }
    },
    
    sales: {
        label: 'Sales',
        items: {
            customers: { icon: Users, label: 'Customers', href: '/dashboard/data/customers' },
            quotations: { icon: FileQuestion, label: 'Quotations', href: '/dashboard/sales/quotations' },
            orders: { icon: ShoppingCart, label: 'Sale Orders', href: '/dashboard/sales/orders' },
            debtors: { icon: ShoppingCart, label: 'Debitors', href: '/dashboard/sales/debitors' },
        }
    }
};

const hasAccess = (tabId: MainTab, authProfile: AuthProfile | null | undefined, loading: boolean) => {
    if (loading || !authProfile) return false;
    if (authProfile.role === 'Super Admin') return true;

    // If a user has dashboard access, they should also have company profile access.
    if (tabId === 'company-profile' && authProfile.accessOptions?.includes('dashboard')) {
        return true;
    }

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
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        admin: true,
        cash: false,
        data: false,
        sales: false,
    });

    const toggleGroup = (groupKey: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }));
    };

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

                        {/* Admin Group */}
                        <SidebarGroup>
                            <SidebarGroupLabel className="flex items-center justify-between cursor-pointer text-base font-semibold py-3 px-2 rounded-md hover:bg-sidebar-accent/80 transition-colors duration-200" onClick={() => toggleGroup('admin')}>
                                <span>{menuConfig.admin.label}</span>
                                {expandedGroups.admin ? <ChevronUp className="h-4 w-4 transition-transform duration-200" /> : <ChevronDown className="h-4 w-4 transition-transform duration-200" />}
                            </SidebarGroupLabel>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedGroups.admin ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                {Object.entries(menuConfig.admin.items).map(([key, item]) => 
                                    hasAccess(key as MainTab, authProfile, loading) && (
                                    <SidebarMenuItem key={key}>
                                        <SidebarMenuButton href={item.href}>
                                            <item.icon />
                                            {item.label}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </div>
                        </SidebarGroup>

                        {/* Cash Management Group */}
                        <SidebarGroup>
                            <SidebarGroupLabel className="flex items-center justify-between cursor-pointer text-base font-semibold py-3 px-2 rounded-md hover:bg-sidebar-accent/80 transition-colors duration-200" onClick={() => toggleGroup('cash')}>
                                <span>{menuConfig.cash.label}</span>
                                {expandedGroups.cash ? <ChevronUp className="h-4 w-4 transition-transform duration-200" /> : <ChevronDown className="h-4 w-4 transition-transform duration-200" />}
                            </SidebarGroupLabel>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedGroups.cash ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                {Object.entries(menuConfig.cash.items).map(([key, item]) => 
                                    hasAccess(key as MainTab, authProfile, loading) && (
                                    <SidebarMenuItem key={key}>
                                        <SidebarMenuButton href={item.href}>
                                            <item.icon />
                                            {item.label}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </div>
                        </SidebarGroup>
                        
                        {/* Data Management Group */}
                        <SidebarGroup>
                            <SidebarGroupLabel className="flex items-center justify-between cursor-pointer text-base font-semibold py-3 px-2 rounded-md hover:bg-sidebar-accent/80 transition-colors duration-200" onClick={() => toggleGroup('data')}>
                                <span>{menuConfig.data.label}</span>
                                {expandedGroups.data ? <ChevronUp className="h-4 w-4 transition-transform duration-200" /> : <ChevronDown className="h-4 w-4 transition-transform duration-200" />}
                            </SidebarGroupLabel>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedGroups.data ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                {Object.entries(menuConfig.data.items).map(([key, item]) => 
                                    hasAccess(key as MainTab, authProfile, loading) && (
                                    <SidebarMenuItem key={key}>
                                        <SidebarMenuButton href={item.href}>
                                            <item.icon />
                                            {item.label}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </div>
                        </SidebarGroup>
                        
                        {/* Sales Group */}
                        <SidebarGroup>
                            <SidebarGroupLabel className="flex items-center justify-between cursor-pointer text-base font-semibold py-3 px-2 rounded-md hover:bg-sidebar-accent/80 transition-colors duration-200" onClick={() => toggleGroup('sales')}>
                                <span>{menuConfig.sales.label}</span>
                                {expandedGroups.sales ? <ChevronUp className="h-4 w-4 transition-transform duration-200" /> : <ChevronDown className="h-4 w-4 transition-transform duration-200" />}
                            </SidebarGroupLabel>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedGroups.sales ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                {Object.entries(menuConfig.sales.items).map(([key, item]) => 
                                    hasAccess(key as MainTab, authProfile, loading) && (
                                    <SidebarMenuItem key={key}>
                                        <SidebarMenuButton href={item.href}>
                                            <item.icon />
                                            {item.label}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </div>
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


import { Logo } from "@/components/icons/logo";
import {
    Sidebar,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
    SidebarGroup,
    SidebarGroupLabel,
  } from "@/components/ui/sidebar";
import { Home, Settings, FileText, Database, Users, Building, FileQuestion } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-4 text-lg font-medium p-2">
                        <Logo />
                        <span className="font-headline text-2xl">Furnimate Central</span>
                    </div>
                </SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/dashboard">
                            <Home />
                            Dashboard
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarGroup>
                        <SidebarGroupLabel>Admin</SidebarGroupLabel>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/dashboard/admin/company-profile">
                                <Settings />
                                Company Profile
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/dashboard/admin/notification-templates">
                                <FileText />
                                Notification Templates
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarGroup>
                    <SidebarGroup>
                        <SidebarGroupLabel>Data Management</SidebarGroupLabel>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/dashboard/data/master-data">
                                <Database />
                                Master Data
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/dashboard/data/suppliers">
                                <Building />
                                Suppliers
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/dashboard/data/customers">
                                <Users />
                                Customers
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarGroup>
                     <SidebarGroup>
                        <SidebarGroupLabel>Sales</SidebarGroupLabel>
                        <SidebarMenuItem>
                            <SidebarMenuButton href="/dashboard/sales/quotations">
                                <FileQuestion />
                                Quotations
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarGroup>
                </SidebarMenu>
            </Sidebar>
            <SidebarInset>
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}

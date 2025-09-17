
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const developmentChecklist = [
  {
    heading: "User Authentication & Roles",
    items: [
      { id: "auth-1", label: "Implement secure email-based login", checked: true },
      { id: "auth-2", label: "Define roles: Admin, Sales, Production, Customer, Supplier", checked: true },
    ],
  },
  {
    heading: "Admin Features",
    items: [
      { id: "admin-1", label: "Company Profile Management UI" },
      { id: "admin-2", label: "Notification Template Engine UI" },
    ],
  },
  {
    heading: "Core System Features",
    items: [
      { id: "core-1", label: "Smart Reference Number Generator (Cloud Function)" },
      { id: "core-2", label: "GenAI Audit Flow for reference numbers" },
      { id: "core-3", label: "Progress Dashboard with KPIs" },
    ],
  },
    {
    heading: "Data Management",
    items: [
        { id: "data-1", label: "Master Data Management for products and materials" },
        { id: "data-2", label: "Supplier and Customer data management" },
    ],
    },
    {
    heading: "Sales Flow",
    items: [
        { id: "sales-1", label: "Quotation creation and management" },
        { id: "sales-2", label: "Order conversion and real-time tracking" },
    ],
    },
];

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 md:p-8">
      <Tabs defaultValue="dashboard" className="w-full max-w-4xl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to your Dashboard</CardTitle>
              <CardDescription>
                This is your central hub for managing everything.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>You have successfully logged in.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="development">
          <Card>
            <CardHeader>
              <CardTitle>Development Workflow</CardTitle>
              <CardDescription>
                A step-by-step checklist to track feature implementation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {developmentChecklist.map((section, index) => (
                <div key={section.heading}>
                  <h3 className="text-lg font-semibold mb-4">{section.heading}</h3>
                  <div className="space-y-4">
                    {section.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <Checkbox id={item.id} checked={item.checked || false} />
                        <label
                          htmlFor={item.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {index < developmentChecklist.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

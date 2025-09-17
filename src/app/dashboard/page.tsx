
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const developmentChecklist = [
  {
    heading: 'User Authentication & Roles',
    items: [
      {
        id: 'auth-1',
        label: 'Implement secure email-based login',
        checked: true,
      },
      {
        id: 'auth-2',
        label: 'Define roles: Admin, Sales, Production, Customer, Supplier',
        checked: true,
      },
    ],
  },
  {
    heading: 'Admin Features',
    items: [
      { id: 'admin-1', label: 'Company Profile Management UI', checked: true },
      {
        id: 'admin-2',
        label: 'Notification Template Engine UI',
        checked: true,
      },
    ],
  },
  {
    heading: 'Core System Features',
    items: [
      {
        id: 'core-1',
        label: 'Smart Reference Number Generator (Cloud Function)',
        checked: true,
      },
      {
        id: 'core-2',
        label: 'GenAI Audit Flow for reference numbers',
        checked: true,
      },
      { id: 'core-3', label: 'Progress Dashboard with KPIs', checked: true },
    ],
  },
  {
    heading: 'Data Management',
    items: [
      {
        id: 'data-1',
        label: 'Master Data Management for products and materials',
        checked: true,
      },
      { id: 'data-2', label: 'Supplier and Customer data management', checked: true },
    ],
  },
  {
    heading: 'Sales Flow',
    items: [
      { id: 'sales-1', label: 'Quotation creation and management' },
      { id: 'sales-2', label: 'Order conversion and real-time tracking' },
    ],
  },
];

const kpiData = [
  {
    title: 'Total Revenue',
    value: '$45,231.89',
    change: '+20.1% from last month',
    icon: <DollarSign className="text-muted-foreground" />,
  },
  {
    title: 'New Orders',
    value: '+2350',
    change: '+180.1% from last month',
    icon: <ShoppingCart className="text-muted-foreground" />,
  },
  {
    title: 'Pending Shipments',
    value: '125',
    change: '+19% from last month',
    icon: <Package className="text-muted-foreground" />,
  },
  {
    title: 'Production Yield',
    value: '98.5%',
    change: '+2.5% from last month',
    icon: <TrendingUp className="text-muted-foreground" />,
  },
];

const salesData = [
    { month: 'Jan', sales: 4000 },
    { month: 'Feb', sales: 3000 },
    { month: 'Mar', sales: 5000 },
    { month: 'Apr', sales: 4500 },
    { month: 'May', sales: 6000 },
    { month: 'Jun', sales: 5500 },
  ];

export default function DashboardPage() {
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="development">Development</TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi) => (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                {kpi.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">{kpi.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-4 grid gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Sales Overview</CardTitle>
                    <CardDescription>A look at your sales performance over the last 6 months.</CardDescription>
                </CardHeader>
                <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sales" fill="hsl(var(--primary))" />
                    </BarChart>
                </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
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
                <h3 className="text-lg font-semibold mb-4">
                  {section.heading}
                </h3>
                <div className="space-y-4">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-3"
                    >
                      <Checkbox
                        id={item.id}
                        checked={item.checked || false}
                        disabled
                      />
                      <label
                        htmlFor={item.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
                {index < developmentChecklist.length - 1 && (
                  <Separator className="mt-6" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}


'use client';

import { useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
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
  BookOpenCheck,
  Server,
  Archive,
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

import { useAtom } from 'jotai';
import { currencyAtom, paymentsAtom, saleOrdersAtom, masterDataAtom } from '@/lib/store';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

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
      { id: 'sales-1', label: 'Quotation creation and management', checked: true },
      { id: 'sales-2', label: 'Sale Order conversion and real-time tracking', checked: true },
    ],
  },
];

export default function DashboardPage() {
  const [currency] = useAtom(currencyAtom);
  const [payments] = useAtom(paymentsAtom);
  const [saleOrders] = useAtom(saleOrdersAtom);
  const [masterData] = useAtom(masterDataAtom);
  const [isConnected, setIsConnected] = useState(false);

  const kpiData = useMemo(() => {
    const totalRevenue = payments
        .filter(p => p.type === 'income')
        .reduce((acc, p) => acc + p.amount, 0);

    const newOrders = saleOrders.length;
    
    const pendingShipments = saleOrders.filter(o => o.status === 'Processing').length;
    
    const itemsToRestock = masterData.filter(item => item.stockLevel === 0).length;

    return [
      {
        title: 'Total Revenue',
        amount: totalRevenue,
        valuePrefix: '',
        change: 'All income recorded',
        icon: <DollarSign className="text-muted-foreground" />,
      },
      {
        title: 'New Orders',
        amount: newOrders,
        valuePrefix: '',
        change: 'Total sale orders created',
        icon: <ShoppingCart className="text-muted-foreground" />,
      },
      {
        title: 'Pending Shipments',
        amount: pendingShipments,
        valuePrefix: '',
        change: `Orders in 'Processing' state`,
        icon: <Package className="text-muted-foreground" />,
      },
      {
        title: 'Items to Re-stock',
        amount: itemsToRestock,
        valuePrefix: '',
        valueSuffix: '',
        change: 'Items with zero stock level',
        icon: <Archive className="text-muted-foreground" />,
      },
    ];
  }, [payments, saleOrders, masterData]);

 const salesData = useMemo(() => {
    const monthlySales: { [key: string]: number } = {};

    saleOrders.forEach(order => {
        const month = format(parseISO(order.date), 'MMM yyyy');
        if (!monthlySales[month]) {
            monthlySales[month] = 0;
        }
        monthlySales[month] += order.amount;
    });

    return Object.entries(monthlySales)
        .map(([month, sales]) => ({
            month: month.split(' ')[0], // just get month name
            sales: sales,
        }))
        .slice(-6); // Get last 6 months
 }, [saleOrders]);

  return (
    <>
      <DashboardHeader title="Dashboard" />
      <main className="p-4">
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
                    <div className="text-2xl font-bold">
                        {kpi.title === 'Total Revenue' 
                            ? `${kpi.valuePrefix || ''}${currency.code} ${kpi.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `${kpi.valuePrefix || ''}${kpi.amount.toLocaleString()}${kpi.valueSuffix || ''}`
                        }
                    </div>
                    <p className="text-xs text-muted-foreground">{kpi.change}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 grid gap-4 grid-cols-1">
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
                        <YAxis tickFormatter={(value) => `${currency.code} ${value.toLocaleString()}`} />
                        <Tooltip formatter={(value: number) => `${currency.code} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                        <Bar dataKey="sales" fill="hsl(var(--primary))" />
                        </BarChart>
                    </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Reporting</CardTitle>
                        <CardDescription>Generate and view reports based on a selected date range.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                            <BookOpenCheck className="h-16 w-16 text-muted-foreground" />
                            <p>Select a date range to generate reports for sales, purchases, and more.</p>
                            <Button asChild>
                                <Link href="/dashboard/reporting">Go to Reporting</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>
          <TabsContent value="development">
            <Card>
              <CardHeader>
                <CardTitle>Development Workflow</CardTitle>
                <CardDescription>
                  A step-by-step checklist to track feature implementation and testing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-4">Data Seeding</h3>
                     <div className="flex items-center space-x-2 p-4 border rounded-lg">
                        <Switch id="dummy-data-switch" disabled />
                        <Label htmlFor="dummy-data-switch">Enable Dummy Data</Label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Data is now being fetched from Firestore. This switch is disabled.
                    </p>
                </div>
                
                <Separator />

                <div>
                    <h3 className="text-lg font-semibold mb-4">Server Connection</h3>
                     <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <Server className="h-6 w-6 text-muted-foreground" />
                            <div>
                                <p className="font-medium">absiraivaws@gmail.com</p>
                                {isConnected ? (
                                    <Badge className="bg-green-600 text-white">Connected</Badge>
                                ) : (
                                    <Badge variant="destructive">Disconnected</Badge>
                                )}
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => setIsConnected(!isConnected)}>
                          {isConnected ? 'Disconnect' : 'Connect'}
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Simulated server connection status for development purposes.
                    </p>
                </div>

                <Separator />

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
      </main>
    </>
  );
}

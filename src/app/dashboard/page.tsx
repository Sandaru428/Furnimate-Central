
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  BookOpenCheck,
  Server,
  Archive,
  Gift,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from 'recharts';

import { useAtom } from 'jotai';
import { currencyAtom, paymentsAtom, saleOrdersAtom, stocksAtom, customersAtom, staffAtom } from '@/lib/store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format, parseISO, isToday } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { useToast } from '@/hooks/use-toast';
import type { StockItem } from './data/stocks/page';


const CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function DashboardPage() {
  const [currency] = useAtom(currencyAtom);
  const [payments] = useAtom(paymentsAtom);
  const [saleOrders] = useAtom(saleOrdersAtom);
  const [stocks] = useAtom(stocksAtom);
  const [customers] = useAtom(customersAtom);
  const [staff] = useAtom(staffAtom);
  const { toast } = useToast();

  const kpiData = useMemo(() => {
    const totalRevenue = payments
        .filter(p => p.type === 'income')
        .reduce((acc, p) => acc + p.amount, 0);

    const newOrders = saleOrders.length;
    
    const pendingShipments = saleOrders.filter(o => o.status === 'Processing').length;
    
    const itemsToRestock = stocks.filter(item => item.stockLevel === 0).length;

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
  }, [payments, saleOrders, stocks]);

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

  const stockValueData = useMemo(() => {
    const rawMaterialValue = stocks
        .filter(item => item.type === 'Raw Material')
        .reduce((acc, item) => acc + (item.stockLevel * item.unitPrice), 0);
    
    const finishedGoodValue = stocks
        .filter(item => item.type === 'Finished Good')
        .reduce((acc, item) => acc + (item.stockLevel * item.unitPrice), 0);
    
    return [
        { name: 'Raw Materials', value: rawMaterialValue, fill: 'var(--color-raw)' },
        { name: 'Finished Goods', value: finishedGoodValue, fill: 'var(--color-finished)' },
    ];
  }, [stocks]);

  const stockChartConfig = {
    raw: { label: "Raw Materials", color: "hsl(var(--chart-1))" },
    finished: { label: "Finished Goods", color: "hsl(var(--chart-2))" }
  };

  const rawMaterialsChartData = useMemo(() => 
    stocks.filter(s => s.type === 'Raw Material' && s.stockLevel > 0).map(s => ({
        name: s.name,
        value: s.unitPrice * s.stockLevel,
    })), [stocks]);
    
  const finishedGoodsChartData = useMemo(() => 
    stocks.filter(s => s.type === 'Finished Good' && s.stockLevel > 0).map(s => ({
        name: s.name,
        value: s.unitPrice * s.stockLevel,
    })), [stocks]);

  const birthdayList = useMemo(() => {
    const today = new Date();
    const isBirthday = (dob: string | undefined) => {
        if (!dob) return false;
        try {
            const birthDate = parseISO(dob);
            return birthDate.getDate() === today.getDate() && birthDate.getMonth() === today.getMonth();
        } catch {
            return false;
        }
    };
    const birthdayCustomers = customers.filter(c => isBirthday(c.dateOfBirth)).map(c => ({...c, type: 'Customer'}));
    const birthdayStaff = staff.filter(s => isBirthday(s.dateOfBirth)).map(s => ({...s, type: 'Staff'}));

    return [...birthdayCustomers, ...birthdayStaff];
  }, [customers, staff]);

  const handleSendWishes = (name: string) => {
    // In a real app, this would trigger an email.
    // For now, we'll just show a notification.
    toast({
        title: 'Wishes Sent!',
        description: `Birthday wishes have been sent to ${name}.`
    });
  }

  return (
    <>
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
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
        <div className="mt-4 grid gap-4 grid-cols-1 lg:grid-cols-2">
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
                    <CardTitle>Birthday Wishes</CardTitle>
                    <CardDescription>Send birthday wishes to staff and customers celebrating today.</CardDescription>
                </CardHeader>
                <CardContent>
                    {birthdayList.length > 0 ? (
                        <ul className="space-y-3">
                            {birthdayList.map(person => (
                                <li key={(person as any).id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                    <div className='flex items-center gap-3'>
                                        <div className='bg-background p-2 rounded-full'>
                                           <Gift className='h-5 w-5 text-primary' />
                                        </div>
                                        <div>
                                            <p className="font-medium">{(person as any).name}</p>
                                            <p className="text-sm text-muted-foreground">{(person as any).type}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={() => handleSendWishes((person as any).name)}>Send Wishes</Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 h-full">
                            <p>No birthdays today.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
        
        <div className="mt-4 grid gap-4 grid-cols-1 xl:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Stock Value: Raw vs Finished</CardTitle>
                    <CardDescription>Total value of raw materials vs. finished goods in stock.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={stockChartConfig} className="mx-auto aspect-square h-[250px]">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                            <Pie data={stockValueData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                                <Cell key="raw-materials" fill="var(--color-raw)" />
                                <Cell key="finished-goods" fill="var(--color-finished)" />
                            </Pie>
                            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Raw Material Stock Value</CardTitle>
                    <CardDescription>Value breakdown of each raw material.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="mx-auto aspect-square h-[250px]">
                         <PieChart>
                             <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                             <Pie data={rawMaterialsChartData} dataKey="value" nameKey="name" innerRadius={60}>
                                {rawMaterialsChartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                         </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Finished Good Stock Value</CardTitle>
                    <CardDescription>Value breakdown of each finished good.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={{}} className="mx-auto aspect-square h-[250px]">
                         <PieChart>
                             <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                             <Pie data={finishedGoodsChartData} dataKey="value" nameKey="name" innerRadius={60}>
                                {finishedGoodsChartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                         </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
      </main>
    </>
  );
}

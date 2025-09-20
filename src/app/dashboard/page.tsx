
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
import { currencyAtom, paymentsAtom, saleOrdersAtom, stocksAtom } from '@/lib/store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';

export default function DashboardPage() {
  const [currency] = useAtom(currencyAtom);
  const [payments] = useAtom(paymentsAtom);
  const [saleOrders] = useAtom(saleOrdersAtom);
  const [stocks] = useAtom(stocksAtom);

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
      </main>
    </>
  );
}

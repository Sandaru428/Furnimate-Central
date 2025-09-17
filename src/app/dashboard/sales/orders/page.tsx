
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';

// This is a mock data source. In a real app, you'd fetch this.
// For now, we'll imagine quotations are passed here after conversion.
// We are adding a new state to store orders.

const initialOrders: any[] = [
    {
        id: 'ORD-001',
        customer: 'Emily Davis',
        date: '2024-05-06',
        amount: 2400.00,
        status: 'Processing',
        quotationId: 'QUO-003',
      },
];


export default function OrdersPage() {
    const [orders, setOrders] = useState(initialOrders);

    // In a real application, you might fetch converted quotations
    // or listen to a global state management solution.
    // For this example, we'll keep it simple.

  return (
    <>
      <header className="flex items-center p-4 border-b">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold ml-4">Orders</h1>
      </header>
      <main className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Confirmed Orders</CardTitle>
            <CardDescription>
                These are quotations that have been converted into orders after a successful stock check.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Original Quotation</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length > 0 ? (
                    orders.map((order) => (
                    <TableRow key={order.id}>
                        <TableCell className="font-mono">{order.id}</TableCell>
                        <TableCell className="font-mono">{order.quotationId}</TableCell>
                        <TableCell className="font-medium">{order.customer}</TableCell>
                        <TableCell>{order.date}</TableCell>
                        <TableCell className="text-right">${order.amount.toFixed(2)}</TableCell>
                        <TableCell>
                        <Badge>{order.status}</Badge>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">
                            No converted orders yet.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

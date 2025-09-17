
'use client';

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
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAtom } from 'jotai';
import { paymentsAtom } from '@/lib/store';
import { Badge } from '@/components/ui/badge';


export default function CashBookPage() {
    const [payments] = useAtom(paymentsAtom);

  return (
    <>
      <header className="flex items-center p-4 border-b">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold ml-4">Cash Book</h1>
      </header>
      <main className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Cash Book</CardTitle>
            <CardDescription>
                A record of all financial transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length > 0 ? (
                    payments.map((payment) => (
                    <TableRow key={payment.id}>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell className="font-mono">{payment.orderId}</TableCell>
                        <TableCell className="text-right">${payment.amount.toFixed(2)}</TableCell>
                        <TableCell>
                            <Badge variant="secondary">{payment.method}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{payment.details}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">
                            No transactions recorded yet.
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

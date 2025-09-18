
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
import { paymentsAtom, currencyAtom } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


export default function CashBookPage() {
    const [payments] = useAtom(paymentsAtom);
    const [currency] = useAtom(currencyAtom);

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
                A record of all financial transactions, both income and expenses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference ID</TableHead>
                  <TableHead>Type</TableHead>
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
                        <TableCell className="font-mono">
                            {payment.type === 'income' ? 'Sale Order: ' : 'Purchase Order: '} 
                            {payment.orderId}
                        </TableCell>
                        <TableCell>
                            <Badge variant={payment.type === 'income' ? 'default' : 'destructive'} className={cn(payment.type === 'income' ? 'bg-green-600' : 'bg-red-600', 'text-white')}>
                                {payment.type}
                            </Badge>
                        </TableCell>
                        <TableCell className={cn("text-right", payment.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                            {payment.type === 'income' ? '+' : '-'}{currency.code} {payment.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary">{payment.method}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{payment.details}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">
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


'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { paymentsAtom, currencyAtom, saleOrdersAtom, purchaseOrdersAtom } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Payment } from '@/lib/store';
import { Input } from '@/components/ui/input';

export default function CashBookPage() {
    const [payments, setPayments] = useAtom(paymentsAtom);
    const [saleOrders, setSaleOrders] = useAtom(saleOrdersAtom);
    const [purchaseOrders, setPurchaseOrders] = useAtom(purchaseOrdersAtom);
    const [currency] = useAtom(currencyAtom);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            const [paymentsSnapshot, soSnapshot, poSnapshot] = await Promise.all([
                getDocs(collection(db, "payments")),
                getDocs(collection(db, "saleOrders")),
                getDocs(collection(db, "purchaseOrders"))
            ]);
            
            const paymentsData = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
            setPayments(paymentsData);
            
            const saleOrdersData = soSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSaleOrders(saleOrdersData as any);

            const purchaseOrdersData = poSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPurchaseOrders(purchaseOrdersData as any);

            setLoading(false);
        };
        fetchAllData();
    }, [setPayments, setSaleOrders, setPurchaseOrders]);
    
    const getNameForPayment = (payment: Payment) => {
        if (!payment.orderId) {
            return payment.description;
        }

        if (payment.type === 'income') {
            const saleOrder = saleOrders.find(so => so.id === payment.orderId);
            return saleOrder?.customer || 'N/A';
        } else { // expense
            const purchaseOrder = purchaseOrders.find(po => po.id === payment.orderId);
            return purchaseOrder?.supplierName || 'N/A';
        }
    };
    
    const filteredPayments = useMemo(() => {
        const sortedPayments = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        if (!searchTerm) {
            return sortedPayments;
        }

        return sortedPayments.filter(payment => {
            const name = getNameForPayment(payment)?.toLowerCase();
            const reference = payment.orderId?.toLowerCase() || 'ad-hoc';
            const details = payment.details?.toLowerCase();
            const lowercasedSearchTerm = searchTerm.toLowerCase();

            return (
                name.includes(lowercasedSearchTerm) ||
                reference.includes(lowercasedSearchTerm) ||
                details.includes(lowercasedSearchTerm)
            );
        });
    }, [payments, saleOrders, purchaseOrders, searchTerm]);


  return (
    <>
      <header className="flex items-center p-4 border-b">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold ml-4">Cash Book</h1>
      </header>
      <main className="p-4">
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Cash Book</CardTitle>
                    <CardDescription>
                        A record of all financial transactions, including order-related payments and other income/expenses.
                    </CardDescription>
                </div>
                 <Input
                    placeholder="Search transactions..."
                    className="w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center">
                            Loading...
                        </TableCell>
                    </TableRow>
                ) : filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell className="font-mono">
                            {payment.orderId 
                                ? payment.orderId
                                : 'Ad-hoc'
                            }
                        </TableCell>
                        <TableCell className="font-medium">{getNameForPayment(payment)}</TableCell>
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
                        <TableCell colSpan={7} className="text-center">
                            No transactions found.
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

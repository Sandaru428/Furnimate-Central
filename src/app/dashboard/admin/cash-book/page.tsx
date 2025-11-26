
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
import { useAtom } from 'jotai';
import { paymentsAtom, currencyAtom, saleOrdersAtom, purchaseOrdersAtom } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import type { Payment } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { format, parseISO, startOfDay, startOfWeek, startOfMonth, isAfter, isSameDay } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';

export default function CashBookPage() {
  const [payments, setPayments] = useAtom(paymentsAtom);
  const [saleOrders, setSaleOrders] = useAtom(saleOrdersAtom);
  const [purchaseOrders, setPurchaseOrders] = useAtom(purchaseOrdersAtom);
  const [currency] = useAtom(currencyAtom);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('all');
  const [isCustomDateDialogOpen, setIsCustomDateDialogOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [fromDateOpen, setFromDateOpen] = useState(false);
  const [toDateOpen, setToDateOpen] = useState(false);    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);

            const paymentsQuery = query(collection(db, "payments"));
            const soQuery = query(collection(db, "saleOrders"));
            const poQuery = query(collection(db, "purchaseOrders"));

            const [paymentsSnapshot, soSnapshot, poSnapshot] = await Promise.all([
                getDocs(paymentsQuery),
                getDocs(soQuery),
                getDocs(poQuery)
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
        let sortedPayments = [...payments]
            .filter(payment => payment.method?.toLowerCase() === 'cash');
        
        // Apply date filter
        const today = startOfDay(new Date());
        if (dateFilter === 'today') {
            sortedPayments = sortedPayments.filter(payment => isSameDay(parseISO(payment.date), today));
        } else if (dateFilter === 'week') {
            const weekStart = startOfWeek(today, { weekStartsOn: 1 });
            sortedPayments = sortedPayments.filter(payment => isAfter(parseISO(payment.date), weekStart) || isSameDay(parseISO(payment.date), weekStart));
        } else if (dateFilter === 'month') {
            const monthStart = startOfMonth(today);
            sortedPayments = sortedPayments.filter(payment => isAfter(parseISO(payment.date), monthStart) || isSameDay(parseISO(payment.date), monthStart));
        } else if (dateFilter === 'custom' && customDateRange.from && customDateRange.to) {
            sortedPayments = sortedPayments.filter(payment => {
                const paymentDate = startOfDay(parseISO(payment.date));
                const fromDate = startOfDay(customDateRange.from!);
                const toDate = startOfDay(customDateRange.to!);
                return (isAfter(paymentDate, fromDate) || isSameDay(paymentDate, fromDate)) &&
                       (isAfter(toDate, paymentDate) || isSameDay(paymentDate, toDate));
            });
        }
        
        sortedPayments = sortedPayments.sort((a, b) => {
            const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateCompare !== 0) return dateCompare;
            return (b.referenceNumber || '').localeCompare(a.referenceNumber || '');
        });
        
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
    }, [payments, saleOrders, purchaseOrders, searchTerm, dateFilter]);


  return (
    <>
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">Cash Book</h1>
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
                  <TableHead>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 p-0 hover:bg-transparent">
                          Date {dateFilter !== 'all' && <span className="ml-1 text-xs text-muted-foreground">({dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : dateFilter === 'month' ? 'This Month' : 'Custom'})</span>} <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setDateFilter('today')}>Today</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDateFilter('week')}>This Week</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDateFilter('month')}>This Month</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsCustomDateDialogOpen(true)}>Custom</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDateFilter('all')}>All</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableHead>
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
                        <TableCell>{format(parseISO(payment.date), 'yyyy-MM-dd')}</TableCell>
                        <TableCell className="font-mono text-xs">
                            {payment.referenceNumber || 'N/A'}
                        </TableCell>
                        <TableCell className="font-medium">{getNameForPayment(payment)}</TableCell>
                        <TableCell>
                            <Badge variant={payment.type === 'income' ? 'default' : 'destructive'} className={cn(payment.type === 'income' ? 'bg-green-600' : 'bg-red-600', 'text-white')}>
                                {payment.type}
                            </Badge>
                        </TableCell>
                        <TableCell className={cn("text-right", payment.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                            {payment.type === 'income' ? '+' : '-'}{currency.code} {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

      <Dialog open={isCustomDateDialogOpen} onOpenChange={setIsCustomDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Popover open={fromDateOpen} onOpenChange={setFromDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange.from ? format(customDateRange.from, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDateRange.from}
                    onSelect={(date) => {
                      setCustomDateRange(prev => ({ ...prev, from: date }));
                      setFromDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Popover open={toDateOpen} onOpenChange={setToDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange.to ? format(customDateRange.to, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDateRange.to}
                    onSelect={(date) => {
                      setCustomDateRange(prev => ({ ...prev, to: date }));
                      setToDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomDateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (customDateRange.from && customDateRange.to) {
                setDateFilter('custom');
                setIsCustomDateDialogOpen(false);
              }
            }}>Apply Filter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

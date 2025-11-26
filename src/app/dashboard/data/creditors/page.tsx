'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAtom } from 'jotai';
import { paymentsAtom, currencyAtom, saleOrdersAtom, purchaseOrdersAtom } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, addDoc, updateDoc, doc } from 'firebase/firestore';
import type { Payment } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { format, parseISO, startOfDay, startOfWeek, startOfMonth, isAfter, isSameDay } from 'date-fns';
import { MoreHorizontal, ChevronDown, CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { generatePaymentReferenceNumber } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const paymentSchema = z.object({
    amount: z.coerce.number().positive("Amount must be a positive number."),
    method: z.enum(['Cash', 'Card', 'Online', 'QR', 'Cheque']),
    cardLast4: z.string().optional(),
    fromBankName: z.string().optional(),
    fromAccountNumber: z.string().optional(),
    toBankName: z.string().optional(),
    toAccountNumber: z.string().optional(),
    chequeBank: z.string().optional(),
    chequeDate: z.string().optional(),
    chequeNumber: z.string().optional(),
}).refine(data => {
    if (data.method === 'Card') return !!data.cardLast4 && data.cardLast4.length === 4;
    if (data.method === 'Online') return !!data.fromBankName && !!data.fromAccountNumber && !!data.toBankName && !!data.toAccountNumber;
    if (data.method === 'Cheque') return !!data.chequeBank && !!data.chequeDate && !!data.chequeNumber;
    return true;
}, {
    message: "Please fill in all required details for the selected payment method.",
    path: ['method'], 
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function CreditorsPage() {
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
  const [toDateOpen, setToDateOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [nameFilter, setNameFilter] = useState<string>('all');
  const { toast } = useToast();    const paymentForm = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: '' as any,
            method: undefined,
            cardLast4: '',
            fromBankName: '',
            fromAccountNumber: '',
            toBankName: '',
            toAccountNumber: '',
            chequeBank: '',
            chequeDate: '',
            chequeNumber: '',
        }
    });

    const paymentMethod = paymentForm.watch('method');

    useEffect(() => {
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
    
    // Get unique supplier names from credit expense payments
    const uniqueSupplierNames = useMemo(() => {
        const creditExpensePayments = payments.filter(
            payment => payment.method?.toLowerCase() === 'credit' && payment.type === 'expense'
        );
        const names = creditExpensePayments
            .map(payment => getNameForPayment(payment))
            .filter(name => name && name !== 'N/A');
        return Array.from(new Set(names)).sort();
    }, [payments, purchaseOrders]);
    
    const filteredPayments = useMemo(() => {
        let sortedPayments = [...payments]
            .filter(payment => payment.method?.toLowerCase() === 'credit' && payment.type === 'expense');
        
        // Apply name filter
        if (nameFilter !== 'all') {
            sortedPayments = sortedPayments.filter(payment => getNameForPayment(payment) === nameFilter);
        }
        
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
    }, [payments, purchaseOrders, searchTerm, dateFilter, nameFilter]);

    const openPaymentDialog = (payment: Payment) => {
        setSelectedPayment(payment);
        const creditAmount = payment.amount;
        const paidAmount = payment.paidAmount || 0;
        const remainingAmount = creditAmount - paidAmount;
        
        paymentForm.reset({ 
            amount: remainingAmount > 0 ? remainingAmount : '' as any, 
            method: undefined,
            cardLast4: '',
            fromBankName: '',
            fromAccountNumber: '',
            toBankName: '',
            toAccountNumber: '',
            chequeBank: '',
            chequeDate: '',
            chequeNumber: '',
        });
        setIsPaymentDialogOpen(true);
    };

    async function onPaymentSubmit(values: PaymentFormValues) {
        if (!selectedPayment || !selectedPayment.id) return;

        const creditAmount = selectedPayment.amount;
        const currentPaidAmount = selectedPayment.paidAmount || 0;
        
        if (values.amount > creditAmount - currentPaidAmount) {
            toast({ 
                variant: 'destructive', 
                title: 'Invalid Amount', 
                description: `Payment exceeds remaining balance. Max payable: ${currency.code} ${(creditAmount - currentPaidAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            });
            return;
        }

        let details = '';
        switch(values.method) {
            case 'Card': details = `Card ending in ${values.cardLast4}`; break;
            case 'Online': details = `${values.fromBankName} (${values.fromAccountNumber}) to ${values.toBankName} (${values.toAccountNumber})`; break;
            case 'Cheque': details = `Cheque #${values.chequeNumber} from ${values.chequeBank}, dated ${values.chequeDate}`; break;
            default: details = 'N/A';
        }

        // Create a new payment record for the actual payment
        const referenceNumber = await generatePaymentReferenceNumber();
        const newPayment: Omit<Payment, 'id'> = {
            orderId: selectedPayment.orderId,
            description: selectedPayment.description,
            date: format(new Date(), 'yyyy-MM-dd'),
            amount: values.amount,
            method: values.method,
            details: details,
            type: selectedPayment.type,
            referenceNumber: referenceNumber,
        };

        const paymentDocRef = await addDoc(collection(db, 'payments'), newPayment);
        setPayments(prev => [{...newPayment, id: paymentDocRef.id} as Payment, ...prev]);

        // Update the credit payment's paidAmount
        const newPaidAmount = currentPaidAmount + values.amount;
        await updateDoc(doc(db, 'payments', selectedPayment.id), { paidAmount: newPaidAmount });
        
        setPayments(prev => prev.map(p => 
            p.id === selectedPayment.id 
                ? { ...p, paidAmount: newPaidAmount } 
                : p
        ));

        if (newPaidAmount >= creditAmount) {
            toast({ title: 'Payment Complete', description: `Final payment for ${selectedPayment.orderId || 'transaction'} has been recorded.` });
        } else {
            toast({ title: 'Installment Recorded', description: `Payment of ${currency.code} ${values.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} recorded.` });
        }
        setIsPaymentDialogOpen(false);
    }

    const getAmountPaid = (payment: Payment) => {
        return payment.paidAmount || 0;
    };

    const getRemainingAmount = (payment: Payment) => {
        return payment.amount - (payment.paidAmount || 0);
    };

  return (
    <>
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">Creditors</h1>
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Creditors</CardTitle>
                    <CardDescription>
                        A record of all credit transactions, including order-related payments and other income/expenses.
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
                  <TableHead>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 p-0 hover:bg-transparent">
                          Name {nameFilter !== 'all' && <span className="ml-1 text-xs text-muted-foreground">({nameFilter})</span>} <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                        {uniqueSupplierNames.map((name) => (
                          <DropdownMenuItem key={name} onClick={() => setNameFilter(name)}>
                            {name}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem onClick={() => setNameFilter('all')}>All</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Credit Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={10} className="text-center">
                            Loading...
                        </TableCell>
                    </TableRow>
                ) : filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => {
                        const amountPaid = getAmountPaid(payment);
                        const remaining = getRemainingAmount(payment);
                        return (
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
                                <TableCell className="text-right">
                                    {currency.code} {amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className={cn("text-right font-medium", remaining > 0 ? 'text-orange-600' : 'text-green-600')}>
                                    {currency.code} {remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{payment.method}</Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{payment.details}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openPaymentDialog(payment)} disabled={remaining <= 0}>
                                                Add Payment
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })
                ) : (
                    <TableRow>
                        <TableCell colSpan={10} className="text-center">
                            No credit transactions found.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
              <DialogHeader>
                  <DialogTitle>Record Payment for {selectedPayment?.orderId || 'Transaction'}</DialogTitle>
                  <CardDescription>
                      Credit Amount: {currency.code} {selectedPayment?.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | 
                      Paid: {currency.code} {selectedPayment ? getAmountPaid(selectedPayment).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} | 
                      Remaining: {currency.code} {selectedPayment ? getRemainingAmount(selectedPayment).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </CardDescription>
              </DialogHeader>
              <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="flex flex-col flex-1 overflow-hidden">
                      <ScrollArea className="flex-1 pr-6">
                          <div className="space-y-4 py-4">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField control={paymentForm.control} name="amount" render={({ field }) => <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>}/>
                                  <FormField control={paymentForm.control} name="method" render={({ field }) => <FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a payment method" /></SelectTrigger></FormControl><SelectContent>{['Cash', 'Card', 'Online', 'QR', 'Cheque'].map(method => <SelectItem key={method} value={method}>{method}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>}/>
                              </div>

                              {paymentMethod === 'Card' && (
                                  <FormField control={paymentForm.control} name="cardLast4" render={({ field }) => <FormItem><FormLabel>Last 4 Digits of Card</FormLabel><FormControl><Input placeholder="1234" maxLength={4} {...field} /></FormControl><FormMessage /></FormItem>}/>
                              )}
                              {paymentMethod === 'Online' && (
                                  <div className="space-y-4">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          <FormField control={paymentForm.control} name="fromBankName" render={({ field }) => <FormItem><FormLabel>From Bank</FormLabel><FormControl><Input placeholder="e.g. City Bank" {...field} /></FormControl><FormMessage /></FormItem>} />
                                          <FormField control={paymentForm.control} name="fromAccountNumber" render={({ field }) => <FormItem><FormLabel>From Account</FormLabel><FormControl><Input placeholder="e.g. 1234567890" {...field} /></FormControl><FormMessage /></FormItem>} />
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          <FormField control={paymentForm.control} name="toBankName" render={({ field }) => <FormItem><FormLabel>To Bank</FormLabel><FormControl><Input placeholder="e.g. Our Bank" {...field} /></FormControl><FormMessage /></FormItem>} />
                                          <FormField control={paymentForm.control} name="toAccountNumber" render={({ field }) => <FormItem><FormLabel>To Account</FormLabel><FormControl><Input placeholder="e.g. 0987654321" {...field} /></FormControl><FormMessage /></FormItem>} />
                                      </div>
                                  </div>
                              )}
                              {paymentMethod === 'Cheque' && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <FormField control={paymentForm.control} name="chequeBank" render={({ field }) => <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g. National Bank" {...field} /></FormControl><FormMessage /></FormItem>}/>
                                      <FormField control={paymentForm.control} name="chequeNumber" render={({ field }) => <FormItem><FormLabel>Cheque Number</FormLabel><FormControl><Input placeholder="e.g. 987654" {...field} /></FormControl><FormMessage /></FormItem>}/>
                                      <FormField control={paymentForm.control} name="chequeDate" render={({ field }) => <FormItem><FormLabel>Cheque Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>}/>
                                  </div>
                              )}
                          </div>
                      </ScrollArea>
                      <DialogFooter className="pt-4">
                          <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button type="submit">Record Payment</Button>
                      </DialogFooter>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>

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

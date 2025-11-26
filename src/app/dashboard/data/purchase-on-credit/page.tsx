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
import { format, parseISO } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

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

export default function PurchaseOnCreditPage() {
    const [payments, setPayments] = useAtom(paymentsAtom);
    const [saleOrders, setSaleOrders] = useAtom(saleOrdersAtom);
    const [purchaseOrders, setPurchaseOrders] = useAtom(purchaseOrdersAtom);
    const [currency] = useAtom(currencyAtom);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const { toast } = useToast();

    const paymentForm = useForm<PaymentFormValues>({
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
    
    const filteredPayments = useMemo(() => {
        const sortedPayments = [...payments]
            .filter(payment => payment.method?.toLowerCase() === 'credit')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
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
        const newPayment: Omit<Payment, 'id'> = {
            orderId: selectedPayment.orderId,
            description: selectedPayment.description,
            date: format(new Date(), 'yyyy-MM-dd'),
            amount: values.amount,
            method: values.method,
            details: details,
            type: selectedPayment.type,
        };

        const paymentDocRef = await addDoc(collection(db, 'payments'), newPayment);
        setPayments(prev => [...prev, {...newPayment, id: paymentDocRef.id} as Payment]);

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
        <h1 className="text-2xl font-bold mb-4">Purchase on Credit</h1>
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Purchase on Credit</CardTitle>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Name</TableHead>
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
    </>
  );
}

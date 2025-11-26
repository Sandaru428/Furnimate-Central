
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from '@/components/ui/input';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAtom } from 'jotai';
import { paymentsAtom, currencyAtom, Payment } from '@/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn, generatePaymentReferenceNumber } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const transactionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['income', 'expense'], { required_error: 'Transaction type is required.' }),
  description: z.string().min(1, 'Description is required.'),
  amount: z.coerce.number().positive('Amount must be a positive number.'),
  method: z.enum(['Cash', 'Card', 'Online', 'QR', 'Cheque'], { required_error: 'Payment method is required.' }),
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


type TransactionForm = z.infer<typeof transactionSchema>;

export default function IncomeExpensesPage() {
  const [payments, setPayments] = useAtom(paymentsAtom);
  const [currency] = useAtom(currencyAtom);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
        setLoading(true);
        const q = query(collection(db, "payments"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
        setPayments(data);
        setLoading(false);
    };
    fetchPayments();
  }, [setPayments]);

  const form = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: undefined,
      description: '',
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
    },
  });

  const paymentMethod = form.watch('method');

  async function onSubmit(values: TransactionForm) {
     let details = '';
        switch(values.method) {
            case 'Card':
                details = `Card ending in ${values.cardLast4}`;
                break;
            case 'Online':
                details = `From ${values.fromBankName} (${values.fromAccountNumber}) to ${values.toBankName} (${values.toAccountNumber})`;
                break;
             case 'Cheque':
                details = `${values.chequeBank} Cheque #${values.chequeNumber}, dated ${values.chequeDate}`;
                break;
            default:
                details = `Ad-hoc ${values.type}`;
        }
    
    try {
        if (editingTransaction) {
            // Update
            const updatedPayment: Partial<Payment> = {
                description: values.description,
                amount: values.amount,
                method: values.method,
                details: details,
                type: values.type,
            };
            const docRef = doc(db, 'payments', editingTransaction.id);
            await updateDoc(docRef, updatedPayment);
            setPayments(prev => prev.map(p => p.id === editingTransaction.id ? { ...p, ...updatedPayment } as Payment : p));
            toast({
                title: 'Transaction Updated',
                description: `The ${values.type} of ${currency.code} ${values.amount} has been updated.`,
            });
        } else {
            // Create
            const referenceNumber = await generatePaymentReferenceNumber();
            const newPayment: Omit<Payment, 'id'> = {
                description: values.description,
                date: format(new Date(), 'yyyy-MM-dd'),
                amount: values.amount,
                method: values.method,
                details: details,
                type: values.type,
                referenceNumber: referenceNumber,
            };
            const docRef = await addDoc(collection(db, 'payments'), newPayment);
            setPayments(prev => [{...newPayment, id: docRef.id} as Payment, ...prev]);
            toast({
                title: 'Transaction Added',
                description: `A new ${values.type} of ${currency.code} ${values.amount} has been recorded.`,
            });
        }
        form.reset();
        setEditingTransaction(null);
        setIsDialogOpen(false);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to save transaction.',
        });
    }
  }

  const openDialog = (transaction: Payment | null) => {
    if (transaction) {
        setEditingTransaction(transaction);
        
        // Parse details back into form fields based on payment method
        let parsedFields: any = {
            id: transaction.id,
            type: transaction.type,
            description: transaction.description,
            amount: transaction.amount,
            method: transaction.method,
            cardLast4: '',
            fromBankName: '',
            fromAccountNumber: '',
            toBankName: '',
            toAccountNumber: '',
            chequeBank: '',
            chequeDate: '',
            chequeNumber: '',
        };

        // Parse details string based on method
        if (transaction.method === 'Card' && transaction.details) {
            const match = transaction.details.match(/Card ending in (\d{4})/);
            if (match) parsedFields.cardLast4 = match[1];
        } else if (transaction.method === 'Online' && transaction.details) {
            const match = transaction.details.match(/From (.+?) \((.+?)\) to (.+?) \((.+?)\)/);
            if (match) {
                parsedFields.fromBankName = match[1];
                parsedFields.fromAccountNumber = match[2];
                parsedFields.toBankName = match[3];
                parsedFields.toAccountNumber = match[4];
            }
        } else if (transaction.method === 'Cheque' && transaction.details) {
            const match = transaction.details.match(/(.+?) Cheque #(.+?), dated (.+)/);
            if (match) {
                parsedFields.chequeBank = match[1];
                parsedFields.chequeNumber = match[2];
                parsedFields.chequeDate = match[3];
            }
        }

        form.reset(parsedFields);
    } else {
        setEditingTransaction(null);
        form.reset({
            type: undefined,
            description: '',
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
        });
    }
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (transactionId: string) => {
    try {
        await deleteDoc(doc(db, "payments", transactionId));
        setPayments(payments.filter(p => p.id !== transactionId));
        toast({ title: 'Transaction Deleted' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete transaction.' });
    }
  }
  
  const adHocTransactions = payments
    .filter(p => !p.orderId)
    .sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return (b.referenceNumber || '').localeCompare(a.referenceNumber || '');
    });

  return (
    <>
      <main className="p-4">
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Income & Expenses</h1>
            <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingTransaction(null); setIsDialogOpen(isOpen); }}>
                <DialogTrigger asChild>
                <Button onClick={() => openDialog(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Transaction
                </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
                    <CardDescription>{editingTransaction ? 'Update the details of this transaction.' : 'Record a miscellaneous income or expense.'}</CardDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                        <ScrollArea className="flex-1 pr-6">
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="type" render={({ field }) => <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="amount" render={({ field }) => <FormItem><FormLabel>Amount ({currency.code})</FormLabel><FormControl><Input type="number" placeholder="e.g., 50.00" {...field} /></FormControl><FormMessage /></FormItem>} />
                            </div>
                            <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g., Office electricity bill" {...field} /></FormControl><FormMessage /></FormItem>} />
                            <FormField control={form.control} name="method" render={({ field }) => <FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select method..." /></SelectTrigger></FormControl><SelectContent>{['Cash', 'Card', 'Online', 'QR', 'Cheque'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                            
                            {paymentMethod === 'Card' && (
                                <FormField control={form.control} name="cardLast4" render={({ field }) => <FormItem><FormLabel>Last 4 Digits of Card</FormLabel><FormControl><Input placeholder="1234" maxLength={4} {...field} /></FormControl><FormMessage /></FormItem>} />
                            )}
                            {paymentMethod === 'Online' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="fromBankName" render={({ field }) => <FormItem><FormLabel>From Bank</FormLabel><FormControl><Input placeholder="e.g. City Bank" {...field} /></FormControl><FormMessage /></FormItem>} />
                                        <FormField control={form.control} name="fromAccountNumber" render={({ field }) => <FormItem><FormLabel>From Account</FormLabel><FormControl><Input placeholder="e.g. 1234567890" {...field} /></FormControl><FormMessage /></FormItem>} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="toBankName" render={({ field }) => <FormItem><FormLabel>To Bank</FormLabel><FormControl><Input placeholder="e.g. Our Bank" {...field} /></FormControl><FormMessage /></FormItem>} />
                                        <FormField control={form.control} name="toAccountNumber" render={({ field }) => <FormItem><FormLabel>To Account</FormLabel><FormControl><Input placeholder="e.g. 0987654321" {...field} /></FormControl><FormMessage /></FormItem>} />
                                    </div>
                                </div>
                            )}
                            {paymentMethod === 'Cheque' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="chequeBank" render={({ field }) => <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g. National Bank" {...field} /></FormControl><FormMessage /></FormItem>} />
                                    <FormField control={form.control} name="chequeNumber" render={({ field }) => <FormItem><FormLabel>Cheque Number</FormLabel><FormControl><Input placeholder="e.g. 987654" {...field} /></FormControl><FormMessage /></FormItem>} />
                                    <FormField control={form.control} name="chequeDate" render={({ field }) => <FormItem><FormLabel>Cheque Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
                                </div>
                            )}
                        </div>
                        </ScrollArea>
                    <DialogFooter className="pt-4">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">{editingTransaction ? 'Save Changes' : 'Add Transaction'}</Button>
                    </DialogFooter>
                    </form>
                </Form>
                </DialogContent>
            </Dialog>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>A list of non-order related income and expenses.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Reference No.</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : adHocTransactions.length > 0 ? (
                            adHocTransactions.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell>{payment.date}</TableCell>
                                <TableCell className="font-mono text-xs">{payment.referenceNumber || 'N/A'}</TableCell>
                                <TableCell className="font-medium">{payment.description}</TableCell>
                                <TableCell>
                                    <Badge variant={payment.type === 'income' ? 'default' : 'destructive'} className={cn(payment.type === 'income' ? 'bg-green-600' : 'bg-red-600', 'text-white')}>
                                        {payment.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className={cn("text-right", payment.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                                    {payment.type === 'income' ? '+' : '-'}{currency.code} {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openDialog(payment)}>Edit</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(payment.id!)}>Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    No ad-hoc transactions found.
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


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
import { PlusCircle } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { useAtom } from 'jotai';
import { paymentsAtom, currencyAtom, Payment } from '@/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const transactionSchema = z.object({
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "payments"));
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

    const newPayment: Omit<Payment, 'id'> = {
      description: values.description,
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: values.amount,
      method: values.method,
      details: details,
      type: values.type,
    };
    
    try {
        const docRef = await addDoc(collection(db, 'payments'), newPayment);
        setPayments(prev => [{...newPayment, id: docRef.id}, ...prev]);
        toast({
        title: 'Transaction Added',
        description: `A new ${values.type} of ${currency.code} ${values.amount} has been recorded.`,
        });
        form.reset();
        setIsDialogOpen(false);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to add transaction.',
        });
    }
  }
  
  const adHocTransactions = payments
    .filter(p => !p.orderId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <header className="flex items-center p-4 border-b">
        <SidebarTrigger />
        <h1 className="text-xl font-semibold ml-4">Income & Expenses</h1>
      </header>
      <main className="p-4">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>A list of non-order related income and expenses.</CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Transaction
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                        <DialogHeader>
                          <DialogTitle>New Transaction</DialogTitle>
                          <CardDescription>Record a miscellaneous income or expense.</CardDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                             <ScrollArea className="flex-1 pr-6">
                                <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount ({currency.code})</FormLabel><FormControl><Input type="number" placeholder="e.g., 50.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g., Office electricity bill" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="method" render={({ field }) => (<FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select method..." /></SelectTrigger></FormControl><SelectContent>{['Cash', 'Card', 'Online', 'QR', 'Cheque'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                    
                                    {paymentMethod === 'Card' && (
                                        <FormField control={form.control} name="cardLast4" render={({ field }) => (<FormItem><FormLabel>Last 4 Digits of Card</FormLabel><FormControl><Input placeholder="1234" maxLength={4} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    )}
                                    {paymentMethod === 'Online' && (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FormField control={form.control} name="fromBankName" render={({ field }) => (<FormItem><FormLabel>From Bank</FormLabel><FormControl><Input placeholder="e.g. City Bank" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="fromAccountNumber" render={({ field }) => (<FormItem><FormLabel>From Account</FormLabel><FormControl><Input placeholder="e.g. 1234567890" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FormField control={form.control} name="toBankName" render={({ field }) => (<FormItem><FormLabel>To Bank</FormLabel><FormControl><Input placeholder="e.g. Our Bank" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="toAccountNumber" render={({ field }) => (<FormItem><FormLabel>To Account</FormLabel><FormControl><Input placeholder="e.g. 0987654321" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            </div>
                                        </>
                                    )}
                                    {paymentMethod === 'Cheque' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField control={form.control} name="chequeBank" render={({ field }) => (<FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g. National Bank" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="chequeNumber" render={({ field }) => (<FormItem><FormLabel>Cheque Number</FormLabel><FormControl><Input placeholder="e.g. 987654" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="chequeDate" render={({ field }) => (<FormItem><FormLabel>Cheque Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                    )}
                                </div>
                             </ScrollArea>
                            <DialogFooter className="pt-4">
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Add Transaction</Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow>
                                <TableCell colSpan={4} className="text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : adHocTransactions.length > 0 ? (
                            adHocTransactions.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell>{payment.date}</TableCell>
                                <TableCell className="font-medium">{payment.description}</TableCell>
                                <TableCell>
                                    <Badge variant={payment.type === 'income' ? 'default' : 'destructive'} className={cn(payment.type === 'income' ? 'bg-green-600' : 'bg-red-600', 'text-white')}>
                                        {payment.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className={cn("text-right", payment.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                                    {payment.type === 'income' ? '+' : '-'}{currency.code} {payment.amount.toFixed(2)}
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">
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

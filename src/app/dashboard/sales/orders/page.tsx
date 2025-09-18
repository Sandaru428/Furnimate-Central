
'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
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
    DropdownMenuSeparator,
  } from "@/components/ui/dropdown-menu";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Printer, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAtom } from 'jotai';
import { paymentsAtom, Payment, currencyAtom, saleOrdersAtom, useDummyDataAtom, dataSeederAtom, masterDataAtom, quotationsAtom } from '@/lib/store';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';


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
type SaleOrder = {
    id: string;
    customer: string;
    date: string;
    amount: number;
    status: 'Processing' | 'Paid' | 'Shipped';
    quotationId: string;
};


export default function SaleOrdersPage() {
    const [orders, setOrders] = useAtom(saleOrdersAtom);
    const [quotations] = useAtom(quotationsAtom);
    const [masterData] = useAtom(masterDataAtom);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null);
    const [payments, setPayments] = useAtom(paymentsAtom);
    const { toast } = useToast();
    const [currency] = useAtom(currencyAtom);

    const [useDummyData] = useAtom(useDummyDataAtom);
    const [, seedData] = useAtom(dataSeederAtom);
    
    const printRef = useRef(null);
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Sale Order ${selectedOrder?.id}`,
    });

    const prepareAndPrint = (order: SaleOrder) => {
        setSelectedOrder(order);
        setTimeout(() => {
            handlePrint();
        }, 100);
    };

    useEffect(() => {
        seedData(useDummyData);
    }, [useDummyData, seedData]);


    const form = useForm<PaymentFormValues>({
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

    const paymentMethod = form.watch('method');
    
    const amountPaid = selectedOrder ? payments.filter(p => p.orderId === selectedOrder.id).reduce((acc, p) => acc + p.amount, 0) : 0;
    const remainingAmount = selectedOrder ? selectedOrder.amount - amountPaid : 0;


    useEffect(() => {
        if (typeof window !== 'undefined') {
            const convertedOrder = localStorage.getItem('convertedOrder');
            if (convertedOrder) {
                const newOrder = JSON.parse(convertedOrder);
                if (!orders.some(o => o.id === newOrder.id)) {
                    setOrders(prevOrders => [newOrder, ...prevOrders]);
                }
                localStorage.removeItem('convertedOrder');
            }
        }
    }, [orders, setOrders]);

    const openPaymentDialog = (order: SaleOrder) => {
        setSelectedOrder(order);
        const currentAmountPaid = payments.filter(p => p.orderId === order.id).reduce((acc, p) => acc + p.amount, 0);
        const currentRemainingAmount = order.amount - currentAmountPaid;
        form.reset({ 
            amount: currentRemainingAmount > 0 ? currentRemainingAmount : '' as any, 
            method: undefined, 
            cardLast4: '', 
            fromBankName: '',
            fromAccountNumber: '',
            toBankName: '',
            toAccountNumber: '',
            chequeBank: '', 
            chequeDate: '', 
            chequeNumber: '' 
        });
        setIsPaymentDialogOpen(true);
    };

    function onPaymentSubmit(values: PaymentFormValues) {
        if (!selectedOrder) return;

        const currentAmountPaid = payments.filter(p => p.orderId === selectedOrder.id).reduce((acc, p) => acc + p.amount, 0);
        
        if (values.amount > selectedOrder.amount - currentAmountPaid) {
            toast({
                variant: 'destructive',
                title: 'Invalid Amount',
                description: `Payment exceeds remaining balance. Max payable: ${currency.code} ${(selectedOrder.amount - currentAmountPaid).toFixed(2)}`,
            });
            return;
        }

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
                details = 'N/A';
        }

        const newPayment: Payment = {
            id: Date.now().toString(),
            orderId: selectedOrder.id,
            date: format(new Date(), 'yyyy-MM-dd'),
            amount: values.amount,
            method: values.method,
            details: details,
            type: 'income',
        };

        setPayments(prev => [...prev, newPayment]);

        const totalPaid = currentAmountPaid + newPayment.amount;

        if (totalPaid >= selectedOrder.amount) {
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'Paid' } : o));
             toast({
                title: 'Payment Complete',
                description: `Final payment for sale order ${selectedOrder.id} has been recorded.`
            });
        } else {
             toast({
                title: 'Installment Recorded',
                description: `Payment of ${currency.code} ${values.amount.toFixed(2)} for sale order ${selectedOrder.id} recorded.`
            });
        }

        setIsPaymentDialogOpen(false);
    }

    const handleShare = async (order: SaleOrder) => {
        const url = window.location.href;
        const shareData = {
            title: `Sale Order ${order.id}`,
            text: `Check out this sale order for ${order.customer} for a total of ${currency.code} ${order.amount.toFixed(2)}.`,
            url: url,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text} \n${shareData.url}`);
                toast({
                    title: 'Link Copied!',
                    description: 'Sale order link copied to clipboard.',
                });
            }
        } catch (error) {
            console.error('Error sharing:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not share or copy the content.',
            });
        }
    };
    
    const sortedOrders = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  return (
    <>
      <div className="hidden">
        <PrintableSO ref={printRef} order={selectedOrder} quotations={quotations} masterData={masterData} currency={currency} />
      </div>
      <header className="flex items-center p-4 border-b">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold ml-4">Sale Orders</h1>
      </header>
      <main className="p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Confirmed Sale Orders</CardTitle>
                    <CardDescription>
                        These are quotations that have been converted into sale orders.
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Sale Order ID</TableHead>
                  <TableHead>Original Quotation</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.length > 0 ? (
                    sortedOrders.map((order) => (
                    <TableRow key={order.id}>
                        <TableCell>{order.date}</TableCell>
                        <TableCell className="font-mono">{order.id}</TableCell>
                        <TableCell className="font-mono">{order.quotationId}</TableCell>
                        <TableCell className="font-medium">{order.customer}</TableCell>
                        <TableCell className="text-right">{currency.code} {order.amount.toFixed(2)}</TableCell>
                        <TableCell>
                            <Badge variant={order.status === 'Paid' ? 'outline' : 'default'}>{order.status}</Badge>
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
                                <DropdownMenuItem onClick={() => openPaymentDialog(order)} disabled={order.status === 'Paid'}>
                                    Add Payment
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => prepareAndPrint(order)}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    <span>Print</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare(order)}>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    <span>Share</span>
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center">
                            No converted sale orders yet. Enable dummy data in the dashboard's development tab to see sample entries.
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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Record Payment for {selectedOrder?.id}</DialogTitle>
                    <CardDescription>
                        Total: {currency.code} {selectedOrder?.amount.toFixed(2)} | Paid: {currency.code} {amountPaid.toFixed(2)} | Remaining: {currency.code} {remainingAmount.toFixed(2)}
                    </CardDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onPaymentSubmit)} className="space-y-4 py-4">
                       <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="method"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Payment Method</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a payment method" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {['Cash', 'Card', 'Online', 'QR', 'Cheque'].map(method => (
                                            <SelectItem key={method} value={method}>
                                                {method}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        {paymentMethod === 'Card' && (
                            <FormField
                                control={form.control}
                                name="cardLast4"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last 4 Digits of Card</FormLabel>
                                        <FormControl>
                                            <Input placeholder="1234" maxLength={4} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        {paymentMethod === 'Online' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <h4 className="font-medium text-sm">From</h4>
                                    <FormField control={form.control} name="fromBankName" render={({ field }) => ( <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g. City Bank" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="fromAccountNumber" render={({ field }) => ( <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="e.g. 1234567890" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                     <h4 className="font-medium text-sm">To</h4>
                                     <FormField control={form.control} name="toBankName" render={({ field }) => ( <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g. Our Bank" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                     <FormField control={form.control} name="toAccountNumber" render={({ field }) => ( <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="e.g. 0987654321" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </div>
                        )}
                        {paymentMethod === 'Cheque' && (
                             <div className="space-y-4">
                                <FormField
                                     control={form.control}
                                     name="chequeBank"
                                     render={({ field }) => (
                                         <FormItem>
                                             <FormLabel>Bank Name</FormLabel>
                                             <FormControl>
                                                 <Input placeholder="e.g. National Bank" {...field} />
                                             </FormControl>
                                             <FormMessage />
                                         </FormItem>
                                     )}
                                 />
                                  <FormField
                                     control={form.control}
                                     name="chequeNumber"
                                     render={({ field }) => (
                                         <FormItem>
                                             <FormLabel>Cheque Number</FormLabel>
                                             <FormControl>
                                                 <Input placeholder="e.g. 987654" {...field} />
                                             </FormControl>
                                             <FormMessage />
                                         </FormItem>
                                     )}
                                 />
                                  <FormField
                                     control={form.control}
                                     name="chequeDate"
                                     render={({ field }) => (
                                         <FormItem>
                                             <FormLabel>Cheque Date</FormLabel>
                                             <FormControl>
                                                 <Input type="date" {...field} />
                                             </FormControl>
                                             <FormMessage />
                                         </FormItem>
                                     )}
                                 />
                             </div>
                        )}


                        <DialogFooter>
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

// Component for printing - hidden from view
const PrintableSO = React.forwardRef<HTMLDivElement, { order: SaleOrder | null, quotations: any[], masterData: any[], currency: any }>(({ order, quotations, masterData, currency }, ref) => {
    if (!order) return null;
  
    const originalQuotation = quotations.find(q => q.id === order.quotationId);
  
    return (
      <div ref={ref} className="p-8">
        <h1 className="text-2xl font-bold mb-4">Sale Order: {order.id}</h1>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <p><strong>Customer:</strong> {order.customer}</p>
            <p><strong>Date:</strong> {order.date}</p>
            <p><strong>Original Quotation:</strong> {order.quotationId}</p>
          </div>
          <div className="text-right">
            <p><strong>Status:</strong> {order.status}</p>
          </div>
        </div>
        
        {originalQuotation && (
          <>
            <h2 className="text-lg font-semibold mb-2">Line Items</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {originalQuotation.lineItems.map((item: any) => {
                  const itemDetails = masterData.find(md => md.itemCode === item.itemId);
                  return (
                    <TableRow key={item.itemId}>
                      <TableCell>{itemDetails?.name || item.itemId}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{currency.code} {item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{currency.code} {item.totalValue.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        )}
  
        <div className="text-right mt-4 text-xl font-bold">
            Total Amount: {currency.code} {order.amount.toFixed(2)}
        </div>
      </div>
    );
  });
PrintableSO.displayName = "PrintableSO";

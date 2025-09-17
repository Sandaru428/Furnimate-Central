
'use client';

import { useState, useEffect } from 'react';
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
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAtom } from 'jotai';
import { paymentsAtom } from '@/lib/store';
import { format } from 'date-fns';

const paymentSchema = z.object({
    amount: z.coerce.number().positive("Amount must be a positive number."),
    method: z.enum(['Cash', 'Card', 'Online', 'QR', 'Cheque']),
    cardLast4: z.string().optional(),
    onlineBank: z.string().optional(),
    onlineAccount: z.string().optional(),
    chequeBank: z.string().optional(),
    chequeDate: z.string().optional(),
    chequeNumber: z.string().optional(),
}).refine(data => {
    if (data.method === 'Card') return !!data.cardLast4 && data.cardLast4.length === 4;
    if (data.method === 'Online') return !!data.onlineBank && !!data.onlineAccount;
    if (data.method === 'Cheque') return !!data.chequeBank && !!data.chequeDate && !!data.chequeNumber;
    return true;
}, {
    message: "Please fill in the required details for the selected payment method.",
    path: ['method'], // This path can be adjusted to point to a more specific field if needed
});

type PaymentFormValues = z.infer<typeof paymentSchema>;
type Order = {
    id: string;
    customer: string;
    date: string;
    amount: number;
    status: 'Processing' | 'Paid' | 'Shipped';
    quotationId: string;
};


const initialOrders: Order[] = [
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
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [, setPayments] = useAtom(paymentsAtom);
    const { toast } = useToast();

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: '' as any,
        }
    });

    const paymentMethod = form.watch('method');

    useEffect(() => {
        const convertedOrder = localStorage.getItem('convertedOrder');
        if (convertedOrder) {
            const newOrder = JSON.parse(convertedOrder);
            if (!orders.some(o => o.id === newOrder.id)) {
                setOrders(prevOrders => [newOrder, ...prevOrders]);
            }
            localStorage.removeItem('convertedOrder');
        }
    }, [orders]);

    const openPaymentDialog = (order: Order) => {
        setSelectedOrder(order);
        form.reset({ amount: order.amount, method: undefined });
        setIsPaymentDialogOpen(true);
    };

    function onPaymentSubmit(values: PaymentFormValues) {
        if (!selectedOrder) return;

        let details = '';
        switch(values.method) {
            case 'Card':
                details = `Card ending in ${values.cardLast4}`;
                break;
            case 'Online':
                details = `From ${values.onlineBank} (Acc: ${values.onlineAccount})`;
                break;
             case 'Cheque':
                details = `${values.chequeBank} Cheque #${values.chequeNumber}, dated ${values.chequeDate}`;
                break;
            default:
                details = 'N/A';
        }

        // Add to payments log
        setPayments(prev => [...prev, {
            id: Date.now().toString(),
            orderId: selectedOrder.id,
            date: format(new Date(), 'yyyy-MM-dd'),
            amount: values.amount,
            method: values.method,
            details: details
        }]);

        // Update order status
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'Paid' } : o));

        toast({
            title: 'Payment Recorded',
            description: `Payment for order ${selectedOrder.id} has been successfully recorded.`
        });
        setIsPaymentDialogOpen(false);
    }


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
                These are quotations that have been converted into orders.
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
                  <TableHead className="w-[50px]"></TableHead>
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
                                <DropdownMenuItem onClick={() => openPaymentDialog(order)} disabled={order.status !== 'Processing'}>
                                    Add Payment
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center">
                            No converted orders yet.
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Record Payment for {selectedOrder?.id}</DialogTitle>
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
                            <div className="space-y-4">
                               <FormField
                                    control={form.control}
                                    name="onlineBank"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bank Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. City Bank" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="onlineAccount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 1234567890" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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

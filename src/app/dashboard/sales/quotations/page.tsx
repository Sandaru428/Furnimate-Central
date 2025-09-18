
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
    DropdownMenuSeparator,
  } from "@/components/ui/dropdown-menu"
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
import { MoreHorizontal, PlusCircle, Trash2, Share2, Printer } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/componentsui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAtom } from 'jotai';
import { currencyAtom, masterDataAtom, customersAtom, quotationsAtom, useDummyDataAtom, dataSeederAtom } from '@/lib/store';
import type { MasterDataItem } from '../../data/master-data/page';

const lineItemSchema = z.object({
  itemId: z.string().min(1, "Item is required."),
  quantity: z.coerce.number().int().positive("Quantity must be a positive integer."),
  unitPrice: z.coerce.number(),
  totalValue: z.coerce.number(),
});

const quotationSchema = z.object({
    id: z.string(),
    customer: z.string().min(1, "Customer name is required"),
    date: z.string(),
    amount: z.coerce.number().min(0, "Amount must be a non-negative number"),
    status: z.enum(['Draft', 'Sent', 'Approved', 'Rejected', 'Converted']),
    lineItems: z.array(lineItemSchema),
});

const createQuotationSchema = z.object({
    customer: z.string().min(1, "Customer name is required"),
    lineItems: z.array(lineItemSchema).min(1, "Please add at least one item."),
});


type Quotation = z.infer<typeof quotationSchema>;
type CreateQuotation = z.infer<typeof createQuotationSchema>;

const statusVariant: {[key: string]: "default" | "secondary" | "destructive" | "outline"} = {
    'Sent': 'default',
    'Draft': 'secondary',
    'Approved': 'outline', 
    'Rejected': 'destructive',
    'Converted': 'default'
}

const AddItemForm = ({ masterData, onAddItem }: { masterData: MasterDataItem[], onAddItem: (item: z.infer<typeof lineItemSchema>) => void }) => {
    const [selectedItemCode, setSelectedItemCode] = useState('');
    const [quantity, setQuantity] = useState<number | ''>('');
    const item = masterData.find(i => i.itemCode === selectedItemCode);

    const handleAddItem = () => {
        const numQuantity = Number(quantity);
        if (item && numQuantity > 0) {
            onAddItem({
                itemId: item.itemCode,
                quantity: numQuantity,
                unitPrice: item.unitPrice,
                totalValue: item.unitPrice * numQuantity,
            });
            setSelectedItemCode('');
            setQuantity('');
        }
    }

    return (
        <div className="flex items-end gap-2 p-2 border rounded-lg">
            <div className="flex-1">
                <Label htmlFor="item-select">Finished Good</Label>
                 <Select value={selectedItemCode} onValueChange={setSelectedItemCode}>
                    <SelectTrigger id="item-select">
                        <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                        {masterData.filter(i => i.type === 'Finished Good').map(item => (
                            <SelectItem key={item.itemCode} value={item.itemCode}>
                                {item.name} ({item.itemCode})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="w-24">
                <Label htmlFor="item-quantity">Quantity</Label>
                <Input
                    id="item-quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value))}
                    min="1"
                    placeholder="1"
                />
            </div>
            <Button type="button" onClick={handleAddItem} disabled={!item || !quantity}>Add</Button>
        </div>
    );
};


export default function QuotationsPage() {
    const [quotations, setQuotations] = useAtom(quotationsAtom);
    const [masterData] = useAtom(masterDataAtom);
    const [customers] = useAtom(customersAtom);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const [currency] = useAtom(currencyAtom);

    const [useDummyData] = useAtom(useDummyDataAtom);
    const [, seedData] = useAtom(dataSeederAtom);

    useEffect(() => {
        seedData(useDummyData);
    }, [useDummyData, seedData]);


    const form = useForm<CreateQuotation>({
        resolver: zodResolver(createQuotationSchema),
        defaultValues: {
          customer: '',
          lineItems: [],
        },
    });

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "lineItems",
    });

    const totalAmount = form.watch('lineItems').reduce((acc, item) => acc + item.totalValue, 0);


    function onSubmit(values: CreateQuotation) {
        try {
             const totalAmount = values.lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
            
             if (editingQuotation) {
                // Update
                const updatedQuotation: Quotation = {
                    ...editingQuotation,
                    ...values,
                    amount: totalAmount,
                    status: 'Draft',
                };
                setQuotations(quotations.map(q => q.id === editingQuotation.id ? updatedQuotation : q));
                toast({
                    title: 'Quotation Updated',
                    description: `Quotation ${editingQuotation.id} has been updated.`
                });
             } else {
                // Create
                const nextId = quotations.length > 0 ? Math.max(...quotations.map(q => parseInt(q.id.split('-')[1]))) + 1 : 1;
                const newQuotation: Quotation = {
                    id: `QUO-${String(nextId).padStart(3, '0')}`,
                    customer: values.customer,
                    date: format(new Date(), 'yyyy-MM-dd'),
                    status: 'Draft',
                    lineItems: values.lineItems,
                    amount: totalAmount,
                };
    
                setQuotations([newQuotation, ...quotations]);
                toast({
                  title: 'Quotation Created',
                  description: `Quotation ${newQuotation.id} has been saved as a draft.`,
                });
             }
            
            form.reset({ customer: '', lineItems: [] });
            remove(); // clear all items
            setIsDialogOpen(false);
            setEditingQuotation(null);

        } catch (error: any) {
             toast({
                variant: "destructive",
                title: 'Error Saving Quotation',
                description: error.message,
            });
        }
    }

    const openCreateOrEditDialog = (quote: Quotation | null) => {
        if (quote) {
            setEditingQuotation(quote);
            form.reset({
                customer: quote.customer,
                lineItems: quote.lineItems,
            });
            replace(quote.lineItems);
        } else {
            setEditingQuotation(null);
            form.reset({ customer: '', lineItems: [] });
            remove();
        }
        setIsDialogOpen(true);
    };

    const handleStatusChange = (quotationId: string, newStatus: Quotation['status']) => {
        setQuotations(quotations.map(q =>
            q.id === quotationId ? { ...q, status: newStatus } : q
        ));
        toast({
            title: 'Status Updated',
            description: `Quotation ${quotationId} has been marked as ${newStatus}.`
        });
    };

    const handleDelete = (quotationId: string) => {
        setQuotations(quotations.filter(q => q.id !== quotationId));
        toast({
            title: 'Quotation Deleted',
            description: `Quotation ${quotationId} has been removed.`,
        });
    };
    
    const handleConvertToOrder = (quotationId: string) => {
        const quotation = quotations.find(q => q.id === quotationId);
        if (!quotation) return;

        // Stock check logic
        let insufficientStock = false;
        quotation.lineItems.forEach(item => {
            const masterItem = masterData.find(mi => mi.itemCode === item.itemId);
            if (!masterItem || masterItem.stockLevel < item.quantity) {
                insufficientStock = true;
                toast({
                    variant: "destructive",
                    title: 'Stock Unavailable',
                    description: `Not enough stock for ${item.itemId}. Required: ${item.quantity}, Available: ${masterItem?.stockLevel || 0}`,
                });
            }
        });

        if (insufficientStock) {
            return; // Stop conversion if any item has insufficient stock
        }

        // Create the new order object
        const newOrder = {
            id: `ORD-${quotation.id.split('-')[1]}`,
            quotationId: quotation.id,
            customer: quotation.customer,
            date: format(new Date(), 'yyyy-MM-dd'),
            amount: quotation.amount,
            status: 'Processing',
        };
        
        // Use local storage to pass the new order to the orders page
        if (typeof window !== 'undefined') {
            localStorage.setItem('convertedOrder', JSON.stringify(newOrder));
        }

        // Update the quotation status to 'Converted'
        setQuotations(quotations.map(q => 
            q.id === quotationId ? { ...q, status: 'Converted' } : q
        ));

        toast({
            title: 'Quotation Converted to Sale Order',
            description: `Stock checked and available. Sale Order created from ${quotationId}.`,
        });

        // Navigate to orders page
        router.push('/dashboard/sales/orders');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Quotations',
            text: 'Here is the list of quotations.',
            url: window.location.href,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Not Supported',
                    description: 'Web Share API is not supported in your browser.',
                });
            }
        } catch (error) {
            console.error('Error sharing:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not share the content.',
            });
        }
    };
    
    const sortedQuotations = [...quotations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  return (
    <>
      <header className="flex items-center p-4 border-b">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold ml-4">Quotations</h1>
      </header>
      <main className="p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Quotations</CardTitle>
                    <CardDescription>
                    Create and manage sales quotations for your customers.
                    </CardDescription>
                </div>
                <div className='flex items-center gap-2'>
                    <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            form.reset();
                            remove();
                            setEditingQuotation(null);
                        }
                        setIsDialogOpen(isOpen);
                    }}>
                        <DialogTrigger asChild>
                            <Button onClick={() => openCreateOrEditDialog(null)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create New Quotation
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{editingQuotation ? `Edit Quotation ${editingQuotation.id}` : 'Create New Quotation'}</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                    <FormField
                                        control={form.control}
                                        name="customer"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Customer</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a customer" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {customers.map(customer => (
                                                        <SelectItem key={customer.id} value={customer.name}>
                                                            {customer.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div>
                                        <FormLabel>Line Items</FormLabel>
                                        <div className="space-y-2 mt-2">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Item</TableHead>
                                                        <TableHead className="w-20">Qty</TableHead>
                                                        <TableHead className="w-28 text-right">Unit Price</TableHead>
                                                        <TableHead className="w-28 text-right">Total</TableHead>
                                                        <TableHead className="w-10"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {fields.map((field, index) => {
                                                        const itemDetails = masterData.find(i => i.itemCode === field.itemId);
                                                        return (
                                                        <TableRow key={field.id}>
                                                            <TableCell className="font-medium">{itemDetails?.name || field.itemId}</TableCell>
                                                            <TableCell>{field.quantity}</TableCell>
                                                            <TableCell className="text-right">{currency.code} {field.unitPrice.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right">{currency.code} {field.totalValue.toFixed(2)}</TableCell>
                                                            <TableCell>
                                                                <Button variant="ghost" size="icon" type="button" onClick={() => remove(index)}>
                                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )})}
                                                </TableBody>
                                            </Table>
                                            {fields.length === 0 && (
                                                <p className="text-sm text-muted-foreground text-center p-4">No items added yet.</p>
                                            )}
                                            <FormMessage>{form.formState.errors.lineItems?.root?.message || form.formState.errors.lineItems?.message}</FormMessage>
                                        </div>
                                    </div>
                                    
                                    <AddItemForm masterData={masterData} onAddItem={append} />

                                    <DialogFooter>
                                        <div className='w-full flex justify-between items-center'>
                                            <div className="text-lg font-semibold">
                                                Total: {currency.code} {totalAmount.toFixed(2)}
                                            </div>
                                            <div className="flex gap-2">
                                                <DialogClose asChild>
                                                    <Button variant="outline" type="button">Cancel</Button></DialogClose>
                                                <Button type="submit">{editingQuotation ? 'Save Changes' : 'Create Quotation'}</Button>
                                            </div>
                                        </div>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                <span>Print</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleShare}>
                                <Share2 className="mr-2 h-4 w-4" />
                                <span>Share</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedQuotations.length > 0 ? (
                    sortedQuotations.map((quote) => (
                    <TableRow key={quote.id}>
                        <TableCell className="font-mono">{quote.id}</TableCell>
                        <TableCell className="font-medium">{quote.customer}</TableCell>
                        <TableCell>{quote.date}</TableCell>
                        <TableCell className="text-right">{currency.code} {quote.amount.toFixed(2)}</TableCell>
                        <TableCell>
                        <Badge 
                            variant={statusVariant[quote.status] || 'secondary'}
                            className={quote.status === 'Converted' ? 'bg-green-600 text-white' : ''}
                        >
                            {quote.status}
                        </Badge>
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
                                    {quote.status === 'Draft' && (
                                        <>
                                            <DropdownMenuItem onClick={() => openCreateOrEditDialog(quote)}>
                                                View/Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'Sent')}>
                                                Mark as Sent
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    {quote.status === 'Sent' && (
                                        <>
                                            <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'Approved')}>
                                                Approve
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'Rejected')} className="text-destructive">
                                                Reject
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    {quote.status === 'Approved' && (
                                        <DropdownMenuItem onClick={() => handleConvertToOrder(quote.id)}>
                                            Convert to Sale Order
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        className="text-destructive" 
                                        onClick={() => handleDelete(quote.id)}
                                        disabled={!['Draft', 'Rejected'].includes(quote.status)}
                                    >
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">
                           No quotations found. Enable dummy data in the dashboard's development tab to see sample entries.
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

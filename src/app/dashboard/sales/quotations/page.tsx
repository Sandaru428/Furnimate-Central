
'use client';

import { useState } from 'react';
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
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { initialMasterData } from '@/app/dashboard/data/master-data/page';
import { initialCustomers } from '@/app/dashboard/data/customers/page';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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

const initialQuotations: Quotation[] = [
  {
    id: 'QUO-001',
    customer: 'Modern Designs LLC',
    date: '2024-05-01',
    amount: 1250.00,
    status: 'Sent',
    lineItems: [{ itemId: 'WD-001', quantity: 50, unitPrice: 25, totalValue: 1250 }],
  },
  {
    id: 'QUO-002',
    customer: 'Home Comforts',
    date: '2024-05-03',
    amount: 852.50,
    status: 'Draft',
    lineItems: [{ itemId: 'FBR-003', quantity: 55, unitPrice: 15.50, totalValue: 852.50 }],
  },
  {
    id: 'QUO-003',
    customer: 'Emily Davis',
    date: '2024-05-05',
    amount: 2320.00,
    status: 'Approved',
    lineItems: [
        { itemId: 'MTL-002', quantity: 40, unitPrice: 55, totalValue: 2200 }, 
        { itemId: 'FNS-010', quantity: 10, unitPrice: 12, totalValue: 120 }
    ],
  },
];

const statusVariant: {[key: string]: "default" | "secondary" | "destructive" | "outline"} = {
    'Sent': 'default',
    'Draft': 'secondary',
    'Approved': 'outline', 
    'Rejected': 'destructive',
    'Converted': 'default'
}

const AddItemForm = ({ onAddItem }: { onAddItem: (item: z.infer<typeof lineItemSchema>) => void }) => {
    const [selectedItemCode, setSelectedItemCode] = useState('');
    const [quantity, setQuantity] = useState<number | ''>('');
    const item = initialMasterData.find(i => i.itemCode === selectedItemCode);

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
                        {initialMasterData.map(item => (
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
    const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
    const { toast } = useToast();
    const router = useRouter();

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
            
            form.reset();
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
            });
            replace(quote.lineItems);
        } else {
            setEditingQuotation(null);
            form.reset({ customer: '', lineItems: [] });
            remove();
        }
        setIsDialogOpen(true);
    };
    
    const handleConvertToOrder = (quotationId: string) => {
        const quotation = quotations.find(q => q.id === quotationId);
        if (!quotation) return;

        // Stock check logic
        let insufficientStock = false;
        quotation.lineItems.forEach(item => {
            const masterItem = initialMasterData.find(mi => mi.itemCode === item.itemId);
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
        localStorage.setItem('convertedOrder', JSON.stringify(newOrder));

        // Update the quotation status to 'Converted'
        setQuotations(quotations.map(q => 
            q.id === quotationId ? { ...q, status: 'Converted' } : q
        ));

        toast({
            title: 'Quotation Converted to Order',
            description: `Stock checked and available. Order created from ${quotationId}.`,
        });

        // Navigate to orders page
        router.push('/dashboard/sales/orders');
    };


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
                                                {initialCustomers.map(customer => (
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
                                                    const itemDetails = initialMasterData.find(i => i.itemCode === field.itemId);
                                                    return (
                                                    <TableRow key={field.id}>
                                                        <TableCell className="font-medium">{itemDetails?.name || field.itemId}</TableCell>
                                                        <TableCell>{field.quantity}</TableCell>
                                                        <TableCell className="text-right">${field.unitPrice.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right">${field.totalValue.toFixed(2)}</TableCell>
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
                                
                                <AddItemForm onAddItem={append} />

                                <DialogFooter>
                                    <div className='w-full flex justify-between items-center'>
                                        <div className="text-lg font-semibold">
                                            Total: ${totalAmount.toFixed(2)}
                                        </div>
                                        <div className="flex gap-2">
                                            <DialogClose asChild>
                                                <Button variant="outline" type="button">Cancel</Button>
                                            </DialogClose>
                                             <Button type="submit">{editingQuotation ? 'Save Changes' : 'Create Quotation'}</Button>
                                        </div>
                                    </div>
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
                  <TableHead>Quotation ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono">{quote.id}</TableCell>
                    <TableCell className="font-medium">{quote.customer}</TableCell>
                    <TableCell>{quote.date}</TableCell>
                    <TableCell className="text-right">${quote.amount.toFixed(2)}</TableCell>
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
                            <DropdownMenuItem 
                                onClick={() => openCreateOrEditDialog(quote)}
                                disabled={quote.status !== 'Draft'}
                            >
                                View/Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => handleConvertToOrder(quote.id)}
                                disabled={quote.status !== 'Approved'}
                            >
                                Convert to Order
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

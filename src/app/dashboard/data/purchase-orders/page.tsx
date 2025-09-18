
'use client';

import * as React from 'react';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAtom } from 'jotai';
import { 
    paymentsAtom, 
    Payment, 
    currencyAtom,
    purchaseOrdersAtom,
    masterDataAtom,
    suppliersAtom,
    useDummyDataAtom,
    dataSeederAtom,
    companyProfileAtom,
} from '@/lib/store';
import type { MasterDataItem } from '../master-data/page';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from '@/components/icons/logo';


const lineItemSchema = z.object({
  itemId: z.string().min(1, "Item selection is required."),
  quantity: z.coerce.number().int().positive("Quantity must be a positive number."),
  unitPrice: z.coerce.number().optional(), // Now optional at creation
  totalValue: z.coerce.number().optional(), // Now optional at creation
});

const purchaseOrderSchema = z.object({
    id: z.string(),
    supplierName: z.string(),
    date: z.string(),
    totalAmount: z.coerce.number(),
    status: z.enum(['Draft', 'Sent', 'Fulfilled', 'Paid']),
    lineItems: z.array(lineItemSchema),
});

const createQuotationSchema = z.object({
    supplierName: z.string().min(1, "Please select a supplier."),
    lineItems: z.array(lineItemSchema.omit({ unitPrice: true, totalValue: true })).min(1, "Please add at least one item."),
});

const receiveItemsSchema = z.object({
  lineItems: z.array(z.object({
    itemId: z.string(),
    quantity: z.number(),
    unitPrice: z.coerce.number().positive("Unit price must be a positive number."),
    totalValue: z.number(),
  }))
});

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


type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;
type CreatePurchaseOrder = z.infer<typeof createQuotationSchema>;
type ReceiveItemsForm = z.infer<typeof receiveItemsSchema>;
type PaymentFormValues = z.infer<typeof paymentSchema>;

const AddItemForm = ({ masterData, onAddItem }: { masterData: MasterDataItem[], onAddItem: (item: Omit<z.infer<typeof lineItemSchema>, 'unitPrice' | 'totalValue'>) => void }) => {
    const [selectedItemCode, setSelectedItemCode] = useState('');
    const [quantity, setQuantity] = useState<number | ''>('');
    const item = masterData.find(i => i.itemCode === selectedItemCode);

    const handleAddItem = () => {
        const numQuantity = Number(quantity);
        if (item && numQuantity > 0) {
            onAddItem({
                itemId: item.itemCode,
                quantity: numQuantity,
            });
            setSelectedItemCode('');
            setQuantity('');
        }
    }

    return (
        <div className="flex items-end gap-2 p-2 border rounded-lg">
            <div className="flex-1">
                <Label htmlFor="item-select">Raw Material</Label>
                 <Select value={selectedItemCode} onValueChange={setSelectedItemCode}>
                    <SelectTrigger id="item-select">
                        <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                        {masterData.map(item => (
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


export default function PurchaseOrdersPage() {
    const [purchaseOrders, setPurchaseOrders] = useAtom(purchaseOrdersAtom);
    const [masterData, setMasterData] = useAtom(masterDataAtom);
    const [suppliers] = useAtom(suppliersAtom);
    const [payments, setPayments] = useAtom(paymentsAtom);
    const [companyProfile] = useAtom(companyProfileAtom);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [poToPrint, setPoToPrint] = useState<PurchaseOrder | null>(null);
    const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    const [currency] = useAtom(currencyAtom);

    const [useDummyData] = useAtom(useDummyDataAtom);
    const [, seedData] = useAtom(dataSeederAtom);

    useEffect(() => {
        seedData(useDummyData);
    }, [useDummyData, seedData]);
    
    useEffect(() => {
        if (poToPrint) {
            window.print();
            setPoToPrint(null);
        }
    }, [poToPrint]);
    
    const handlePrint = (po: PurchaseOrder) => {
        setPoToPrint(po);
    };

    const createForm = useForm<CreatePurchaseOrder>({
        resolver: zodResolver(createQuotationSchema),
        defaultValues: {
          supplierName: '',
          lineItems: [],
        },
    });

    const receiveForm = useForm<ReceiveItemsForm>({
        resolver: zodResolver(receiveItemsSchema),
        defaultValues: {
            lineItems: []
        }
    });

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

    const { fields: createFields, append: createAppend, remove: createRemove, replace: createReplace } = useFieldArray({
        control: createForm.control,
        name: "lineItems",
    });

     const { fields: receiveFields } = useFieldArray({
        control: receiveForm.control,
        name: "lineItems",
    });
    
    const paymentMethod = paymentForm.watch('method');
    const amountPaid = selectedPO ? payments.filter(p => p.orderId === selectedPO.id).reduce((acc, p) => acc + p.amount, 0) : 0;
    const remainingAmount = selectedPO ? selectedPO.totalAmount - amountPaid : 0;


    function handleCreateOrUpdateSubmit(values: CreatePurchaseOrder) {
        if (editingPO) {
            // Update logic, no price calculation here as it's done on fulfillment
            const updatedLineItems = values.lineItems.map(item => ({...item, unitPrice: undefined, totalValue: undefined }));

            setPurchaseOrders(prevPOs => prevPOs.map(po => 
                po.id === editingPO.id
                ? { ...po, ...values, lineItems: updatedLineItems, status: 'Draft', totalAmount: 0 }
                : po
            ));
            toast({ title: 'Purchase Order Updated', description: `Purchase Order ${editingPO.id} has been updated.` });
        } else {
            const nextId = purchaseOrders.length > 0 ? Math.max(...purchaseOrders.map(po => parseInt(po.id.split('-')[1]))) + 1 : 1;
            const newPO: PurchaseOrder = {
                id: `PO-${String(nextId).padStart(3, '0')}`,
                supplierName: values.supplierName,
                date: format(new Date(), 'yyyy-MM-dd'),
                status: 'Draft',
                lineItems: values.lineItems,
                totalAmount: 0, // Total amount is 0 for draft as prices are not final
            };
            setPurchaseOrders([newPO, ...purchaseOrders]);
            toast({ title: 'Purchase Order Created', description: `Purchase Order ${newPO.id} has been saved as a draft.` });
        }
        createForm.reset({ supplierName: '', lineItems: []});
        createRemove();
        setIsCreateDialogOpen(false);
        setEditingPO(null);
    }
    
    function handleReceiveSubmit(values: ReceiveItemsForm) {
        if (!selectedPO) return;
        const totalAmount = values.lineItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
        setPurchaseOrders(prevPOs => prevPOs.map(po => 
            po.id === selectedPO.id 
            ? { ...po, status: 'Fulfilled', totalAmount, lineItems: values.lineItems } 
            : po
        ));
        setMasterData(prevMasterData => {
            const newMasterData = [...prevMasterData];
            values.lineItems.forEach(receivedItem => {
                const itemIndex = newMasterData.findIndex(md => md.itemCode === receivedItem.itemId);
                if (itemIndex !== -1) {
                    newMasterData[itemIndex].stockLevel += receivedItem.quantity;
                }
            });
            return newMasterData;
        });
        toast({ title: 'Purchase Order Fulfilled', description: `Stock for PO ${selectedPO.id} has been updated.` });
        setIsReceiveDialogOpen(false);
        setSelectedPO(null);
    }

    function onPaymentSubmit(values: PaymentFormValues) {
        if (!selectedPO) return;

        const currentAmountPaid = payments.filter(p => p.orderId === selectedPO.id).reduce((acc, p) => acc + p.amount, 0);
        
        if (values.amount > selectedPO.totalAmount - currentAmountPaid) {
            toast({
                variant: 'destructive',
                title: 'Invalid Amount',
                description: `Payment exceeds remaining balance. Max payable: ${currency.code} ${(selectedPO.totalAmount - currentAmountPaid).toFixed(2)}`,
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
            orderId: selectedPO.id,
            description: `Payment for ${selectedPO.id}`,
            date: format(new Date(), 'yyyy-MM-dd'),
            amount: values.amount,
            method: values.method,
            details: details,
            type: 'expense',
        };

        setPayments(prev => [...prev, newPayment]);

        const totalPaid = currentAmountPaid + newPayment.amount;

        if (totalPaid >= selectedPO.totalAmount) {
            setPurchaseOrders(prev => prev.map(o => o.id === selectedPO.id ? { ...o, status: 'Paid' } : o));
             toast({
                title: 'Payment Complete',
                description: `Final payment for PO ${selectedPO.id} has been recorded.`
            });
        } else {
             toast({
                title: 'Installment Recorded',
                description: `Payment of ${currency.code} ${values.amount.toFixed(2)} for PO ${selectedPO.id} recorded.`
            });
        }
        setIsPaymentDialogOpen(false);
    }

    const handleStatusChange = (poId: string, status: 'Sent') => {
        setPurchaseOrders(prev => prev.map(po => po.id === poId ? {...po, status} : po));
        toast({ title: 'Status Updated', description: `PO ${poId} marked as ${status}.` });
    };

    const handleDelete = (poId: string) => {
        setPurchaseOrders(prev => prev.filter(po => po.id !== poId));
        toast({ title: 'Purchase Order Deleted', description: `PO ${poId} has been removed.` });
    };

    const openReceiveDialog = (po: PurchaseOrder) => {
        setSelectedPO(po);
        receiveForm.reset({ lineItems: po.lineItems.map(item => ({ ...item, unitPrice: item.unitPrice || ('' as any), totalValue: item.totalValue || 0 })) });
        setIsReceiveDialogOpen(true);
    };

    const openCreateOrEditDialog = (po: PurchaseOrder | null) => {
        if (po) {
            setEditingPO(po);
            const simplifiedLineItems = po.lineItems.map(({ itemId, quantity }) => ({ itemId, quantity }));
            createForm.reset({ supplierName: po.supplierName, lineItems: simplifiedLineItems });
            createReplace(simplifiedLineItems);
        } else {
            setEditingPO(null);
            createForm.reset({ supplierName: '', lineItems: [] });
            createRemove();
        }
        setIsCreateDialogOpen(true);
    };

    const openPaymentDialog = (po: PurchaseOrder) => {
        setSelectedPO(po);
        const currentAmountPaid = payments.filter(p => p.orderId === po.id).reduce((acc, p) => acc + p.amount, 0);
        const currentRemainingAmount = po.totalAmount - currentAmountPaid;
        paymentForm.reset({ 
            amount: currentRemainingAmount > 0 ? currentRemainingAmount : '' as any, 
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

    const handleShare = async (po: PurchaseOrder) => {
        const url = window.location.href;
        const shareData = {
            title: `Purchase Order ${po.id}`,
            text: `Check out this purchase order to ${po.supplierName} for ${currency.code} ${po.totalAmount.toFixed(2)}.`,
            url: url,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text} \n${shareData.url}`);
                toast({
                    title: 'Link Copied!',
                    description: 'Purchase order link copied to clipboard.',
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


    const sortedPurchaseOrders = [...purchaseOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const filteredPurchaseOrders = sortedPurchaseOrders.filter(po => po.id.toLowerCase().includes(searchTerm.toLowerCase()) || po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) || po.status.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const statusVariant: {[key: string]: "default" | "secondary" | "destructive" | "outline"} = { 'Draft': 'secondary', 'Sent': 'default', 'Fulfilled': 'outline', 'Paid': 'default' };

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none;
            }
          }
        `}
      </style>
      <div id="print-area">
        {poToPrint && <PrintablePO po={poToPrint} masterData={masterData} currency={currency} companyProfile={companyProfile}/>}
      </div>
      <div className='no-print'>
        <header className="flex items-center p-4 border-b">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold ml-4">Purchase Orders</h1>
        </header>
        <main className="p-4">
            <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Purchase Orders</CardTitle>
                        <CardDescription>
                        Create and manage purchase orders for raw materials.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input placeholder="Search POs..." className="w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <Dialog open={isCreateDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) { setEditingPO(null); createForm.reset(); createRemove(); } setIsCreateDialogOpen(isOpen); }}>
                            <DialogTrigger asChild>
                                <Button onClick={() => openCreateOrEditDialog(null)}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create New PO
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>{editingPO ? `Edit Purchase Order ${editingPO.id}` : 'Create New Purchase Order'}</DialogTitle>
                                </DialogHeader>
                                <Form {...createForm}>
                                    <form onSubmit={createForm.handleSubmit(handleCreateOrUpdateSubmit)}>
                                        <ScrollArea className="max-h-[calc(100vh-12rem)]">
                                            <div className="space-y-4 p-4">
                                                <FormField
                                                control={createForm.control}
                                                name="supplierName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                    <FormLabel>Supplier</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a supplier" />
                                                        </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                        {suppliers.map(supplier => (
                                                            <SelectItem key={supplier.id} value={supplier.name}>
                                                            {supplier.name}
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
                                                        {createFields.map((field, index) => { const itemDetails = masterData.find(i => i.itemCode === field.itemId); return ( <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md"> <div className="flex-1 font-medium">{itemDetails?.name || field.itemId}</div> <div className="w-20 text-sm">Qty: {field.quantity}</div> <Button variant="ghost" size="icon" type="button" onClick={() => createRemove(index)}> <Trash2 className="h-4 w-4 text-destructive"/> </Button> </div> )})}
                                                    </div>
                                                    {createFields.length === 0 && ( <p className="text-sm text-muted-foreground text-center p-4">No items added yet.</p> )}
                                                    <FormMessage>{createForm.formState.errors.lineItems?.root?.message || createForm.formState.errors.lineItems?.message}</FormMessage>
                                                </div>
                                                <AddItemForm masterData={masterData} onAddItem={createAppend} />
                                            </div>
                                        </ScrollArea>
                                        <DialogFooter className="mt-4">
                                            <div className="flex justify-end gap-2 w-full">
                                                <DialogClose asChild>
                                                    <Button variant="outline" type="button">Cancel</Button>
                                                </DialogClose>
                                                <Button type="submit">{editingPO ? 'Save Changes' : 'Create PO'}</Button>
                                            </div>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>PO ID</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredPurchaseOrders.length > 0 ? (
                        filteredPurchaseOrders.map((po) => (
                        <TableRow key={po.id}>
                            <TableCell>{po.date}</TableCell>
                            <TableCell className="font-mono">{po.id}</TableCell>
                            <TableCell className="font-medium">{po.supplierName}</TableCell>
                            <TableCell className="text-right">{currency.code} {po.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>
                            <Badge 
                                variant={statusVariant[po.status]}
                                className={po.status === 'Paid' ? 'bg-green-600 text-white' : ''}
                            >
                                {po.status}
                            </Badge>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0"> <span className="sr-only">Open menu</span> <MoreHorizontal className="h-4 w-4" /> </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openCreateOrEditDialog(po)} disabled={po.status !== 'Draft'}> View/Edit </DropdownMenuItem>
                                    {po.status === 'Draft' && ( <DropdownMenuItem onClick={() => handleStatusChange(po.id, 'Sent')}> Mark as Sent </DropdownMenuItem> )}
                                    {po.status === 'Sent' && ( <DropdownMenuItem onClick={() => openReceiveDialog(po)}> Receive Items </DropdownMenuItem> )}
                                    {po.status === 'Fulfilled' && ( <DropdownMenuItem onClick={() => openPaymentDialog(po)}> Add Payment </DropdownMenuItem> )}
                                    {po.status === 'Paid' && ( <DropdownMenuItem disabled>Payment Complete</DropdownMenuItem> )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handlePrint(po)}>
                                        <Printer className="mr-2 h-4 w-4" />
                                        <span>Print</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleShare(po)}>
                                        <Share2 className="mr-2 h-4 w-4" />
                                        <span>Share</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(po.id)} disabled={po.status !== 'Draft'}> Delete </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center">
                                No purchase orders found. Enable dummy data in the dashboard's development tab to see sample entries.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </main>

        {/* Receive Items Dialog */}
        <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader> <DialogTitle>Receive Items for PO {selectedPO?.id}</DialogTitle> <CardDescription>Enter the final unit price for each item to update stock and finalize the order.</CardDescription> </DialogHeader>
                    <Form {...receiveForm}>
                        <form onSubmit={receiveForm.handleSubmit(handleReceiveSubmit)}>
                            <ScrollArea className="max-h-[calc(100vh-12rem)]">
                                <div className="p-4">
                                    <Table>
                                        <TableHeader> <TableRow> <TableHead>Item</TableHead> <TableHead className="w-24">Quantity</TableHead> <TableHead className="w-40">Unit Price</TableHead> <TableHead className="w-40 text-right">Total Value</TableHead> </TableRow> </TableHeader>
                                        <TableBody>
                                            {receiveFields.map((field, index) => {
                                                const itemDetails = masterData.find(i => i.itemCode === field.itemId);
                                                const quantity = receiveForm.watch(`lineItems.${index}.quantity`);
                                                const unitPrice = receiveForm.watch(`lineItems.${index}.unitPrice`);
                                                const totalValue = (quantity || 0) * (unitPrice || 0);
                                                if(receiveForm.getValues(`lineItems.${index}.totalValue`) !== totalValue) {
                                                    receiveForm.setValue(`lineItems.${index}.totalValue`, totalValue);
                                                }
                                                return (
                                                    <TableRow key={field.id}>
                                                        <TableCell className="font-medium">{itemDetails?.name}</TableCell>
                                                        <TableCell>{quantity}</TableCell>
                                                        <TableCell> <FormField control={receiveForm.control} name={`lineItems.${index}.unitPrice`} render={({ field }) => ( <FormItem> <FormControl> <Input type="number" placeholder="e.g. 10.50" {...field} /> </FormControl> <FormMessage /> </FormItem> )} /> </TableCell>
                                                        <TableCell className="text-right font-mono">{currency.code} {totalValue.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </ScrollArea>
                            <DialogFooter className="mt-4"> <DialogClose asChild> <Button variant="outline" type="button">Cancel</Button> </DialogClose> <Button type="submit">Confirm &amp; Receive Stock</Button> </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Record Payment for PO {selectedPO?.id}</DialogTitle>
                        <CardDescription>
                            Total: {currency.code} {selectedPO?.totalAmount.toFixed(2)} | Paid: {currency.code} {amountPaid.toFixed(2)} | Remaining: {currency.code} {remainingAmount.toFixed(2)}
                        </CardDescription>
                    </DialogHeader>
                    <Form {...paymentForm}>
                        <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)}>
                            <ScrollArea className="max-h-[calc(100vh-12rem)]">
                                <div className="space-y-4 p-4">
                                    <FormField
                                            control={paymentForm.control}
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
                                            control={paymentForm.control}
                                            name="method"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Payment Method</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
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
                                                control={paymentForm.control}
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-4">
                                                    <h4 className="font-medium text-sm">From</h4>
                                                    <FormField control={paymentForm.control} name="fromBankName" render={({ field }) => ( <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g. City Bank" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                    <FormField control={paymentForm.control} name="fromAccountNumber" render={({ field }) => ( <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="e.g. 1234567890" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                </div>
                                                <div className="space-y-4">
                                                    <h4 className="font-medium text-sm">To</h4>
                                                    <FormField control={paymentForm.control} name="toBankName" render={({ field }) => ( <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g. Our Bank" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                    <FormField control={paymentForm.control} name="toAccountNumber" render={({ field }) => ( <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="e.g. 0987654321" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                </div>
                                            </div>
                                        )}
                                        {paymentMethod === 'Cheque' && (
                                            <div className="space-y-4">
                                                <FormField
                                                    control={paymentForm.control}
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
                                                    control={paymentForm.control}
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
                                                    control={paymentForm.control}
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
                                    </div>
                                </ScrollArea>
                            <DialogFooter className="mt-4">
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Record Payment</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    </>
  );
}

// Component for printing - rendered conditionally in a hidden div
const PrintablePO = ({ po, masterData, currency, companyProfile }: { po: PurchaseOrder | null; masterData: MasterDataItem[], currency: any, companyProfile: any }) => {
    if (!po) return null;

    return (
        <div className="p-8">
            <header className="flex justify-between items-start mb-8 pb-4 border-b">
                <div className="flex items-center gap-4">
                    <Logo />
                    <div>
                        <h1 className="text-2xl font-bold">{companyProfile.companyName}</h1>
                        <p className="text-muted-foreground">{companyProfile.email}</p>
                        <p className="text-muted-foreground">{companyProfile.phone}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase text-muted-foreground">Purchase Order</h2>
                    <p className="text-muted-foreground font-mono">{po.id}</p>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
                <p className='text-sm text-muted-foreground'>Supplier</p>
                <p className="font-medium">{po.supplierName}</p>
            </div>
            <div className="text-right">
                <p><strong>Date:</strong> {po.date}</p>
                <p><strong>Status:</strong> {po.status}</p>
            </div>
            </div>

            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Item Code</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                {po.status !== 'Draft' && <TableHead className="text-right">Unit Price</TableHead>}
                {po.status !== 'Draft' && <TableHead className="text-right">Total Value</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {po.lineItems.map(item => {
                const itemDetails = masterData.find(md => md.itemCode === item.itemId);
                return (
                    <TableRow key={item.itemId}>
                    <TableCell>{item.itemId}</TableCell>
                    <TableCell>{itemDetails?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    {po.status !== 'Draft' && <TableCell className="text-right">{currency.code} {item.unitPrice?.toFixed(2) || '0.00'}</TableCell>}
                    {po.status !== 'Draft' && <TableCell className="text-right">{currency.code} {item.totalValue?.toFixed(2) || '0.00'}</TableCell>}
                    </TableRow>
                );
                })}
            </TableBody>
            </Table>
            {po.status !== 'Draft' && (
                <div className="text-right mt-4 pr-4 text-xl font-bold">
                    Total: {currency.code} {po.totalAmount.toFixed(2)}
                </div>
            )}
        </div>
    );
};

    
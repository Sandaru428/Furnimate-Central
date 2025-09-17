
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
import { initialMasterData, MasterDataItem } from '@/app/dashboard/data/master-data/page';
import { initialSuppliers } from '../suppliers/page';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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
    status: z.enum(['Draft', 'Sent', 'Fulfilled']),
    lineItems: z.array(lineItemSchema),
});

const createPurchaseOrderSchema = z.object({
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


type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;
type CreatePurchaseOrder = z.infer<typeof createPurchaseOrderSchema>;
type ReceiveItemsForm = z.infer<typeof receiveItemsSchema>;

const initialPurchaseOrders: PurchaseOrder[] = [
    {
      id: 'PO-001',
      supplierName: 'Timber Co.',
      date: '2024-05-10',
      totalAmount: 0, // Will be calculated on fulfillment
      status: 'Sent',
      lineItems: [
        { itemId: 'WD-001', quantity: 30 },
      ],
    },
     {
      id: 'PO-002',
      supplierName: 'Fabric Solutions',
      date: '2025-09-17',
      totalAmount: 0,
      status: 'Draft',
      lineItems: [
        { itemId: 'FBR-003', quantity: 20 },
      ],
    },
];

const AddItemForm = ({ onAddItem }: { onAddItem: (item: Omit<z.infer<typeof lineItemSchema>, 'unitPrice' | 'totalValue'>) => void }) => {
    const [selectedItemCode, setSelectedItemCode] = useState('');
    const [quantity, setQuantity] = useState(1);
    const item = initialMasterData.find(i => i.itemCode === selectedItemCode);

    const handleAddItem = () => {
        if (item && quantity > 0) {
            onAddItem({
                itemId: item.itemCode,
                quantity: quantity,
            });
            setSelectedItemCode('');
            setQuantity(1);
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
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                />
            </div>
            <Button type="button" onClick={handleAddItem} disabled={!item}>Add</Button>
        </div>
    );
};


export default function PurchaseOrdersPage() {
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
    const [masterData, setMasterData] = useState<MasterDataItem[]>(initialMasterData);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const createForm = useForm<CreatePurchaseOrder>({
        resolver: zodResolver(createPurchaseOrderSchema),
        defaultValues: {
          supplierName: '',
          lineItems: [],
        },
    });

    const receiveForm = useForm<ReceiveItemsForm>();

    const { fields: createFields, append: createAppend, remove: createRemove, replace: createReplace } = useFieldArray({
        control: createForm.control,
        name: "lineItems",
    });

     const { fields: receiveFields } = useFieldArray({
        control: receiveForm.control,
        name: "lineItems",
    });

    function handleCreateOrUpdateSubmit(values: CreatePurchaseOrder) {
        if (editingPO) {
             // Update existing PO
            setPurchaseOrders(prevPOs => prevPOs.map(po => 
                po.id === editingPO.id
                ? { ...po, ...values, lineItems: values.lineItems, status: 'Draft' }
                : po
            ));
            toast({
                title: 'Purchase Order Updated',
                description: `Purchase Order ${editingPO.id} has been updated.`,
            });
        } else {
             // Create new PO
            const nextId = purchaseOrders.length > 0 ? Math.max(...purchaseOrders.map(po => parseInt(po.id.split('-')[1]))) + 1 : 1;
            
            const newPO: PurchaseOrder = {
                id: `PO-${String(nextId).padStart(3, '0')}`,
                supplierName: values.supplierName,
                date: format(new Date(), 'yyyy-MM-dd'),
                status: 'Draft',
                lineItems: values.lineItems,
                totalAmount: 0, // Total amount is 0 on creation
            };

            setPurchaseOrders([newPO, ...purchaseOrders]);
            toast({
                title: 'Purchase Order Created',
                description: `Purchase Order ${newPO.id} has been saved as a draft.`,
            });
        }
       
        createForm.reset({ supplierName: '', lineItems: []});
        createRemove();
        setIsCreateDialogOpen(false);
        setEditingPO(null);
    }
    
    function handleReceiveSubmit(values: ReceiveItemsForm) {
        if (!selectedPO) return;

        const totalAmount = values.lineItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);

        // Update PO
        setPurchaseOrders(prevPOs => prevPOs.map(po => 
            po.id === selectedPO.id 
            ? { ...po, status: 'Fulfilled', totalAmount, lineItems: values.lineItems } 
            : po
        ));

        // Update Master Data Stock
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

        toast({
            title: 'Purchase Order Fulfilled',
            description: `Stock for PO ${selectedPO.id} has been updated.`,
        });
        setIsReceiveDialogOpen(false);
        setSelectedPO(null);
    }
    
    const handleStatusChange = (poId: string, status: 'Sent' | 'Fulfilled') => {
        setPurchaseOrders(prev => prev.map(po => po.id === poId ? {...po, status} : po));
        toast({ title: 'Status Updated', description: `PO ${poId} marked as ${status}.` });
    };

    const handleDelete = (poId: string) => {
        setPurchaseOrders(prev => prev.filter(po => po.id !== poId));
        toast({ title: 'Purchase Order Deleted', description: `PO ${poId} has been removed.` });
    };

    const openReceiveDialog = (po: PurchaseOrder) => {
        setSelectedPO(po);
        receiveForm.reset({ 
            lineItems: po.lineItems.map(item => ({
                ...item,
                unitPrice: undefined,
                totalValue: item.totalValue ?? 0,
            })) 
        });
        setIsReceiveDialogOpen(true);
    };

    const openCreateOrEditDialog = (po: PurchaseOrder | null) => {
        if (po) {
            setEditingPO(po);
            createForm.reset({
                supplierName: po.supplierName,
            });
            createReplace(po.lineItems);
        } else {
            setEditingPO(null);
            createForm.reset({ supplierName: '', lineItems: [] });
            createRemove();
        }
        setIsCreateDialogOpen(true);
    };


    const filteredPurchaseOrders = purchaseOrders.filter(po =>
        po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
  return (
    <>
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
                    <Input
                        placeholder="Search POs..."
                        className="w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Dialog open={isCreateDialogOpen} onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            setEditingPO(null);
                            createForm.reset();
                            createRemove();
                        }
                        setIsCreateDialogOpen(isOpen);
                    }}>
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
                                <form onSubmit={createForm.handleSubmit(handleCreateOrUpdateSubmit)} className="space-y-4 py-4">
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
                                                    {initialSuppliers.map(supplier => (
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
                                            {createFields.map((field, index) => {
                                                const itemDetails = initialMasterData.find(i => i.itemCode === field.itemId);
                                                return (
                                                <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md">
                                                    <div className="flex-1 font-medium">{itemDetails?.name || field.itemId}</div>
                                                    <div className="w-20 text-sm">Qty: {field.quantity}</div>
                                                    <Button variant="ghost" size="icon" type="button" onClick={() => createRemove(index)}>
                                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                                    </Button>
                                                </div>
                                            )})}
                                        </div>
                                         {createFields.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center p-4">No items added yet.</p>
                                        )}
                                        <FormMessage>{createForm.formState.errors.lineItems?.root?.message || createForm.formState.errors.lineItems?.message}</FormMessage>
                                    </div>
                                    
                                    <AddItemForm onAddItem={createAppend} />

                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline" type="button">Cancel</Button>
                                        </DialogClose>
                                        <Button type="submit">{editingPO ? 'Save Changes' : 'Create PO'}</Button>
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
                  <TableHead>PO ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono">{po.id}</TableCell>
                    <TableCell className="font-medium">{po.supplierName}</TableCell>
                    <TableCell>{po.date}</TableCell>
                    <TableCell className="text-right">${po.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={po.status === 'Draft' ? 'secondary' : po.status === 'Sent' ? 'default' : 'outline'}>
                        {po.status}
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
                                onClick={() => openCreateOrEditDialog(po)} 
                                disabled={po.status !== 'Draft'}
                            >
                                View/Edit
                            </DropdownMenuItem>
                            {po.status === 'Draft' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(po.id, 'Sent')}>
                                    Mark as Sent
                                </DropdownMenuItem>
                            )}
                             {po.status === 'Sent' && (
                                <DropdownMenuItem onClick={() => openReceiveDialog(po)}>
                                    Receive Items
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                                className="text-destructive" 
                                onClick={() => handleDelete(po.id)}
                                disabled={po.status !== 'Draft'}
                            >
                                Delete
                            </DropdownMenuItem>
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

       {/* Receive Items Dialog */}
       <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Receive Items for PO {selectedPO?.id}</DialogTitle>
                    <CardDescription>Enter the final unit price for each item to update stock and finalize the order.</CardDescription>
                </DialogHeader>
                <Form {...receiveForm}>
                    <form onSubmit={receiveForm.handleSubmit(handleReceiveSubmit)} className="space-y-4 py-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="w-24">Quantity</TableHead>
                                    <TableHead className="w-40">Unit Price</TableHead>
                                    <TableHead className="w-40 text-right">Total Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {receiveFields.map((field, index) => {
                                    const itemDetails = initialMasterData.find(i => i.itemCode === field.itemId);
                                    const quantity = receiveForm.watch(`lineItems.${index}.quantity`);
                                    const unitPrice = receiveForm.watch(`lineItems.${index}.unitPrice`);
                                    const totalValue = (quantity || 0) * (unitPrice || 0);
                                    receiveForm.setValue(`lineItems.${index}.totalValue`, totalValue);

                                    return (
                                        <TableRow key={field.id}>
                                            <TableCell className="font-medium">{itemDetails?.name}</TableCell>
                                            <TableCell>{quantity}</TableCell>
                                            <TableCell>
                                                <FormField
                                                    control={receiveForm.control}
                                                    name={`lineItems.${index}.unitPrice`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input type="number" placeholder="e.g. 10.50" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-mono">${totalValue.toFixed(2)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" type="button">Cancel</Button>
                            </DialogClose>
                            <Button type="submit">Confirm &amp; Receive Stock</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    </>
  );
}


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
import { initialSuppliers } from '../suppliers/page';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';


const lineItemSchema = z.object({
  itemId: z.string().min(1, "Item selection is required."),
  quantity: z.coerce.number().int().positive("Quantity must be a positive number."),
  unitPrice: z.coerce.number(),
  totalValue: z.coerce.number(),
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
    lineItems: z.array(lineItemSchema).min(1, "Please add at least one item."),
});


type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;
type CreatePurchaseOrder = z.infer<typeof createPurchaseOrderSchema>;

const initialPurchaseOrders: PurchaseOrder[] = [
    {
      id: 'PO-001',
      supplierName: 'Timber Co.',
      date: '2024-05-10',
      totalAmount: 750.00,
      status: 'Sent',
      lineItems: [
        { itemId: 'WD-001', quantity: 30, unitPrice: 25.00, totalValue: 750.00 },
      ],
    },
];

// Temporary component for adding items - will be moved to its own file later if needed
const AddItemForm = ({ onAddItem }: { onAddItem: (item: z.infer<typeof lineItemSchema>) => void }) => {
    const [selectedItemCode, setSelectedItemCode] = useState('');
    const [quantity, setQuantity] = useState(1);
    const item = initialMasterData.find(i => i.itemCode === selectedItemCode);

    const handleAddItem = () => {
        if (item && quantity > 0) {
            onAddItem({
                itemId: item.itemCode,
                quantity: quantity,
                unitPrice: item.unitPrice,
                totalValue: item.unitPrice * quantity,
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
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const form = useForm<CreatePurchaseOrder>({
        resolver: zodResolver(createPurchaseOrderSchema),
        defaultValues: {
          supplierName: '',
          lineItems: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "lineItems",
    });

    function onSubmit(values: CreatePurchaseOrder) {
        const totalAmount = values.lineItems.reduce((acc, item) => acc + item.totalValue, 0);
        const nextId = purchaseOrders.length > 0 ? Math.max(...purchaseOrders.map(po => parseInt(po.id.split('-')[1]))) + 1 : 1;
        
        const newPO: PurchaseOrder = {
            id: `PO-${String(nextId).padStart(3, '0')}`,
            supplierName: values.supplierName,
            date: format(new Date(), 'yyyy-MM-dd'),
            status: 'Draft',
            lineItems: values.lineItems,
            totalAmount: totalAmount,
        };

        setPurchaseOrders([newPO, ...purchaseOrders]);
        toast({
            title: 'Purchase Order Created',
            description: `Purchase Order ${newPO.id} has been saved as a draft.`,
        });
        form.reset();
        remove(); // remove all field array items
        setIsDialogOpen(false);
    }

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
                    <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
                        setIsDialogOpen(isOpen);
                        if (!isOpen) {
                            form.reset();
                            remove();
                        };
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create New PO
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create New Purchase Order</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                    <FormField
                                        control={form.control}
                                        name="supplierName"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Supplier</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                            {fields.map((field, index) => {
                                                const itemDetails = initialMasterData.find(i => i.itemCode === field.itemId);
                                                return (
                                                <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md">
                                                    <div className="flex-1 font-medium">{itemDetails?.name || field.itemId}</div>
                                                    <div className="w-20 text-sm">Qty: {field.quantity}</div>
                                                    <div className="w-24 text-sm text-right">@ ${field.unitPrice.toFixed(2)}</div>
                                                    <div className="w-24 text-sm font-semibold text-right">${field.totalValue.toFixed(2)}</div>
                                                    <Button variant="ghost" size="icon" type="button" onClick={() => remove(index)}>
                                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                                    </Button>
                                                </div>
                                            )})}
                                        </div>
                                         {fields.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center p-4">No items added yet.</p>
                                        )}
                                        <FormMessage>{form.formState.errors.lineItems?.root?.message || form.formState.errors.lineItems?.message}</FormMessage>
                                    </div>
                                    
                                    <AddItemForm onAddItem={append} />

                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline" type="button">Cancel</Button>
                                        </DialogClose>
                                        <Button type="submit">Create PO</Button>
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
                            <DropdownMenuItem>View/Edit</DropdownMenuItem>
                            <DropdownMenuItem>Mark as Sent</DropdownMenuItem>
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

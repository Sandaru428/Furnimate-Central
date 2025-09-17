
'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { initialMasterData } from '@/app/dashboard/data/master-data/page';
import { initialSuppliers } from '../suppliers/page';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const lineItemSchema = z.object({
  itemId: z.string(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.number(),
  totalValue: z.number(),
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
    items: z.string().min(1, "Please add at least one item."),
});


type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;

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

export default function PurchaseOrdersPage() {
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof createPurchaseOrderSchema>>({
        resolver: zodResolver(createPurchaseOrderSchema),
        defaultValues: {
          supplierName: '',
          items: '',
        },
    });

    function onSubmit(values: z.infer<typeof createPurchaseOrderSchema>) {
        try {
            const parsedLineItems = values.items.split('\n').map(line => {
                const [itemId, quantityStr] = line.split(',');
                if (!itemId || !quantityStr || isNaN(parseInt(quantityStr.trim()))) {
                    throw new Error(`Invalid line item format: ${line}. Use 'ITEM-ID,quantity'.`);
                }
                const quantity = parseInt(quantityStr.trim());
                const item = initialMasterData.find(i => i.itemCode === itemId.trim());
                if (!item) {
                    throw new Error(`Item with code ${itemId.trim()} not found in master data.`);
                }
                return { 
                    itemId: itemId.trim(), 
                    quantity,
                    unitPrice: item.unitPrice,
                    totalValue: quantity * item.unitPrice,
                };
            });

            const totalAmount = parsedLineItems.reduce((acc, item) => acc + item.totalValue, 0);
            
            const nextId = purchaseOrders.length > 0 ? Math.max(...purchaseOrders.map(po => parseInt(po.id.split('-')[1]))) + 1 : 1;
            const newPO: PurchaseOrder = {
                id: `PO-${String(nextId).padStart(3, '0')}`,
                supplierName: values.supplierName,
                date: format(new Date(), 'yyyy-MM-dd'),
                status: 'Draft',
                lineItems: parsedLineItems,
                totalAmount: totalAmount,
            };

            setPurchaseOrders([newPO, ...purchaseOrders]);
            toast({
              title: 'Purchase Order Created',
              description: `Purchase Order ${newPO.id} has been saved as a draft.`,
            });
            form.reset();
            setIsDialogOpen(false);

        } catch (error: any) {
             toast({
                variant: "destructive",
                title: 'Error Creating Purchase Order',
                description: error.message,
            });
        }
    }
    
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
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create New PO
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
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

                                 <FormField
                                control={form.control}
                                name="items"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Items (ID,quantity per line)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="WD-001,30\nMTL-002,10" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Each line should contain an item code and quantity, separated by a comma.
                                    </FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit">Create PO</Button>
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
                  <TableHead>PO ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono">{po.id}</TableCell>
                    <TableCell className="font-medium">{po.supplierName}</TableCell>
                    <TableCell>{po.date}</TableCell>
                    <TableCell className="text-right">${po.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={po.status === 'Draft' ? 'secondary' : 'default'}>
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

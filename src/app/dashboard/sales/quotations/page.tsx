
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
import { useRouter } from 'next/navigation';

const lineItemSchema = z.object({
  itemId: z.string(),
  quantity: z.coerce.number().int().positive(),
});

const quotationSchema = z.object({
    id: z.string(),
    customer: z.string().min(1, "Customer name is required"),
    date: z.string(),
    amount: z.coerce.number().min(0, "Amount must be a non-negative number"),
    status: z.enum(['Draft', 'Sent', 'Approved', 'Rejected', 'Converted']),
    lineItems: z.array(lineItemSchema),
});

const createQuotationSchema = quotationSchema.omit({ id: true, date: true, status: true, amount: true, lineItems: true }).extend({
    items: z.string().min(1, "Please add at least one item."),
});


type Quotation = z.infer<typeof quotationSchema>;

const initialQuotations: Quotation[] = [
  {
    id: 'QUO-001',
    customer: 'Modern Designs LLC',
    date: '2024-05-01',
    amount: 1250.00,
    status: 'Sent',
    lineItems: [{ itemId: 'WD-001', quantity: 50 }],
  },
  {
    id: 'QUO-002',
    customer: 'Home Comforts',
    date: '2024-05-03',
    amount: 850.50,
    status: 'Draft',
    lineItems: [{ itemId: 'FBR-003', quantity: 55 }],
  },
  {
    id: 'QUO-003',
    customer: 'Emily Davis',
    date: '2024-05-05',
    amount: 2400.00,
    status: 'Approved',
    lineItems: [{ itemId: 'MTL-002', quantity: 40 }, { itemId: 'FNS-010', quantity: 10 }],
  },
];

const statusVariant: {[key: string]: "default" | "secondary" | "destructive" | "outline"} = {
    'Sent': 'default',
    'Draft': 'secondary',
    'Approved': 'outline', 
    'Rejected': 'destructive',
    'Converted': 'default'
}


export default function QuotationsPage() {
    const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<z.infer<typeof createQuotationSchema>>({
        resolver: zodResolver(createQuotationSchema),
        defaultValues: {
          customer: '',
          items: '',
        },
    });

    function onSubmit(values: z.infer<typeof createQuotationSchema>) {
        try {
            const parsedLineItems = values.items.split('\n').map(line => {
                const [itemId, quantity] = line.split(',');
                if (!itemId || !quantity || isNaN(parseInt(quantity))) {
                    throw new Error(`Invalid line item format: ${line}. Use 'ITEM-ID,quantity'.`);
                }
                const item = initialMasterData.find(i => i.itemCode === itemId.trim());
                if (!item) {
                    throw new Error(`Item with code ${itemId.trim()} not found in master data.`);
                }
                return { 
                    itemId: itemId.trim(), 
                    quantity: parseInt(quantity.trim()),
                    unitPrice: item.unitPrice,
                };
            });

            const totalAmount = parsedLineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
            
            const nextId = quotations.length > 0 ? Math.max(...quotations.map(q => parseInt(q.id.split('-')[1]))) + 1 : 1;
            const newQuotation: Quotation = {
                id: `QUO-${String(nextId).padStart(3, '0')}`,
                customer: values.customer,
                date: format(new Date(), 'yyyy-MM-dd'),
                status: 'Draft',
                lineItems: parsedLineItems.map(({itemId, quantity}) => ({itemId, quantity})),
                amount: totalAmount,
            };

            setQuotations([newQuotation, ...quotations]);
            toast({
              title: 'Quotation Created',
              description: `Quotation ${newQuotation.id} has been saved as a draft.`,
            });
            form.reset();
            setIsDialogOpen(false);

        } catch (error: any) {
             toast({
                variant: "destructive",
                title: 'Error Creating Quotation',
                description: error.message,
            });
        }
    }
    
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
                    title: 'Stock Unvailable',
                    description: `Not enough stock for ${item.itemId}. Required: ${item.quantity}, Available: ${masterItem?.stockLevel || 0}`,
                });
            }
        });

        if (insufficientStock) {
            return; // Stop conversion if any item has insufficient stock
        }

        setQuotations(quotations.map(q => 
            q.id === quotationId ? { ...q, status: 'Converted' } : q
        ));
        toast({
            title: 'Quotation Converted to Order',
            description: `Stock checked and available. Order created from ${quotationId}.`,
        });
        // Optionally, navigate to orders page
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
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create New Quotation
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create New Quotation</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                <FormField
                                control={form.control}
                                name="customer"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Customer Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Modern Designs LLC" {...field} />
                                    </FormControl>
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
                                        <Textarea placeholder="WD-001,50\nFBR-003,20" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit">Create Quotation</Button>
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
                            <DropdownMenuItem>View/Edit</DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => handleConvertToOrder(quote.id)}
                                disabled={quote.status === 'Converted' || quote.status !== 'Approved'}
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

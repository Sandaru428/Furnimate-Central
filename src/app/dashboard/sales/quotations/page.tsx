
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const quotationSchema = z.object({
    id: z.string(),
    customer: z.string().min(1, "Customer name is required"),
    date: z.string(),
    total: z.coerce.number().min(0, "Total must be a non-negative number"),
    status: z.enum(['Draft', 'Sent', 'Approved', 'Rejected']),
});

type Quotation = z.infer<typeof quotationSchema>;

const initialQuotations: Quotation[] = [
  {
    id: 'QUO-001',
    customer: 'Modern Designs LLC',
    date: '2024-05-01',
    total: 1250.00,
    status: 'Sent',
  },
  {
    id: 'QUO-002',
    customer: 'Home Comforts',
    date: '2024-05-03',
    total: 850.50,
    status: 'Draft',
  },
  {
    id: 'QUO-003',
    customer: 'Emily Davis',
    date: '2024-05-05',
    total: 2400.00,
    status: 'Approved',
  },
];

const statusVariant: {[key: string]: "default" | "secondary" | "destructive" | "outline"} = {
    'Sent': 'default',
    'Draft': 'secondary',
    'Approved': 'outline', // Success-like variant
    'Rejected': 'destructive'
}


export default function QuotationsPage() {
    const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm({
        resolver: zodResolver(quotationSchema.omit({ id: true, date: true, status: true})),
        defaultValues: {
          customer: '',
          total: 0,
        },
    });

    function onSubmit(values: z.infer<typeof quotationSchema.omit<{id: true, date: true, status: true}>>) {
        const nextId = quotations.length > 0 ? Math.max(...quotations.map(q => parseInt(q.id.split('-')[1]))) + 1 : 1;
        const newQuotation: Quotation = {
            ...values,
            id: `QUO-${String(nextId).padStart(3, '0')}`,
            date: format(new Date(), 'yyyy-MM-dd'),
            status: 'Draft',
        };
        setQuotations([newQuotation, ...quotations]);
        toast({
          title: 'Quotation Created',
          description: `Quotation ${newQuotation.id} has been saved as a draft.`,
        });
        form.reset();
        setIsDialogOpen(false);
    }


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
                                name="total"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Total Amount</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0.00" {...field} />
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
                  <TableHead className="text-right">Total</TableHead>
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
                    <TableCell className="text-right">${quote.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[quote.status] || 'secondary'}>{quote.status}</Badge>
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
                            <DropdownMenuItem>Convert to Order</DropdownMenuItem>
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

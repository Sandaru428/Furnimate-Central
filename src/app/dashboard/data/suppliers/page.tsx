
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';

const supplierSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Supplier name is required"),
    contactPerson: z.string().min(1, "Contact person is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    category: z.string().min(1, "Category is required"),
});

type Supplier = z.infer<typeof supplierSchema>;

const initialSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Timber Co.',
    contactPerson: 'John Doe',
    email: 'john.doe@timberco.com',
    phone: '555-123-4567',
    category: 'Wood',
  },
  {
    id: '2',
    name: 'Fabric Solutions',
    contactPerson: 'Jane Smith',
    email: 'jane.s@fabricsolutions.com',
    phone: '555-987-6543',
    category: 'Fabric',
  },
  {
    id: '3',
    name: 'MetalWorks Inc.',
    contactPerson: 'Bob Johnson',
    email: 'b.johnson@metalworks.com',
    phone: '555-456-7890',
    category: 'Metal',
  },
    {
    id: '4',
    name: 'Finishing Touches',
    contactPerson: 'Alice Williams',
    email: 'alice@finishingtouches.com',
    phone: '555-321-9876',
    category: 'Finishing',
  },
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<Supplier>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      category: '',
    },
  });

  function onSubmit(values: Supplier) {
    const newSupplier = { ...values, id: Date.now().toString() };
    setSuppliers([...suppliers, newSupplier]);
    toast({
      title: 'Supplier Added',
      description: `${values.name} has been successfully added.`,
    });
    form.reset();
    setIsDialogOpen(false);
  }

  return (
    <>
      <header className="flex items-center p-4 border-b">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold ml-4">Suppliers</h1>
      </header>
      <main className="p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Suppliers</CardTitle>
                    <CardDescription>
                    Manage your supplier information.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Input placeholder="Search suppliers..." className="w-64" />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2" />
                                Add New Supplier
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New Supplier</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Supplier Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Timber Co." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    <FormField
                                    control={form.control}
                                    name="contactPerson"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Contact Person</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="john@timberco.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="555-123-4567" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Wood" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <Button type="submit">Add Supplier</Button>
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
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contactPerson}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{supplier.category}</Badge>
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
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
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

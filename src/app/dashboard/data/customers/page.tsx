
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
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';

const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
});

type Customer = z.infer<typeof customerSchema>;

const initialCustomers: Customer[] = [
  {
    id: '1',
    name: 'Modern Designs LLC',
    email: 'sarah@moderndesigns.com',
    phone: '555-111-2222',
  },
  {
    id: '2',
    name: 'Home Comforts',
    email: 'mbrown@homecomforts.net',
    phone: '555-333-4444',
  },
  {
    id: '3',
    name: 'Emily Davis',
    email: 'emily.d@email.com',
    phone: '555-555-6666',
  },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const form = useForm<Customer>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  function onSubmit(values: Customer) {
    const newCustomer = { ...values, id: Date.now().toString() };
    setCustomers([...customers, newCustomer]);
    toast({
      title: 'Customer Added',
      description: `${values.name} has been successfully added.`,
    });
    form.reset();
    setIsDialogOpen(false);
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <>
      <header className="flex items-center p-4 border-b">
        <SidebarTrigger />
        <h1 className="text-xl font-semibold ml-4">Customers</h1>
      </header>
      <main className="p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Customer List</CardTitle>
                <CardDescription>Manage your customer information.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search customers..."
                  className="w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add New Customer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                          control={form.control}
                          name="name"
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
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="e.g. sarah@example.com" {...field} />
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
                                <Input placeholder="e.g. 555-111-2222" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button type="submit">Add Customer</Button>
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
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
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
                          <DropdownMenuItem className="text-destructive">
                            Archive
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
    </>
  );
}

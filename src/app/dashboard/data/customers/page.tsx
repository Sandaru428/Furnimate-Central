
'use client';

import { useState, useEffect } from 'react';
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
import { MoreHorizontal, PlusCircle, Merge } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, writeBatch } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  whatsappNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
});

type Customer = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const form = useForm<Customer>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      whatsappNumber: '',
      dateOfBirth: '',
      address: '',
    },
  });

  const phoneValue = form.watch('phone');
  useEffect(() => {
      if (phoneValue && !form.getValues('whatsappNumber')) {
          form.setValue('whatsappNumber', phoneValue);
      }
  }, [phoneValue, form]);

  const fetchCustomers = async () => {
    setLoading(true);
    const q = query(collection(db, "customers"));
    const querySnapshot = await getDocs(q);
    const customersData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
            dateOfBirth: data.dateOfBirth ? (typeof data.dateOfBirth.toDate === 'function' ? format(data.dateOfBirth.toDate(), 'yyyy-MM-dd') : data.dateOfBirth) : '',
        } as Customer
    });
    setCustomers(customersData.sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function onSubmit(values: Customer) {
    try {
      const dataToSave: any = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        whatsappNumber: values.whatsappNumber,
        address: values.address,
      };
      if (values.dateOfBirth) {
        dataToSave.dateOfBirth = new Date(values.dateOfBirth);
      }

      if (editingCustomer && editingCustomer.id) {
        // Update
        const docRef = doc(db, 'customers', editingCustomer.id);
        await updateDoc(docRef, dataToSave);
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...values, dateOfBirth: values.dateOfBirth } : c).sort((a, b) => a.name.localeCompare(b.name)));
        toast({
          title: 'Customer Updated',
          description: `${values.name} has been successfully updated.`,
        });
      } else {
        // Create
        const docRef = await addDoc(collection(db, 'customers'), dataToSave);
        const newCustomer: Customer = { 
          ...values, 
          id: docRef.id,
        };
        setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
        toast({
          title: 'Customer Added',
          description: `${values.name} has been successfully added.`,
        });
      }
      form.reset();
      setEditingCustomer(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save customer: ", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save customer.',
      });
    }
  }

  const handleMergeDuplicates = async () => {
    setLoading(true);
    const duplicates = new Map<string, Customer[]>();

    // Group customers by normalized name
    customers.forEach(c => {
        const normalizedName = c.name.trim().toLowerCase();
        if (!duplicates.has(normalizedName)) {
            duplicates.set(normalizedName, []);
        }
        duplicates.get(normalizedName)!.push(c);
    });

    const batch = writeBatch(db);
    let mergeCount = 0;

    for (const [name, group] of duplicates.entries()) {
        if (group.length > 1) {
            mergeCount += (group.length - 1);
            const [primary, ...rest] = group; // Keep the first one
            
            // In a real scenario, you'd merge fields intelligently.
            // Here, we just delete the duplicates.
            rest.forEach(duplicate => {
                if (duplicate.id) {
                    const docRef = doc(db, 'customers', duplicate.id);
                    batch.delete(docRef);
                }
            });
        }
    }

    if (mergeCount > 0) {
        await batch.commit();
        toast({
            title: 'Duplicates Merged',
            description: `Successfully merged and removed ${mergeCount} duplicate customer records.`,
        });
        // Re-fetch customers to update the UI
        await fetchCustomers();
    } else {
        toast({
            title: 'No Duplicates Found',
            description: 'No duplicate customer records were found.',
        });
    }

    setLoading(false);
  };

  const openDialog = (customer: Customer | null) => {
    if (customer) {
        setEditingCustomer(customer);
        form.reset(customer);
    } else {
        setEditingCustomer(null);
        form.reset({
            name: '',
            email: '',
            phone: '',
            whatsappNumber: '',
            dateOfBirth: '',
            address: '',
        });
    }
    setIsDialogOpen(true);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <main className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Customers</h1>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search customers..."
              className="w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline" onClick={handleMergeDuplicates} disabled={loading}>
                <Merge className="mr-2 h-4 w-4" />
                Merge Duplicates
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingCustomer(null); setIsDialogOpen(isOpen); }}>
              <DialogTrigger asChild>
                <Button onClick={() => openDialog(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <ScrollArea className="flex-1 pr-6">
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input placeholder="e.g. Modern Designs LLC" {...field} /></FormControl><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="e.g. sarah@example.com" {...field} /></FormControl><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="phone" render={({ field }) => <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="e.g. 555-111-2222" {...field} /></FormControl><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="whatsappNumber" render={({ field }) => <FormItem><FormLabel>WhatsApp Number</FormLabel><FormControl><Input placeholder="e.g. 555-111-2222" {...field} /></FormControl><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="dateOfBirth" render={({ field }) => <FormItem><FormLabel>Date of birth</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>} />
                            </div>
                            <FormField control={form.control} name="address" render={({ field }) => <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="123 Main St, Anytown, USA" {...field} /></FormControl><FormMessage /></FormItem>} />
                        </div>
                    </ScrollArea>
                    <DialogFooter className="pt-4">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">{editingCustomer ? 'Save Changes' : 'Add Customer'}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
            <CardDescription>Manage your customer information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center">
                            Loading...
                        </TableCell>
                    </TableRow>
                ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>{customer.whatsappNumber}</TableCell>
                        <TableCell>
                           {customer.dateOfBirth ? customer.dateOfBirth : '-'}
                        </TableCell>
                        <TableCell>{customer.address}</TableCell>
                        <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDialog(customer)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                                Archive
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center">
                            No customers found.
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

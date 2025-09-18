
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
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';

const supplierSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Supplier name is required"),
    contactPerson: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    whatsappNumber: z.string().optional(),
    contactNumber: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
});

type Supplier = z.infer<typeof supplierSchema>;


export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const form = useForm<Supplier>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contactPerson: '',
      email: '',
      whatsappNumber: '',
      contactNumber: '',
      bankName: '',
      accountNumber: '',
    },
  });

  const whatsappValue = form.watch('whatsappNumber');
  useEffect(() => {
    if (whatsappValue && !form.getValues('contactNumber')) {
      form.setValue('contactNumber', whatsappValue);
    }
  }, [whatsappValue, form]);


  useEffect(() => {
    const fetchSuppliers = async () => {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "suppliers"));
        const suppliersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
        setSuppliers(suppliersData);
        setLoading(false);
    };
    fetchSuppliers();
  }, []);

  async function onSubmit(values: Supplier) {
    try {
        const dataToSave = {
            name: values.name,
            contactPerson: values.contactPerson || '',
            email: values.email || '',
            whatsappNumber: values.whatsappNumber || '',
            contactNumber: values.contactNumber || '',
            bankName: values.bankName || '',
            accountNumber: values.accountNumber || '',
        };

        if (editingSupplier && editingSupplier.id) {
            // Update
            const docRef = doc(db, 'suppliers', editingSupplier.id);
            await updateDoc(docRef, dataToSave);
            setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...s, ...values, id: s.id } : s));
            toast({
              title: 'Supplier Updated',
              description: `${values.name} has been successfully updated.`,
            });
        } else {
            // Create
            const docRef = await addDoc(collection(db, 'suppliers'), dataToSave);
            setSuppliers(prev => [{ ...values, id: docRef.id }, ...prev]);
            toast({
              title: 'Supplier Added',
              description: `${values.name} has been successfully added.`,
            });
        }
        form.reset();
        setEditingSupplier(null);
        setIsDialogOpen(false);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to save supplier.',
        });
    }
  }

  const openDialog = (supplier: Supplier | null) => {
    if (supplier) {
        setEditingSupplier(supplier);
        form.reset({
            name: supplier.name || '',
            contactPerson: supplier.contactPerson || '',
            email: supplier.email || '',
            whatsappNumber: supplier.whatsappNumber || '',
            contactNumber: supplier.contactNumber || '',
            bankName: supplier.bankName || '',
            accountNumber: supplier.accountNumber || '',
        });
    } else {
        setEditingSupplier(null);
        form.reset({
            name: '',
            contactPerson: '',
            email: '',
            whatsappNumber: '',
            contactNumber: '',
            bankName: '',
            accountNumber: '',
        });
    }
    setIsDialogOpen(true);
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                    <CardTitle>Supplier List</CardTitle>
                    <CardDescription>
                    Manage your supplier information.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search suppliers..."
                      className="w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingSupplier(null); setIsDialogOpen(isOpen); }}>
                        <DialogTrigger asChild>
                            <Button onClick={() => openDialog(null)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add New Supplier
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                                    <ScrollArea className="flex-1 pr-6">
                                        <div className="space-y-4 py-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                  control={form.control}
                                                  name="name"
                                                  render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Supplier Name</FormLabel>
                                                    <FormControl><Input placeholder="e.g. Timber Co." {...field} /></FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}/>
                                                <FormField
                                                  control={form.control}
                                                  name="contactPerson"
                                                  render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Contact Person</FormLabel>
                                                    <FormControl><Input placeholder="e.g. John Doe" {...field} /></FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}/>
                                                <FormField
                                                  control={form.control}
                                                  name="email"
                                                  render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Email Address</FormLabel>
                                                    <FormControl><Input placeholder="e.g. contact@timberco.com" {...field} /></FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}/>
                                                <FormField
                                                  control={form.control}
                                                  name="whatsappNumber"
                                                  render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>WhatsApp Number</FormLabel>
                                                    <FormControl><Input placeholder="e.g. +1 555-123-4567" {...field} /></FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}/>
                                                <FormField
                                                  control={form.control}
                                                  name="contactNumber"
                                                  render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Contact Number</FormLabel>
                                                    <FormControl><Input placeholder="e.g. +1 555-123-4567" {...field} /></FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}/>
                                                <FormField
                                                  control={form.control}
                                                  name="bankName"
                                                  render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Bank Name</FormLabel>
                                                    <FormControl><Input placeholder="e.g. National Bank" {...field} /></FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}/>
                                                <FormField
                                                  control={form.control}
                                                  name="accountNumber"
                                                  render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Account Number</FormLabel>
                                                    <FormControl><Input placeholder="e.g. 1234567890" {...field} /></FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}/>
                                            </div>
                                        </div>
                                    </ScrollArea>
                                    <DialogFooter className="pt-4">
                                        <DialogClose asChild>
                                            <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <Button type="submit">{editingSupplier ? 'Save Changes' : 'Add Supplier'}</Button>
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
                  <TableHead>Contact No.</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account No.</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
                ) : filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.contactPerson}</TableCell>
                        <TableCell>{supplier.contactNumber}</TableCell>
                        <TableCell>{supplier.bankName || '-'}</TableCell>
                        <TableCell>{supplier.accountNumber || '-'}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openDialog(supplier)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                     <TableRow>
                        <TableCell colSpan={6} className="text-center">
                            No suppliers found.
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

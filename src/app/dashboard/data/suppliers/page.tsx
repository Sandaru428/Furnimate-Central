
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
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';

const supplierSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Supplier name is required"),
    contact: z.string().min(1, "Contact info is required"),
});

type Supplier = z.infer<typeof supplierSchema>;


export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

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


  const form = useForm<Omit<Supplier, 'id'>>({
    resolver: zodResolver(supplierSchema.omit({id: true})),
    defaultValues: {
      name: '',
      contact: '',
    },
  });

  async function onSubmit(values: Omit<Supplier, 'id'>) {
    try {
        const docRef = await addDoc(collection(db, 'suppliers'), values);
        setSuppliers([...suppliers, { ...values, id: docRef.id }]);
        toast({
        title: 'Supplier Added',
        description: `${values.name} has been successfully added.`,
        });
        form.reset();
        setIsDialogOpen(false);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to add supplier.',
        });
    }
  }

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add New Supplier
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add New Supplier</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)}>
                                    <ScrollArea className="max-h-[70vh] w-full">
                                        <div className="space-y-4 py-4 px-1">
                                            <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Supplier Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Timber Co." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                            />
                                            <FormField
                                            control={form.control}
                                            name="contact"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Contact Info</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. John Doe, 555-123-4567" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                            />
                                        </div>
                                    </ScrollArea>
                                    <DialogFooter className="pt-4">
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
                  <TableHead>Contact</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
                ) : filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.contact}</TableCell>
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
                    ))
                ) : (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center">
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

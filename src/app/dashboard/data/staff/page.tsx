
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, deleteDoc } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAtom } from 'jotai';
import { staffAtom, type Staff } from '@/lib/store';
import { toSentenceCase } from '@/lib/utils';

const staffSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Staff name is required'),
  dateOfBirth: z.string().optional(),
  nic: z.string().optional(),
  contactNumber: z.string().min(1, 'Contact number is required'),
  whatsappNumber: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  position: z.string().min(1, 'Position is required'),
});


export default function StaffPage() {
  const [staff, setStaff] = useAtom(staffAtom);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const form = useForm<Staff>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: '',
      dateOfBirth: '',
      nic: '',
      contactNumber: '',
      whatsappNumber: '',
      email: '',
      position: '',
    },
  });
  
  const contactNumberValue = form.watch('contactNumber');
  useEffect(() => {
    if (contactNumberValue && !form.getValues('whatsappNumber')) {
      form.setValue('whatsappNumber', contactNumberValue);
    }
  }, [contactNumberValue, form]);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      const q = query(collection(db, "staff"));
      const querySnapshot = await getDocs(q);
      const staffData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
              id: doc.id, 
              ...data,
              dateOfBirth: data.dateOfBirth ? (typeof data.dateOfBirth.toDate === 'function' ? format(data.dateOfBirth.toDate(), 'yyyy-MM-dd') : data.dateOfBirth) : '',
          } as Staff
      });
      setStaff(staffData);
      setLoading(false);
    };
    fetchStaff();
  }, [setStaff]);

  async function onSubmit(values: Staff) {
    try {
      const dataToSave: any = {
        name: toSentenceCase(values.name),
        nic: values.nic,
        contactNumber: values.contactNumber,
        whatsappNumber: values.whatsappNumber,
        email: values.email,
        position: toSentenceCase(values.position),
      };
      if (values.dateOfBirth) {
        dataToSave.dateOfBirth = new Date(values.dateOfBirth);
      }

      if (editingStaff && editingStaff.id) {
        // Update
        const docRef = doc(db, 'staff', editingStaff.id);
        await updateDoc(docRef, dataToSave);
        setStaff(prev => prev.map(c => c.id === editingStaff.id ? { ...c, ...values, name: dataToSave.name, position: dataToSave.position, dateOfBirth: values.dateOfBirth } as Staff : c));
        toast({
          title: 'Staff Updated',
          description: `${dataToSave.name} has been successfully updated.`,
        });
      } else {
        // Create
        const docRef = await addDoc(collection(db, 'staff'), dataToSave);
        const newStaff: Staff = { 
          ...values, 
          name: dataToSave.name,
          position: dataToSave.position,
          id: docRef.id,
        };
        setStaff(prev => [newStaff, ...prev]);
        toast({
          title: 'Staff Added',
          description: `${dataToSave.name} has been successfully added.`,
        });
      }
      form.reset();
      setEditingStaff(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save staff member: ", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save staff member.',
      });
    }
  }

  const openDialog = (staffMember: Staff | null) => {
    if (staffMember) {
        setEditingStaff(staffMember);
        form.reset(staffMember);
    } else {
        setEditingStaff(null);
        form.reset({
            name: '',
            dateOfBirth: '',
            nic: '',
            contactNumber: '',
            whatsappNumber: '',
            email: '',
            position: '',
        });
    }
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (staffId: string) => {
    try {
        await deleteDoc(doc(db, "staff", staffId));
        setStaff(staff.filter(s => s.id !== staffId));
        toast({ title: 'Staff Member Deleted' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete staff member.' });
    }
  }

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contactNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <main className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Staff</h1>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search staff..."
              className="w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
              <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingStaff(null); setIsDialogOpen(isOpen); }}>
              <DialogTrigger asChild>
                <Button onClick={() => openDialog(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <ScrollArea className="flex-1 pr-6">
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g. John Doe" {...field} /></FormControl><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="position" render={({ field }) => <FormItem><FormLabel>Position</FormLabel><FormControl><Input placeholder="e.g. Manager, Cutter" {...field} /></FormControl><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="dateOfBirth" render={({ field }) => <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="nic" render={({ field }) => <FormItem><FormLabel>NIC</FormLabel><FormControl><Input placeholder="e.g. 901234567V" {...field} /></FormControl><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="contactNumber" render={({ field }) => <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="e.g. 0771234567" {...field} /></FormControl><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="whatsappNumber" render={({ field }) => <FormItem><FormLabel>WhatsApp Number</FormLabel><FormControl><Input placeholder="e.g. 0771234567" {...field} /></FormControl><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="e.g. john.d@example.com" {...field} /></FormControl><FormMessage /></FormItem>} />
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="pt-4">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">{editingStaff ? 'Save Changes' : 'Add Staff Member'}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Staff List</CardTitle>
            <CardDescription>Manage your staff information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Contact Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>DOB</TableHead>
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
                ) : filteredStaff.length > 0 ? (
                    filteredStaff.map((staffMember) => (
                    <TableRow key={staffMember.id}>
                        <TableCell className="font-medium">{staffMember.name}</TableCell>
                        <TableCell>{staffMember.position}</TableCell>
                        <TableCell>{staffMember.contactNumber}</TableCell>
                        <TableCell>{staffMember.email}</TableCell>
                        <TableCell>{staffMember.nic}</TableCell>
                        <TableCell>
                           {staffMember.dateOfBirth ? staffMember.dateOfBirth : '-'}
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
                            <DropdownMenuItem onClick={() => openDialog(staffMember)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(staffMember.id!)}>
                                Delete
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center">
                            No staff members found.
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


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
import { collection, addDoc, getDocs, doc, updateDoc, query, where, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAtom } from 'jotai';
import { companyProfileAtom, staffAtom, type Staff } from '@/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { USER_ROLES, MAIN_TABS, UserRole, MainTab } from '@/lib/roles';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

const userSchema = z.object({
  id: z.string().optional(),
  staffId: z.string().min(1, "Please select a staff member."),
  name: z.string().min(1, 'User name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(USER_ROLES, { required_error: 'User role is required' }),
  accessOptions: z.array(z.string()).optional(),
});

type User = z.infer<typeof userSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [staff, setStaff] = useAtom(staffAtom);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [companyProfile] = useAtom(companyProfileAtom);

  const form = useForm<User>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      staffId: '',
      name: '',
      email: '',
      role: undefined,
      accessOptions: [],
    },
  });

  const selectedStaffId = form.watch('staffId');
  useEffect(() => {
    if (selectedStaffId) {
        const selectedStaffMember = staff.find(s => s.id === selectedStaffId);
        if (selectedStaffMember) {
            form.setValue('name', selectedStaffMember.name);
            form.setValue('email', selectedStaffMember.email || '');
        }
    }
  }, [selectedStaffId, staff, form]);

  const accessOptionsValue = form.watch('accessOptions') || [];
    const allAccessOptions = MAIN_TABS.map(tab => tab.id);

    const handleSelectAll = (checked: boolean | 'indeterminate') => {
        if (checked === true) {
            form.setValue('accessOptions', allAccessOptions);
        } else {
            form.setValue('accessOptions', []);
        }
    };

  useEffect(() => {
    const fetchUsersAndStaff = async () => {
      if (!companyProfile.companyName) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const companyId = companyProfile.companyName;
      const usersQuery = query(collection(db, "users"), where("companyId", "==", companyId));
      const staffQuery = query(collection(db, "staff"), where("companyId", "==", companyId));
      
      const [usersSnapshot, staffSnapshot] = await Promise.all([
          getDocs(usersQuery),
          getDocs(staffQuery),
      ]);
      
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      const staffData = staffSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));

      setUsers(usersData);
      setStaff(staffData);
      setLoading(false);
    };
    fetchUsersAndStaff();
  }, [companyProfile, setStaff]);

  async function onSubmit(values: User) {
    try {
      const dataToSave: any = {
        companyId: companyProfile.companyName,
        staffId: values.staffId,
        name: values.name,
        email: values.email,
        role: values.role,
        accessOptions: values.accessOptions || [],
      };

      if (editingUser && editingUser.id) {
        // Update
        const docRef = doc(db, 'users', editingUser.id);
        await updateDoc(docRef, dataToSave);
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...values } : u));
        toast({
          title: 'User Updated',
          description: `${values.name} has been successfully updated.`,
        });
      } else {
        // Create
        const docRef = await addDoc(collection(db, 'users'), dataToSave);
        const newUser: User = { 
          ...values, 
          id: docRef.id,
        };
        setUsers(prev => [newUser, ...prev]);
        toast({
          title: 'User Added',
          description: `${values.name} has been successfully added.`,
        });
      }
      form.reset();
      setEditingUser(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save user: ", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save user.',
      });
    }
  }

  const handleDelete = async (userId: string) => {
    try {
        await deleteDoc(doc(db, "users", userId));
        setUsers(users.filter(u => u.id !== userId));
        toast({ title: 'User Deleted' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete user.' });
    }
  }

  const openDialog = (user: User | null) => {
    if (user) {
        setEditingUser(user);
        form.reset({ ...user });
    } else {
        setEditingUser(null);
        form.reset({
            staffId: '',
            name: '',
            email: '',
            role: undefined,
            accessOptions: [],
        });
    }
    setIsDialogOpen(true);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableStaff = staff.filter(s => !users.some(u => u.staffId === s.id) || (editingUser && s.id === editingUser.staffId));

  return (
    <>
      <main className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Users</h1>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search users..."
              className="w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
              <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingUser(null); setIsDialogOpen(isOpen); }}>
              <DialogTrigger asChild>
                <Button onClick={() => openDialog(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <ScrollArea className="flex-1 pr-6">
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="staffId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Select Staff Member</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={!!editingUser}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select a staff member" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {availableStaff.map(s => <SelectItem key={s.id} value={s.id!}>{s.name} ({s.email})</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="e.g. john.s@example.com" {...field} readOnly /></FormControl><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="role" render={({ field }) => <FormItem><FormLabel>User Role</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{USER_ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                            </div>
                            <FormField
                                control={form.control}
                                name="accessOptions"
                                render={() => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                          <FormLabel>User Access Options</FormLabel>
                                          <div className="flex items-center space-x-2">
                                              <Checkbox
                                                  id="select-all"
                                                  checked={accessOptionsValue.length === allAccessOptions.length}
                                                  onCheckedChange={handleSelectAll}
                                              />
                                              <Label htmlFor="select-all" className="text-sm font-medium">Select All</Label>
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border p-4">
                                            {MAIN_TABS.map((item) => (
                                                <FormField
                                                key={item.id}
                                                control={form.control}
                                                name="accessOptions"
                                                render={({ field }) => {
                                                    return (
                                                    <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0 w-48">
                                                        <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(item.id)}
                                                            onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...(field.value || []), item.id])
                                                                : field.onChange(
                                                                    field.value?.filter(
                                                                    (value) => value !== item.id
                                                                    )
                                                                )
                                                            }}
                                                        />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">{item.label}</FormLabel>
                                                    </FormItem>
                                                    )
                                                }}
                                                />
                                            ))}
                                        </div>
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
                        <Button type="submit">{editingUser ? 'Save Changes' : 'Add User'}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>Manage user accounts and permissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">
                            Loading...
                        </TableCell>
                    </TableRow>
                ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                        <TableCell className="max-w-[200px]">
                            <div className="flex flex-wrap gap-1">
                                {user.accessOptions?.map(access => {
                                    const tab = MAIN_TABS.find(t => t.id === access);
                                    return <Badge key={access} variant="outline">{tab?.label || access}</Badge>
                                })}
                            </div>
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
                            <DropdownMenuItem onClick={() => openDialog(user)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user.id!)}>
                                Delete
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">
                            No users found.
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

    
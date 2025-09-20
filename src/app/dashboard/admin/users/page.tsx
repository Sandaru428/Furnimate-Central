
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
  DropdownMenuSeparator,
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
import { MoreHorizontal, PlusCircle, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, deleteDoc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAtom } from 'jotai';
import { companyProfileAtom, staffAtom, type Staff, userRolesAtom, type UserRoleDef } from '@/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MAIN_TABS, MainTab } from '@/lib/roles';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';


const userSchema = z.object({
  id: z.string().optional(),
  staffId: z.string().min(1, "Please select a staff member."),
  name: z.string().min(1, 'User name is required'),
  email: z.string().email('Invalid email address'),
  role: z.string({ required_error: 'User role is required' }),
});

const roleSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Role name is required"),
    accessOptions: z.array(z.string()),
});

type User = z.infer<typeof userSchema>;
type RoleFormValues = z.infer<typeof roleSchema>;

// Filter out 'company-profile' as it's not a selectable permission
const selectableMainTabs = MAIN_TABS.filter(tab => tab.id !== 'company-profile');


export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [staff, setStaff] = useAtom(staffAtom);
  const [userRoles, setUserRoles] = useAtom(userRolesAtom);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<UserRoleDef | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { handlePasswordReset } = useAuth();
  const [loading, setLoading] = useState(true);

  const userForm = useForm<User>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      staffId: '',
      name: '',
      email: '',
      role: undefined,
    },
  });
  
  const roleForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      id: '',
      name: '',
      accessOptions: [],
    },
  });

  const selectedStaffId = userForm.watch('staffId');
  useEffect(() => {
    if (selectedStaffId) {
        const selectedStaffMember = staff.find(s => s.id === selectedStaffId);
        if (selectedStaffMember) {
            userForm.setValue('name', selectedStaffMember.name);
            userForm.setValue('email', selectedStaffMember.email || '');
        }
    }
  }, [selectedStaffId, staff, userForm]);

  const roleAccessOptionsValue = roleForm.watch('accessOptions') || [];
  const allAccessOptions = selectableMainTabs.map(tab => tab.id);

  const handleSelectAllRoleAccess = (checked: boolean | 'indeterminate') => {
      if (checked === true) {
          roleForm.setValue('accessOptions', allAccessOptions);
      } else {
          roleForm.setValue('accessOptions', []);
      }
  };


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const usersQuery = query(collection(db, "users"));
      const staffQuery = query(collection(db, "staff"));
      const rolesQuery = query(collection(db, "userRoles"));
      
      const [usersSnapshot, staffSnapshot, rolesSnapshot] = await Promise.all([
          getDocs(usersQuery),
          getDocs(staffQuery),
          getDocs(rolesQuery),
      ]);
      
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      const staffData = staffSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
      
      let rolesData = rolesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRoleDef));
      if (rolesData.length === 0) {
        // Seed roles if none exist
        const defaultRoles: Omit<UserRoleDef, 'id'>[] = [
          { name: 'Super Admin', accessOptions: allAccessOptions },
          { name: 'Admin', accessOptions: [] },
          { name: 'Level-1', accessOptions: [] },
          { name: 'Level-2', accessOptions: [] },
          { name: 'Level-3', accessOptions: [] },
        ];
        const newRoles = [];
        for (const role of defaultRoles) {
            const docRef = await addDoc(collection(db, 'userRoles'), { ...role });
            newRoles.push({ ...role, id: docRef.id });
        }
        rolesData = newRoles;
      }

      setUsers(usersData);
      setStaff(staffData);
      setUserRoles(rolesData);
      setLoading(false);
    };
    fetchData();
  }, [setStaff, setUserRoles]);

  async function onUserSubmit(values: User) {
    try {
      const selectedRole = userRoles.find(r => r.name === values.role);
      if (!selectedRole) throw new Error("Selected role not found");

      const dataToSave: any = {
        staffId: values.staffId,
        name: values.name,
        email: values.email,
        role: values.role,
        accessOptions: selectedRole.accessOptions, // Inherit from role
      };

      if (editingUser && editingUser.id) {
        // Update
        const docRef = doc(db, 'users', editingUser.id);
        await updateDoc(docRef, dataToSave);
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...values, accessOptions: selectedRole.accessOptions } : u));
        toast({ title: 'User Updated' });
      } else {
        // Create
        const docRef = await addDoc(collection(db, 'users'), dataToSave);
        setUsers(prev => [{ ...values, id: docRef.id, accessOptions: selectedRole.accessOptions }, ...prev]);
        toast({ title: 'User Added' });
      }
      userForm.reset();
      setEditingUser(null);
      setIsUserDialogOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save user.' });
    }
  }

  async function onRoleSubmit(values: RoleFormValues) {
    try {
        const dataToSave = {
            name: values.name,
            accessOptions: values.accessOptions,
        };

        if (editingRole) { // Update existing role
            const docRef = doc(db, 'userRoles', editingRole.id);
            await updateDoc(docRef, { name: values.name, accessOptions: values.accessOptions });
            setUserRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...values } : r));
            toast({ title: 'Role Updated', description: `The "${values.name}" role has been updated.` });
        } else { // Create new role
            const docRef = await addDoc(collection(db, 'userRoles'), dataToSave);
            setUserRoles(prev => [...prev, { ...dataToSave, id: docRef.id }]);
            toast({ title: 'Role Created', description: `The "${values.name}" role has been added.` });
        }
        
        setIsRoleDialogOpen(false);
        setEditingRole(null);
        roleForm.reset();

    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save role.' });
    }
}


  const handleDeleteUser = async (userId: string) => {
    try {
        await deleteDoc(doc(db, "users", userId));
        setUsers(users.filter(u => u.id !== userId));
        toast({ title: 'User Deleted' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete user.' });
    }
  }

  const handleResetPassword = async (email: string) => {
    await handlePasswordReset(email);
  }

  const openUserDialog = (user: User | null) => {
    if (user) {
        setEditingUser(user);
        userForm.reset({ ...user });
    } else {
        setEditingUser(null);
        userForm.reset({ staffId: '', name: '', email: '', role: undefined });
    }
    setIsUserDialogOpen(true);
  };

  const openRoleDialog = (role: UserRoleDef | null) => {
    if (role) {
        setEditingRole(role);
        roleForm.reset({ id: role.id, name: role.name, accessOptions: role.accessOptions });
    } else {
        setEditingRole(null);
        roleForm.reset({ id: '', name: '', accessOptions: [] });
    }
    setIsRoleDialogOpen(true);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableStaff = staff.filter(s => !users.some(u => u.staffId === s.id) || (editingUser && s.id === editingUser.staffId));
  
  const userRole = userForm.watch('role');
  const effectiveAccessOptions = userRoles.find(r => r.name === userRole)?.accessOptions || [];

  return (
    <>
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
        <Tabs defaultValue="users">
            <div className="flex items-center justify-between mb-4">
                 <TabsList>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="roles">User Roles</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                    <Input
                    placeholder="Search..."
                    className="w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Dialog open={isUserDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingUser(null); setIsUserDialogOpen(isOpen); }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => openUserDialog(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                        <DialogHeader>
                        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                        </DialogHeader>
                        <Form {...userForm}>
                        <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="flex flex-col flex-1 overflow-hidden">
                            <ScrollArea className="flex-1 pr-6">
                                <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={userForm.control} name="staffId" render={({ field }) => (
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
                                        )}/>
                                        <FormField control={userForm.control} name="email" render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="e.g. john.s@example.com" {...field} readOnly /></FormControl><FormMessage /></FormItem>} />
                                        <FormField control={userForm.control} name="role" render={({ field }) => <FormItem><FormLabel>User Role</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{userRoles.map(role => <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                                    </div>
                                    <FormItem>
                                        <FormLabel>Effective Access (Read-only)</FormLabel>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 rounded-lg border p-4">
                                            {MAIN_TABS.map((item) => (
                                                <div key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                    <Checkbox
                                                        checked={effectiveAccessOptions.includes(item.id)}
                                                        disabled
                                                    />
                                                    <Label className="font-normal">{item.label}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </FormItem>

                                </div>
                            </ScrollArea>
                            <DialogFooter className="pt-4">
                                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                <Button type="submit">{editingUser ? 'Save Changes' : 'Add User'}</Button>
                            </DialogFooter>
                        </form>
                        </Form>
                    </DialogContent>
                    </Dialog>
                </div>
            </div>

            <TabsContent value="users">
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
                        <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                                <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openUserDialog(user)}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleResetPassword(user.email)}>Reset Password</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.id!)}>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={4} className="text-center">No users found.</TableCell></TableRow>
                        )}
                    </TableBody>
                    </Table>
                </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="roles">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>User Roles</CardTitle>
                            <CardDescription>Define roles and their permissions for the application.</CardDescription>
                        </div>
                        <Button onClick={() => openRoleDialog(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create New Role
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Role Name</TableHead>
                                    <TableHead>Permissions</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
                                ) : userRoles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell className="max-w-md">
                                            <div className="flex flex-wrap gap-1">
                                                {role.accessOptions?.map(access => {
                                                    const tab = MAIN_TABS.find(t => t.id === access);
                                                    return <Badge key={access} variant="outline">{tab?.label || access}</Badge>
                                                })}
                                                {role.accessOptions.length === 0 && <span className="text-muted-foreground text-sm">No permissions</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                             <Button variant="ghost" size="icon" onClick={() => openRoleDialog(role)} disabled={role.name === 'Super Admin'}>
                                                <Edit className="h-4 w-4" />
                                             </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </main>

      {/* Edit/Create Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Role'}</DialogTitle>
                <CardDescription>{editingRole ? 'Modify the access permissions for this role.' : 'Define a new role and its permissions.'}</CardDescription>
            </DialogHeader>
            <Form {...roleForm}>
                <form onSubmit={roleForm.handleSubmit(onRoleSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <ScrollArea className="flex-1 pr-6">
                       <div className="space-y-4 py-4">
                            {!editingRole && (
                                <FormField
                                    control={roleForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role Name</FormLabel>
                                            <FormControl><Input placeholder="e.g. Sales Manager" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <FormField
                                control={roleForm.control}
                                name="accessOptions"
                                render={() => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Permissions</FormLabel>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="select-all"
                                                    checked={roleAccessOptionsValue.length === allAccessOptions.length}
                                                    onCheckedChange={handleSelectAllRoleAccess}
                                                />
                                                <Label htmlFor="select-all" className="text-sm font-medium">Select All</Label>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 rounded-lg border p-4">
                                            {selectableMainTabs.map((item) => (
                                                <FormField
                                                key={item.id}
                                                control={roleForm.control}
                                                name="accessOptions"
                                                render={({ field }) => (
                                                    <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                        <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(item.id)}
                                                            onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...(field.value || []), item.id])
                                                                : field.onChange(field.value?.filter((value) => value !== item.id))
                                                            }}
                                                        />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">{item.label}</FormLabel>
                                                    </FormItem>
                                                )}
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
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

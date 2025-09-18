
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
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAtom } from 'jotai';
import { currencyAtom } from '@/lib/store';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';


const itemSchema = z.object({
    id: z.string().optional(),
    itemCode: z.string().min(1, "Item code is required"),
    name: z.string().min(1, "Item name is required"),
    type: z.enum(['Raw Material', 'Finished Good']),
    unitPrice: z.coerce.number().positive("Unit price must be a positive number."),
    stockLevel: z.coerce.number().int().min(0, "Stock level cannot be negative."),
});

export type MasterDataItem = z.infer<typeof itemSchema>;

export default function MasterDataPage() {
    const [masterData, setMasterData] = useState<MasterDataItem[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    const [currency] = useAtom(currencyAtom);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMasterData = async () => {
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, "masterData"));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MasterDataItem));
            setMasterData(data);
            setLoading(false);
        };
        fetchMasterData();
    }, []);

    const form = useForm<Omit<MasterDataItem, 'id'>>({
        resolver: zodResolver(itemSchema.omit({id: true})),
        defaultValues: {
            itemCode: '',
            name: '',
            type: undefined,
            unitPrice: '' as any,
            stockLevel: '' as any,
        },
    });

    async function onSubmit(values: Omit<MasterDataItem, 'id'>) {
        try {
            const docRef = await addDoc(collection(db, 'masterData'), values);
            setMasterData([...masterData, { ...values, id: docRef.id }]);
            toast({
              title: 'Item Added',
              description: `${values.name} has been successfully added.`,
            });
            form.reset();
            setIsDialogOpen(false);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to add item.',
            });
        }
    }

    const filteredMasterData = masterData.filter(
        (item) =>
          item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.type.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <>
      <header className="flex items-center p-4 border-b">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold ml-4">Master Data</h1>
      </header>
      <main className="p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Master Item List</CardTitle>
                    <CardDescription>
                    A consolidated list of all raw materials and finished goods.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search items..."
                      className="w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add New Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Add New Item</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                                    <ScrollArea className="flex-1 pr-6">
                                        <div className="space-y-4 py-4">
                                            <FormField
                                            control={form.control}
                                            name="itemCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Item Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., WD-002" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                            />
                                            <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Walnut Wood Plank" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                            />
                                            <FormField
                                            control={form.control}
                                            name="type"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Type</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select item type" />
                                                    </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                    <SelectItem value="Raw Material">Raw Material</SelectItem>
                                                    <SelectItem value="Finished Good">Finished Good</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                            />
                                            <FormField
                                            control={form.control}
                                            name="unitPrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Unit Price</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="e.g. 10.50" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                            />
                                            <FormField
                                            control={form.control}
                                            name="stockLevel"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Stock Level</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="e.g. 100" {...field} />
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
                                        <Button type="submit">Add Item</Button>
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
                  <TableHead>Item Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Stock Level</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
                ) : filteredMasterData.length > 0 ? (
                    filteredMasterData.map((item) => (
                    <TableRow key={item.itemCode}>
                        <TableCell className="font-mono">{item.itemCode}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                        <Badge variant="secondary">{item.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{currency.code} {item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.stockLevel}</TableCell>
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
                        <TableCell colSpan={6} className="text-center">
                            No master data found.
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

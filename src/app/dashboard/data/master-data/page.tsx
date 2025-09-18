
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const itemSchema = z.object({
    id: z.string().optional(),
    itemCode: z.string().min(1, "Item code is required"),
    name: z.string().min(1, "Item name is required"),
    type: z.enum(['Raw Material', 'Finished Good'], { required_error: "Item type is required" }),
    unitPrice: z.coerce.number().positive("Unit price must be a positive number."),
    stockLevel: z.coerce.number().int().min(0, "Stock level cannot be negative."),
    minimumLevel: z.coerce.number().int().min(0, "Minimum level cannot be negative.").optional(),
    maximumLevel: z.coerce.number().int().min(0, "Maximum level cannot be negative.").optional(),
    linkedItems: z.array(z.string()).optional(),
}).refine(data => {
    if (data.minimumLevel !== undefined && data.maximumLevel !== undefined) {
        return data.maximumLevel >= data.minimumLevel;
    }
    return true;
}, {
    message: "Maximum level must be greater than or equal to minimum level.",
    path: ["maximumLevel"],
});

export type MasterDataItem = z.infer<typeof itemSchema>;

export default function MasterDataPage() {
    const [masterData, setMasterData] = useState<MasterDataItem[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
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

    const form = useForm<MasterDataItem>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            itemCode: '',
            name: '',
            type: undefined,
            unitPrice: '' as any,
            stockLevel: '' as any,
            minimumLevel: '' as any,
            maximumLevel: '' as any,
            linkedItems: [],
        },
    });

    const itemType = form.watch('type');

    async function onSubmit(values: MasterDataItem) {
        try {
            const dataToSave: Omit<MasterDataItem, 'id'> = {
                itemCode: values.itemCode,
                name: values.name,
                type: values.type,
                unitPrice: values.unitPrice,
                stockLevel: values.stockLevel,
                minimumLevel: values.minimumLevel,
                maximumLevel: values.maximumLevel,
                linkedItems: values.linkedItems || [],
            };

            if (editingItem && editingItem.id) {
                // Update
                const docRef = doc(db, 'masterData', editingItem.id);
                await updateDoc(docRef, dataToSave);
                setMasterData(masterData.map(item => item.id === editingItem.id ? { ...item, ...values, id: item.id } : item));
                toast({
                  title: 'Item Updated',
                  description: `${values.name} has been successfully updated.`,
                });
            } else {
                // Create
                const docRef = await addDoc(collection(db, 'masterData'), dataToSave);
                setMasterData(prev => [{ ...values, id: docRef.id }, ...prev]);
                toast({
                  title: 'Item Added',
                  description: `${values.name} has been successfully added.`,
                });
            }
            form.reset();
            setEditingItem(null);
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Failed to save item: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save item.',
            });
        }
    }

    const openDialog = (item: MasterDataItem | null) => {
        if (item) {
            setEditingItem(item);
            form.reset(item);
        } else {
            setEditingItem(null);
            form.reset({
                itemCode: '',
                name: '',
                type: undefined,
                unitPrice: '' as any,
                stockLevel: '' as any,
                minimumLevel: '' as any,
                maximumLevel: '' as any,
                linkedItems: [],
            });
        }
        setIsDialogOpen(true);
    };

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
                     <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingItem(null); setIsDialogOpen(isOpen); }}>
                        <DialogTrigger asChild>
                            <Button onClick={() => openDialog(null)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add New Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                                    <ScrollArea className="flex-1 pr-6">
                                        <div className="space-y-4 py-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField control={form.control} name="itemCode" render={({ field }) => ( <FormItem><FormLabel>Item Code</FormLabel><FormControl><Input placeholder="e.g., WD-002" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g., Walnut Wood Plank" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                                <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select item type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Raw Material">Raw Material</SelectItem><SelectItem value="Finished Good">Finished Good</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                                                <FormField control={form.control} name="unitPrice" render={({ field }) => ( <FormItem><FormLabel>Unit Price ({currency.code})</FormLabel><FormControl><Input type="number" placeholder="e.g. 10.50" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                            </div>
                                            
                                            <div className="grid grid-cols-3 gap-4">
                                                <FormField control={form.control} name="stockLevel" render={({ field }) => ( <FormItem><FormLabel>Stock Level</FormLabel><FormControl><Input type="number" placeholder="e.g. 100" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                                <FormField control={form.control} name="minimumLevel" render={({ field }) => ( <FormItem><FormLabel>Min Level</FormLabel><FormControl><Input type="number" placeholder="e.g. 10" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                                <FormField control={form.control} name="maximumLevel" render={({ field }) => ( <FormItem><FormLabel>Max Level</FormLabel><FormControl><Input type="number" placeholder="e.g. 200" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                            </div>

                                            {itemType && (
                                                <FormField
                                                    control={form.control}
                                                    name="linkedItems"
                                                    render={({ field }) => (
                                                        <FormItem className="md:col-span-2">
                                                            <FormLabel>{itemType === 'Raw Material' ? 'Link to Finished Good(s)' : 'Link to Raw Material(s)'}</FormLabel>
                                                            <Controller
                                                                control={form.control}
                                                                name="linkedItems"
                                                                render={({ field }) => {
                                                                    const options = masterData.filter(i => i.type === (itemType === 'Raw Material' ? 'Finished Good' : 'Raw Material'));
                                                                    return (
                                                                        <Popover>
                                                                            <PopoverTrigger asChild>
                                                                                <FormControl>
                                                                                    <Button variant="outline" role="combobox" className={cn( "w-full justify-between", !field.value?.length && "text-muted-foreground" )}>
                                                                                        {field.value?.length ? `${field.value.length} selected` : "Select items..."}
                                                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                                    </Button>
                                                                                </FormControl>
                                                                            </PopoverTrigger>
                                                                            <PopoverContent className="w-[300px] p-0">
                                                                                <ScrollArea className="max-h-60">
                                                                                    <div className="p-2 space-y-1">
                                                                                        {options.map((option) => (
                                                                                            <div key={option.id} className="flex items-center gap-2">
                                                                                                <Checkbox
                                                                                                    id={option.itemCode}
                                                                                                    checked={field.value?.includes(option.itemCode)}
                                                                                                    onCheckedChange={(checked) => {
                                                                                                        const current = field.value || [];
                                                                                                        if (checked) {
                                                                                                            field.onChange([...current, option.itemCode]);
                                                                                                        } else {
                                                                                                            field.onChange(current.filter(code => code !== option.itemCode));
                                                                                                        }
                                                                                                    }}
                                                                                                />
                                                                                                <label htmlFor={option.itemCode} className="text-sm font-medium">{option.name} ({option.itemCode})</label>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </ScrollArea>
                                                                            </PopoverContent>
                                                                        </Popover>
                                                                    )
                                                                }}
                                                            />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                        </div>
                                    </ScrollArea>
                                    <DialogFooter className="pt-4">
                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                        <Button type="submit">{editingItem ? 'Save Changes' : 'Add Item'}</Button>
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
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Min Level</TableHead>
                  <TableHead className="text-right">Max Level</TableHead>
                  <TableHead>Linked Items</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={9} className="text-center">Loading...</TableCell></TableRow>
                ) : filteredMasterData.length > 0 ? (
                    filteredMasterData.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.itemCode}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell><Badge variant="secondary">{item.type}</Badge></TableCell>
                        <TableCell className="text-right">{currency.code} {item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.stockLevel}</TableCell>
                        <TableCell className="text-right">{item.minimumLevel || '-'}</TableCell>
                        <TableCell className="text-right">{item.maximumLevel || '-'}</TableCell>
                        <TableCell className='max-w-[150px]'>
                            <div className="flex flex-wrap gap-1">
                                {item.linkedItems?.map(link => <Badge key={link} variant="outline" className="font-mono">{link}</Badge>)}
                            </div>
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openDialog(item)}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow><TableCell colSpan={9} className="text-center">No master data found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

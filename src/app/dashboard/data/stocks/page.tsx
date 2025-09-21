

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useAtom } from 'jotai';
import { currencyAtom, stocksAtom, purchaseOrdersAtom, saleOrdersAtom, companyProfileAtom } from '@/lib/store';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, deleteDoc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseISO, format } from 'date-fns';
import { Label } from '@/components/ui/label';


const itemSchema = z.object({
    id: z.string().optional(),
    itemCode: z.string().min(1, "Item code is required"),
    name: z.string().min(1, "Item name is required"),
    type: z.enum(['Raw Material', 'Finished Good'], { required_error: "Item type is required" }),
    unitPrice: z.coerce.number().positive("Unit price must be a positive number."),
    stockLevel: z.coerce.number().int().min(0, "Stock level cannot be negative."),
    linkedItems: z.array(z.object({
        id: z.string(),
        quantity: z.coerce.number().int().positive(),
    })).optional(),
});

export type StockItem = z.infer<typeof itemSchema> & {
    minimumLevel?: number;
    maximumLevel?: number;
};

type StockMovement = {
    date: string;
    itemCode: string;
    itemName: string;
    refId: string;
    type: 'PO' | 'SO';
    inQty: number;
    outQty: number;
    balance: number;
};

export default function StocksPage() {
    const [stocks, setStocks] = useAtom(stocksAtom);
    const [purchaseOrders, setPurchaseOrders] = useAtom(purchaseOrdersAtom);
    const [saleOrders, setSaleOrders] = useAtom(saleOrdersAtom);
    const [companyProfile] = useAtom(companyProfileAtom);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    const [currency] = useAtom(currencyAtom);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("itemList");
    const [stockLevelFilter, setStockLevelFilter] = useState<"all" | "Raw Material" | "Finished Good">("all");
    const [selectedMainItemId, setSelectedMainItemId] = useState<string | null>(null);
    const [relatedItemIds, setRelatedItemIds] = useState<string[]>([]);

    const form = useForm<StockItem>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            itemCode: '',
            name: '',
            type: undefined,
            unitPrice: '' as any,
            stockLevel: '' as any,
            linkedItems: [],
        },
    });

    const itemType = form.watch('type');

    useEffect(() => {
        if (itemType && !editingItem) {
            const prefix = itemType === 'Raw Material' ? 'RM' : 'FI';
            const relevantItems = stocks.filter(item => item.itemCode.startsWith(prefix));
            const maxNum = relevantItems.reduce((max, item) => {
                const numPart = parseInt(item.itemCode.split('-')[1]);
                return numPart > max ? numPart : max;
            }, 0);
            const nextNum = maxNum + 1;
            const newItemCode = `${prefix}-${String(nextNum).padStart(3, '0')}`;
            form.setValue('itemCode', newItemCode);
        }
    }, [itemType, stocks, editingItem, form]);


    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            const collections: { [key: string]: (data: any) => void } = {
                stocks: setStocks,
                purchaseOrders: setPurchaseOrders,
                saleOrders: setSaleOrders,
            };

            for (const [key, setter] of Object.entries(collections)) {
                const q = query(collection(db, key));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setter(data as any);
            }
            setLoading(false);
        };
        fetchAllData();
    }, [setStocks, setPurchaseOrders, setSaleOrders]);


    const stockMovements = useMemo(() => {
        const allMovements: Omit<StockMovement, 'balance'>[] = [];

        purchaseOrders.forEach(po => {
            if (po.status !== 'Fulfilled' && po.status !== 'Paid') return;
            po.lineItems.forEach((item: any) => {
                const stockItem = stocks.find(s => s.itemCode === item.itemId);
                if (stockItem) {
                    allMovements.push({
                        date: po.date,
                        itemCode: item.itemId,
                        itemName: stockItem.name,
                        refId: po.id,
                        type: 'PO',
                        inQty: item.quantity,
                        outQty: 0,
                    });
                }
            });
        });

        saleOrders.forEach(so => {
            if (!so.lineItems) return;
            so.lineItems.forEach((item: any) => {
                 const stockItem = stocks.find(s => s.itemCode === item.itemId);
                if (stockItem) {
                    allMovements.push({
                        date: so.date,
                        itemCode: item.itemId,
                        itemName: stockItem.name,
                        refId: so.id,
                        type: 'SO',
                        inQty: 0,
                        outQty: item.quantity,
                    });
                }
            });
        });

        const sortedMovements = allMovements.sort((a, b) => {
            const dateComp = parseISO(a.date).getTime() - parseISO(b.date).getTime();
            if (dateComp !== 0) return dateComp;
            if (companyProfile.stockOrderMethod === 'FIFO') {
                return a.type === 'PO' ? -1 : 1;
            }
            if (companyProfile.stockOrderMethod === 'LIFO') {
                return a.type === 'SO' ? -1 : 1;
            }
            return 0;
        });

        const balances: { [itemCode: string]: number } = {};
        const movementsWithBalance: StockMovement[] = [];

        sortedMovements.forEach(m => {
            if (balances[m.itemCode] === undefined) {
                const stockItem = stocks.find(s => s.itemCode === m.itemCode);
                balances[m.itemCode] = stockItem?.stockLevel || 0;
            }
            
            let balanceAfter;
            if (m.type === 'PO') {
                balanceAfter = (balances[m.itemCode] || 0) + m.inQty;
            } else {
                balanceAfter = (balances[m.itemCode] || 0) - m.outQty;
            }
            
            movementsWithBalance.push({ ...m, balance: balanceAfter });
            balances[m.itemCode] = balanceAfter;
        });

        const finalSortOrder = companyProfile.stockOrderMethod === 'LIFO' ? (a:any, b:any) => b.date.localeCompare(a.date) : (a:any, b:any) => a.date.localeCompare(b.date);
        
        return movementsWithBalance.sort(finalSortOrder);
    }, [stocks, purchaseOrders, saleOrders, companyProfile.stockOrderMethod]);

    const filteredStockMovements = useMemo(() => {
        if (!searchTerm) return stockMovements;
        return stockMovements.filter(m => 
            m.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.refId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [stockMovements, searchTerm]);


    async function onSubmit(values: StockItem) {
        try {
            const dataToSave: Omit<StockItem, 'id'> = {
                itemCode: values.itemCode,
                name: values.name,
                type: values.type,
                unitPrice: values.unitPrice,
                stockLevel: values.stockLevel,
                linkedItems: values.linkedItems || [],
            };

            if (editingItem && editingItem.id) {
                // Update
                const docRef = doc(db, 'stocks', editingItem.id);
                await updateDoc(docRef, dataToSave as any);
                setStocks(stocks.map(item => item.id === editingItem.id ? { ...item, ...values, id: item.id } : item).sort((a, b) => a.itemCode.localeCompare(b.itemCode)));
                toast({
                  title: 'Item Updated',
                  description: `${values.name} has been successfully updated.`,
                });
            } else {
                // Create
                const docRef = await addDoc(collection(db, 'stocks'), dataToSave);
                setStocks(prev => [...prev, { ...values, id: docRef.id }].sort((a, b) => a.itemCode.localeCompare(b.itemCode)));
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

    const openDialog = (item: StockItem | null) => {
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
                linkedItems: [],
            });
        }
        setIsDialogOpen(true);
    };

    const handleDelete = async (itemId: string) => {
        try {
            await deleteDoc(doc(db, "stocks", itemId));
            setStocks(stocks.filter(s => s.id !== itemId));
            toast({ title: 'Stock Item Deleted', description: 'The item has been removed from stock.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete stock item.' });
        }
    };
      
    const filteredStockLevels = stocks.filter(item => {
        const typeMatch = stockLevelFilter === 'all' || item.type === stockLevelFilter;
        const searchMatch = searchTerm === "" ||
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
        return typeMatch && searchMatch;
    });

    const totalStockValue = filteredStockLevels.reduce((acc, item) => acc + (item.stockLevel * item.unitPrice), 0);
    const totalStockCount = filteredStockLevels.reduce((acc, item) => acc + item.stockLevel, 0);

    const BomManager = ({ control, stocks, itemType }: { control: any, stocks: StockItem[], itemType: 'Raw Material' | 'Finished Good' | undefined }) => {
        const { fields, append, remove } = useFieldArray({ control, name: "linkedItems" });
        const [popoverOpen, setPopoverOpen] = useState(false);
    
        const rawMaterials = useMemo(() => stocks.filter(s => s.type === 'Raw Material'), [stocks]);
    
        const selectedItems = useMemo(() => new Set(fields.map((field: any) => field.id)), [fields]);
    
        const handleSelect = (material: StockItem) => {
            if (selectedItems.has(material.id!)) {
                const index = fields.findIndex((field: any) => field.id === material.id);
                remove(index);
            } else {
                append({ id: material.id, quantity: 1 });
            }
        };

        const renderLabel = () => {
            if (itemType === 'Finished Good') {
                return 'Define Bill of Materials (BOM)';
            }
            return '';
        };

        if (itemType !== 'Finished Good') return null;
    
        return (
            <div className="col-span-1 md:col-span-2 space-y-2">
                <Label>{renderLabel()}</Label>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                            {selectedItems.size > 0 ? `${selectedItems.size} raw materials selected` : "Select raw materials..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                        <ScrollArea className="max-h-60">
                            <div className="p-2 space-y-1">
                                {rawMaterials.map(material => (
                                    <div key={material.id} className="flex items-center gap-2 p-1 rounded-md hover:bg-muted">
                                        <Checkbox
                                            id={`bom-${material.id}`}
                                            checked={selectedItems.has(material.id!)}
                                            onCheckedChange={() => handleSelect(material)}
                                        />
                                        <label htmlFor={`bom-${material.id}`} className="text-sm font-medium flex-1">
                                            {material.name} ({material.itemCode})
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>

                <div className="space-y-2 mt-2 border rounded-lg p-2 max-h-48 overflow-y-auto">
                    {fields.length > 0 ? (
                        fields.map((field, index) => {
                            const material = rawMaterials.find(rm => rm.id === (field as any).id);
                            return material ? (
                                <div key={field.id} className="flex items-center justify-between gap-2">
                                    <span className="text-sm">{material.name}</span>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor={`qty-${field.id}`} className="text-xs">Qty:</Label>
                                        <Controller
                                            control={control}
                                            name={`linkedItems.${index}.quantity`}
                                            defaultValue={(field as any).quantity}
                                            render={({ field: controllerField }) => (
                                                <Input
                                                    id={`qty-${field.id}`}
                                                    type="number"
                                                    className="h-8 w-20"
                                                    {...controllerField}
                                                    onChange={(e) => controllerField.onChange(parseInt(e.target.value, 10) || 1)}
                                                    min="1"
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                            ) : null;
                        })
                    ) : (
                         <p className="text-sm text-muted-foreground text-center py-2">No raw materials selected.</p>
                    )}
                </div>
            </div>
        );
    };

    const handleMainItemSelect = (itemId: string) => {
        setSelectedMainItemId(itemId);
        const mainItem = stocks.find(s => s.id === itemId);
        if (mainItem) {
            setRelatedItemIds(mainItem.linkedItems?.map(li => li.id) || []);
        } else {
            setRelatedItemIds([]);
        }
    };
    
    const handleRelatedItemToggle = (relatedId: string, isChecked: boolean | 'indeterminate') => {
        setRelatedItemIds(prev => isChecked ? [...prev, relatedId] : prev.filter(id => id !== relatedId));
    };

    const handleSelectAllRelated = (allIds: string[], isChecked: boolean | 'indeterminate') => {
        setRelatedItemIds(isChecked ? allIds : []);
    };
    
    const handleSaveRelations = async () => {
        if (!selectedMainItemId) {
            toast({ variant: 'destructive', title: 'Error', description: 'No main item selected.' });
            return;
        }
        const mainItem = stocks.find(s => s.id === selectedMainItemId);
        if (!mainItem) return;

        // For simplicity, we assume qty is 1 when linking this way. BOM manager handles detailed qty.
        const newLinkedItems = relatedItemIds.map(id => ({ id, quantity: 1 })); 
        
        try {
            const docRef = doc(db, 'stocks', selectedMainItemId);
            await updateDoc(docRef, { linkedItems: newLinkedItems });
            
            setStocks(prev => prev.map(s => s.id === selectedMainItemId ? { ...s, linkedItems: newLinkedItems } : s));
            
            toast({ title: 'Success', description: 'Item relationships have been updated.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update relationships.' });
        }
    };
    
    const { mainItems, relatedItems, mainItemTypeLabel, relatedItemTypeLabel } = useMemo(() => {
        if (!selectedMainItemId) return { mainItems: [], relatedItems: [], mainItemTypeLabel: '', relatedItemTypeLabel: '' };

        const mainItem = stocks.find(s => s.id === selectedMainItemId);
        if (!mainItem) return { mainItems: [], relatedItems: [], mainItemTypeLabel: '', relatedItemTypeLabel: '' };

        if (mainItem.type === 'Finished Good') {
            return {
                mainItems: stocks.filter(s => s.type === 'Finished Good'),
                relatedItems: stocks.filter(s => s.type === 'Raw Material'),
                mainItemTypeLabel: 'Finished Good',
                relatedItemTypeLabel: 'Raw Materials'
            };
        } else { // Raw Material
            return {
                mainItems: stocks.filter(s => s.type === 'Raw Material'),
                relatedItems: stocks.filter(s => s.type === 'Finished Good'),
                mainItemTypeLabel: 'Raw Material',
                relatedItemTypeLabel: 'Finished Goods'
            };
        }
    }, [stocks, selectedMainItemId]);
    
    const filteredRelatedItems = relatedItems.filter(item => {
        const searchMatch = searchTerm === "" ||
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
        return searchMatch;
    });


    const isAllRelatedSelected = relatedItems.length > 0 && relatedItemIds.length === relatedItems.length;

  return (
    <>
      <main className="p-4">
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Stocks</h1>
             <Input
                placeholder="Search items or refs..."
                className="w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="itemList">Stock Ledger</TabsTrigger>
                <TabsTrigger value="stockLevel">Stock Level</TabsTrigger>
                <TabsTrigger value="relatedItems">Related Items</TabsTrigger>
            </TabsList>
        <TabsContent value="itemList">
            <Card>
            <CardHeader>
                <CardTitle>Stock Ledger</CardTitle>
                <CardDescription>
                A chronological record of all stock movements from purchase and sale orders. Sorted by: {companyProfile.stockOrderMethod}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Reference ID</TableHead>
                    <TableHead className="text-right">In</TableHead>
                    <TableHead className="text-right">Out</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={8} className="text-center">Loading...</TableCell></TableRow>
                    ) : filteredStockMovements.length > 0 ? (
                        filteredStockMovements.map((item, index) => {
                            const stockItem = stocks.find(s => s.itemCode === item.itemCode);
                            return (
                                <TableRow key={`${item.refId}-${item.itemCode}-${index}`}>
                                    <TableCell>{format(parseISO(item.date), 'yyyy-MM-dd')}</TableCell>
                                    <TableCell className="font-mono">{item.itemCode}</TableCell>
                                    <TableCell className="font-medium">{item.itemName}</TableCell>
                                    <TableCell className="font-mono">
                                        <Badge variant={item.type === 'PO' ? 'secondary' : 'outline'}>
                                        {item.refId}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-green-600 font-medium">{item.inQty > 0 ? item.inQty : '-'}</TableCell>
                                    <TableCell className="text-right text-red-600 font-medium">{item.outQty > 0 ? item.outQty : '-'}</TableCell>
                                    <TableCell className="text-right font-bold">{item.balance}</TableCell>
                                    <TableCell>
                                    {stockItem && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openDialog(stockItem)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(stockItem.id!)}>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                                </TableRow>
                            )
                        })
                    ) : (
                        <TableRow><TableCell colSpan={8} className="text-center">No stock movements found.</TableCell></TableRow>
                    )}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="stockLevel">
            <Card>
                <CardHeader>
                    <CardTitle>Stock Levels</CardTitle>
                    <CardDescription>View and manage current inventory levels across all items.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                           <Select value={stockLevelFilter} onValueChange={(value) => setStockLevelFilter(value as any)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="Raw Material">Raw Material</SelectItem>
                                    <SelectItem value="Finished Good">Finished Good</SelectItem>
                                </SelectContent>
                            </Select>
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
                                                <div className="py-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <FormField
                                                            control={form.control}
                                                            name="type"
                                                            render={({ field }) => (
                                                                <FormItem className="md:col-span-2">
                                                                    <FormLabel>Type</FormLabel>
                                                                    <Select onValueChange={field.onChange} value={field.value} disabled={!!editingItem}>
                                                                        <FormControl>
                                                                            <SelectTrigger><SelectValue placeholder="Select item type" /></SelectTrigger>
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

                                                        {itemType && (
                                                            <>
                                                                <FormField control={form.control} name="itemCode" render={({ field }) => <FormItem><FormLabel>Item Code</FormLabel><FormControl><Input placeholder="e.g., WD-002" {...field} readOnly /></FormControl><FormMessage /></FormItem>} />
                                                                <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g., Walnut Wood Plank" {...field} /></FormControl><FormMessage /></FormItem>} />
                                                                <FormField control={form.control} name="unitPrice" render={({ field }) => <FormItem><FormLabel>Unit Price ({currency.code})</FormLabel><FormControl><Input type="number" placeholder="e.g. 10.50" {...field} /></FormControl><FormMessage /></FormItem>} />
                                                                <FormField control={form.control} name="stockLevel" render={({ field }) => <FormItem><FormLabel>Opening Stock</FormLabel><FormControl><Input type="number" placeholder="e.g. 100" {...field} /></FormControl><FormMessage /></FormItem>} />
                                                                <BomManager control={form.control} stocks={stocks} itemType={itemType}/>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </ScrollArea>
                                            <DialogFooter className="pt-4">
                                                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                                <Button type="submit" disabled={!itemType}>{editingItem ? 'Save Changes' : 'Add Item'}</Button>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-muted-foreground">Total Stock Count</div>
                            <div className="text-2xl font-bold">{totalStockCount.toLocaleString()} units</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-muted-foreground">Total Stock Value</div>
                            <div className="text-2xl font-bold">{currency.code} {totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Stock Level</TableHead>
                                <TableHead className="text-right">Value</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
                            ) : filteredStockLevels.length > 0 ? (
                                filteredStockLevels.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-mono">{item.itemCode}</TableCell>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.type === 'Raw Material' ? 'outline' : 'default'}>{item.type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">{item.stockLevel}</TableCell>
                                        <TableCell className="text-right">{currency.code} {(item.unitPrice * item.stockLevel).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openDialog(item)}>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id!)}>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={6} className="text-center">No items match your search.</TableCell></TableRow>
                            )}
                        </TableBody>
                     </Table>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="relatedItems">
            <Card>
                <CardHeader>
                    <CardTitle>Related Items</CardTitle>
                    <CardDescription>Manage relationships between Finished Goods and Raw Materials.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="main-item-select">Select Main Item</Label>
                            <Select onValueChange={handleMainItemSelect} value={selectedMainItemId || undefined}>
                                <SelectTrigger id="main-item-select"><SelectValue placeholder="Select an item..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Finished Goods</SelectLabel>
                                        {stocks.filter(s => s.type === 'Finished Good').map(item => (
                                            <SelectItem key={item.id} value={item.id!}>{item.name} ({item.itemCode})</SelectItem>
                                        ))}
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel>Raw Materials</SelectLabel>
                                        {stocks.filter(s => s.type === 'Raw Material').map(item => (
                                            <SelectItem key={item.id} value={item.id!}>{item.name} ({item.itemCode})</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedMainItemId && (
                        <div>
                             <div className="flex items-center justify-between mb-4">
                                <div>
                                    <Label>Link {relatedItemTypeLabel}</Label>
                                    <p className="text-sm text-muted-foreground">Select all related items below.</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="select-all-related"
                                        checked={isAllRelatedSelected}
                                        onCheckedChange={(checked) => handleSelectAllRelated(relatedItems.map(ri => ri.id!), checked)}
                                    />
                                    <Label htmlFor="select-all-related" className="text-sm font-medium">Select All</Label>
                                </div>
                            </div>
                            <ScrollArea className="h-72 rounded-md border">
                                <div className="p-4 space-y-2">
                                    {filteredRelatedItems.map(item => (
                                        <div key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                            <Checkbox
                                                id={`related-${item.id}`}
                                                checked={relatedItemIds.includes(item.id!)}
                                                onCheckedChange={(checked) => handleRelatedItemToggle(item.id!, checked)}
                                            />
                                            <div className="space-y-1 leading-none">
                                                <Label htmlFor={`related-${item.id}`} className="font-normal">{item.name}</Label>
                                                <p className="text-xs text-muted-foreground">{item.itemCode}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                    <div className="flex justify-end">
                        <Button onClick={handleSaveRelations} disabled={!selectedMainItemId}>Save Changes</Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        </Tabs>
      </main>
    </>
  );
}










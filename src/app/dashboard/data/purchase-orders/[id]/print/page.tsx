
'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAtom } from 'jotai';
import { purchaseOrdersAtom, masterDataAtom, currencyAtom, companyProfileAtom } from '@/lib/store';
import { Logo } from '@/components/icons/logo';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MasterDataItem } from '../../../master-data/page';

export default function PurchaseOrderPrintPage() {
    const params = useParams();
    const { id } = params;

    const [purchaseOrders] = useAtom(purchaseOrdersAtom);
    const [masterData] = useAtom(masterDataAtom);
    const [currency] = useAtom(currencyAtom);
    const [companyProfile] = useAtom(companyProfileAtom);

    const po = useMemo(() => {
        return purchaseOrders.find(p => p.id === id);
    }, [id, purchaseOrders]);

    useEffect(() => {
        if (po) {
            setTimeout(() => window.print(), 500); // Delay to ensure content is rendered
        }
    }, [po]);

    if (!po) {
        return <div className="p-8">Loading or Purchase Order not found...</div>;
    }

    return (
        <div className="p-8">
            <style>{`
                @media print {
                    @page { 
                        size: auto;
                        margin: 0;
                    }
                    body {
                        margin: 1cm;
                    }
                }
            `}</style>
            <header className="flex justify-between items-start mb-8 pb-4 border-b">
                <div className="flex items-center gap-4">
                    <Logo />
                    <div>
                        <h1 className="text-2xl font-bold">{companyProfile.companyName}</h1>
                        <p className="text-muted-foreground">{companyProfile.email}</p>
                        <p className="text-muted-foreground">{companyProfile.phone}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase text-muted-foreground">Purchase Order</h2>
                    <p className="text-muted-foreground font-mono">{po.id}</p>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                    <p className='text-sm text-muted-foreground'>Supplier</p>
                    <p className="font-medium">{po.supplierName}</p>
                </div>
                <div className="text-right">
                    <p><strong>Date:</strong> {po.date}</p>
                    <p><strong>Status:</strong> {po.status}</p>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Item Code</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        {po.status !== 'Draft' && <TableHead className="text-right">Unit Price</TableHead>}
                        {po.status !== 'Draft' && <TableHead className="text-right">Total Value</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {po.lineItems.map((item: any) => {
                        const itemDetails = masterData.find((md: MasterDataItem) => md.itemCode === item.itemId);
                        return (
                            <TableRow key={item.itemId}>
                                <TableCell>{item.itemId}</TableCell>
                                <TableCell>{itemDetails?.name || 'N/A'}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                {po.status !== 'Draft' && <TableCell className="text-right">{currency.code} {(item.unitPrice || 0).toFixed(2)}</TableCell>}
                                {po.status !== 'Draft' && <TableCell className="text-right">{currency.code} {(item.totalValue || 0).toFixed(2)}</TableCell>}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            {po.status !== 'Draft' && (
                <div className="text-right mt-4 pr-4 text-xl font-bold">
                    Total: {currency.code} {po.totalAmount.toFixed(2)}
                </div>
            )}
            <footer className="text-center text-xs text-muted-foreground mt-12 border-t pt-4">
                Thank you for your business!
            </footer>
        </div>
    );
}

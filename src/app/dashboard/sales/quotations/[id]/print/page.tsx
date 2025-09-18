
'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAtom } from 'jotai';
import { quotationsAtom, masterDataAtom, currencyAtom, companyProfileAtom } from '@/lib/store';
import { Logo } from '@/components/icons/logo';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MasterDataItem } from '../../../../data/master-data/page';

export default function QuotationPrintPage() {
    const params = useParams();
    const { id } = params;

    const [quotations] = useAtom(quotationsAtom);
    const [masterData] = useAtom(masterDataAtom);
    const [currency] = useAtom(currencyAtom);
    const [companyProfile] = useAtom(companyProfileAtom);

    const quotation = useMemo(() => {
        return quotations.find(q => q.id === id);
    }, [id, quotations]);

    useEffect(() => {
        if (quotation) {
            setTimeout(() => window.print(), 500); // Delay to ensure content is rendered
        }
    }, [quotation]);

    if (!quotation) {
        return <div className="p-8">Loading or Quotation not found...</div>;
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
                    <h2 className="text-3xl font-bold uppercase text-muted-foreground">Quotation</h2>
                    <p className="text-muted-foreground font-mono">{quotation.id}</p>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                    <p className='text-sm text-muted-foreground'>Customer</p>
                    <p className="font-medium">{quotation.customer}</p>
                </div>
                <div className="text-right">
                    <p><strong>Date:</strong> {quotation.date}</p>
                    <p><strong>Status:</strong> {quotation.status}</p>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {quotation.lineItems.map(item => {
                        const itemDetails = masterData.find((md: MasterDataItem) => md.itemCode === item.itemId);
                        return (
                            <TableRow key={item.itemId}>
                                <TableCell>{itemDetails?.name || item.itemId}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">{currency.code} {item.unitPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-right">{currency.code} {item.totalValue.toFixed(2)}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            
            <div className="text-right mt-4 pr-4 text-xl font-bold">
                Total: {currency.code} {quotation.amount.toFixed(2)}
            </div>

            <footer className="text-center text-xs text-muted-foreground mt-12 border-t pt-4">
                This quotation is valid for 30 days. Thank you for your business!
            </footer>
        </div>
    );
}

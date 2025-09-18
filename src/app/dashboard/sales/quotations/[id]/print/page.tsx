

'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { quotationsAtom, stocksAtom, currencyAtom, companyProfileAtom } from '@/lib/store';
import { Logo } from '@/components/icons/logo';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { StockItem } from '../../../../data/stocks/page';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';

export default function QuotationPrintPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const [quotations] = useAtom(quotationsAtom);
    const [stocks] = useAtom(stocksAtom);
    const [currency] = useAtom(currencyAtom);
    const [companyProfile] = useAtom(companyProfileAtom);

    const quotation = useMemo(() => {
        return quotations.find(q => q.id === id);
    }, [id, quotations]);

    if (!quotation) {
        return <div className="p-8">Loading or Quotation not found...</div>;
    }

    return (
        <>
            <style>{`
                @media print {
                    @page { 
                        size: auto;
                        margin: 0;
                    }
                    body {
                        margin: 1cm;
                    }
                    .no-print {
                        display: none;
                    }
                }
            `}</style>
            <header className="no-print p-4 border-b flex justify-between items-center bg-background">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <h2 className="text-lg font-semibold">Print Preview</h2>
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </Button>
            </header>
            <main className="p-8">
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
                            const itemDetails = stocks.find((md: StockItem) => md.itemCode === item.itemId);
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
            </main>
        </>
    );
}

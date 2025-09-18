
'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAtom } from 'jotai';
import { saleOrdersAtom, quotationsAtom, masterDataAtom, currencyAtom, companyProfileAtom } from '@/lib/store';
import { Logo } from '@/components/icons/logo';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SaleOrderPrintPage() {
    const params = useParams();
    const { id } = params;

    const [saleOrders] = useAtom(saleOrdersAtom);
    const [quotations] = useAtom(quotationsAtom);
    const [masterData] = useAtom(masterDataAtom);
    const [currency] = useAtom(currencyAtom);
    const [companyProfile] = useAtom(companyProfileAtom);

    const order = useMemo(() => {
        return saleOrders.find(o => o.id === id);
    }, [id, saleOrders]);

    const originalQuotation = useMemo(() => {
        if (!order) return null;
        return quotations.find(q => q.id === order.quotationId);
    }, [order, quotations]);

    useEffect(() => {
        if (order) {
            setTimeout(() => window.print(), 500); // Delay to ensure content is rendered
        }
    }, [order]);

    if (!order) {
        return <div className="p-8">Loading or Sale Order not found...</div>;
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
                    <h2 className="text-3xl font-bold uppercase text-muted-foreground">Sale Order</h2>
                    <p className="text-muted-foreground font-mono">{order.id}</p>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                    <p className='text-sm text-muted-foreground'>Customer</p>
                    <p className="font-medium">{order.customer}</p>
                    <p className="text-sm text-muted-foreground mt-2">Original Quotation: {order.quotationId}</p>
                </div>
                <div className="text-right">
                    <p><strong>Date:</strong> {order.date}</p>
                    <p><strong>Status:</strong> {order.status}</p>
                </div>
            </div>
            
            {originalQuotation && (
                <>
                    <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
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
                            {originalQuotation.lineItems.map((item: any) => {
                                const itemDetails = masterData.find(md => md.itemCode === item.itemId);
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
                </>
            )}
    
            <div className="text-right mt-4 pr-4 text-xl font-bold">
                Total Amount: {currency.code} {order.amount.toFixed(2)}
            </div>
             <footer className="text-center text-xs text-muted-foreground mt-12 border-t pt-4">
                Thank you for your business!
            </footer>
        </div>
    );
}

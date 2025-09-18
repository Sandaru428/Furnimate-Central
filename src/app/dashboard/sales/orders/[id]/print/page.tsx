
'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { saleOrdersAtom, quotationsAtom, masterDataAtom, currencyAtom, companyProfileAtom, paymentsAtom } from '@/lib/store';
import { Logo } from '@/components/icons/logo';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Payment } from '@/lib/store';

export default function SaleOrderPrintPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const [saleOrders] = useAtom(saleOrdersAtom);
    const [quotations] = useAtom(quotationsAtom);
    const [masterData] = useAtom(masterDataAtom);
    const [payments] = useAtom(paymentsAtom);
    const [currency] = useAtom(currencyAtom);
    const [companyProfile] = useAtom(companyProfileAtom);

    const order = useMemo(() => {
        return saleOrders.find(o => o.id === id);
    }, [id, saleOrders]);

    const originalQuotation = useMemo(() => {
        if (!order) return null;
        return quotations.find(q => q.id === order.quotationId);
    }, [order, quotations]);

    const orderPayments = useMemo(() => {
        if (!order) return [];
        return payments.filter((p: Payment) => p.orderId === order.id);
    }, [order, payments]);

    const totalPaid = useMemo(() => {
        return orderPayments.reduce((acc, p) => acc + p.amount, 0);
    }, [orderPayments]);

    const amountDue = useMemo(() => {
        if (!order) return 0;
        return order.amount - totalPaid;
    }, [order, totalPaid]);

    const handlePrint = (type: 'invoice' | 'receipt' | 'history') => {
        const orderSection = document.getElementById('order-section');
        const paymentSection = document.getElementById('payment-section');
        const summarySection = document.getElementById('summary-section');

        const allSections = [orderSection, paymentSection, summarySection];
        allSections.forEach(s => s?.classList.remove('print-hide'));

        if (type === 'receipt') {
            orderSection?.classList.add('print-hide');
        } else if (type === 'history') {
            orderSection?.classList.add('print-hide');
            summarySection?.classList.add('print-hide');
        }
        // 'invoice' prints everything, so no classes are added.

        window.print();
    };


    if (!order) {
        return <div className="p-8">Loading or Sale Order not found...</div>;
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
                        margin: 1.5cm 1cm;
                    }
                    .no-print {
                        display: none;
                    }
                    .print-hide {
                        display: none !important;
                    }
                }
            `}</style>
            <header className="no-print p-4 border-b flex justify-between items-center bg-background">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <h2 className="text-lg font-semibold">Print Preview</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handlePrint('invoice')}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Invoice
                    </Button>
                     <Button variant="outline" onClick={() => handlePrint('receipt')}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Receipt
                    </Button>
                     <Button variant="outline" onClick={() => handlePrint('history')}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print History
                    </Button>
                </div>
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
                
                <div id="order-section">
                    {originalQuotation && (
                        <div className="mb-8">
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
                        </div>
                    )}
                </div>

                <div id="payment-section">
                    {orderPayments.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-2">Payment History</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead className="text-right">Amount Paid</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orderPayments.map(payment => (
                                        <TableRow key={payment.id}>
                                            <TableCell>{payment.date}</TableCell>
                                            <TableCell>{payment.method}</TableCell>
                                            <TableCell>{payment.details}</TableCell>
                                            <TableCell className="text-right">{currency.code} {payment.amount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
        
                <div id="summary-section">
                    <div className="grid grid-cols-2 mt-8">
                        <div></div>
                        <div className="space-y-2 text-right">
                            <div className="flex justify-between font-semibold text-lg">
                                <span>Total Amount:</span>
                                <span>{currency.code} {order.amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Paid:</span>
                                <span>{currency.code} {totalPaid.toFixed(2)}</span>
                            </div>
                            <div className={cn("flex justify-between font-bold text-xl", amountDue > 0 ? 'text-red-600' : 'text-green-600')}>
                                <span>Amount Due:</span>
                                <span>{currency.code} {amountDue.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="text-center text-xs text-muted-foreground mt-12 border-t pt-4">
                    Thank you for your business!
                </footer>
            </main>
        </>
    );
}

    
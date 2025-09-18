
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAtom } from 'jotai';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Printer } from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  customersAtom,
  suppliersAtom,
  purchaseOrdersAtom,
  saleOrdersAtom,
  quotationsAtom,
  paymentsAtom,
  currencyAtom,
  companyProfileAtom,
} from '@/lib/store';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const reportTypes = [
    { value: 'all', label: 'All Reports' },
    { value: 'cash-book', label: 'Cash Book' },
    { value: 'purchase-orders', label: 'Purchase Orders' },
    { value: 'sale-orders', label: 'Sale Orders' },
    { value: 'quotations', label: 'Quotations' },
];


export default function ReportingPage() {
    const [customers, setCustomers] = useAtom(customersAtom);
    const [suppliers, setSuppliers] = useAtom(suppliersAtom);
    const [purchaseOrders, setPurchaseOrders] = useAtom(purchaseOrdersAtom);
    const [saleOrders, setSaleOrders] = useAtom(saleOrdersAtom);
    const [quotations, setQuotations] = useAtom(quotationsAtom);
    const [payments, setPayments] = useAtom(paymentsAtom);
    const [currency] = useAtom(currencyAtom);
    const [companyProfile] = useAtom(companyProfileAtom);

    const [date, setDate] = useState<DateRange | undefined>();
    const [reportType, setReportType] = useState('all');


    useEffect(() => {
        const fetchData = async () => {
            if (!companyProfile.companyName) return;

            const companyId = companyProfile.companyName;

            const collections: { [key: string]: (data: any) => void } = {
                customers: setCustomers,
                suppliers: setSuppliers,
                purchaseOrders: setPurchaseOrders,
                saleOrders: setSaleOrders,
                quotations: setQuotations,
                payments: setPayments,
            };

            for (const [key, setter] of Object.entries(collections)) {
                const q = query(collection(db, key), where("companyId", "==", companyId));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setter(data as any);
            }
        };
        fetchData();
    }, [setCustomers, setSuppliers, setPurchaseOrders, setSaleOrders, setQuotations, setPayments, companyProfile]);

    const filteredData = useMemo(() => {
        if (!date?.from || !date?.to) {
          return {
            payments: [],
            purchaseOrders: [],
            saleOrders: [],
            quotations: [],
            suppliers: [],
            customers: [],
          };
        }
        const interval = { start: date.from, end: date.to };
    
        return {
          payments: payments.filter(p => isWithinInterval(parseISO(p.date), interval)),
          purchaseOrders: purchaseOrders.filter(p => isWithinInterval(parseISO(p.date), interval)),
          saleOrders: saleOrders.filter(p => isWithinInterval(parseISO(p.date), interval)),
          quotations: quotations.filter(p => isWithinInterval(parseISO(p.date), interval)),
          suppliers: suppliers, // Suppliers are not date-based
          customers: customers, // Customers are not date-based
        };
      }, [date, payments, purchaseOrders, saleOrders, quotations, suppliers, customers]);

    const handlePrint = () => {
        window.print();
    };

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none;
            }
          }
        `}
      </style>
      <header className="flex items-center p-4 border-b no-print">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold ml-4">Reporting</h1>
      </header>
      <main className="p-4">
        <Card className="no-print">
            <CardHeader>
                <CardTitle>Date Range Report</CardTitle>
                <CardDescription>Select a date range and report type. The filtered data will be displayed below.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-[300px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                        date.to ? (
                            <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(date.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date range</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
                 <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select a report" />
                    </SelectTrigger>
                    <SelectContent>
                        {reportTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Button onClick={handlePrint} disabled={!date?.from || !date?.to}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Report
                </Button>
            </CardContent>
        </Card>
        
        <div id="print-area" className="mt-4 space-y-4">
            {date?.from && date?.to && (
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold">Report for {format(date.from, "LLL dd, y")} to {format(date.to, "LLL dd, y")}</h1>
                    <p className="text-muted-foreground">Generated on {format(new Date(), "LLL dd, y")}</p>
                </div>
            )}

            {date?.from && date?.to ? (
                <>
                {/* Cash Book Report */}
                {(reportType === 'all' || reportType === 'cash-book') && (
                <Card>
                    <CardHeader><CardTitle>Cash Book</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Reference</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
                            <TableBody>
                            {filteredData.payments.length > 0 ? filteredData.payments.map(p => (
                                <TableRow key={p.id}>
                                <TableCell>{p.date}</TableCell>
                                <TableCell className="font-mono">{p.orderId ? `${p.type === 'income' ? 'Sale Order: ' : 'Purchase Order: '}${p.orderId}` : p.description}</TableCell>
                                <TableCell><Badge variant={p.type === 'income' ? 'default' : 'destructive'} className={cn(p.type === 'income' ? 'bg-green-600' : 'bg-red-600', 'text-white')}>{p.type}</Badge></TableCell>
                                <TableCell className={cn("text-right", p.type === 'income' ? 'text-green-600' : 'text-red-600')}>{p.type === 'income' ? '+' : '-'}{currency.code} {p.amount.toFixed(2)}</TableCell>
                                <TableCell>{p.details}</TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={5} className="text-center">No transactions in this period.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                )}

                 {/* Purchase Orders Report */}
                {(reportType === 'all' || reportType === 'purchase-orders') && (
                <Card>
                    <CardHeader><CardTitle>Purchase Orders</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>PO ID</TableHead><TableHead>Supplier</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                            <TableBody>
                            {filteredData.purchaseOrders.length > 0 ? filteredData.purchaseOrders.map(po => (
                                <TableRow key={po.id}>
                                <TableCell>{po.date}</TableCell>
                                <TableCell className="font-mono">{po.id}</TableCell>
                                <TableCell>{po.supplierName}</TableCell>
                                <TableCell className="text-right">{currency.code} {po.totalAmount.toFixed(2)}</TableCell>
                                <TableCell><Badge>{po.status}</Badge></TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={5} className="text-center">No purchase orders in this period.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                )}
                
                 {/* Sale Orders Report */}
                {(reportType === 'all' || reportType === 'sale-orders') && (
                <Card>
                    <CardHeader><CardTitle>Sale Orders</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>SO ID</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                            <TableBody>
                            {filteredData.saleOrders.length > 0 ? filteredData.saleOrders.map(so => (
                                <TableRow key={so.id}>
                                <TableCell>{so.date}</TableCell>
                                <TableCell className="font-mono">{so.id}</TableCell>
                                <TableCell>{so.customer}</TableCell>
                                <TableCell className="text-right">{currency.code} {so.amount.toFixed(2)}</TableCell>
                                <TableCell><Badge>{so.status}</Badge></TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={5} className="text-center">No sale orders in this period.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                )}
                
                 {/* Quotations Report */}
                {(reportType === 'all' || reportType === 'quotations') && (
                <Card>
                    <CardHeader><CardTitle>Quotations</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Quotation ID</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                            <TableBody>
                            {filteredData.quotations.length > 0 ? filteredData.quotations.map(q => (
                                <TableRow key={q.id}>
                                <TableCell>{q.date}</TableCell>
                                <TableCell className="font-mono">{q.id}</TableCell>
                                <TableCell>{q.customer}</TableCell>
                                <TableCell className="text-right">{currency.code} {q.amount.toFixed(2)}</TableCell>
                                <TableCell><Badge>{q.status}</Badge></TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={5} className="text-center">No quotations in this period.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                )}
                </>
            ) : (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        Please select a date range and report type to view the report.
                    </CardContent>
                </Card>
            )}
        </div>
      </main>
    </>
  );
}

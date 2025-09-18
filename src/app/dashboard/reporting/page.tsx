
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
  useDummyDataAtom,
  dataSeederAtom,
} from '@/lib/store';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


export default function ReportingPage() {
    const [customers] = useAtom(customersAtom);
    const [suppliers] = useAtom(suppliersAtom);
    const [purchaseOrders] = useAtom(purchaseOrdersAtom);
    const [saleOrders] = useAtom(saleOrdersAtom);
    const [quotations] = useAtom(quotationsAtom);
    const [payments] = useAtom(paymentsAtom);
    const [currency] = useAtom(currencyAtom);

    const [date, setDate] = useState<DateRange | undefined>();
    
    const [useDummyData] = useAtom(useDummyDataAtom);
    const [, seedData] = useAtom(dataSeederAtom);

    useEffect(() => {
        seedData(useDummyData);
    }, [useDummyData, seedData]);

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
                <CardDescription>Select a date range to generate a report for all key modules. The filtered data will be displayed below.</CardDescription>
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
                <Card>
                    <CardHeader><CardTitle>Cash Book</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Reference ID</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
                            <TableBody>
                            {filteredData.payments.length > 0 ? filteredData.payments.map(p => (
                                <TableRow key={p.id}>
                                <TableCell>{p.date}</TableCell>
                                <TableCell className="font-mono">{p.type === 'income' ? 'Sale Order: ' : 'Purchase Order: '}{p.orderId}</TableCell>
                                <TableCell><Badge variant={p.type === 'income' ? 'default' : 'destructive'} className={cn(p.type === 'income' ? 'bg-green-600' : 'bg-red-600', 'text-white')}>{p.type}</Badge></TableCell>
                                <TableCell className={cn("text-right", p.type === 'income' ? 'text-green-600' : 'text-red-600')}>{p.type === 'income' ? '+' : '-'}{currency.code} {p.amount.toFixed(2)}</TableCell>
                                <TableCell>{p.details}</TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={5} className="text-center">No transactions in this period.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                 {/* Purchase Orders Report */}
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
                
                 {/* Sale Orders Report */}
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
                
                 {/* Quotations Report */}
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

                 {/* Customers & Suppliers are not date-filtered, so they are not shown in the date-range report */}
                </>
            ) : (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        Please select a date range above to view the report.
                    </CardContent>
                </Card>
            )}
        </div>
      </main>
    </>
  );
}

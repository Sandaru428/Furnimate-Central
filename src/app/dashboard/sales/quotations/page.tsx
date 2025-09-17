
'use client';

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
  } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

const quotations = [
  {
    id: 'QUO-001',
    customer: 'Modern Designs LLC',
    date: '2024-05-01',
    total: 1250.00,
    status: 'Sent',
  },
  {
    id: 'QUO-002',
    customer: 'Home Comforts',
    date: '2024-05-03',
    total: 850.50,
    status: 'Draft',
  },
  {
    id: 'QUO-003',
    customer: 'Emily Davis',
    date: '2024-05-05',
    total: 2400.00,
    status: 'Approved',
  },
];

const statusVariant: {[key: string]: "default" | "secondary" | "destructive"} = {
    'Sent': 'default',
    'Draft': 'secondary',
    'Approved': 'default', // Should be a success variant, using default for now
    'Rejected': 'destructive'
}

export default function QuotationsPage() {
  return (
    <>
      <header className="flex items-center p-4 border-b">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold ml-4">Quotations</h1>
      </header>
      <main className="p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Quotations</CardTitle>
                    <CardDescription>
                    Create and manage sales quotations for your customers.
                    </CardDescription>
                </div>
                 <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Quotation
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono">{quote.id}</TableCell>
                    <TableCell className="font-medium">{quote.customer}</TableCell>
                    <TableCell>{quote.date}</TableCell>
                    <TableCell className="text-right">${quote.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[quote.status] || 'secondary'}>{quote.status}</Badge>
                    </TableCell>
                    <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuItem>View/Edit</DropdownMenuItem>
                            <DropdownMenuItem>Convert to Order</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

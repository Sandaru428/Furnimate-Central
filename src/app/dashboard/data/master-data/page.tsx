
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const masterData = [
  {
    itemCode: 'WD-001',
    name: 'Oak Wood Plank',
    category: 'Wood',
    unitPrice: 25.00,
    stockLevel: 150,
  },
  {
    itemCode: 'FBR-003',
    name: 'Linen Fabric',
    category: 'Fabric',
    unitPrice: 15.50,
    stockLevel: 300,
  },
  {
    itemCode: 'MTL-002',
    name: 'Steel Frame',
    category: 'Metal',
    unitPrice: 55.00,
    stockLevel: 80,
  },
    {
    itemCode: 'FNS-010',
    name: 'Matte Varnish',
    category: 'Finishing',
    unitPrice: 12.00,
    stockLevel: 200,
  },
];

export default function MasterDataPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Master Data</CardTitle>
                <CardDescription>
                Manage products, materials, and other master data.
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Input placeholder="Search items..." className="w-64" />
                <Button>
                    <PlusCircle className="mr-2" />
                    Add New Item
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Stock Level</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {masterData.map((item) => (
              <TableRow key={item.itemCode}>
                <TableCell className="font-mono">{item.itemCode}</TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{item.category}</Badge>
                </TableCell>
                <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right">{item.stockLevel}</TableCell>
                <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

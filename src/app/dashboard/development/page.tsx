
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Server } from 'lucide-react';
import { useAtom } from 'jotai';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

const developmentChecklist = [
  {
    heading: 'User Authentication & Roles',
    items: [
      {
        id: 'auth-1',
        label: 'Implement secure email-based login',
        checked: true,
      },
      {
        id: 'auth-2',
        label: 'Define roles: Admin, Sales, Production, Customer, Supplier',
        checked: true,
      },
    ],
  },
  {
    heading: 'Admin Features',
    items: [
      { id: 'admin-1', label: 'Company Profile Management UI', checked: true },
      {
        id: 'admin-2',
        label: 'Notification Template Engine UI',
        checked: true,
      },
    ],
  },
  {
    heading: 'Core System Features',
    items: [
      {
        id: 'core-1',
        label: 'Smart Reference Number Generator (Cloud Function)',
        checked: true,
      },
      {
        id: 'core-2',
        label: 'GenAI Audit Flow for reference numbers',
        checked: true,
      },
      { id: 'core-3', label: 'Progress Dashboard with KPIs', checked: true },
    ],
  },
  {
    heading: 'Data Management',
    items: [
      {
        id: 'data-1',
        label: 'Stocks Management for products and materials',
        checked: true,
      },
      { id: 'data-2', label: 'Supplier and Customer data management', checked: true },
    ],
  },
  {
    heading: 'Sales Flow',
    items: [
      { id: 'sales-1', label: 'Quotation creation and management', checked: true },
      { id: 'sales-2', label: 'Sale Order conversion and real-time tracking', checked: true },
    ],
  },
];

export default function DevelopmentPage() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      setIsConnected(true);
    }
  }, [user]);

  return (
    <>
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">Development</h1>
         <Card>
            <CardHeader>
            <CardTitle>Development Workflow</CardTitle>
            <CardDescription>
                A step-by-step checklist to track feature implementation and testing.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Data Seeding</h3>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <Switch id="dummy-data-switch" disabled />
                    <Label htmlFor="dummy-data-switch">Enable Dummy Data</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                    Data is now being fetched from Firestore. This switch is disabled.
                </p>
            </div>
            
            <Separator />

            <div>
                <h3 className="text-lg font-semibold mb-4">Server Connection</h3>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                        <Server className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <p className="font-medium">{user?.email || 'Not Logged In'}</p>
                            {isConnected ? (
                                <Badge className="bg-green-600 text-white">Connected</Badge>
                            ) : (
                                <Badge variant="destructive">Disconnected</Badge>
                            )}
                        </div>
                    </div>
                    <Button variant="outline" disabled>
                        {isConnected ? 'Disconnect' : 'Connect'}
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                    Server connection is managed automatically based on user login status.
                </p>
            </div>

            <Separator />

            {developmentChecklist.map((section, index) => (
                <div key={section.heading}>
                <h3 className="text-lg font-semibold mb-4">
                    {section.heading}
                </h3>
                <div className="space-y-4">
                    {section.items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center space-x-3"
                    >
                        <Checkbox
                        id={item.id}
                        checked={item.checked || false}
                        disabled
                        />
                        <label
                        htmlFor={item.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                        {item.label}
                        </label>
                    </div>
                    ))}
                </div>
                {index < developmentChecklist.length - 1 && (
                    <Separator className="mt-6" />
                )}
                </div>
            ))}
            </CardContent>
        </Card>
      </main>
    </>
  );
}

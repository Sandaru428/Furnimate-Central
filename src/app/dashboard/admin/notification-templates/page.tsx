
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

const templateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

type Template = z.infer<typeof templateSchema>;

const initialTemplates: Template[] = [
  {
    id: 'tmpl_1',
    name: 'Order Confirmation',
    subject: 'Your Order #{order_id} has been confirmed!',
    body: 'Hi {customer_name}, \n\nThank you for your order! Your order with ID #{order_id} has been confirmed and will be processed shortly.\n\nThanks,\nSiraiva Ltd',
  },
  {
    id: 'tmpl_2',
    name: 'Shipping Update',
    subject: 'Your Order #{order_id} has shipped!',
    body: 'Hi {customer_name}, \n\nGood news! Your order with ID #{order_id} has been shipped. You can track it using the following link: {tracking_link}\n\nThanks,\nSiraiva Ltd',
  },
  {
    id: 'tmpl_3',
    name: 'Password Reset',
    subject: 'Reset your password',
    body: 'Hi there, \n\nPlease click the following link to reset your password: {reset_link}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nSiraiva Ltd',
  },
];


export default function NotificationTemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>(initialTemplates);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const { toast } = useToast();

    const form = useForm<Template>({
        resolver: zodResolver(templateSchema),
        defaultValues: {
            name: '',
            subject: '',
            body: '',
        },
    });

    const openDialog = (template: Template | null) => {
        if (template) {
            setEditingTemplate(template);
            form.reset(template);
        } else {
            setEditingTemplate(null);
            form.reset({ name: '', subject: '', body: '' });
        }
        setIsDialogOpen(true);
    };

    function onSubmit(values: Template) {
        if (editingTemplate) {
            // Update
            setTemplates(templates.map(t => t.id === editingTemplate.id ? { ...values, id: t.id } : t));
            toast({ title: 'Template Updated', description: `The "${values.name}" template has been saved.` });
        } else {
            // Create
            const newTemplate: Template = { ...values, id: `tmpl_${Date.now()}` };
            setTemplates([newTemplate, ...templates]);
            toast({ title: 'Template Created', description: `The "${values.name}" template has been created.` });
        }
        setIsDialogOpen(false);
        setEditingTemplate(null);
    }

    const handleDelete = (templateId: string) => {
        setTemplates(templates.filter(t => t.id !== templateId));
        toast({ title: 'Template Deleted' });
    }

  return (
    <>
      <header className="flex items-center p-4 border-b">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold ml-4">Notification Templates</h1>
      </header>
      <main className="p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Notification Templates</CardTitle>
                    <CardDescription>
                    Manage email and SMS templates for your application.
                    </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingTemplate(null); setIsDialogOpen(isOpen); }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => openDialog(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create New Template
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                                <ScrollArea className="flex-1 pr-6">
                                    <div className="space-y-4 py-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Template Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Order Confirmation" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="subject"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Subject</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Your Order #{order_id} has shipped!" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="body"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Body</FormLabel>
                                                    <FormControl>
                                                        <Textarea className="min-h-[200px]" placeholder="Hi {customer_name}, your order is on its way!" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </ScrollArea>
                                <DialogFooter className="pt-4">
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit">{editingTemplate ? 'Save Changes' : 'Create Template'}</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.subject}</TableCell>
                    <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDialog(template)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(template.id!)}>Delete</DropdownMenuItem>
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

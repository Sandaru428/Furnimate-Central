
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';

const formSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  logo: z.any().optional(),
});

type CompanyProfile = z.infer<typeof formSchema>;

export default function CompanyProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: 'Siraiva ltd',
    email: 'absiraiva@gmail.com',
    phone: '+94773606494',
    logo: undefined,
  });

  const form = useForm<CompanyProfile>({
    resolver: zodResolver(formSchema),
    values: profile, // Use values to make the form reflect the state
  });

  function onSubmit(values: CompanyProfile) {
    const newProfileData = {
        ...values,
        logo: values.logo && values.logo.length > 0 ? values.logo[0].name : profile.logo
    };
    setProfile(newProfileData);
    console.log(newProfileData);
    toast({
      title: 'Profile Updated',
      description: 'Your company profile has been saved.',
    });
    // The form will automatically re-render with the new state values
  }

  return (
    <>
      <header className="flex items-center p-4 border-b">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold ml-4">Company Profile</h1>
      </header>
      <main className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Company Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input placeholder="contact@yourcompany.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (234) 567-890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Company Logo</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          {...fieldProps}
                          onChange={(event) => {
                            onChange(event.target.files);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                       {typeof profile.logo === 'string' && profile.logo && (
                        <div className="text-sm text-muted-foreground mt-2">
                            Current file: {profile.logo}
                        </div>
                       )}
                    </FormItem>
                  )}
                />
                <Button type="submit">Save Changes</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

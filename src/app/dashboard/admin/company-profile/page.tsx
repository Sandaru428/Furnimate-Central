
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { currencies } from '@/lib/currencies';
import { useAtom } from 'jotai';
import { currencyAtom, companyProfileAtom } from '@/lib/store';
import { DashboardHeader } from '@/components/dashboard-header';

const formSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  logo: z.any().optional(),
  currency: z.string().min(1, 'Currency is required'),
});

type CompanyProfileForm = z.infer<typeof formSchema>;

export default function CompanyProfilePage() {
  const { toast } = useToast();
  const [selectedCurrency, setCurrency] = useAtom(currencyAtom);
  const [companyProfile, setCompanyProfile] = useAtom(companyProfileAtom);

  const form = useForm<CompanyProfileForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...companyProfile,
      currency: selectedCurrency.code,
    },
  });

  function onSubmit(values: CompanyProfileForm) {
    const newLogo = values.logo && values.logo.length > 0 ? values.logo[0].name : companyProfile.logo;
    const newProfileData = {
        ...values,
        logo: newLogo,
    };
    setCompanyProfile(newProfileData);
    
    const newCurrency = currencies.find(c => c.code === values.currency);
    if (newCurrency) {
        setCurrency(newCurrency);
    }
    
    toast({
      title: 'Profile Updated',
      description: 'Your company profile has been saved.',
    });
  }

  return (
    <>
      <DashboardHeader title="Company Profile" />
      <main className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencies.map(currency => (
                                <SelectItem key={currency.code} value={currency.code}>
                                  {currency.name} ({currency.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                           {typeof companyProfile.logo === 'string' && companyProfile.logo && (
                            <div className="text-sm text-muted-foreground mt-2">
                                Current file: {companyProfile.logo}
                            </div>
                           )}
                        </FormItem>
                      )}
                    />
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

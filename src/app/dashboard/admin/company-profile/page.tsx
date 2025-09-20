
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { currencies } from '@/lib/currencies';
import { useAtom } from 'jotai';
import { currencyAtom, companyProfileAtom } from '@/lib/store';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, setDoc } from "firebase/firestore"; 

const formSchema = z.object({
  id: z.string().optional(),
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  logo: z.any().optional(),
  currency: z.string().min(1, 'Currency is required'),
  autoLogoutMinutes: z.coerce.number().min(0, "Auto-logout must be 0 or a positive number.").optional(),
  quotationValidityDays: z.coerce.number().min(1, "Validity period must be at least 1 day.").optional(),
});

type CompanyProfileForm = z.infer<typeof formSchema>;

export default function CompanyProfilePage() {
  const { toast } = useToast();
  const { authProfile } = useAuth();
  const [selectedCurrency, setCurrency] = useAtom(currencyAtom);
  const [companyProfile, setCompanyProfile] = useAtom(companyProfileAtom);

  const form = useForm<CompanyProfileForm>({
    resolver: zodResolver(formSchema),
    values: {
      ...companyProfile,
      currency: selectedCurrency.code,
    },
  });

  async function onSubmit(values: CompanyProfileForm) {
    try {
        const profileId = 'main';

        const logoIsFile = values.logo && values.logo.length > 0 && values.logo[0] instanceof File;
        const newLogo = logoIsFile ? values.logo[0].name : companyProfile.logo;
        
        const newProfileData = {
            ...companyProfile, // start with existing profile
            ...values,         // override with form values
            logo: newLogo,     // set the logo name
            id: profileId,     // ensure the ID is set
        };

        // This removes the actual File object before saving to Firestore
        const dataToSave = { ...newProfileData };
        delete dataToSave.logo; // Remove the FileList or file name to avoid type issues
        if (newLogo) {
            dataToSave.logo = newLogo;
        }


        // Save to Firestore
        await setDoc(doc(db, "companyProfile", profileId), dataToSave);
        
        // Update local state with the new data
        setCompanyProfile(newProfileData);
        
        const newCurrency = currencies.find(c => c.code === values.currency);
        if (newCurrency) {
            setCurrency(newCurrency);
        }
        
        toast({
        title: 'Profile Updated',
        description: 'Your company profile has been successfully saved.',
        });
    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Could not save the company profile to the database.',
        });
    }
  }

  return (
    <>
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">Company Profile</h1>
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Update your company's public details and global settings.</CardDescription>
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
                          <FormLabel>Global Currency</FormLabel>
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
                    <FormField
                      control={form.control}
                      name="quotationValidityDays"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quotation Validity (days)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="30" {...field} />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">Set the default validity period for new quotations.</p>
                            <FormMessage />
                        </FormItem>
                      )}
                    />

                    {authProfile?.role === 'Super Admin' && (
                       <FormField
                        control={form.control}
                        name="autoLogoutMinutes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Auto-Logout Timer (minutes)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="0" {...field} />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">Set to 0 to disable automatic logout.</p>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    )}
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

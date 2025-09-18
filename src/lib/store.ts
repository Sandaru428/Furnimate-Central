
import { atom } from 'jotai';

export type Payment = {
    id: string;
    orderId: string; // Can be a Sales Order ID or a Purchase Order ID
    date: string;
    amount: number;
    method: 'Cash' | 'Card' | 'Online' | 'QR' | 'Cheque';
    details: string;
    type: 'income' | 'expense'; // To distinguish between SO and PO payments
};

export const paymentsAtom = atom<Payment[]>([]);

export type Currency = {
    code: string;
    name: string;
}

export const currencyAtom = atom<Currency>({ code: 'USD', name: 'United States Dollar' });


export type CompanyProfile = {
  companyName: string;
  email: string;
  phone: string;
  logo?: string | File;
  currency: string;
};

export const companyProfileAtom = atom<CompanyProfile>({
  companyName: 'Siraiva ltd',
  email: 'absiraiva@gmail.com',
  phone: '+94773606494',
  logo: undefined,
  currency: 'USD',
});

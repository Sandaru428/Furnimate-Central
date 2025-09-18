
import { atom } from 'jotai';
import { initialCustomersData, initialSuppliersData, initialMasterData, initialPurchaseOrdersData, initialQuotationsData, initialSaleOrdersData, initialPaymentsData } from './dummy-data';
import type { UserRole, MainTab } from './roles';

// Data types
export type Payment = {
    id: string;
    companyId: string;
    orderId?: string; // Optional: Can be a SO or PO ID
    description: string; // Used for ad-hoc entries
    date: string;
    amount: number;
    method: 'Cash' | 'Card' | 'Online' | 'QR' | 'Cheque';
    details: string;
    type: 'income' | 'expense';
};

export type Currency = {
    code: string;
    name: string;
}

export type CompanyProfile = {
  companyName: string;
  email: string;
  phone: string;
  logo?: string | File;
  currency: string;
};

export type AuthProfile = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    accessOptions: MainTab[];
};

export type Staff = {
  id?: string;
  companyId: string;
  name: string;
  dateOfBirth?: string;
  nic?: string;
  contactNumber: string;
  whatsappNumber?: string;
  email?: string;
  position: string;
};


// Global state atoms
export const currencyAtom = atom<Currency>({ code: 'LKR', name: 'Sri Lankan Rupee' });

export const companyProfileAtom = atom<CompanyProfile>({
  companyName: 'Siraiva ltd',
  email: 'absiraivaws@gmail.com',
  phone: '+94773606494',
  logo: undefined,
  currency: 'LKR',
});

export const authProfileAtom = atom<AuthProfile | null>(null);


// Data atoms - These will be populated from Firestore
export const customersAtom = atom<any[]>([]);
export const suppliersAtom = atom<any[]>([]);
export const masterDataAtom = atom<any[]>([]);
export const purchaseOrdersAtom = atom<any[]>([]);
export const quotationsAtom = atom<any[]>([]);
export const saleOrdersAtom = atom<any[]>([]);
export const paymentsAtom = atom<Payment[]>([]);
export const staffAtom = atom<Staff[]>([]);

    
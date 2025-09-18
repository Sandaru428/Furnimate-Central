
import { atom } from 'jotai';
import { initialCustomersData, initialSuppliersData, initialMasterData, initialPurchaseOrdersData, initialQuotationsData, initialSaleOrdersData, initialPaymentsData } from './dummy-data';

// Data types
export type Payment = {
    id: string;
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

// Dummy data control atom
export const useDummyDataAtom = atom(true);

// Global state atoms
export const currencyAtom = atom<Currency>({ code: 'LKR', name: 'Sri Lankan Rupee' });

export const companyProfileAtom = atom<CompanyProfile>({
  companyName: 'Siraiva ltd',
  email: 'absiraiva@gmail.com',
  phone: '+94773606494',
  logo: undefined,
  currency: 'LKR',
});

// Data atoms
export const customersAtom = atom<typeof initialCustomersData>([]);
export const suppliersAtom = atom<typeof initialSuppliersData>([]);
export const masterDataAtom = atom<typeof initialMasterData>([]);
export const purchaseOrdersAtom = atom<typeof initialPurchaseOrdersData>([]);
export const quotationsAtom = atom<typeof initialQuotationsData>([]);
export const saleOrdersAtom = atom<typeof initialSaleOrdersData>([]);
export const paymentsAtom = atom<Payment[]>([]);

// This writable atom clears or seeds all data based on the useDummyDataAtom
export const dataSeederAtom = atom(
    get => get(useDummyDataAtom),
    (get, set, useDummyData: boolean) => {
        set(useDummyDataAtom, useDummyData);
        if (useDummyData) {
            set(customersAtom, initialCustomersData);
            set(suppliersAtom, initialSuppliersData);
            set(masterDataAtom, initialMasterData);
            set(purchaseOrdersAtom, initialPurchaseOrdersData);
            set(quotationsAtom, initialQuotationsData);
            set(saleOrdersAtom, initialSaleOrdersData);
            set(paymentsAtom, initialPaymentsData);
        } else {
            set(customersAtom, []);
            set(suppliersAtom, []);
            set(masterDataAtom, []);
            set(purchaseOrdersAtom, []);
            set(quotationsAtom, []);
            set(saleOrdersAtom, []);
            set(paymentsAtom, []);
        }
    }
)

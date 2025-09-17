
import { atom } from 'jotai';

export type Payment = {
    id: string;
    orderId: string;
    date: string;
    amount: number;
    method: 'Cash' | 'Card' | 'Online' | 'QR' | 'Cheque';
    details: string;
};

export const paymentsAtom = atom<Payment[]>([]);

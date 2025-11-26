import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toSentenceCase(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Generates a payment reference number in the format YYYYMMDDxxxxxx
 * where xxxxxx is an incrementing number starting from 000001 for each day.
 * @returns Promise<string> - The generated reference number
 */
export async function generatePaymentReferenceNumber(): Promise<string> {
  const today = new Date();
  const datePrefix = format(today, 'yyyyMMdd');
  
  // Query all payments with reference numbers starting with today's date
  const paymentsRef = collection(db, 'payments');
  const startOfDay = `${datePrefix}000000`;
  const endOfDay = `${datePrefix}999999`;
  
  const q = query(
    paymentsRef,
    where('referenceNumber', '>=', startOfDay),
    where('referenceNumber', '<=', endOfDay),
    orderBy('referenceNumber', 'desc'),
    limit(1)
  );
  
  try {
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // First payment of the day
      return `${datePrefix}000001`;
    }
    
    // Get the last reference number and increment
    const lastDoc = querySnapshot.docs[0];
    const lastReferenceNumber = lastDoc.data().referenceNumber as string;
    const lastSequence = parseInt(lastReferenceNumber.slice(-6));
    const newSequence = (lastSequence + 1).toString().padStart(6, '0');
    
    return `${datePrefix}${newSequence}`;
  } catch (error) {
    console.error('Error generating reference number:', error);
    // Fallback: return with 000001
    return `${datePrefix}000001`;
  }
}

'use server';

/**
 * @fileOverview A smart reference number generator.
 *
 * - generateReferenceNumber - A function that generates a unique reference number.
 * - GenerateReferenceNumberOutput - The return type for the generateReferenceNumber function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {format} from 'date-fns';

const GenerateReferenceNumberOutputSchema = z.object({
  referenceNumber: z
    .string()
    .describe('The generated reference number, format YYYYMMDDXXXXXX.'),
});
export type GenerateReferenceNumberOutput = z.infer<
  typeof GenerateReferenceNumberOutputSchema
>;

export async function generateReferenceNumber(): Promise<GenerateReferenceNumberOutput> {
  return generateReferenceNumberFlow();
}

const generateReferenceNumberFlow = ai.defineFlow(
  {
    name: 'generateReferenceNumberFlow',
    outputSchema: GenerateReferenceNumberOutputSchema,
  },
  async () => {
    const datePart = format(new Date(), 'yyyyMMdd');
    const randomPart = Math.floor(100000 + Math.random() * 900000)
      .toString()
      .substring(0, 6);
    
    const referenceNumber = `${datePart}${randomPart}`;

    return {
      referenceNumber,
    };
  }
);

'use server';

/**
 * @fileOverview A reference number compliance auditor AI agent.
 *
 * - auditReferenceCompliance - A function that audits reference numbers for compliance.
 * - AuditReferenceComplianceInput - The input type for the auditReferenceCompliance function.
 * - AuditReferenceComplianceOutput - The return type for the auditReferenceCompliance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {parse, isValid as isValidDate} from 'date-fns';

const AuditReferenceComplianceInputSchema = z.object({
  referenceNumber: z
    .string()
    .describe('The reference number to audit, format YYYYMMDDXXXXXX.'),
  referenceType: z.string().describe('The type of reference number (e.g., PO, SO, INV).'),
});
export type AuditReferenceComplianceInput = z.infer<
  typeof AuditReferenceComplianceInputSchema
>;

const AuditReferenceComplianceOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the reference number is valid.'),
  reason: z.string().describe('The reason why the reference number is invalid, if applicable.'),
});
export type AuditReferenceComplianceOutput = z.infer<
  typeof AuditReferenceComplianceOutputSchema
>;

export async function auditReferenceCompliance(
  input: AuditReferenceComplianceInput
): Promise<AuditReferenceComplianceOutput> {
  return auditReferenceComplianceFlow(input);
}

const auditReferenceComplianceFlow = ai.defineFlow(
  {
    name: 'auditReferenceComplianceFlow',
    inputSchema: AuditReferenceComplianceInputSchema,
    outputSchema: AuditReferenceComplianceOutputSchema,
  },
  async ({referenceNumber, referenceType}) => {
    // Rule 1: Check format YYYYMMDDXXXXXX (14 characters, all digits)
    if (!/^\d{14}$/.test(referenceNumber)) {
      return {
        isValid: false,
        reason: 'Invalid format. Must be 14 digits in YYYYMMDDXXXXXX format.',
      };
    }

    // Rule 2: YYYYMMDD must be a valid date
    const datePart = referenceNumber.substring(0, 8);
    const date = parse(datePart, 'yyyyMMdd', new Date());
    if (!isValidDate(date)) {
      return {
        isValid: false,
        reason: `Invalid date part. ${datePart} is not a valid date.`,
      };
    }
    
    // All checks passed
    return {
        isValid: true,
        reason: 'Reference number is valid.',
    };
  }
);

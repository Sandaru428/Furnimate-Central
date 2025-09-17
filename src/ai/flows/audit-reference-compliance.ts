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

const prompt = ai.definePrompt({
  name: 'auditReferenceCompliancePrompt',
  input: {schema: AuditReferenceComplianceInputSchema},
  output: {schema: AuditReferenceComplianceOutputSchema},
  prompt: `You are an expert auditor specializing in reference number compliance.

You will audit the reference number against the following rules:
1. The reference number must be in the format YYYYMMDDXXXXXX.
2. YYYYMMDD must be a valid date.
3. XXXXXX must be a 6-digit number, zero-padded.

Reference Type: {{{referenceType}}}
Reference Number: {{{referenceNumber}}}

Respond with isValid true or false, and a reason if isValid is false.
`,
});

const auditReferenceComplianceFlow = ai.defineFlow(
  {
    name: 'auditReferenceComplianceFlow',
    inputSchema: AuditReferenceComplianceInputSchema,
    outputSchema: AuditReferenceComplianceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

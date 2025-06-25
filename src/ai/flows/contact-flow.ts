'use server';

/**
 * @fileOverview A flow for handling contact form submissions.
 *
 * - submitContactForm - A function that handles the contact form submission.
 * - ContactFormInput - The input type for the submitContactForm function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ContactFormInputSchema = z.object({
  name: z.string().describe('The full name of the person submitting the form.'),
  email: z.string().email().describe('The email address of the person.'),
  companyName: z.string().describe('The company name of the person.'),
  message: z.string().optional().describe('An optional message from the person.'),
});
export type ContactFormInput = z.infer<typeof ContactFormInputSchema>;

export async function submitContactForm(input: ContactFormInput): Promise<void> {
  await contactFlow(input);
}

const contactFlow = ai.defineFlow(
  {
    name: 'contactFlow',
    inputSchema: ContactFormInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    // In a real application, you would add logic here to:
    // 1. Save the contact information to a database (e.g., Firestore).
    // 2. Send a notification email to the sales team.
    // For this prototype, we'll just log the input to the console.
    console.log('New contact form submission:', input);
  }
);

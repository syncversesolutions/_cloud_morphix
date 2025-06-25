'use server';

/**
 * @fileOverview A flow for handling contact form submissions.
 *
 * - submitContactForm - A function that handles the contact form submission.
 * - ContactFormInput - The input type for the submitContactForm function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const ContactFormInputSchema = z.object({
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
    // Save the contact information to a "contacts" collection in Firestore.
    try {
        const contactsCollection = collection(db, 'contacts');
        await addDoc(contactsCollection, {
            ...input,
            submittedAt: serverTimestamp(),
        });
        console.log('Contact form submission saved to Firestore:', input);
    } catch (error) {
        console.error("Error saving contact form to Firestore:", error);
        // Re-throw the error so the client can handle it.
        throw new Error("Failed to save contact information.");
    }
  }
);

import { pipeline } from '@huggingface/transformers';

const extractor = await pipeline('feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
         { dtype: 'q8' });

// Accepts a string or an array of strings, returns an array of 384-number vectors
export async function embed(texts) {
  const input = Array.isArray(texts) ? texts : [texts];
  const output = await extractor(input, { pooling: 'mean', normalize: true });
  return output.tolist();
}
 
/**
 * The text that represents a ticket in vector space.
 * A new ticket only has subject + description, so we embed exactly those
 * for both stored and incoming tickets (keeps the comparison symmetrical).
 */
export function ticketText({ subject, description }) {
  return `${subject}. ${description ?? ''}`.trim();
}

 

import { pipeline } from '@huggingface/transformers';

// Load the feature-extraction pipeline
const extractor = await pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2',
  { dtype: 'q8' }
);

// Generate an embedding for a sentence
const output = await extractor('I need help with my order', {
  pooling: 'mean',
  normalize: true
});

// Convert the embedding into a regular JavaScript array
const vector = output.tolist()[0];

console.log('Vector length:', vector.length);
// console.log('Embedding:', vector);

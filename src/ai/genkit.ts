
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Ensure your GOOGLE_API_KEY environment variable is set.
// You can add it to a .env file at the root of your project:
// GOOGLE_API_KEY=your_api_key_here
// Restart your dev server after changing .env.

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

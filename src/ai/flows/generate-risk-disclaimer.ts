// 'use server';
// /**
//  * @fileOverview A flow that generates a risk disclaimer for the stock market.
//  * (This flow is currently not in active use as primary analysis shifted to get-ai-web-search-stock-report.ts)
//  *
//  * - generateRiskDisclaimer - A function that generates a risk disclaimer.
//  * - GenerateRiskDisclaimerInput - The input type for the generateRiskDisclaimer function.
//  * - GenerateRiskDisclaimerOutput - The return type for the generateRiskDisclaimer function.
//  */

// import {ai} from '@/ai/genkit';
// import {z} from 'genkit';

// const GenerateRiskDisclaimerInputSchema = z.object({
//   stockName: z.string().describe('The name of the stock, or "general stock market" if not specific to one stock.'),
// });
// export type GenerateRiskDisclaimerInput = z.infer<typeof GenerateRiskDisclaimerInputSchema>;

// const GenerateRiskDisclaimerOutputSchema = z.object({
//   disclaimer: z.string().describe('The generated risk disclaimer.'),
// });
// export type GenerateRiskDisclaimerOutput = z.infer<typeof GenerateRiskDisclaimerOutputSchema>;

// export async function generateRiskDisclaimer(input: GenerateRiskDisclaimerInput): Promise<GenerateRiskDisclaimerOutput> {
//   return generateRiskDisclaimerFlow(input);
// }

// const prompt = ai.definePrompt({
//   name: 'generateRiskDisclaimerPrompt',
//   input: {schema: GenerateRiskDisclaimerInputSchema},
//   output: {schema: GenerateRiskDisclaimerOutputSchema},
//   prompt: `You are an AI assistant that specializes in generating risk disclaimers for stock market investments.

// Generate a standard risk disclaimer for investing in {{#if stockName}}{{stockName}}{{else}}the stock market{{/if}}.
// The disclaimer should be informative, concise, and easy to understand. It should clearly state that past performance is not indicative of future results, investments carry risk of loss, and information provided is not financial advice and individuals should consult with a qualified financial advisor before making investment decisions.

// Ensure your output is a JSON object with a "disclaimer" field containing the generated text.
//   `,
// });

// const generateRiskDisclaimerFlow = ai.defineFlow(
//   {
//     name: 'generateRiskDisclaimerFlow',
//     inputSchema: GenerateRiskDisclaimerInputSchema,
//     outputSchema: GenerateRiskDisclaimerOutputSchema,
//   },
//   async input => {
//     const {output} = await prompt(input);
//     return output!;
//   }
// );

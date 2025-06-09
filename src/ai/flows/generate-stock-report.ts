
// src/ai/flows/generate-stock-report.ts
'use server';

/**
 * @fileOverview Generates an AI-driven stock weather report assessing the overall outlook of a stock.
 *
 * - generateStockReport - A function that generates the stock report.
 * - GenerateStockReportInput - The input type for the generateStockReport function.
 * - GenerateStockReportOutput - The return type for the generateStockReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStockReportInputSchema = z.object({
  fundamentalData: z.string().describe('Fundamental data of the stock.'),
  technicalIndicators: z.string().describe('Technical indicators of the stock.'),
  news: z.string().describe('Recent news related to the stock.'),
});
export type GenerateStockReportInput = z.infer<typeof GenerateStockReportInputSchema>;

const GenerateStockReportOutputSchema = z.object({
  report: z.string().describe('The AI-driven stock weather report.'),
  score: z.string().describe('A score or grade representing the overall outlook of the stock (e.g., A, B, C, or a numerical score).'),
  confidence: z.number().describe('A confidence meter indicating the degree of confidence in the AI-driven stock assessment (0 to 1).'),
  disclaimer: z.string().describe('A disclaimer about the risk and uncertainty involved in the stock market.'),
});
export type GenerateStockReportOutput = z.infer<typeof GenerateStockReportOutputSchema>;

export async function generateStockReport(input: GenerateStockReportInput): Promise<GenerateStockReportOutput> {
  return generateStockReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStockReportPrompt',
  input: {schema: GenerateStockReportInputSchema},
  output: {schema: GenerateStockReportOutputSchema},
  prompt: `You are an AI stock market analyst. Analyze the provided Fundamental Data, Technical Indicators, and News for a stock.
Based on your analysis, generate:
1.  A comprehensive stock report detailing your findings and outlook.
2.  An overall outlook score (e.g., A, B, C, or a numerical score like 75/100).
3.  A confidence level (a number between 0 and 1, where 0 is no confidence and 1 is full confidence) in your assessment.
4.  A standard disclaimer about the risks and uncertainties involved in stock market investments.

Ensure your output is a JSON object matching the defined schema.

Fundamental Data: {{{fundamentalData}}}
Technical Indicators: {{{technicalIndicators}}}
News: {{{news}}}`,
});

const generateStockReportFlow = ai.defineFlow(
  {
    name: 'generateStockReportFlow',
    inputSchema: GenerateStockReportInputSchema,
    outputSchema: GenerateStockReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

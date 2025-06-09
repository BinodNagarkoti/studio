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
  score: z.string().describe('A score or grade representing the overall outlook of the stock.'),
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
  prompt: `You are an AI stock market analyst. Generate a stock weather report based on the provided information.

Fundamental Data: {{{fundamentalData}}}
Technical Indicators: {{{technicalIndicators}}}
News: {{{news}}}

Analyze the data and generate a comprehensive stock report, a score (e.g., A, B, C) indicating the overall outlook, a confidence level (0 to 1) representing the confidence in the assessment, and a disclaimer about the risks of stock market investments.

Report:
{{report}}
Score:
{{score}}
Confidence:
{{confidence}}
Disclaimer:
{{disclaimer}}`,
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

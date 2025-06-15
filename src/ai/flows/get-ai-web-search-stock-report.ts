
'use server';
/**
 * @fileOverview A Genkit flow that uses AI to generate a stock report
 * by simulating a web search based on the stock symbol.
 *
 * - getAIWebSearchStockReport - Generates a stock report, outlook score, confidence, and disclaimer.
 * - GetAIWebSearchStockReportInput - Input type for the flow.
 * - GetAIWebSearchStockReportOutput - Output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetAIWebSearchStockReportInputSchema = z.object({
  stockSymbol: z.string().describe('The stock ticker symbol to research (e.g., NTC, API).'),
  companyName: z.string().optional().describe('The full name of the company, if known.'),
});
export type GetAIWebSearchStockReportInput = z.infer<typeof GetAIWebSearchStockReportInputSchema>;

// Output schema similar to the previous generateStockReportFlow
const GetAIWebSearchStockReportOutputSchema = z.object({
  report: z.string().describe('The AI-driven stock weather report based on simulated web search findings, including justification for the confidence level.'),
  score: z.string().describe('A score or grade representing the overall outlook of the stock (e.g., A, B, C, or a numerical score) based on the simulated web search.'),
  confidence: z.number().min(0).max(1).describe('A confidence meter indicating the degree of confidence in the AI-driven stock assessment (0 to 1) based on the simulated web search.'),
  disclaimer: z.string().describe('A standard disclaimer about the risk and uncertainty involved in the stock market.'),
});
export type GetAIWebSearchStockReportOutput = z.infer<typeof GetAIWebSearchStockReportOutputSchema>;

export async function getAIWebSearchStockReport(
  input: GetAIWebSearchStockReportInput
): Promise<GetAIWebSearchStockReportOutput> {
  return getAIWebSearchStockReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getAIWebSearchStockReportPrompt',
  input: {schema: GetAIWebSearchStockReportInputSchema},
  output: {schema: GetAIWebSearchStockReportOutputSchema},
  prompt: `You are an AI stock market analyst for the Nepal Stock Exchange (NEPSE).
Your task is to provide an analysis for the stock with ticker symbol: {{{stockSymbol}}}{{#if companyName}} (Company Name: {{{companyName}}}){{/if}}.

Imagine you have performed a web search to gather the latest available information, news, general sentiment, and typical fundamental and technical analysis talking points for this NEPSE stock. Based on this simulated "web research," generate:

1.  A comprehensive stock report: Detail your findings and provide an overall outlook for the stock. Consider its sector, recent performance trends (if general knowledge allows), any major known news or events, and general market perception. This report should also include a brief justification for your confidence level assessment (see point 3).
2.  An overall outlook score: Assign a grade (e.g., A, B, C, D, F) or a numerical score (e.g., 75/100) that reflects your assessment of the stock's potential.
3.  A confidence level: Provide a numerical value between 0.0 (no confidence) and 1.0 (complete confidence) in your assessment. The reasoning for this confidence level should be integrated into the main stock report (point 1), considering factors like the typical availability and reliability of information for such stocks.
4.  A standard risk disclaimer: Include a disclaimer about the risks and uncertainties involved in stock market investments, emphasizing that this is not financial advice.

Focus on synthesizing a plausible analysis based on the typical characteristics and information available for NEPSE stocks. Do not invent specific financial numbers unless they are very commonly known for the given stock. Your analysis should be informative and reflect what an investor might glean from a general web search and preliminary analysis.

Ensure your output is a JSON object matching the defined schema.
`,
});

const getAIWebSearchStockReportFlow = ai.defineFlow(
  {
    name: 'getAIWebSearchStockReportFlow',
    inputSchema: GetAIWebSearchStockReportInputSchema,
    outputSchema: GetAIWebSearchStockReportOutputSchema,
  },
  async input => {
    // In a real scenario with tools, you might fetch live search results here.
    // For now, the LLM uses its existing knowledge.
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a report. Output was null.');
    }
    return output;
  }
);


// 'use server';
// /**
//  * @fileOverview Summarizes stock data using fundamental data, technical indicators, and news.
//  * (This flow is currently not in active use as primary analysis shifted to get-ai-web-search-stock-report.ts)
//  */
// import {ai} from '@/ai/genkit';
// import {z} from 'genkit';

// const StockDataSummaryInputSchema = z.object({
//   fundamentalData: z.string().describe('Fundamental data of the stock.'),
//   technicalIndicators: z.string().describe('Technical indicators of the stock.'),
//   news: z.string().describe('News related to the stock.'),
// });
// export type StockDataSummaryInput = z.infer<typeof StockDataSummaryInputSchema>;

// const StockDataSummaryOutputSchema = z.object({
//   summary: z.string().describe('A concise summary of the stock data.'),
//   confidence: z.number().describe('Confidence level in the summary (0-1).'),
//   reportGrade: z.string().describe('Overall grade of the stock (e.g., A, B, C).'),
//   disclaimer: z.string().describe('Risk disclaimer for the stock market.'),
// });
// export type StockDataSummaryOutput = z.infer<typeof StockDataSummaryOutputSchema>;

// export async function summarizeStockData(input: StockDataSummaryInput): Promise<StockDataSummaryOutput> {
//   return summarizeStockDataFlow(input);
// }

// const summarizeStockDataPrompt = ai.definePrompt({
//   name: 'summarizeStockDataPrompt',
//   input: {schema: StockDataSummaryInputSchema},
//   output: {schema: StockDataSummaryOutputSchema},
//   prompt: `You are an AI assistant that summarizes stock data.
// Given the fundamental data, technical indicators, and news of a stock, provide:
// 1.  A concise summary of the key takeaways.
// 2.  A confidence level (a number between 0 and 1) for your summary.
// 3.  An overall grade for the stock (e.g., A, B, C, D, F).
// 4.  A standard risk disclaimer relevant to stock market investments.

// Ensure your output is a JSON object matching the defined schema.

// Fundamental Data: {{{fundamentalData}}}
// Technical Indicators: {{{technicalIndicators}}}
// News: {{{news}}}`,
// });

// const summarizeStockDataFlow = ai.defineFlow(
//   {
//     name: 'summarizeStockDataFlow',
//     inputSchema: StockDataSummaryInputSchema,
//     outputSchema: StockDataSummaryOutputSchema,
//   },
//   async input => {
//     const {output} = await summarizeStockDataPrompt(input);
//     return output!;
//   }
// );

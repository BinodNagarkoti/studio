// 'use server';
// /**
//  * @fileOverview Flow to assess the confidence level of the AI-driven stock assessment.
//  * (This flow is currently not in active use as primary analysis shifted to get-ai-web-search-stock-report.ts)
//  *
//  * - assessConfidenceLevel - A function that assesses the confidence level.
//  * - AssessConfidenceLevelInput - The input type for assessConfidenceLevel.
//  * - AssessConfidenceLevelOutput - The output type for assessConfidenceLevel.
//  */

// import {ai} from '@/ai/genkit';
// import {z} from 'genkit';

// const AssessConfidenceLevelInputSchema = z.object({
//   fundamentalData: z.string().describe('Fundamental data of the stock.'),
//   technicalIndicators: z.string().describe('Technical indicators of the stock.'),
//   newsSentiment: z.string().describe('News sentiment of the stock (e.g., Positive, Negative, Neutral, Mixed).'),
//   aiAssessment: z.string().describe('The AI-driven stock assessment text whose confidence is being evaluated.'),
// });
// export type AssessConfidenceLevelInput = z.infer<typeof AssessConfidenceLevelInputSchema>;

// const AssessConfidenceLevelOutputSchema = z.object({
//   confidenceLevel: z
//     .number()
//     .min(0)
//     .max(1)
//     .describe(
//       'A number between 0 and 1 representing the confidence level in the AI assessment. 0 indicates no confidence, 1 indicates complete confidence.'
//     ),
//   reasoning: z.string().describe('The reasoning behind the confidence level assessment, considering data quality, agreement between sources, and potential biases.'),
// });
// export type AssessConfidenceLevelOutput = z.infer<typeof AssessConfidenceLevelOutputSchema>;

// export async function assessConfidenceLevel(
//   input: AssessConfidenceLevelInput
// ): Promise<AssessConfidenceLevelOutput> {
//   return assessConfidenceLevelFlow(input);
// }

// const prompt = ai.definePrompt({
//   name: 'assessConfidenceLevelPrompt',
//   input: {schema: AssessConfidenceLevelInputSchema},
//   output: {schema: AssessConfidenceLevelOutputSchema},
//   prompt: `You are an expert in evaluating the confidence level of AI-driven stock assessments.
// Based on the provided fundamental data, technical indicators, news sentiment, and the AI's own assessment text, critically evaluate and determine a confidence score for the AI's assessment.

// Consider factors like:
// - The coherence and consistency of the AI's assessment.
// - Agreement or disagreement between fundamental data, technical indicators, and news sentiment.
// - The strength and clarity of signals from the provided data.
// - Potential limitations or biases in the data or the AI assessment.

// Provide:
// 1.  A confidence level as a numerical value between 0.0 (no confidence) and 1.0 (complete confidence).
// 2.  A brief but clear reasoning for your confidence level assessment, highlighting the key factors that influenced your decision.

// Ensure your output is a JSON object matching the defined schema.

// Fundamental Data: {{{fundamentalData}}}
// Technical Indicators: {{{technicalIndicators}}}
// News Sentiment: {{{newsSentiment}}}
// AI Assessment Text: {{{aiAssessment}}}
// `,
// });

// const assessConfidenceLevelFlow = ai.defineFlow(
//   {
//     name: 'assessConfidenceLevelFlow',
//     inputSchema: AssessConfidenceLevelInputSchema,
//     outputSchema: AssessConfidenceLevelOutputSchema,
//   },
//   async input => {
//     const {output} = await prompt(input);
//     return output!;
//   }
// );

'use server';

/**
 * @fileOverview Flow to assess the confidence level of the AI-driven stock assessment.
 *
 * - assessConfidenceLevel - A function that assesses the confidence level.
 * - AssessConfidenceLevelInput - The input type for assessConfidenceLevel.
 * - AssessConfidenceLevelOutput - The output type for assessConfidenceLevel.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssessConfidenceLevelInputSchema = z.object({
  fundamentalData: z.string().describe('Fundamental data of the stock.'),
  technicalIndicators: z.string().describe('Technical indicators of the stock.'),
  newsSentiment: z.string().describe('News sentiment of the stock.'),
  aiAssessment: z.string().describe('The AI-driven stock assessment.'),
});
export type AssessConfidenceLevelInput = z.infer<typeof AssessConfidenceLevelInputSchema>;

const AssessConfidenceLevelOutputSchema = z.object({
  confidenceLevel: z
    .number()
    .describe(
      'A number between 0 and 1 representing the confidence level in the AI assessment.'
    ),
  reasoning: z.string().describe('The reasoning behind the confidence level assessment.'),
});
export type AssessConfidenceLevelOutput = z.infer<typeof AssessConfidenceLevelOutputSchema>;

export async function assessConfidenceLevel(
  input: AssessConfidenceLevelInput
): Promise<AssessConfidenceLevelOutput> {
  return assessConfidenceLevelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assessConfidenceLevelPrompt',
  input: {schema: AssessConfidenceLevelInputSchema},
  output: {schema: AssessConfidenceLevelOutputSchema},
  prompt: `You are an expert in assessing the confidence level of AI-driven stock assessments.

  Based on the following information, assess the confidence level of the AI assessment provided.
  Provide a confidence level as a number between 0 and 1, where 0 indicates no confidence and 1 indicates complete confidence.
  Also, provide a brief reasoning for your confidence level assessment.

  Fundamental Data: {{{fundamentalData}}}
  Technical Indicators: {{{technicalIndicators}}}
  News Sentiment: {{{newsSentiment}}}
  AI Assessment: {{{aiAssessment}}}

  Confidence Level (0-1):
  Reasoning: `,
});

const assessConfidenceLevelFlow = ai.defineFlow(
  {
    name: 'assessConfidenceLevelFlow',
    inputSchema: AssessConfidenceLevelInputSchema,
    outputSchema: AssessConfidenceLevelOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


'use server';
/**
 * @fileOverview A Genkit flow that uses AI to generate a stock report
 * by simulating a web search based on the stock symbol.
 *
 * - getAIWebSearchStockReport - Generates a stock report, outlook score, confidence, and disclaimer,
 *   along with fundamental, technical, news summaries, and technical indicator chart data.
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

const AIChartDataPointSchema = z.object({
  date: z.string().describe("Date in YYYY-MM-DD format."),
  value: z.number().describe("Indicator value for that date.")
});

const AITechnicalIndicatorChartInfoSchema = z.object({
  indicator_name: z.string().describe("Name of the technical indicator (e.g., RSI, MACD, 50-day Moving Average)."),
  current_value: z.string().describe("Current (latest) calculated value of the indicator."),
  interpretation: z.string().describe("Brief interpretation of the current indicator value (e.g., Overbought, Bullish Crossover, Approaching Support)."),
  chart_data: z.array(AIChartDataPointSchema).describe("An array of simulated historical data points (date, value) for this indicator, covering approximately the last 30-60 days, suitable for plotting a chart."),
  chart_type: z.enum(['line', 'bar']).optional().default('line').describe("Preferred chart type, defaults to line.")
});

const GetAIWebSearchStockReportOutputSchema = z.object({
  report: z.string().describe('The AI-driven stock "weather report" assessing overall outlook of the stock, incorporating insights from simulated fundamental, technical, and news analysis. This report MUST also include a brief justification for the confidence level.'),
  score: z.string().describe('A score or grade representing the overall outlook of the stock (e.g., A, B, C, or a numerical score like 75/100) based on the simulated web search.'),
  confidence: z.number().min(0).max(1).describe('A confidence meter indicating the degree of confidence in the AI-driven stock assessment (0 to 1) based on the simulated web search.'),
  disclaimer: z.string().describe('A standard disclaimer about the risk and uncertainty involved in the stock market.'),
  fundamental_summary: z.string().describe("A concise summary of key fundamental aspects of the stock (e.g., valuation, profitability, financial health) based on simulated web search findings."),
  technical_summary: z.string().describe("A concise summary of key technical aspects and chart patterns observed for the stock based on simulated web search findings."),
  news_summary: z.string().describe("A concise summary of recent relevant news, events, or overall market sentiment regarding the stock, based on simulated web search findings."),
  technical_indicators_chart_data: z.array(AITechnicalIndicatorChartInfoSchema).length(3).describe("An array containing data for exactly 2 to 3 key technical indicators (e.g., RSI, MACD, a common Moving Average). Each object must include the indicator name, its current value, a brief interpretation, and simulated daily historical data for the past 30-60 days for charting purposes.")
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
Your task is to provide a comprehensive analysis for the stock with ticker symbol: {{{stockSymbol}}}{{#if companyName}} (Company Name: {{{companyName}}}){{/if}}.

Imagine you have performed a web search to gather the latest available information, news, general sentiment, and typical fundamental and technical analysis talking points for this NEPSE stock. Based on this simulated "web research," generate the following in a valid JSON object:

1.  **Report ("report")**: A comprehensive stock "weather report" detailing your findings and providing an overall outlook for the stock. Consider its sector, recent performance trends, any major known news or events, and general market perception. This report MUST also include a brief justification for your confidence level assessment (see point 3).
2.  **Overall Outlook Score ("score")**: Assign a grade (e.g., A, B, C, D, F) or a numerical score (e.g., 75/100) that reflects your assessment of the stock's potential.
3.  **Confidence Level ("confidence")**: Provide a numerical value between 0.0 (no confidence) and 1.0 (complete confidence) in your assessment. The reasoning for this confidence level should be integrated into the main stock report (point 1).
4.  **Risk Disclaimer ("disclaimer")**: Include a standard disclaimer about the risks and uncertainties involved in stock market investments, emphasizing that this is not financial advice.
5.  **Fundamental Summary ("fundamental_summary")**: A concise textual summary highlighting key fundamental aspects (like valuation, profitability, financial health, key ratios if commonly known) derived from your simulated research.
6.  **Technical Summary ("technical_summary")**: A concise textual summary of key technical aspects, such as recent price action, support/resistance levels, or observed chart patterns from your simulated research.
7.  **News Summary ("news_summary")**: A concise textual summary of any significant recent news, announcements, or prevailing market sentiment related to the stock from your simulated research.
8.  **Technical Indicators Chart Data ("technical_indicators_chart_data")**:
    *   Provide an array for **exactly 2 to 3** key technical indicators (e.g., RSI, MACD, a common Moving Average like 50-day SMA).
    *   For each indicator in the array, include:
        *   "indicator_name": The name of the indicator.
        *   "current_value": The latest simulated value of the indicator.
        *   "interpretation": A brief interpretation of this current value.
        *   "chart_data": An array of simulated daily data points for this indicator for the **past 30 to 60 days**. Each data point should have a "date" (YYYY-MM-DD, sequential, ending yesterday or a recent plausible date) and a "value" (numeric). Ensure the historical data is plausible for the indicator type.
        *   "chart_type": (Optional) "line" or "bar". Default to "line".

Do not invent specific financial numbers unless they are very commonly known for the given stock. Your analysis should be informative and reflect what an investor might glean from a general web search and preliminary analysis. Ensure your output is a JSON object matching the defined output schema.
The "technical_indicators_chart_data" array must contain between 2 and 3 items. For "chart_data", make sure dates are in 'YYYY-MM-DD' format and are chronologically ordered, ending on a recent plausible date.
The justification for the confidence level must be included in the main "report" text.
`,
});

const getAIWebSearchStockReportFlow = ai.defineFlow(
  {
    name: 'getAIWebSearchStockReportFlow',
    inputSchema: GetAIWebSearchStockReportInputSchema,
    outputSchema: GetAIWebSearchStockReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a report. Output was null.');
    }
    // Basic validation for the chart data array length, though Zod schema should handle it.
    if (output.technical_indicators_chart_data && (output.technical_indicators_chart_data.length < 2 || output.technical_indicators_chart_data.length > 3)) {
        // Attempt to self-correct or log a warning. For now, just let Zod handle it or pass through.
        // This is more of a safeguard if the LLM doesn't strictly follow the count.
    }
    return output;
  }
);

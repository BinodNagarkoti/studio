
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-stock-data.ts';
import '@/ai/flows/generate-risk-disclaimer.ts';
import '@/ai/flows/assess-confidence-level.ts';
import '@/ai/flows/generate-stock-report.ts';
import '@/ai/flows/get-ai-web-search-stock-report.ts'; // Added new flow

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import type { NepseStockSymbol } from "@/types"; // NepseStockSymbol is now string
import { useState } from "react";
// Removed the import for fetchAllCompaniesForSearchAction
// Removed the import for useToast as toasts were primarily for loading the list

// Directly import the stock data from the JSON file
import stockData from "../../../stock_data.json";

const FormSchema = z.object({
  symbol: z.string({required_error: "Please select a stock symbol."}).min(1, "Please select a stock symbol."),
});

interface StockSearchFormProps {
  onSearch: (symbol: NepseStockSymbol) => void;
  isLoading: boolean; // Loading state for when selected stock's details are being fetched
}

export function StockSearchForm({ onSearch, isLoading }: StockSearchFormProps) {
  // Initialize companies state directly with imported data
  const [companies] = useState(stockData);
  // isCompanyListLoading is no longer needed as data is local
  const isCompanyListLoading = false; // Set to false since data is loaded directly

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  // Removed the useEffect hook for fetching data

  function onSubmit(data: z.infer<typeof FormSchema>) {
    onSearch(data.symbol as NepseStockSymbol);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md mx-auto space-y-6 bg-card p-6 sm:p-8 rounded-lg shadow-xl">
        <FormField
          control={form.control}
          name="symbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Select Stock Symbol (NEPSE)</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                disabled={isLoading || isCompanyListLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/* Map over the imported stockData */}
                  {companies.length > 0 ? (
                    companies.map((company) => (
                      <SelectItem key={company.stock_symbol} value={company.stock_symbol}>
                        {company.name} ({company.stock_symbol})
                      </SelectItem>
                    ))
                  ) : (
                     <SelectItem value="no-companies" disabled>No companies available in JSON</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isCompanyListLoading || companies.length === 0}>
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Search className="mr-2 h-5 w-5" />
          )}
          {isLoading ? "Analyzing..." : "Get AI Insights"}
        </Button>
      </form>
    </Form>
  );
}


"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import type { NepseStockSymbol } from "@/types";
import { useState } from "react";
import stockData from '@/../stock_data.json'; 

const FormSchema = z.object({
  symbol: z.string({required_error: "Please select a stock symbol."}).min(1, "Please select a stock symbol."),
});

interface StockSearchFormProps {
  onSearch: (symbol: NepseStockSymbol) => void;
  isLoading: boolean;
}

interface StockDataItem {
  stock_symbol: string;
  name: string;
}

export function StockSearchForm({ onSearch, isLoading }: StockSearchFormProps) {
  const [companies] = useState<StockDataItem[]>(stockData);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

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
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={companies.length === 0 ? "No companies loaded" : "Select a company"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.length > 0 ? (
                    companies.map((company) => (
                      <SelectItem key={company.stock_symbol} value={company.stock_symbol}>
                        {company.name} ({company.stock_symbol})
                      </SelectItem>
                    ))
                  ) : (
                     <SelectItem value="no-companies" disabled>No companies available</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || companies.length === 0}>
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

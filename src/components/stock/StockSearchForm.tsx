
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import type { NepseStockSymbol, CompanySelectItem } from "@/types";
import { useState, useEffect } from "react";
import { fetchAllCompaniesForSearchAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

const FormSchema = z.object({
  symbol: z.string({required_error: "Please select a stock symbol."}).min(1, "Please select a stock symbol."),
});

interface StockSearchFormProps {
  onSearch: (symbol: NepseStockSymbol) => void;
  isLoading: boolean; // Loading state for when selected stock's details are being fetched
}

export function StockSearchForm({ onSearch, isLoading }: StockSearchFormProps) {
  const [companies, setCompanies] = useState<CompanySelectItem[]>([]);
  const [isCompanyListLoading, setIsCompanyListLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  useEffect(() => {
    const loadCompanies = async () => {
      setIsCompanyListLoading(true);
      try {
        // toast({ title: "Fetching Company List...", description: "Loading available NEPSE companies."});
        const fetchedCompanies = await fetchAllCompaniesForSearchAction();
        setCompanies(fetchedCompanies);
        if (fetchedCompanies.length === 0) {
        //   toast({ title: "No Companies Found", description: "Could not find any companies in the database.", variant: "default" });
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
        toast({ title: "Error Loading Companies", description: "Could not load company list. Please try again later.", variant: "destructive" });
        setCompanies([]); // Ensure companies is an empty array on error
      } finally {
        setIsCompanyListLoading(false);
      }
    };
    loadCompanies();
  }, [toast]);

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
                    <SelectValue placeholder={isCompanyListLoading ? "Loading companies..." : "Select a company"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isCompanyListLoading ? (
                    <SelectItem value="loading" disabled>Loading companies...</SelectItem>
                  ) : companies.length > 0 ? (
                    companies.map((company) => (
                      <SelectItem key={company.ticker_symbol} value={company.ticker_symbol}>
                        {company.name} ({company.ticker_symbol})
                      </SelectItem>
                    ))
                  ) : (
                     <SelectItem value="no-companies" disabled>No companies available or failed to load</SelectItem>
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

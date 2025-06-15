
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRoundSearch, Loader2 } from "lucide-react";
import type { BrokerSelectItem } from "@/types";
import { useEffect, useState } from "react";
import { fetchAllBrokersAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

const FormSchema = z.object({
  brokerId: z.string({ required_error: "Please select a broker." }).min(1, "Please select a broker."),
});

interface BrokerSelectFormProps {
  onBrokerSelect: (brokerId: string) => void;
  isLoading: boolean;
}

export function BrokerSelectForm({ onBrokerSelect, isLoading }: BrokerSelectFormProps) {
  const [brokers, setBrokers] = useState<BrokerSelectItem[]>([]);
  const [isBrokerListLoading, setIsBrokerListLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  useEffect(() => {
    const loadBrokers = async () => {
      setIsBrokerListLoading(true);
      try {
        const fetchedBrokers = await fetchAllBrokersAction();
        setBrokers(fetchedBrokers);
      } catch (error) {
        console.error("Failed to fetch brokers:", error);
        toast({ title: "Error Loading Brokers", description: "Could not load broker list. Please try again later.", variant: "destructive" });
        setBrokers([]);
      } finally {
        setIsBrokerListLoading(false);
      }
    };
    loadBrokers();
  }, [toast]);

  function onSubmit(data: z.infer<typeof FormSchema>) {
    onBrokerSelect(data.brokerId);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md mx-auto space-y-6 bg-card p-6 sm:p-8 rounded-lg shadow-xl">
        <FormField
          control={form.control}
          name="brokerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Select Broker (NEPSE)</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                disabled={isLoading || isBrokerListLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isBrokerListLoading ? "Loading brokers..." : "Select a broker"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isBrokerListLoading ? (
                    <SelectItem value="loading" disabled>Loading brokers...</SelectItem>
                  ) : brokers.length > 0 ? (
                    brokers.map((broker) => (
                      <SelectItem key={broker.id} value={broker.id}>
                        {broker.name} ({broker.broker_code})
                      </SelectItem>
                    ))
                  ) : (
                     <SelectItem value="no-brokers" disabled>No brokers available or failed to load</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isBrokerListLoading || brokers.length === 0}>
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <UserRoundSearch className="mr-2 h-5 w-5" />
          )}
          {isLoading ? "Fetching Stocks..." : "Get Broker Activity"}
        </Button>
      </form>
    </Form>
  );
}

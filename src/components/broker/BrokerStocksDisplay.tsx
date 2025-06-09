
"use client";

import type { BrokerSelectItem, ProcessedStockInfo } from '@/types'; // Use BrokerSelectItem
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks } from 'lucide-react';

interface BrokerStocksDisplayProps {
  broker?: BrokerSelectItem | null; // Selected broker details (BrokerSelectItem provides id, name, code)
  stocks: ProcessedStockInfo[];
}

export function BrokerStocksDisplay({ broker, stocks }: BrokerStocksDisplayProps) {
  const brokerDisplayName = broker?.name || "Selected Broker"; // Use broker name if available

  if (!broker) {
    return null; 
  }

  if (stocks.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ListChecks className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl font-semibold font-headline text-primary">
              Processed Stocks for {brokerDisplayName}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No processed stock data found for this broker.</p>
        </CardContent>
      </Card>
    );
  }
  
  const getTransactionTypeBadgeVariant = (type: ProcessedStockInfo['transactionType']) => {
    switch (type) {
      case 'Buy':
        return 'default'; 
      case 'Sell':
        return 'destructive'; 
      case 'Match':
        return 'secondary'; 
      default:
        return 'outline';
    }
  };


  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
         <div className="flex items-center gap-3">
            <ListChecks className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl font-semibold font-headline text-primary">
              Processed Stocks for {brokerDisplayName}
            </CardTitle>
          </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>A list of stocks recently processed by {brokerDisplayName}.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Symbol</TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead className="text-center">Transaction Type</TableHead>
              <TableHead className="text-right">Volume Traded</TableHead>
              <TableHead className="text-right">Last Processed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => (
              <TableRow key={`${stock.symbol}-${stock.lastProcessedDate}-${stock.transactionType}`}>
                <TableCell className="font-medium">{stock.symbol}</TableCell>
                <TableCell>{stock.companyName}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={getTransactionTypeBadgeVariant(stock.transactionType)} 
                         className={stock.transactionType === 'Buy' ? 'bg-accent text-accent-foreground' : ''}>
                    {stock.transactionType}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{stock.volumeTraded.toLocaleString()}</TableCell>
                <TableCell className="text-right">{new Date(stock.lastProcessedDate).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

    
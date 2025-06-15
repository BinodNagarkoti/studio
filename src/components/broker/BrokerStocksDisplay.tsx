
"use client";

import type { BrokerSelectItem, ProcessedStockInfo } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

interface BrokerStocksDisplayProps {
  broker?: BrokerSelectItem | null;
  stocks: ProcessedStockInfo[];
  isLoading: boolean;
}

const SkeletonRow = () => (
  <TableRow>
    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
    <TableCell className="text-center"><Skeleton className="h-6 w-16 inline-block" /></TableCell>
    <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
    <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
  </TableRow>
);

export function BrokerStocksDisplay({ broker, stocks, isLoading }: BrokerStocksDisplayProps) {
  const brokerDisplayName = broker?.name || "Selected Broker";

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Loading processed stock data for {brokerDisplayName}...</TableCaption>
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
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }
  
  if (!broker) {
    return null; 
  }

  // This case is handled by the parent page if stocks.length === 0 and !isLoading
  // But as a fallback:
  if (stocks.length === 0 && !isLoading) {
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

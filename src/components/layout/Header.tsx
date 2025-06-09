import { TrendingUp } from 'lucide-react';
import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary font-headline">ShareScope AI</h1>
          </Link>
          {/* Future navigation items can go here */}
        </div>
      </div>
    </header>
  );
}

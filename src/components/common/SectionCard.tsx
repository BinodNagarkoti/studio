import type { SectionCardProps } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function SectionCard({ title, icon: Icon, children, action, defaultOpen = true }: SectionCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <Accordion type="single" collapsible defaultValue={defaultOpen ? "item-1" : undefined}>
        <AccordionItem value="item-1" className="border-b-0">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3 w-full">
              {Icon && <Icon className="h-6 w-6 text-primary" />}
              <CardTitle className="text-xl font-semibold font-headline text-primary">{title}</CardTitle>
              {action && <div className="ml-auto">{action}</div>}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-0">
            {children}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

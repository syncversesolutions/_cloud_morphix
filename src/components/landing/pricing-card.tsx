import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  tier: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isFeatured?: boolean;
}

export default function PricingCard({ tier, price, period, description, features, isFeatured = false }: PricingCardProps) {
  return (
    <Card className={cn("flex flex-col bg-secondary/30", isFeatured ? "border-primary shadow-lg shadow-primary/20" : "border-border/50")}>
      <CardHeader className={cn(isFeatured ? "bg-primary/10" : "")}>
        <CardTitle className="font-headline text-2xl">{tier}</CardTitle>
        <div className="flex items-baseline gap-2 pt-2">
          {price !== "Custom" && <span className="text-4xl font-bold tracking-tight">${price}</span>}
          {price === "Custom" && <span className="text-4xl font-bold tracking-tight">Custom</span>}
          {period && <span className="text-muted-foreground">/ {period}</span>}
        </div>
        <CardDescription className="pt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-6">
        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild variant={isFeatured ? "default" : "outline"}>
          <Link href="/register">Get Started</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

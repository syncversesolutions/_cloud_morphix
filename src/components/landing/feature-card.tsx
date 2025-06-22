import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="bg-secondary/30 border-border/50 transition-all hover:scale-105 hover:border-primary/50">
      <CardHeader>
        <div className="bg-primary/10 text-primary p-3 rounded-md w-fit mb-4">
          <Icon className="w-6 h-6" />
        </div>
        <CardTitle className="font-headline text-xl">{title}</CardTitle>
        <CardDescription className="text-muted-foreground pt-2">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

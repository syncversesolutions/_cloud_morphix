"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

interface DashboardEmbedProps {
  url: string | null;
}

export default function DashboardEmbed({ url }: DashboardEmbedProps) {
  if (!url) {
    return (
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="p-0">
          <div className="aspect-video w-full flex flex-col items-center justify-center bg-muted/30">
              <LayoutDashboard className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground">Dashboard Not Configured</h3>
              <p className="text-muted-foreground">Your Looker dashboard URL has not been set up yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardContent className="p-0">
        <div className="aspect-video w-full">
          <iframe
            src={url}
            className="h-full w-full border-0"
            allowFullScreen
            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-forms allow-popups"
            title="Cloud Morphix Dashboard"
          ></iframe>
        </div>
      </CardContent>
    </Card>
  );
}

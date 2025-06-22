"use client";

import { Card, CardContent } from "@/components/ui/card";

interface DashboardEmbedProps {
  url: string | null;
}

export default function DashboardEmbed({ url }: DashboardEmbedProps) {
  if (!url) {
    return null;
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
            title="Looker Studio Dashboard"
          ></iframe>
        </div>
      </CardContent>
    </Card>
  );
}

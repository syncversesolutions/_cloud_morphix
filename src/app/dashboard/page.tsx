
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import DashboardEmbed from "@/components/dashboard/dashboard-embed";
import LoadingSpinner from "@/components/loading-spinner";
import PlatformAdminDashboard from "@/components/dashboard/platform-admin-dashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading, isPlatformAdmin } = useAuth();
  const router = useRouter();
  const [currentReport, setCurrentReport] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);



  useEffect(() => {
    if (userProfile) {
      const urls = userProfile.dashboardUrl;
      const firstReport = Array.isArray(urls) ? urls[0] : urls;
      setCurrentReport(firstReport || null);
    }
  }, [userProfile]);

  if (authLoading || !userProfile) {
    return <LoadingSpinner />;
  }
  
  if (isPlatformAdmin) {
    return <PlatformAdminDashboard />;
  }
  
  const getReportName = (url: string | null): string => {
    if (!url) return "Dashboard";
    try {
        const parts = url.split('/');
        const lastPart = parts[parts.length - 1] || '';
        return lastPart.split('?')[0].replace(/-/g, ' ').replace(/_/g, ' ') || 'Report';
    } catch {
        return "Report";
    }
  };

  const viewableReports = Array.isArray(userProfile.dashboardUrl) ? userProfile.dashboardUrl : (userProfile.dashboardUrl ? [userProfile.dashboardUrl] : []);
  const currentReportName = getReportName(currentReport);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div className="mb-6 flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">{userProfile.companyName}</h2>
          <p className="text-muted-foreground capitalize">
            {currentReport ? currentReportName : 'An overview of your key business metrics.'}
          </p>
        </div>
        {viewableReports.length > 1 && (
          <Select onValueChange={setCurrentReport} value={currentReport || ''}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Select a report" />
            </SelectTrigger>
            <SelectContent>
              {viewableReports.map(reportUrl => (
                <SelectItem key={reportUrl} value={reportUrl}>
                  <span className="capitalize">{getReportName(reportUrl)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex-1 rounded-lg overflow-hidden border border-border/60 shadow-sm min-h-0">
        <DashboardEmbed url={currentReport} />
      </div>
    </div>
  );
}

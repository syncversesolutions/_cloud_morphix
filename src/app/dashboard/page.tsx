"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import DashboardEmbed from "@/components/dashboard/dashboard-embed";
import LoadingSpinner from "@/components/loading-spinner";
import PlatformAdminDashboard from "@/components/dashboard/platform-admin-dashboard";

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading, isPlatformAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !userProfile) {
    return <LoadingSpinner />;
  }
  
  if (isPlatformAdmin) {
    return <PlatformAdminDashboard />;
  }
  
  const dashboardUrl = userProfile.dashboardUrl;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <h2 className="text-3xl font-bold tracking-tight font-headline">{userProfile.companyName}</h2>
        <p className="text-muted-foreground">An overview of your key business metrics.</p>
      </div>
      <div className="flex-1 rounded-lg overflow-hidden border border-border/60 shadow-sm min-h-0">
        <DashboardEmbed url={dashboardUrl} />
      </div>
    </div>
  );
}

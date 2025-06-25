
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import DashboardEmbed from "@/components/dashboard/dashboard-embed";
import LoadingSpinner from "@/components/loading-spinner";
import { getDashboardUrl } from "@/services/firestore";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoadingUrl(false);
        return;
      }
      
      setLoadingUrl(true);
      setPermissionError(false);

      try {
        const url = await getDashboardUrl(user.uid);
        setDashboardUrl(url);
      } catch (error: any) {
        console.error("Failed to get dashboard URL:", error);
        if (error.code === 'permission-denied') {
          setPermissionError(true);
        } else {
          toast({
            variant: "destructive",
            title: "Dashboard Error",
            description: "Could not load the dashboard configuration.",
          });
        }
      } finally {
        setLoadingUrl(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, toast]);

  if (authLoading || loadingUrl) {
    return <LoadingSpinner />;
  }

  if (permissionError) {
      return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h2 className="mb-4 text-3xl font-bold tracking-tight font-headline">Dashboard Unavailable</h2>
            <p className="text-muted-foreground">
                You do not have permission to view the dashboard for this organization. 
                Please contact your administrator to request access.
            </p>
        </div>
      )
  }
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h2 className="mb-4 text-3xl font-bold tracking-tight font-headline">Your Dashboard</h2>
        <DashboardEmbed url={dashboardUrl} />
    </div>
  );
}

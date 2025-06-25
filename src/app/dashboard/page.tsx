
"use client";

import { useEffect, useState, useCallback } from "react";
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

  const fetchUrlWithRetry = useCallback((retries = 3, delay = 500) => {
    if (!user) return;
    
    getDashboardUrl(user.uid)
      .then((url) => {
        setDashboardUrl(url);
        setPermissionError(false);
      })
      .catch((error: any) => {
        if (error.code === 'permission-denied' && retries > 0) {
          console.warn(`Permission denied fetching dashboard URL, retrying in ${delay}ms... (${retries} retries left)`);
          setTimeout(() => fetchUrlWithRetry(retries - 1, delay), delay);
        } else {
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
        }
      })
      .finally(() => {
         if (retries === 0 || !error.code || error.code !== 'permission-denied') {
            setLoadingUrl(false);
         }
      });
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      setLoadingUrl(true);
      fetchUrlWithRetry();
    } else if (!authLoading) {
      setLoadingUrl(false);
    }
  }, [user, authLoading, fetchUrlWithRetry]);

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

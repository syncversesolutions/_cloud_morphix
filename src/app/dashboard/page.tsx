"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import DashboardEmbed from "@/components/dashboard/dashboard-embed";
import LoadingSpinner from "@/components/loading-spinner";
import { getDashboardUrl } from "@/services/firestore";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      getDashboardUrl(user.uid)
        .then((url) => {
          setDashboardUrl(url);
        })
        .catch((error) => {
          console.error("Failed to get dashboard URL:", error);
          // You could add a toast notification here if you like
        })
        .finally(() => {
          setLoadingUrl(false);
        });
    } else if (!authLoading) {
      setLoadingUrl(false);
    }
  }, [user, authLoading]);

  if (authLoading || loadingUrl) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h2 className="mb-4 text-3xl font-bold tracking-tight font-headline">Your Dashboard</h2>
        <DashboardEmbed url={dashboardUrl} />
    </div>
  );
}

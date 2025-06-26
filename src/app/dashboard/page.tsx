"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import DashboardEmbed from "@/components/dashboard/dashboard-embed";
import LoadingSpinner from "@/components/loading-spinner";

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !userProfile) {
    return <LoadingSpinner />;
  }
  
  // The dashboard URL is now part of the userProfile object.
  // No need for a separate fetch call.
  const dashboardUrl = userProfile.dashboardUrl;

  return (
      <DashboardEmbed url={dashboardUrl} />
  );
}

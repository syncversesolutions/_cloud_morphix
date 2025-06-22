"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getDashboardUrl } from "@/services/firestore";
import DashboardEmbed from "@/components/dashboard/dashboard-embed";
import LoadingSpinner from "@/components/loading-spinner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchDashboardUrl() {
      if (user) {
        try {
          const baseUrl = await getDashboardUrl(user.uid);
          
          if (baseUrl) {
            const params = JSON.stringify({
              ds0: { user_id: user.uid },
            });
            const finalUrl = `${baseUrl}?params=${encodeURIComponent(params)}`;
            setDashboardUrl(finalUrl);
          } else {
             setError("No dashboard configuration found for your company, or the embed URL is missing from your company's document in Firestore.");
          }
        } catch (err) {
          setError("Failed to fetch dashboard configuration. Please check the console for details.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    }

    if (!authLoading && user) {
      fetchDashboardUrl();
    }
  }, [user, authLoading]);

  if (authLoading || (!user && !authLoading) || loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <div className="container mx-auto flex h-[calc(100vh-3.5rem)] items-center justify-center p-4 sm:p-6 lg:p-8">
         <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
         </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h2 className="mb-4 text-3xl font-bold tracking-tight font-headline">Your Dashboard</h2>
        <DashboardEmbed url={dashboardUrl} />
    </div>
  );
}

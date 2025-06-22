"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import LoginForm from "@/components/auth/login-form";
import LoadingSpinner from "@/components/loading-spinner";
import { Waves } from "lucide-react";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="flex items-center gap-2 mb-8">
        <Waves className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary font-headline">LookerLink</h1>
      </div>
      <LoginForm />
    </div>
  );
}

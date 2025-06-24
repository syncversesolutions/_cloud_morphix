
"use client";

import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Cloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function Header() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "An error occurred during logout. Please try again.",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <Cloud className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold font-headline">Cloud Morphix</span>
          {userProfile?.company_name && (
            <>
                <div className="mx-3 h-5 w-px bg-border/70"></div>
                <span className="text-lg font-semibold text-muted-foreground">{userProfile.company_name}</span>
            </>
          )}
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

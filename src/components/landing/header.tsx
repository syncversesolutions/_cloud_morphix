"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Cloud } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

export default function LandingHeader() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleLinkClick = () => {
    setSheetOpen(false);
  };

  const AuthButtons = () => (
     <>
        {user ? (
            <Button asChild>
                <Link href="/dashboard" onClick={handleLinkClick}>Go to Dashboard</Link>
            </Button>
        ) : (
            <div className="flex items-center gap-2 flex-col md:flex-row w-full">
                <Button asChild variant="ghost" className="w-full md:w-auto">
                    <Link href="/login" onClick={handleLinkClick}>Login</Link>
                </Button>
                <Button asChild className="w-full md:w-auto">
                    <Link href="/register" onClick={handleLinkClick}>Book a Demo</Link>
                </Button>
            </div>
        )}
     </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Cloud className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg font-headline">CloudMorphix</span>
        </Link>

        {isMobile ? (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
                <div className="mt-12 flex flex-col gap-4">
                    <AuthButtons />
                </div>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <AuthButtons />
          </nav>
        )}
      </div>
    </header>
  );
}

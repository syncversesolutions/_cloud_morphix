"use client";

import Header from "@/components/dashboard/header";
import Sidebar from "@/components/dashboard/sidebar";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // For the main dashboard, provide a full-screen view for the iframe.
  if (pathname === "/dashboard") {
    return <main className="h-screen w-screen bg-background">{children}</main>;
  }
  
  // For all other dashboard pages, use the standard layout with header and sidebar.
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-muted/20">{children}</main>
      </div>
    </div>
  );
}


"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, UsersRound, CircleUser } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/dashboard/profile", label: "Profile", icon: CircleUser, adminOnly: false },
  { href: "/dashboard/users", label: "Users", icon: UsersRound, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.company.role === "Admin";

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border/60 bg-background p-4">
      <nav className="flex flex-col gap-2">
        {navLinks.map((link) => {
          if (link.adminOnly && !isAdmin) {
            return null;
          }
          
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                isActive && "bg-primary/10 text-primary"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

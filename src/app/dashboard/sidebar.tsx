
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, UsersRound, CircleUser, MailQuestion } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Define navigation links with required permissions
const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, requiredPermission: null },
  { href: "/dashboard/profile", label: "Profile", icon: CircleUser, requiredPermission: null },
  { href: "/dashboard/users", label: "Users", icon: UsersRound, requiredPermission: "manage_users" },
  { href: "/dashboard/enquiries", label: "Enquiries", icon: MailQuestion, platformAdminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  
  // A platform admin is an Admin of the "Cloud Morphix" company.
  const isPlatformAdmin = userProfile?.role === "Admin" && userProfile?.companyName === "Cloud Morphix";
  const userPermissions = userProfile?.allowed_actions || [];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border/60 bg-background p-4">
      <nav className="flex flex-col gap-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;

          // Check for platform admin requirement
          if (link.platformAdminOnly && !isPlatformAdmin) {
            return null;
          }

          // Check for specific permission requirement
          if (link.requiredPermission && !userPermissions.includes(link.requiredPermission)) {
            return null;
          }
          
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

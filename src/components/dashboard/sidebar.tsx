"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, UsersRound, CircleUser, MailQuestion, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const mainNavLinks = [
  { href: "/dashboard/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/enquiries", label: "Enquiries", icon: MailQuestion, platformAdminOnly: true },
];

const settingsNavLinks = [
  { href: "/dashboard/profile", label: "Profile", icon: CircleUser, requiredPermission: null },
  { href: "/dashboard/users", label: "Users", icon: UsersRound, requiredPermission: "manage_users" },
  { href: "/dashboard/create_company", label: "Create Company", icon: CircleUser, requiredPermission: "manage_users", platformAdminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { userProfile } = useAuth();

  console.log("user is : " , userProfile);

  const isPlatformAdmin = userProfile?.isPlatformAdmin === true;
  const userPermissions = userProfile?.allowed_actions || [];

  const isSettingsPageActive = settingsNavLinks.some(link => pathname.startsWith(link.href));

  // Determine if the user should see the settings section at all.
  const canViewSettings = settingsNavLinks.some(link => {
    if (link.requiredPermission) {
      return userPermissions.includes(link.requiredPermission);
    }
    return true; // Profile page has no required permission
  });

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border/60 bg-background p-4">
      <nav className="flex flex-col gap-1">
        {/* Main Nav Links */}
        {mainNavLinks.map((link) => {
          if (link.platformAdminOnly && !isPlatformAdmin) {
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

        {/* Settings Accordion */}
        {canViewSettings && (
          <Accordion
            type="single"
            collapsible
            defaultValue={isSettingsPageActive ? "settings" : ""}
          >
            <AccordionItem value="settings" className="border-b-0">
              <AccordionTrigger
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:no-underline",
                  isSettingsPageActive && "text-primary"
                )}
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-4 pt-1">
                <div className="flex flex-col gap-1">
                  {settingsNavLinks.map((link) => {
                    if (link.platformAdminOnly && !isPlatformAdmin) {
                      return null;
                    }
                    // Check for specific permission requirement
                    if (link.requiredPermission && !userPermissions.includes(link.requiredPermission)) {
                      return null;
                    }
                    const isActive = pathname.startsWith(link.href);

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
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </nav>
    </aside>
  );
}

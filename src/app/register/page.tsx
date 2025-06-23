
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Building, UserPlus } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <div className="bg-primary/10 text-primary p-3 rounded-md w-fit mb-4">
            <Building className="w-6 h-6" />
          </div>
          <CardTitle className="font-headline text-2xl">Create a Company</CardTitle>
          <CardDescription>
            Set up a new company workspace, create an admin account, and start managing your business intelligence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/register/company">Register Your Company</Link>
          </Button>
        </CardContent>
      </Card>
      
      <Card className="bg-secondary/30">
         <CardHeader>
          <div className="bg-primary/10 text-primary p-3 rounded-md w-fit mb-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <CardTitle className="font-headline text-2xl">Join a Company</CardTitle>
          <CardDescription>
            Have an invitation link? Use it to create your account and join your team's existing workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            You must have a unique invitation link from your company's administrator to join an existing company.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

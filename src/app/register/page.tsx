
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Building } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md mx-auto">
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
          <div className="mt-4 text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Login
                </Link>
              </p>
          </div>
           <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Joining a company? Use the invitation link sent by your administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

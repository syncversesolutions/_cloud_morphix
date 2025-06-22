import { Building, UserPlus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-bold mb-2 text-primary font-headline">Join Cloud Morphix</h1>
      <p className="text-muted-foreground mb-8">Choose your registration type to get started.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Link href="/register/company" className="group">
          <Card className="h-full transition-all duration-300 group-hover:border-primary group-hover:shadow-lg group-hover:scale-105">
            <CardHeader className="flex flex-col items-center text-center p-8">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Building className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl">Register as a Company</CardTitle>
              <CardDescription className="mt-2">Create a new company account and set up your business intelligence environment from scratch.</CardDescription>
              <div className="flex items-center text-primary mt-6 font-semibold">
                Get Started <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/register/user" className="group">
          <Card className="h-full transition-all duration-300 group-hover:border-primary group-hover:shadow-lg group-hover:scale-105">
            <CardHeader className="flex flex-col items-center text-center p-8">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <UserPlus className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="font-headline text-2xl">Join a Company</CardTitle>
              <CardDescription className="mt-2">Register as a user to join an existing company on the Cloud Morphix platform using a company ID.</CardDescription>
              <div className="flex items-center text-primary mt-6 font-semibold">
                Register as User <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
       <div className="mt-8 text-sm">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Login here
            </Link>
          </p>
        </div>
    </div>
  );
}

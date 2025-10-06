"use client";

import { useEffect, useState } from "react";
import { getAllCompanies, type Company } from "@/services/firestore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, Users, AlertTriangle, Pencil } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import LoadingSpinner from "@/components/loading-spinner";
import EditCompanyDialog from "@/components/dashboard/EditCompanyDialog";

export default function PlatformAdminDashboard() {
  const { isPlatformAdmin, loading } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Guard: show spinner or access denied
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isPlatformAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>Only platform admins can view platform dashboard.</AlertDescription>
        </Alert>
      </div>
    );
  }

  useEffect(() => {
    getAllCompanies()
      .then(setCompanies)
      .catch((err) => {
        console.error("Failed to fetch companies:", err);
        setError("Could not load company data. Please ensure you have the correct permissions.");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load platform data.",
        });
      })
      .finally(() => setLoadingCompanies(false));
  }, [toast]);

  const stats = {
    totalCompanies: companies.length,
    totalRevenue: companies.reduce((acc, company) => {
      if (company.subscription_plan === "Basic") return acc + 99;
      if (company.subscription_plan === "Enterprise") return acc + 499;
      return acc;
    }, 0),
    activeSubscriptions: companies.filter((c) => c.subscription_plan !== "Trial").length,
  };

  if (loadingCompanies) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight font-headline">Platform Overview</h2>
          <p className="text-muted-foreground">Key metrics and registered companies for Cloud Morphix.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Platform Overview</h2>
        <p className="text-muted-foreground">Key metrics and registered companies for Cloud Morphix.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Companies</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Registered</TableHead>
                <TableHead className="text-left">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length > 0 ? (
                companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.company_name}</TableCell>
                    <TableCell className="capitalize">{company.industry}</TableCell>
                    <TableCell>
                      <Badge variant={company.subscription_plan === "Trial" ? "outline" : "secondary"}>
                        {company.subscription_plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.is_active ? "default" : "destructive"}>
                        {company.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{company.created_at?.seconds ? format(new Date(company.created_at.seconds * 1000), "PP") : "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <EditCompanyDialog
                        company={company}
                        onSaved={(updated) => {
                          setCompanies(prev =>
                            prev.map(c => (c.id === company.id ? { ...c, ...updated } : c))
                          );
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No companies have registered yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getContacts, type Contact } from "@/services/firestore";
import LoadingSpinner from "@/components/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function EnquiriesPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const [enquiries, setEnquiries] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // A platform admin is an Admin of the "Cloud Morphix" company.
  const isPlatformAdmin = userProfile?.role === "Admin" && userProfile?.companyName === "Cloud Morphix";

  useEffect(() => {
    // Wait for authentication to resolve before doing anything.
    if (authLoading) {
      return;
    }
    
    // Only fetch data if the user is a platform admin.
    if (isPlatformAdmin) {
      getContacts()
        .then(setEnquiries)
        .catch((err) => {
          console.error("Failed to fetch enquiries:", err);
          setError("Could not load enquiries. Please try again later.");
        })
        .finally(() => setLoading(false));
    } else {
      // If not a platform admin, we're done loading.
      setLoading(false);
    }
  }, [isPlatformAdmin, authLoading]);

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  // If the user is not a platform admin, deny access.
  if (!isPlatformAdmin) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            This page is only available to Cloud Morphix platform administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Demo Enquiries</h2>
        <p className="text-muted-foreground">A list of all demo requests submitted through the contact form.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="w-[40%]">Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enquiries.length > 0 ? (
                enquiries.map((enquiry) => (
                  <TableRow key={enquiry.id}>
                    <TableCell className="whitespace-nowrap">
                      {enquiry.submittedAt ? format(new Date(enquiry.submittedAt.seconds * 1000), "PP") : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">{enquiry.name}</TableCell>
                    <TableCell>{enquiry.email}</TableCell>
                    <TableCell>{enquiry.companyName}</TableCell>
                    <TableCell>{enquiry.message || <span className="text-muted-foreground">No message</span>}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No enquiries have been submitted yet.
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

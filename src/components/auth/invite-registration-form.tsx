
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getInviteDetails, acceptInvite, type Invite } from "@/services/firestore";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import LoadingSpinner from "@/components/loading-spinner";

const formSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  password: z.string().refine(password => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    const hasValidLength = password.length >= 8 && password.length <= 16;
    return hasUppercase && hasLowercase && hasNumber && hasSpecialChar && hasValidLength;
  }, {
    message: "Please ensure your password meets all the security requirements."
  }),
});

export default function InviteRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingInvite, setIsCheckingInvite] = useState(true);
  const [inviteData, setInviteData] = useState<Invite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const companyId = searchParams.get('companyId');
  const inviteId = searchParams.get('inviteId');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!companyId || !inviteId) {
      setError("Invalid invitation link. It's missing required parameters.");
      setIsCheckingInvite(false);
      return;
    }

    async function checkInvite() {
      try {
        const invite = await getInviteDetails(companyId!, inviteId!);
        if (invite && invite.status === 'pending') {
          setInviteData(invite);
          form.reset({
            fullName: invite.full_name,
            email: invite.email,
            password: "",
          });
        } else if (invite && invite.status === 'accepted') {
          setError("This invitation has already been accepted.");
        } else {
          setError("This invitation is invalid or has expired.");
        }
      } catch (e) {
        console.error(e);
        setError("Could not verify invitation. Please check the link and try again.");
      } finally {
        setIsCheckingInvite(false);
      }
    }

    checkInvite();
  }, [companyId, inviteId, form]);

  const passwordChecks = [
    { label: "8-16 characters long", satisfied: password.length >= 8 && password.length <= 16 },
    { label: "At least one uppercase letter (A-Z)", satisfied: /[A-Z]/.test(password) },
    { label: "At least one lowercase letter (a-z)", satisfied: /[a-z]/.test(password) },
    { label: "At least one number (0-9)", satisfied: /[0-9]/.test(password) },
    { label: "At least one special character (@, $, !, %, *, ?, &)", satisfied: /[@$!%*?&]/.test(password) },
  ];

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!inviteData || !companyId || !inviteId) return;

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await acceptInvite({
        companyId,
        inviteId,
        user: {
          uid: user.uid,
          email: values.email,
          fullName: values.fullName,
        },
        role: inviteData.role,
      });

      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isCheckingInvite) {
    return <LoadingSpinner />;
  }

  if (error || !inviteData) {
    return (
       <Card className="w-full max-w-md">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><AlertTriangle className="text-destructive"/> Invitation Error</CardTitle>
            <CardDescription>This invitation link is not valid.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-destructive-foreground bg-destructive/20 p-4 rounded-md">{error}</p>
             <Button asChild className="w-full mt-6">
                <Link href="/register">Back to Registration</Link>
            </Button>
        </CardContent>
       </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Join {inviteData.companyName || 'Your Team'}</CardTitle>
        <CardDescription>Create your account to accept the invitation.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Choose a Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setPassword(e.target.value);
                      }}
                     />
                  </FormControl>
                  <FormMessage />
                  <div className="space-y-1 pt-2">
                    {passwordChecks.map((check, index) => (
                      <div key={index} className="flex items-center text-sm">
                        {check.satisfied ? (
                           <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={check.satisfied ? 'text-foreground' : 'text-muted-foreground'}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full !mt-6" disabled={isLoading || !form.formState.isValid}>
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-background border-t-transparent"></div>
              ) : "Create Account & Join"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createCompanyAndAdmin } from "@/services/firestore";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

const formSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  adminFullName: z.string().min(2, { message: "Your name must be at least 2 characters." }),
  industry: z.string().min(1, { message: "Please select an industry." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  domoUrl: z.string().url().optional(),  // Simple string URL
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



export default function CompanyRegistrationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");

  const passwordChecks = [
    { label: "8-16 characters long", satisfied: password.length >= 8 && password.length <= 16 },
    { label: "At least one uppercase letter (A-Z)", satisfied: /[A-Z]/.test(password) },
    { label: "At least one lowercase letter (a-z)", satisfied: /[a-z]/.test(password) },
    { label: "At least one number (0-9)", satisfied: /[0-9]/.test(password) },
    { label: "At least one special character (@, $, !, %, *, ?, &)", satisfied: /[@$!%*?&]/.test(password) },
  ];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      companyName: "",
      adminFullName: "",
      industry: "",
      email: "",
      password: "",
      domoUrl:"",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
  
      await createCompanyAndAdmin({
        companyData: {
          company_name: values.companyName,
          industry: values.industry,
          domoUrl: values.domoUrl,  
        },
        adminData: {
          uid: user.uid,
          email: values.email,
          fullName: values.adminFullName,
        }
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
  

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Register Your Company</CardTitle>
        <CardDescription>Create your company's account and admin user to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adminFullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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
                  <FormLabel>Company Admin Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="law firm">Law Firm</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel>Password</FormLabel>
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
            <FormField
              control={form.control}
              name="domoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://your-domo-instance.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <Button type="submit" className="w-full md:col-span-2 mt-4" disabled={isLoading}>
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-background border-t-transparent"></div>
              ) : "Create Company Account"}
            </Button>
            <div className="text-sm md:col-span-2 text-center mt-4 space-y-2">
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    Login here
                  </Link>
                </p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    
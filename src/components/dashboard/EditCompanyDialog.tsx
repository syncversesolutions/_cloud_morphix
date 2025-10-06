"use client";

import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import type { Company } from "@/services/firestore";
import { updateCompanyAndAdminDomoUrl } from "@/services/firestore";

// ✅ Validation Schema
const formSchema = z.object({
  company_name: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters." }),
  industry: z.string().min(1, { message: "Please select an industry." }),
  domoUrl: z
    .string()
    .url({ message: "Enter a valid URL (including https://)" })
    .or(z.literal(""))
    .optional(),
  subscription_plan: z.enum(["Trial", "Basic", "Enterprise"], {
    required_error: "Select a plan.",
  }),
  is_active: z.boolean().default(true),
  adminFullName: z.string().optional(),
  adminEmail: z.string().email().optional(),
});

export type EditCompanyFormValues = z.infer<typeof formSchema>;

const INDUSTRIES = [
  "technology",
  "finance",
  "healthcare",
  "ecommerce",
  "marketing",
  "retail",
  "manufacturing",
  "law firm",
  "other",
] as const;

interface EditCompanyDialogProps {
  company: Company & {
    domoUrl?: string;
    adminFullName?: string;
    adminEmail?: string;
  };
  onSaved?: (
    updated: Partial<Company> & {
      domoUrl?: string;
      adminFullName?: string;
      adminEmail?: string;
    }
  ) => void;
}

export default function EditCompanyDialog({
  company,
  onSaved,
}: EditCompanyDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<EditCompanyFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      company_name: company.company_name ?? "",
      industry: company.industry ?? "",
      domoUrl: company.domoUrl ?? "",
      subscription_plan: company.subscription_plan ?? "Trial",
      is_active: company.is_active ?? true,
      adminFullName: company.adminFullName ?? "",
      adminEmail: company.adminEmail ?? "",
    },
  });

  const onSubmit = async (values: EditCompanyFormValues) => {
    try {
      setSaving(true);
      toast({ description: "Saving..." });
  
      // ✅ Get correct companyId key (id or companyId)
      const companyId =
        (company as any).id ??
        (company as any).companyId ??
        (company as any).docId;
  
      if (typeof companyId !== "string" || !companyId.trim()) {
        toast({ description: "Company ID missing/invalid", variant: "destructive" });
        setSaving(false);
        return;
      }
  
      const newUrl = values.domoUrl ?? "";
  
      const res = await updateCompanyAndAdminDomoUrl(companyId, {
        domoUrl: values.domoUrl ?? "",
        industry: values.industry,
        subscription_plan: values.subscription_plan,
        is_active: values.is_active,
      });
      
      toast({
        description: res.adminUpdated
          ? `Saved. Admin (${res.adminUid}) synced ✅`
          : "Saved. (No admin found to sync)",
      });
  
      // optional: update parent state
      onSaved?.({ ...values, domoUrl: newUrl });
      setOpen(false);
    } catch (e: any) {
      toast({ description: e.message || "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <Pencil className="h-4 w-4 text-[#c30b17]" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>
            Update company details and save them to Firestore.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
          >
            {/* Company Name */}
            <FormField
              control={form.control}
              name="company_name"
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

            {/* Industry */}
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind[0].toUpperCase() + ind.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Admin Name */}
            <FormField
              control={form.control}
              name="adminFullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Admin Email */}
            {/* <FormField
              control={form.control}
              name="adminEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            {/* Domo URL */}
            <FormField
              control={form.control}
              name="domoUrl"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Domo URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://your-domo-instance.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Plan */}
            <FormField
              control={form.control}
              name="subscription_plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Plan</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Trial">Trial</SelectItem>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active / Inactive Switch */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 mt-6">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="active"
                  />
                  <Label htmlFor="active">Active</Label>
                </FormItem>
              )}
            />

            {/* Buttons */}
            <DialogFooter className="md:col-span-2 mt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-background border-t-transparent" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import type { Role } from '@/services/firestore';
import { addUserFormSchema, type AddUserInput } from '@/services/firestore';
import { CheckCircle2, XCircle, Check, PlusCircle, X } from "lucide-react";
import { cn } from '@/lib/utils';

interface AddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  roles: Role[];
  availableReports: string[];
  onAddUser: (values: AddUserInput) => Promise<boolean>;
}

export default function AddUserDialog({ isOpen, onOpenChange, roles, availableReports, onAddUser }: AddUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");

  const passwordChecks = [
    { label: "8-16 characters long", satisfied: password.length >= 8 && password.length <= 16 },
    { label: "At least one uppercase letter (A-Z)", satisfied: /[A-Z]/.test(password) },
    { label: "At least one lowercase letter (a-z)", satisfied: /[a-z]/.test(password) },
    { label: "At least one number (0-9)", satisfied: /[0-9]/.test(password) },
    { label: "At least one special character (@, $, !, %, *, ? or &)", satisfied: /[@$!%*?&]/.test(password) },
  ];

  const form = useForm<AddUserInput>({
    resolver: zodResolver(addUserFormSchema),
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      email: '',
      role: '',
      password: '',
      assignedReports: [],
    },
  });

  async function onSubmit(values: AddUserInput) {
    setIsLoading(true);
    const success = await onAddUser(values);
    setIsLoading(false);
    if (success) {
      form.reset();
      setPassword('');
      onOpenChange(false);
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setPassword('');
    }
    onOpenChange(open);
  }

  const getReportName = (url: string) => {
    try {
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1] || '';
      return lastPart.split('?')[0] || 'Unnamed Report';
    } catch {
      return 'Unnamed Report';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a New User</DialogTitle>
          <DialogDescription>
            Create a new user account and assign them a role. They will be able to log in with the password you set.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.role_name}>
                          {role.role_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignedReports"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Reports</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Assign Reports
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search reports..." />
                        <CommandList>
                          <CommandEmpty>No reports found.</CommandEmpty>
                          <CommandGroup>
                            {availableReports.map((report) => {
                              const isSelected = field.value?.includes(report);
                              return (
                                <CommandItem
                                  key={report}
                                  onSelect={() => {
                                    if (isSelected) {
                                      field.onChange(field.value?.filter((r) => r !== report));
                                    } else {
                                      field.onChange([...(field.value || []), report]);
                                    }
                                  }}
                                >
                                  <div
                                    className={cn(
                                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                      isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                    )}
                                  >
                                    <Check className="h-4 w-4" />
                                  </div>
                                  <span>{getReportName(report)}</span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Select the reports that this user will have access to.
                  </FormDescription>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {field.value?.map((report) => (
                       <Badge variant="secondary" key={report} className="flex items-center gap-1">
                         {getReportName(report)}
                         <button
                            type="button"
                            onClick={() => field.onChange(field.value?.filter((r) => r !== report))}
                            className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                          >
                           <X className="h-3 w-3" />
                         </button>
                       </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporary Password</FormLabel>
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
                      <div key={index} className="flex items-center text-xs">
                        {check.satisfied ? (
                           <CheckCircle2 className="mr-2 h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="mr-2 h-3 w-3 text-muted-foreground" />
                        )}
                        <span className={check.satisfied ? 'text-foreground/90' : 'text-muted-foreground'}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter className="!mt-6">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !form.formState.isValid}>
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-background border-t-transparent"></div>
                ) : 'Create User Account'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

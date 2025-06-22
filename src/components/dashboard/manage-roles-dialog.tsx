"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  roleName: z.string().min(2, 'Role name must be at least 2 characters.').max(20, 'Role name is too long.'),
});

interface ManageRolesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  roles: string[];
  onAddRole: (roleName: string) => Promise<boolean>;
}

export default function ManageRolesDialog({ isOpen, onOpenChange, roles, onAddRole }: ManageRolesDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roleName: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const success = await onAddRole(values.roleName);
    setIsLoading(false);
    if (success) {
      form.reset();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Roles</DialogTitle>
          <DialogDescription>
            View existing roles and add new custom roles for your company.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
            <div>
                <h4 className="text-sm font-medium mb-2">Existing Roles</h4>
                <div className="flex flex-wrap gap-2">
                    {roles.length > 0 ? roles.map(role => (
                        <Badge key={role} variant="secondary">{role}</Badge>
                    )) : <p className="text-sm text-muted-foreground">No custom roles added yet.</p>}
                </div>
            </div>

            <Separator />

            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="roleName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>New Role Name</FormLabel>
                    <FormControl>
                        <div className="flex gap-2">
                            <Input placeholder="e.g., Marketing" {...field} />
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-background border-t-transparent"></div>
                                ) : 'Add Role'}
                            </Button>
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </form>
            </Form>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

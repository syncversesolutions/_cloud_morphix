
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import type { Role } from '@/services/firestore';
import { availablePermissions } from '@/services/firestore';

const formSchema = z.object({
  roleName: z.string().min(2, 'Role name must be at least 2 characters.').max(20, 'Role name is too long.'),
  permissions: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one permission.',
  }),
});

interface ManageRolesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  roles: Role[];
  onAddRole: (roleName: string, permissions: string[]) => Promise<boolean>;
}

export default function ManageRolesDialog({ isOpen, onOpenChange, roles, onAddRole }: ManageRolesDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roleName: '',
      permissions: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const success = await onAddRole(values.roleName, values.permissions);
    setIsLoading(false);
    if (success) {
      form.reset();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if(!open) form.reset();
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Roles & Permissions</DialogTitle>
          <DialogDescription>
            Create new custom roles and assign permissions to them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
            <div>
                <h4 className="text-sm font-medium mb-2">Existing Roles</h4>
                <div className="flex flex-wrap gap-2">
                    {roles.length > 0 ? roles.map((role) => (
                        <Badge key={role.id} variant={role.role_name === 'Admin' ? 'default' : 'secondary'}>{role.role_name}</Badge>
                    )) : <p className="text-sm text-muted-foreground">No custom roles added yet.</p>}
                </div>
            </div>

            <Separator />

            <h4 className="text-sm font-medium">Add New Role</h4>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="roleName"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>New Role Name</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g., Marketing Manager" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="permissions"
                    render={() => (
                        <FormItem>
                            <FormLabel>Permissions</FormLabel>
                            <FormDescription>Select the actions this role can perform.</FormDescription>
                            <div className="space-y-2 pt-2">
                            {availablePermissions.map((item) => (
                                <FormField
                                key={item.id}
                                control={form.control}
                                name="permissions"
                                render={({ field }) => {
                                    return (
                                    <FormItem
                                        key={item.id}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item.id)}
                                            onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...field.value, item.id])
                                                : field.onChange(
                                                    field.value?.filter(
                                                    (value) => value !== item.id
                                                    )
                                                )
                                            }}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            {item.label}
                                        </FormLabel>
                                    </FormItem>
                                    )
                                }}
                                />
                            ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                <DialogFooter className="!mt-6">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-background border-t-transparent"></div>
                        ) : 'Add Role'}
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

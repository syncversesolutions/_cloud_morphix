
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UserProfile } from '@/hooks/use-auth';

interface ChangeRoleDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: UserProfile;
  roles: string[];
  onConfirm: (newRole: string) => Promise<boolean>;
}

export default function ChangeRoleDialog({ isOpen, onOpenChange, user, roles, onConfirm }: ChangeRoleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.company.role);

  const handleConfirm = async () => {
    setIsLoading(true);
    const success = await onConfirm(selectedRole);
    setIsLoading(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Role for {user.profile.name}</DialogTitle>
          <DialogDescription>
            Select a new role for this user. This will change their permissions within the application.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <Select onValueChange={setSelectedRole} defaultValue={selectedRole}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a new role" />
                </SelectTrigger>
                <SelectContent>
                {roles.map((role) => (
                    <SelectItem key={role} value={role} disabled={role === 'Admin'}>
                        {role}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
                Note: The 'Admin' role cannot be assigned here.
            </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || selectedRole === user.company.role}>
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-background border-t-transparent"></div>
            ) : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

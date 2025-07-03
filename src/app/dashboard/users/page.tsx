
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, type UserProfile } from "@/hooks/use-auth";
import { getCompanyUsers, getCompanyRoles, addRole, createUserInCompany, removeUserFromCompany, updateUserRole, type Role, type AddUserInput } from "@/services/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldPlus, UserPlus, MoreHorizontal, AlertTriangle } from "lucide-react";
import ManageRolesDialog from "@/components/dashboard/manage-roles-dialog";
import AddUserDialog from "@/components/dashboard/invite-user-dialog"; // Renamed to AddUserDialog internally
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/loading-spinner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import ChangeRoleDialog from "@/components/dashboard/change-role-dialog";
import RemoveUserDialog from "@/components/dashboard/remove-user-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function UserManagementPage() {
  const { user, userProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [availableReports, setAvailableReports] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [isRemoveUserDialogOpen, setIsRemoveUserDialogOpen] = useState(false);

  const companyId = userProfile?.companyId;
  const canManageUsers = userProfile?.allowed_actions?.includes('manage_users');
  const canManageRoles = userProfile?.allowed_actions?.includes('manage_roles');

  const fetchUsersAndRoles = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [fetchedUsers, fetchedRoles] = await Promise.all([
        getCompanyUsers(companyId),
        getCompanyRoles(companyId),
      ]);
      
      setUsers(fetchedUsers);
      setRoles(fetchedRoles);

      const allReportUrls = new Set<string>();
      fetchedUsers.forEach(u => {
        if (u.assignedReports) {
          u.assignedReports.forEach(report => allReportUrls.add(report));
        }
      });
      setAvailableReports(Array.from(allReportUrls).sort());

    } catch (error: any) {
      console.error("Failed to fetch user management data:", error);
      toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred while loading user data.",
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    if (companyId && canManageUsers) {
      fetchUsersAndRoles();
    } else {
        setLoading(false);
    }
  }, [companyId, canManageUsers, fetchUsersAndRoles]);

  const getActor = () => {
      if (!user || !userProfile) return null;
      return { id: user.uid, name: userProfile.fullName, email: userProfile.email };
  }
  
  const handleAddNewReport = (newReportUrl: string) => {
    if (newReportUrl && !availableReports.includes(newReportUrl)) {
      setAvailableReports(prev => [...prev, newReportUrl].sort());
      toast({
        title: "Report Added",
        description: "The new report URL is now available for selection."
      });
    }
  };

  const handleAddRole = async (roleName: string, permissions: string[]) => {
    const actor = getActor();
    if (!companyId || !actor) return false;
    if (roles.some(r => r.role_name.toLowerCase() === roleName.toLowerCase())) {
        toast({
            variant: "destructive",
            title: "Duplicate Role",
            description: `The role "${roleName}" already exists.`,
        });
        return false;
    }
    try {
      await addRole(companyId, roleName, permissions, actor);
      toast({ title: "Success", description: `Role "${roleName}" added.` });
      fetchUsersAndRoles();
      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add role." });
      return false;
    }
  };
  
  const handleAddUser = async (values: AddUserInput) => {
    const actor = getActor();
    if (!companyId || !actor) {
        toast({ variant: "destructive", title: "Error", description: "Cannot identify the current administrator." });
        return false;
    }
    try {
      await createUserInCompany(companyId, values, actor);
      toast({ title: "User Created", description: `An account for ${values.fullName} has been successfully created.` });
      fetchUsersAndRoles();
      return true;
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error.code === 'auth/email-already-in-use' 
          ? 'This email address is already registered.' 
          : 'Failed to create the user account.',
      });
      return false;
    }
  };


  const handleChangeRole = async (newRole: string) => {
    const actor = getActor();
    if (!selectedUser || !actor || !companyId) return false;
    try {
      await updateUserRole(selectedUser.id, newRole, actor, companyId);
      toast({ title: "Success", description: `${selectedUser.fullName}'s role has been updated to ${newRole}.`});
      if (selectedUser.id === userProfile?.id) {
          await refreshUserProfile();
      }
      fetchUsersAndRoles();
      return true;
    } catch (error) {
       toast({ variant: "destructive", title: "Update Failed", description: "Could not update the user's role."});
       return false;
    }
  }

  const handleRemoveUser = async () => {
    const actor = getActor();
    if (!selectedUser || !actor) return false;
    try {
        await removeUserFromCompany(selectedUser, actor);
        toast({ title: "Success", description: `${selectedUser.fullName} has been removed from the company.`});
        fetchUsersAndRoles();
        return true;
    } catch (error) {
        toast({ variant: "destructive", title: "Removal Failed", description: "Could not remove the user."});
        return false;
    }
  }

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!canManageUsers) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
                You do not have permission to manage users.
            </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const sortedUsers = [...users].sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">User Management</h2>
            <p className="text-muted-foreground">Add new users and manage roles for your company.</p>
        </div>
        <div className="flex gap-2">
          {canManageRoles && (
            <Button variant="outline" onClick={() => setIsRolesDialogOpen(true)}>
              <ShieldPlus className="mr-2" />
              Manage Roles
            </Button>
          )}
          {canManageUsers && (
            <Button onClick={() => setIsAddUserDialogOpen(true)}>
              <UserPlus className="mr-2" />
              Add User
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Users</CardTitle>
          <CardDescription>A list of all users in your company.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {sortedUsers.length > 0 ? (
                    sortedUsers.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                            <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            {userProfile?.id !== user.id ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setIsChangeRoleDialogOpen(true);
                                        }}
                                    >
                                        Change Role
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setIsRemoveUserDialogOpen(true);
                                        }}
                                    >
                                        Remove User
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : null}
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No users have been added to this company yet.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      
      <ManageRolesDialog
        isOpen={isRolesDialogOpen}
        onOpenChange={setIsRolesDialogOpen}
        roles={roles}
        onAddRole={handleAddRole}
      />

      <AddUserDialog
        isOpen={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        roles={roles.filter(r => r.role_name !== 'Admin')} // Cannot assign Admin directly
        availableReports={availableReports}
        onAddUser={handleAddUser}
        onAddNewReport={handleAddNewReport}
       />
       
      {selectedUser && (
         <>
            <ChangeRoleDialog
                isOpen={isChangeRoleDialogOpen}
                onOpenChange={setIsChangeRoleDialogOpen}
                user={selectedUser}
                roles={roles}
                onConfirm={handleChangeRole}
            />
            <RemoveUserDialog
                isOpen={isRemoveUserDialogOpen}
                onOpenChange={setIsRemoveUserDialogOpen}
                user={selectedUser}
                onConfirm={handleRemoveUser}
            />
         </>
      )}
    </div>
  );
}

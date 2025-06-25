
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, type UserProfile } from "@/hooks/use-auth";
import { getCompanyUsers, getCompanyRoles, addRole, createInvite, createInitialAdminRole, getCompanyInvites, type Invite, updateUserRole, removeUserFromCompany } from "@/services/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldPlus, UserPlus, Copy, Check, MoreHorizontal, AlertTriangle } from "lucide-react";
import ManageRolesDialog from "@/components/dashboard/manage-roles-dialog";
import InviteUserDialog from "@/components/dashboard/invite-user-dialog";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/loading-spinner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import ChangeRoleDialog from "@/components/dashboard/change-role-dialog";
import RemoveUserDialog from "@/components/dashboard/remove-user-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type TeamMember = {
    id: string;
    type: 'user' | 'invite';
    fullName: string;
    email: string;
    role: string;
    status: 'accepted' | 'pending';
    originalProfile: UserProfile | null;
    inviteId?: string;
};

export default function UserManagementPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [isRemoveUserDialogOpen, setIsRemoveUserDialogOpen] = useState(false);

  const companyId = userProfile?.companyId;

  const fetchUsersAndRoles = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setPermissionError(null);
    try {
      const [fetchedUsers, fetchedRoles, fetchedInvites] = await Promise.all([
        getCompanyUsers(companyId),
        getCompanyRoles(companyId),
        getCompanyInvites(companyId, false) // Only fetch pending invites
      ]);
      
      let currentRoles = fetchedRoles;
      if (currentRoles.length === 0 && userProfile && user) {
        const actor = { id: user.uid, name: userProfile.fullName, email: userProfile.email };
        await createInitialAdminRole(companyId, actor);
        currentRoles = await getCompanyRoles(companyId);
      }
      
      const uniqueRoles = [...new Set(currentRoles)];
      setUsers(fetchedUsers);
      setInvites(fetchedInvites);
      setRoles(uniqueRoles.sort());

    } catch (error: any) {
      console.error("Failed to fetch user management data:", error);
      if (error.code === 'permission-denied' || error.code === 'failed-precondition') {
         setPermissionError("You do not have the required permissions to manage users. Please contact your administrator or ensure your Firestore security rules are configured correctly for admin access.");
      } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: "An unexpected error occurred while loading user data.",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [companyId, toast, user, userProfile]);

  useEffect(() => {
    if (companyId) {
      fetchUsersAndRoles();
    }
  }, [companyId, fetchUsersAndRoles]);

  const getActor = () => {
      if (!user || !userProfile) return null;
      return { id: user.uid, name: userProfile.fullName, email: userProfile.email };
  }

  const handleAddRole = async (roleName: string) => {
    const actor = getActor();
    if (!companyId || !actor) return false;
    if (roles.map(r => r.toLowerCase()).includes(roleName.toLowerCase())) {
        toast({
            variant: "destructive",
            title: "Duplicate Role",
            description: `The role "${roleName}" already exists.`,
        });
        return false;
    }
    try {
      await addRole(companyId, roleName, actor);
      toast({ title: "Success", description: `Role "${roleName}" added.` });
      fetchUsersAndRoles();
      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add role." });
      return false;
    }
  };

  const handleInviteUser = async (fullName: string, email: string, role: string) => {
    const actor = getActor();
    if (!companyId || !actor) return false;
    try {
      await createInvite(companyId, email, fullName, role, actor);
      toast({ title: "Success", description: `Invitation sent to ${email}.` });
      fetchUsersAndRoles();
      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to send invitation." });
      return false;
    }
  };

  const handleCopyInviteLink = (inviteId: string) => {
    if(!companyId) return;
    const url = `${window.location.origin}/register/invite?companyId=${companyId}&inviteId=${inviteId}`;
    navigator.clipboard.writeText(url);
    setCopiedInviteId(inviteId);
    toast({ title: "Success", description: "Invite link copied to clipboard." });
    setTimeout(() => setCopiedInviteId(null), 2000);
  };
  
  const handleChangeRole = async (newRole: string) => {
    const actor = getActor();
    if (!selectedUser || !actor || !companyId) return false;
    try {
      await updateUserRole(selectedUser.id, newRole, actor, companyId);
      toast({ title: "Success", description: `${selectedUser.fullName}'s role has been updated to ${newRole}.`});
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

  if (userProfile?.role !== "Admin") {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
                You must be an Administrator to access this page.
            </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const allTeamMembers: TeamMember[] = [
    ...users.map(u => ({
      id: u.id,
      type: 'user' as const,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      status: 'accepted' as const,
      originalProfile: u,
    })),
    ...invites
        .filter(i => i.status === 'pending')
        .map(i => ({
          id: i.invite_id,
          type: 'invite' as const,
          fullName: i.full_name,
          email: i.email,
          role: i.role,
          status: 'pending' as const,
          originalProfile: null,
          inviteId: i.invite_id
        }))
  ].sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">User Management</h2>
            <p className="text-muted-foreground">Invite new users and manage roles for your company.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsRolesDialogOpen(true)}>
            <ShieldPlus className="mr-2" />
            Manage Roles
          </Button>
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Users</CardTitle>
          <CardDescription>A list of all users in your company, including pending invitations.</CardDescription>
        </CardHeader>
        <CardContent>
          {permissionError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Permission Error</AlertTitle>
              <AlertDescription>
                {permissionError}
                 <Button variant="secondary" onClick={fetchUsersAndRoles} size="sm" className="mt-4">
                    Retry
                 </Button>
              </AlertDescription>
            </Alert>
           ) : (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status / Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {allTeamMembers.length > 0 ? (
                    allTeamMembers.map((member) => (
                    <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.fullName}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                        {member.type === 'user' ? (
                            <Badge variant={member.role === 'Admin' ? 'default' : 'secondary'}>{member.role}</Badge>
                        ) : (
                            <Badge variant="outline">Pending Invitation</Badge>
                        )}
                        </TableCell>
                        <TableCell className="text-right">
                            {member.type === 'invite' && member.inviteId && (
                                <Button variant="ghost" size="sm" onClick={() => handleCopyInviteLink(member.inviteId!)}>
                                    {copiedInviteId === member.inviteId ? <Check className="mr-2 text-green-500" /> : <Copy className="mr-2" />}
                                    Copy Link
                                </Button>
                            )}
                            {member.type === 'user' && userProfile.id !== member.id && (
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
                                    if (member.originalProfile) {
                                        setSelectedUser(member.originalProfile);
                                        setIsChangeRoleDialogOpen(true);
                                    }
                                    }}
                                >
                                    Change Role
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                    if (member.originalProfile) {
                                        setSelectedUser(member.originalProfile);
                                        setIsRemoveUserDialogOpen(true);
                                    }
                                    }}
                                >
                                    Remove User
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            )}
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
           )}
        </CardContent>
      </Card>
      
      <ManageRolesDialog
        isOpen={isRolesDialogOpen}
        onOpenChange={setIsRolesDialogOpen}
        roles={roles}
        onAddRole={handleAddRole}
      />

      <InviteUserDialog
        isOpen={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        roles={roles.filter(r => r !== 'Admin')} // Cannot assign Admin via invite
        onInviteUser={handleInviteUser}
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

    
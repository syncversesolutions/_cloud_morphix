
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, type UserProfile } from "@/hooks/use-auth";
import { getCompanyUsers, getCompanyRoles, addRole, createInvite, createInitialAdminRole, getCompanyInvites, type Invite } from "@/services/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldPlus, UserPlus, Copy, Check } from "lucide-react";
import ManageRolesDialog from "@/components/dashboard/manage-roles-dialog";
import InviteUserDialog from "@/components/dashboard/invite-user-dialog";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/loading-spinner";

export default function UserManagementPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const companyId = userProfile?.company_id;

  const fetchUsersAndRoles = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [fetchedUsers, fetchedRoles, fetchedInvites] = await Promise.all([
        getCompanyUsers(companyId),
        getCompanyRoles(companyId),
        getCompanyInvites(companyId, true), // Fetch all invites to show status
      ]);

      let currentRoles = fetchedRoles;
      if (currentRoles.length === 0) {
        await createInitialAdminRole(companyId);
        currentRoles = await getCompanyRoles(companyId); 
      }
      
      const uniqueRoles = [...new Set(currentRoles)];

      setUsers(fetchedUsers);
      setInvites(fetchedInvites);
      setRoles(uniqueRoles.sort());

    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users and roles.",
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    if (companyId) {
      fetchUsersAndRoles();
    }
  }, [companyId, fetchUsersAndRoles]);

  const handleAddRole = async (roleName: string) => {
    if (!companyId) return false;
    if (roles.map(r => r.toLowerCase()).includes(roleName.toLowerCase())) {
        toast({
            variant: "destructive",
            title: "Duplicate Role",
            description: `The role "${roleName}" already exists.`,
        });
        return false;
    }
    try {
      await addRole(companyId, roleName);
      toast({ title: "Success", description: `Role "${roleName}" added.` });
      fetchUsersAndRoles(); // Refresh roles list
      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add role." });
      return false;
    }
  };

  const handleInviteUser = async (fullName: string, email: string, role: string) => {
    if (!companyId) return false;
    try {
      await createInvite(companyId, email, fullName, role);
      toast({ title: "Success", description: `Invitation sent to ${email}.` });
      fetchUsersAndRoles(); // Refetch to show the new invite in the list
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

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (userProfile?.role !== "Admin") {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }
  
  const allTeamMembers = [
    ...users.map(u => ({...u, type: 'user' as const, id: u.user_id, status: 'accepted' as const })),
    ...invites
        .filter(i => i.status === 'pending') // Only show pending invites
        .map(i => ({...i, type: 'invite' as const, id: i.invite_id, role: i.role, status: 'pending' as const}))
  ].sort((a, b) => a.full_name.localeCompare(b.full_name));

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
                    <TableCell className="font-medium">{member.full_name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      {member.type === 'user' ? (
                        <Badge variant={member.role === 'Admin' ? 'default' : 'secondary'}>{member.role}</Badge>
                      ) : (
                        <Badge variant="outline">Pending Invitation</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                        {member.type === 'invite' && (
                            <Button variant="ghost" size="sm" onClick={() => handleCopyInviteLink(member.id)}>
                                {copiedInviteId === member.id ? <Check className="mr-2 text-green-500" /> : <Copy className="mr-2" />}
                                Copy Link
                            </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No users found.
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

      <InviteUserDialog
        isOpen={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        roles={roles.filter(r => r !== 'Admin')} // Cannot assign Admin via invite
        onInviteUser={handleInviteUser}
       />
    </div>
  );
}


import { doc, getDoc, setDoc, serverTimestamp, collection, writeBatch, query, where, getDocs, addDoc, updateDoc, deleteDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";

// NEW STRUCTURE: Actor interface for audit logs
interface Actor {
    id: string;
    name: string;
    email: string;
}

// NEW STRUCTURE: UserProfile uses nested maps
export interface UserProfile {
    id: string; // user UID
    createdAt: any;
    profile: {
        name: string;
        email: string;
        phone_number?: string;
    };
    company: {
        id: string;
        name: string;
        role: "Admin" | "Analyst" | "Viewer" | string;
    };
}

export interface Invite {
    invite_id: string;
    email: string;
    full_name: string;
    role: string;
    status: "pending" | "accepted";
    created_at: any;
    companyName?: string;
    accepted_at?: any;
    accepted_by_uid?: string;
}

// NEW FUNCTION: For creating audit logs
async function createAuditLog(companyId: string, actor: Actor, message: string) {
    try {
        const auditLogRef = collection(db, "companies", companyId, "audit_logs");
        await addDoc(auditLogRef, {
            actor,
            message,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
    }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const data = userSnap.data();
        // Adapt to new structure, ensuring id is the doc id.
        return { id: userSnap.id, ...data } as UserProfile;
    }
    return null;
}

export async function getDashboardUrl(uid: string): Promise<string | null> {
    const userProfile = await getUserProfile(uid);

    // UPDATED: Use new nested structure
    if (userProfile && userProfile.company.id) {
        try {
            const companyRef = doc(db, "companies", userProfile.company.id);
            const companySnap = await getDoc(companyRef);
            if (companySnap.exists()) {
                const companyData = companySnap.data();
                // UPDATED: Access lookerUrl from nested settings map
                return companyData.settings?.lookerUrl || null;
            }
        } catch (error: any) {
            if (error.code === 'permission-denied') {
                console.log("User does not have permission to view company-level dashboard URL. This is expected for non-admins.");
                return null;
            }
            console.error("An unexpected error occurred while fetching dashboard URL:", error);
            return null; 
        }
    }
    return null;
}

// UPDATED: Interface for company creation data
interface CompanyData {
    company_name: string;
    industry: string;
    company_size: string;
    registered_email: string;
    phone_number: string;
}

// UPDATED: Interface for admin creation data
interface AdminData {
    uid: string;
    email: string;
    fullName: string;
}

export async function createCompanyAndAdmin({ companyData, adminData }: { companyData: CompanyData, adminData: AdminData }): Promise<void> {
    const companyRef = doc(collection(db, "companies"));
    const userRef = doc(db, "users", adminData.uid);

    const batch = writeBatch(db);

    // UPDATED: Write company document with new nested structure
    batch.set(companyRef, {
        id: companyRef.id,
        createdAt: serverTimestamp(),
        companyInfo: {
            name: companyData.company_name,
            industry: companyData.industry,
            size: companyData.company_size,
            email: companyData.registered_email,
            phone: companyData.phone_number,
        },
        subscription: {
            plan: "Trial",
            status: "Active",
        },
        settings: {
            lookerUrl: null,
        },
        // NEW: Roles are now stored in an array on the company document
        roles: ["Admin"],
    });

    // UPDATED: Write user document with new nested structure
    batch.set(userRef, {
        id: adminData.uid,
        createdAt: serverTimestamp(),
        profile: {
            name: adminData.fullName,
            email: adminData.email,
        },
        company: {
            id: companyRef.id,
            name: companyData.company_name,
            role: "Admin",
        },
    });
    
    await batch.commit();

    // ADDED: Audit log for company creation
    await createAuditLog(
      companyRef.id,
      { id: adminData.uid, name: adminData.fullName, email: adminData.email },
      `Company account created.`
    );
}

// UPDATED: This function is now fully implemented with the new structure
export async function createUserUnderCompany({
    uid,
    email,
    fullName,
    companyId,
    role,
}: {
    uid: string;
    email: string;
    fullName: string;
    companyId: string;
    role: "Admin" | "Analyst" | "Viewer" | string;
}): Promise<void> {
    const companyRef = doc(db, "companies", companyId);
    const userRef = doc(db, "users", uid);

    const companySnap = await getDoc(companyRef);
    if (!companySnap.exists()) {
        throw new Error("The provided Company ID does not exist. Please check and try again.");
    }
    const companyData = companySnap.data();

    // UPDATED: Create user with new nested structure
    await setDoc(userRef, {
        id: uid,
        createdAt: serverTimestamp(),
        profile: {
            name: fullName,
            email: email,
        },
        company: {
            id: companyId,
            name: companyData.companyInfo.name, // Get name from nested map
            role: role,
        },
    });
}


export async function getCompanyUsers(companyId: string): Promise<UserProfile[]> {
    const usersRef = collection(db, "users");
    // UPDATED: Query based on the new nested field
    const q = query(usersRef, where("company.id", "==", companyId));
    const querySnapshot = await getDocs(q);
    
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
        // The id is now the doc id itself, which is more robust
        users.push({ id: doc.id, ...doc.data() } as UserProfile);
    });
    return users;
}

export async function getCompanyInvites(companyId: string, showAll: boolean = false): Promise<Invite[]> {
    const invitesRef = collection(db, "companies", companyId, "invites");
    
    const q = showAll 
      ? query(invitesRef) 
      : query(invitesRef, where("status", "==", "pending"));

    const querySnapshot = await getDocs(q);
    
    const invites: Invite[] = [];
    querySnapshot.forEach((doc) => {
        invites.push({ invite_id: doc.id, ...doc.data() } as Invite);
    });
    return invites;
}

// REWRITTEN: To fetch roles from an array on the company document.
export async function getCompanyRoles(companyId: string): Promise<string[]> {
    const companyRef = doc(db, "companies", companyId);
    const companySnap = await getDoc(companyRef);

    if (companySnap.exists()) {
        const data = companySnap.data();
        // Roles are now a simple array on the company doc. Default to empty array.
        const roles = data.roles || [];
        return [...new Set(roles)].sort();
    }
    return [];
}

// REWRITTEN: To add a role to the array on the company document.
export async function addRole(companyId: string, roleName: string, actor: Actor): Promise<void> {
    const companyRef = doc(db, "companies", companyId);
    // Use arrayUnion to atomically add a new role to the 'roles' array.
    await updateDoc(companyRef, {
        roles: arrayUnion(roleName)
    });
    await createAuditLog(companyId, actor, `Created new role: "${roleName}".`);
}

// REWRITTEN: To ensure initial roles are set using the new array method.
export async function createInitialAdminRole(companyId: string, actor: Actor): Promise<void> {
    const companyRef = doc(db, "companies", companyId);
    const companySnap = await getDoc(companyRef);
    if(companySnap.exists()) {
        const companyData = companySnap.data();
        const roles = companyData.roles || [];
        if (!roles.includes("Admin")) {
             await updateDoc(companyRef, {
                roles: arrayUnion("Admin")
            });
            await createAuditLog(companyId, actor, 'Created initial "Admin" role.');
        }
    }
}

export async function createInvite(companyId: string, email: string, fullName: string, role: string, actor: Actor): Promise<void> {
    const companyRef = doc(db, "companies", companyId);
    const companySnap = await getDoc(companyRef);
    
    if (!companySnap.exists()) {
        throw new Error("Cannot create invite for a non-existent company.");
    }
    const companyData = companySnap.data();
    const companyName = companyData.companyInfo?.name || "Your Company";

    const invitesRef = collection(db, "companies", companyId, "invites");
    await addDoc(invitesRef, {
        email: email,
        full_name: fullName,
        role: role,
        status: "pending",
        created_at: serverTimestamp(),
        companyName: companyName
    });

    await createAuditLog(companyId, actor, `Sent invitation to ${email} for the role "${role}".`);
}

export async function getInviteDetails(companyId: string, inviteId: string): Promise<Invite | null> {
    const inviteRef = doc(db, "companies", companyId, "invites", inviteId);
    const companyRef = doc(db, "companies", companyId);
    
    const [inviteSnap, companySnap] = await Promise.all([getDoc(inviteRef), getDoc(companyRef)]);

    if (inviteSnap.exists()) {
        const inviteData = inviteSnap.data() as Omit<Invite, 'invite_id'>;
        const companyData = companySnap.exists() ? companySnap.data() : null;
        return { 
            ...inviteData, 
            invite_id: inviteSnap.id,
            // UPDATED: Get company name from nested map
            companyName: companyData?.companyInfo.name
        };
    }
    return null;
}

// UPDATED: Interface for accepting invite
interface AcceptInviteData {
    companyId: string;
    inviteId: string;
    user: {
        uid: string;
        email: string;
        fullName: string;
    };
    role: string;
    companyName?: string;
}

export async function acceptInvite({ companyId, inviteId, user, role, companyName }: AcceptInviteData): Promise<void> {
    const userRef = doc(db, "users", user.uid);
    const inviteRef = doc(db, "companies", companyId, "invites", inviteId);

    const batch = writeBatch(db);

    // UPDATED: Create user doc with new nested structure
    batch.set(userRef, {
        id: user.uid,
        createdAt: serverTimestamp(),
        profile: {
            name: user.fullName,
            email: user.email,
        },
        company: {
            id: companyId,
            name: companyName || "Unknown Company",
            role: role,
        },
    });

    batch.update(inviteRef, {
        status: 'accepted',
        accepted_at: serverTimestamp(),
        accepted_by_uid: user.uid
    });

    await batch.commit();
    await createAuditLog(companyId, {id: user.uid, name: user.fullName, email: user.email}, `Accepted invitation and joined the company.`);
}

// UPDATED: Data now refers to fields inside the 'profile' map
export async function updateUserProfile(uid: string, data: { name: string; phone_number?: string; }): Promise<void> {
    const userRef = doc(db, "users", uid);
    const updateData: { [key: string]: any } = {
        'profile.name': data.name,
    };

    if (data.phone_number !== undefined) {
        updateData['profile.phone_number'] = data.phone_number;
    }
    
    await updateDoc(userRef, updateData);
}

/**
 * Updates the role of a specific user.
 * @param uid The ID of the user to update.
 * @param newRole The new role to assign to the user.
 * @param actor The admin performing the action.
 * @param companyId The ID of the company for audit logging.
 */
export async function updateUserRole(uid: string, newRole: string, actor: Actor, companyId: string): Promise<void> {
    const userRef = doc(db, "users", uid);
    // UPDATED: Update the nested role field
    await updateDoc(userRef, {
        'company.role': newRole
    });
    const targetUser = await getUserProfile(uid);
    const targetName = targetUser?.profile.name || 'Unknown User';
    await createAuditLog(companyId, actor, `Changed role for ${targetName} to "${newRole}".`);
}

/**
 * Removes a user from the company by deleting their user profile document.
 * @param user The user profile of the user to remove.
 * @param actor The admin performing the action.
 */
export async function removeUserFromCompany(user: UserProfile, actor: Actor): Promise<void> {
    const userRef = doc(db, "users", user.id);
    await deleteDoc(userRef);

    await createAuditLog(user.company.id, actor, `Removed user ${user.profile.name} (${user.profile.email}) from the company.`);
}

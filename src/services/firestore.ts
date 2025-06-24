
import { doc, getDoc, setDoc, serverTimestamp, collection, writeBatch, query, where, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UserProfile {
    user_id: string;
    full_name: string;
    email: string;
    company_id: string;
    company_name?: string;
    role: "Admin" | "Analyst" | "Viewer" | string; // Allow for custom roles
    created_at: any;
    phone_number?: string;
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

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
    }
    return null;
}

export async function getDashboardUrl(uid: string): Promise<string | null> {
    const userProfile = await getUserProfile(uid);

    if (userProfile && userProfile.company_id) {
        try {
            const companyRef = doc(db, "companies", userProfile.company_id);
            const companySnap = await getDoc(companyRef);
            if (companySnap.exists()) {
                const companyData = companySnap.data();
                // This check is important for security. Only Admins can read the company doc.
                // For non-admins, companySnap.exists() will be true, but companyData will be empty.
                return companyData.lookerUrl || null;
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

interface CompanyData {
    company_name: string;
    industry: string;
    company_size: string;
    registered_email: string;
    phone_number: string;
}

interface AdminData {
    uid: string;
    email: string;
    fullName: string;
}

export async function createCompanyAndAdmin({ companyData, adminData }: { companyData: CompanyData, adminData: AdminData }): Promise<void> {
    const companyRef = doc(collection(db, "companies"));
    const userRef = doc(db, "users", adminData.uid);

    const batch = writeBatch(db);

    batch.set(companyRef, {
        ...companyData,
        company_id: companyRef.id,
        created_at: serverTimestamp(),
        plan_type: "Trial",
        subscription_status: "Active",
        lookerUrl: null,
    });

    batch.set(userRef, {
        user_id: adminData.uid,
        full_name: adminData.fullName,
        email: adminData.email,
        company_id: companyRef.id,
        company_name: companyData.company_name,
        role: "Admin",
        created_at: serverTimestamp(),
    });
    
    await batch.commit();
}


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

    await setDoc(userRef, {
        user_id: uid,
        full_name: fullName,
        email: email,
        company_id: companyId,
        company_name: companyData.company_name,
        role: role,
        created_at: serverTimestamp(),
    });
}


export async function getCompanyUsers(companyId: string): Promise<UserProfile[]> {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("company_id", "==", companyId));
    const querySnapshot = await getDocs(q);
    
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
        users.push(doc.data() as UserProfile);
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

export async function getCompanyRoles(companyId: string): Promise<string[]> {
    const rolesRef = collection(db, "companies", companyId, "roles");
    const querySnapshot = await getDocs(rolesRef);

    const roles: string[] = [];
    querySnapshot.forEach((doc) => {
        roles.push(doc.data().name);
    });
    const uniqueRoles = [...new Set(roles)];
    return uniqueRoles.sort();
}

export async function addRole(companyId: string, roleName: string): Promise<void> {
    const rolesRef = collection(db, "companies", companyId, "roles");
    await addDoc(rolesRef, {
        name: roleName,
        created_at: serverTimestamp(),
    });
}

export async function createInvite(companyId: string, email: string, fullName: string, role: string): Promise<void> {
    const invitesRef = collection(db, "companies", companyId, "invites");
    await addDoc(invitesRef, {
        email,
        full_name: fullName,
        role,
        status: "pending",
        created_at: serverTimestamp(),
    });
}

export async function createInitialAdminRole(companyId: string): Promise<void> {
    const adminRoleQuery = query(collection(db, "companies", companyId, "roles"), where("name", "==", "Admin"));
    const existingAdminRole = await getDocs(adminRoleQuery);
    if(existingAdminRole.empty) {
        const rolesRef = collection(db, "companies", companyId, "roles");
        await addDoc(rolesRef, {
            name: "Admin",
            created_at: serverTimestamp(),
        });
    }
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
            companyName: companyData?.company_name 
        };
    }
    return null;
}

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

    const newUserProfileData: Omit<UserProfile, 'created_at'> = {
        user_id: user.uid,
        full_name: user.fullName,
        email: user.email,
        company_id: companyId,
        role: role,
    };

    if (companyName) {
        newUserProfileData.company_name = companyName;
    }

    batch.set(userRef, {
        ...newUserProfileData,
        created_at: serverTimestamp(),
    });

    batch.update(inviteRef, {
        status: 'accepted',
        accepted_at: serverTimestamp(),
        accepted_by_uid: user.uid
    });

    await batch.commit();
}


export async function updateUserProfile(uid: string, data: { full_name: string; phone_number?: string; }): Promise<void> {
    const userRef = doc(db, "users", uid);
    const updateData: { [key: string]: any } = {
        full_name: data.full_name,
    };

    if (data.phone_number !== undefined) {
        updateData.phone_number = data.phone_number;
    }
    
    await updateDoc(userRef, updateData);
}

/**
 * Updates the role of a specific user.
 * This function can only be called by an authenticated Admin user.
 * @param uid The ID of the user to update.
 * @param newRole The new role to assign to the user.
 */
export async function updateUserRole(uid: string, newRole: string): Promise<void> {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
        role: newRole
    });
}

/**
 * Removes a user from the company by deleting their user profile document.
 * This revokes their access to the company's data. Note: this does not
 * delete their Firebase Authentication account.
 * @param uid The ID of the user to remove.
 */
export async function removeUserFromCompany(uid: string): Promise<void> {
    const userRef = doc(db, "users", uid);
    await deleteDoc(userRef);
}

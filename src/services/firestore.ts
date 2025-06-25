
import { doc, getDoc, setDoc, serverTimestamp, collection, writeBatch, query, where, getDocs, addDoc, updateDoc, deleteDoc, arrayUnion, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// NEW STRUCTURE: The user's profile data, stored in a sub-collection of a company.
export interface UserProfile {
    id: string; // user UID
    fullName: string;
    email: string;
    role: "Admin" | "Analyst" | "Viewer" | string;
    dashboardUrl?: string;
    isActive: boolean;
    createdAt: any;
    companyId: string; // Denormalized for convenience
    companyName: string; // Denormalized for convenience
}

// NEW STRUCTURE: The company data.
export interface Company {
    id: string;
    company_name: string;
    industry: string;
    subscription_plan: 'Trial' | 'Basic' | 'Enterprise';
    is_active: boolean;
    created_at: any;
    plan_expiry_date?: any;
    roles: string[];
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

export interface Contact {
  id: string;
  name: string;
  email: string;
  companyName: string;
  message?: string;
  submittedAt: Timestamp;
}

interface Actor {
    id: string;
    name: string;
    email: string;
}

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

// Re-fetches the user profile based on the new structure.
// This is a composite object built from multiple documents for UI convenience.
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const lookupRef = doc(db, "user_company_lookup", uid);
    const lookupSnap = await getDoc(lookupRef);

    if (!lookupSnap.exists()) {
        console.log("No company lookup found for user:", uid);
        return null;
    }

    const { companyId } = lookupSnap.data();
    if (!companyId) return null;

    const companyRef = doc(db, "companies", companyId);
    const userRef = doc(db, "companies", companyId, "users", uid);

    const [companySnap, userSnap] = await Promise.all([
        getDoc(companyRef),
        getDoc(userRef)
    ]);

    if (!companySnap.exists() || !userSnap.exists()) {
        console.log("Company or user document not found.");
        return null;
    }

    const companyData = companySnap.data() as Omit<Company, 'id' | 'roles'>;
    const userData = userSnap.data();

    // The object returned to the app combines all necessary info
    return {
        id: uid,
        fullName: userData.fullName,
        email: userData.email,
        role: userData.role,
        dashboardUrl: userData.dashboardUrl,
        isActive: userData.isActive,
        createdAt: userData.createdAt,
        companyId: companyId,
        companyName: companyData.company_name,
    };
}


// Dashboard URL is now directly on the user profile.
export async function getDashboardUrl(uid: string): Promise<string | null> {
    const userProfile = await getUserProfile(uid);
    return userProfile?.dashboardUrl || null;
}

interface CompanyData {
    company_name: string;
    industry: string;
}

interface AdminData {
    uid: string;
    email: string;
    fullName: string;
}

export async function createCompanyAndAdmin({ companyData, adminData }: { companyData: CompanyData, adminData: AdminData }): Promise<void> {
    const companyRef = doc(collection(db, "companies"));
    const userRef = doc(db, "companies", companyRef.id, "users", adminData.uid);
    const lookupRef = doc(db, "user_company_lookup", adminData.uid);

    const batch = writeBatch(db);

    // 1. Create the Company Document
    batch.set(companyRef, {
        company_name: companyData.company_name,
        industry: companyData.industry,
        subscription_plan: "Trial",
        is_active: true,
        created_at: serverTimestamp(),
        plan_expiry_date: null,
        roles: ["Admin", "Viewer", "Analyst"], // Default roles
    });

    // 2. Create the User Document in the sub-collection
    batch.set(userRef, {
        fullName: adminData.fullName,
        email: adminData.email,
        role: "Admin",
        dashboardUrl: null,
        isActive: true,
        createdAt: serverTimestamp(),
    });

    // 3. Create the lookup document
    batch.set(lookupRef, { companyId: companyRef.id });
    
    await batch.commit();

    await createAuditLog(
      companyRef.id,
      { id: adminData.uid, name: adminData.fullName, email: adminData.email },
      `Company account created.`
    );
}

export async function getCompanyUsers(companyId: string): Promise<UserProfile[]> {
    const usersRef = collection(db, "companies", companyId, "users");
    const companyRef = doc(db, "companies", companyId);

    const [usersSnapshot, companySnap] = await Promise.all([getDocs(usersRef), getDoc(companyRef)]);
    
    if (!companySnap.exists()) return [];
    const companyName = companySnap.data()?.company_name || 'Unknown Company';
    
    const users: UserProfile[] = [];
    usersSnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({ 
            id: doc.id,
            companyId,
            companyName,
            ...data
         } as UserProfile);
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
    const companyRef = doc(db, "companies", companyId);
    const companySnap = await getDoc(companyRef);

    if (companySnap.exists()) {
        const data = companySnap.data();
        const roles = data.roles || [];
        return [...new Set(roles)].sort();
    }
    return [];
}

export async function addRole(companyId: string, roleName: string, actor: Actor): Promise<void> {
    const companyRef = doc(db, "companies", companyId);
    await updateDoc(companyRef, {
        roles: arrayUnion(roleName)
    });
    await createAuditLog(companyId, actor, `Created new role: "${roleName}".`);
}

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
    const companyName = companyData.company_name || "Your Company";

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
    const inviteSnap = await getDoc(inviteRef);

    if (inviteSnap.exists()) {
        return { 
            invite_id: inviteSnap.id,
            ...(inviteSnap.data() as Omit<Invite, 'invite_id'>)
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

export async function acceptInvite({ companyId, inviteId, user, role }: AcceptInviteData): Promise<void> {
    const userRef = doc(db, "companies", companyId, "users", user.uid);
    const inviteRef = doc(db, "companies", companyId, "invites", inviteId);
    const lookupRef = doc(db, "user_company_lookup", user.uid);

    const batch = writeBatch(db);

    // 1. Create the User Document in the sub-collection
    batch.set(userRef, {
        fullName: user.fullName,
        email: user.email,
        role: role,
        dashboardUrl: null,
        isActive: true,
        createdAt: serverTimestamp(),
    });

    // 2. Update the invite status
    batch.update(inviteRef, {
        status: 'accepted',
        accepted_at: serverTimestamp(),
        accepted_by_uid: user.uid
    });

    // 3. Create the lookup document
    batch.set(lookupRef, { companyId: companyId });

    await batch.commit();
    await createAuditLog(companyId, {id: user.uid, name: user.fullName, email: user.email}, `Accepted invitation and joined the company.`);
}

// Note: Phone number is no longer part of the new data structure.
export async function updateUserProfile(uid: string, companyId: string, data: { name: string; }): Promise<void> {
    const userRef = doc(db, "companies", companyId, "users", uid);
    const updateData: { [key: string]: any } = {
        'fullName': data.name,
    };
    
    await updateDoc(userRef, updateData);
}

export async function updateUserRole(uid: string, newRole: string, actor: Actor, companyId: string): Promise<void> {
    const userRef = doc(db, "companies", companyId, "users", uid);
    await updateDoc(userRef, {
        'role': newRole
    });
    
    const targetUserDoc = await getDoc(userRef);
    const targetName = targetUserDoc.data()?.fullName || 'Unknown User';
    await createAuditLog(companyId, actor, `Changed role for ${targetName} to "${newRole}".`);
}

export async function removeUserFromCompany(user: UserProfile, actor: Actor): Promise<void> {
    const userRef = doc(db, "companies", user.companyId, "users", user.id);
    const lookupRef = doc(db, "user_company_lookup", user.id);
    
    const batch = writeBatch(db);
    batch.delete(userRef);
    batch.delete(lookupRef);
    await batch.commit();

    await createAuditLog(user.companyId, actor, `Removed user ${user.fullName} (${user.email}) from the company.`);
}

export async function getContacts(): Promise<Contact[]> {
    const contactsCollection = collection(db, "contacts");
    const q = query(contactsCollection, orderBy("submittedAt", "desc"));
    const querySnapshot = await getDocs(q);

    const contacts: Contact[] = [];
    querySnapshot.forEach((doc) => {
        contacts.push({ id: doc.id, ...doc.data() } as Contact);
    });

    return contacts;
}

    
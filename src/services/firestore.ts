import { doc, getDoc, setDoc, serverTimestamp, collection, writeBatch, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UserProfile {
    user_id: string;
    full_name: string;
    email: string;
    company_id: string;
    role: "Admin" | "Analyst" | "Viewer" | string; // Allow for custom roles
    created_at: any;
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
        const companyRef = doc(db, "companies", userProfile.company_id);
        const companySnap = await getDoc(companyRef);
        if (companySnap.exists()) {
            const companyData = companySnap.data();
            return companyData.lookerUrl || null;
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
        role: "Admin",
        created_at: serverTimestamp(),
    });
    
    // Default roles are now created on the first visit to the user management page.
    await batch.commit();
}


interface UserData {
    uid: string;
    fullName: string;
    email: string;
    companyId: string;
    role: "Admin" | "Analyst" | "Viewer" | string;
}

export async function createUserUnderCompany(userData: UserData): Promise<void> {
    const companyRef = doc(db, "companies", userData.companyId);
    const companySnap = await getDoc(companyRef);

    if (!companySnap.exists()) {
        const error = new Error("Company ID not found");
        (error as any).code = 'firestore/not-found';
        throw error;
    }

    const userRef = doc(db, "users", userData.uid);

    await setDoc(userRef, {
        user_id: userData.uid,
        full_name: userData.fullName,
        email: userData.email,
        company_id: userData.companyId,
        role: userData.role,
        created_at: serverTimestamp(),
    });
}

// --- New Functions for User/Role Management ---

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

export async function getCompanyRoles(companyId: string): Promise<string[]> {
    const rolesRef = collection(db, "companies", companyId, "roles");
    const querySnapshot = await getDocs(rolesRef);

    const roles: string[] = [];
    querySnapshot.forEach((doc) => {
        roles.push(doc.data().name);
    });
    return roles.sort();
}

export async function addRole(companyId: string, roleName: string): Promise<void> {
    const rolesRef = collection(db, "companies", companyId, "roles");
    await addDoc(rolesRef, {
        name: roleName,
        created_at: serverTimestamp(),
    });
}

export async function createInvite(companyId: string, email: string, fullName: string, role: string): Promise<void> {
    const invitesRef = collection(db, "invites");
    await addDoc(invitesRef, {
        company_id: companyId,
        email,
        full_name: fullName,
        role,
        status: "pending",
        created_at: serverTimestamp(),
    });
}

export async function createDefaultRoles(companyId: string): Promise<void> {
    const batch = writeBatch(db);
    const rolesRef = collection(db, "companies", companyId, "roles");
    
    batch.set(doc(rolesRef), { name: "Admin", created_at: serverTimestamp() });
    batch.set(doc(rolesRef), { name: "Analyst", created_at: serverTimestamp() });
    batch.set(doc(rolesRef), { name: "Viewer", created_at: serverTimestamp() });

    await batch.commit();
}
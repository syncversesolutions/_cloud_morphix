
import { doc, getDoc, setDoc, serverTimestamp, collection, writeBatch, query, where, getDocs, addDoc, updateDoc, deleteDoc, arrayUnion, orderBy, Timestamp } from "firebase/firestore";
import { db, firebaseConfig } from "@/lib/firebase";
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { z } from 'zod';

export interface Role {
    id: string;
    role_name: string;
    allowed_actions: { [key: string]: boolean }; // Changed to map for rules
}

// The user's profile data, now with permissions included.
export interface UserProfile {
    id: string; // user UID
    fullName: string;
    email: string;
    role: string; // The name of the role, e.g., "Admin"
    allowed_actions: string[]; // Permissions inherited from the role
    dashboardUrl?: string;
    isActive: boolean;
    createdAt: any;
    companyId: string;
    companyName: string;
}

export interface Company {
    id: string;
    company_name: string;
    industry: string;
    subscription_plan: 'Trial' | 'Basic' | 'Enterprise';
    is_active: boolean;
    created_at: Timestamp;
    plan_expiry_date?: any;
}

// This is defined here to be the single source of truth for user creation validation.
export const addUserFormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  role: z.string().min(1, 'You must select a role.'),
  password: z.string().refine(password => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    const hasValidLength = password.length >= 8 && password.length <= 16;
    return hasUppercase && hasLowercase && hasNumber && hasSpecialChar && hasValidLength;
  }, {
    message: "Password does not meet security requirements."
  }),
});
export type AddUserInput = z.infer<typeof addUserFormSchema>;


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

// --- List of all available permissions in the system ---
export const availablePermissions = [
    { id: 'manage_users', label: 'Manage Users & Invites' },
    { id: 'manage_roles', label: 'Manage Roles & Permissions' },
    { id: 'view_dashboard', label: 'View Dashboard' },
];

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

// Re-fetches the user profile and merges it with their role's permissions.
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const lookupRef = doc(db, "user_company_lookup", uid);
    const lookupSnap = await getDoc(lookupRef);

    if (!lookupSnap.exists()) {
        console.log("No company lookup found for user:", uid);
        return null;
    }
    const companyId = lookupSnap.data().companyId;
    
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

    const companyData = companySnap.data() as Omit<Company, 'id'>;
    const userData = userSnap.data();
    const userRoleName = userData.role;
    let allowed_actions: string[] = [];

    // Fetch the permissions for the user's role
    if (userRoleName) {
        const roleRef = doc(db, "companies", companyId, "roles", userRoleName);
        const roleSnap = await getDoc(roleRef);
        if (roleSnap.exists()) {
            const roleData = roleSnap.data();
            // Convert permissions map back to an array for easier use on the client.
            allowed_actions = Object.keys(roleData.allowed_actions || {});
        }
    }

    return {
        id: uid,
        fullName: userData.fullName,
        email: userData.email,
        role: userRoleName,
        allowed_actions: allowed_actions,
        dashboardUrl: userData.dashboardUrl,
        isActive: userData.isActive,
        createdAt: userData.createdAt,
        companyId: companyId,
        companyName: companyData.company_name,
    };
}

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

    const lowerCaseCompanyName = companyData.company_name.toLowerCase();
    const subscription_plan = (lowerCaseCompanyName === 'cloud morphix' || lowerCaseCompanyName === 'loud morphix')
                                ? 'Enterprise'
                                : 'Trial';

    batch.set(companyRef, {
        company_name: companyData.company_name,
        industry: companyData.industry,
        subscription_plan: subscription_plan,
        is_active: true,
        created_at: serverTimestamp(),
        plan_expiry_date: null,
    });
    
    const rolesRef = collection(db, "companies", companyRef.id, "roles");
    const allPermissionsMap = availablePermissions.reduce((acc, p) => {
        acc[p.id] = true;
        return acc;
    }, {} as {[key: string]: boolean});
    
    batch.set(doc(rolesRef, "Admin"), {
        role_name: "Admin",
        allowed_actions: allPermissionsMap,
    });
     batch.set(doc(rolesRef, "Viewer"), {
        role_name: "Viewer",
        allowed_actions: { "view_dashboard": true },
    });
     batch.set(doc(rolesRef, "Analyst"), {
        role_name: "Analyst",
        allowed_actions: { "view_dashboard": true },
    });

    batch.set(userRef, {
        fullName: adminData.fullName,
        email: adminData.email,
        role: "Admin",
        dashboardUrl: null,
        isActive: true,
        createdAt: serverTimestamp(),
    });

    batch.set(lookupRef, { companyId: companyRef.id });
    
    await batch.commit();

    await createAuditLog(
      companyRef.id,
      { id: adminData.uid, name: adminData.fullName, email: adminData.email },
      `Company account created.`
    );
}

export async function createUserInCompany(companyId: string, data: AddUserInput, actor: Actor): Promise<void> {
    const tempAppName = `temp-user-creation-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
        const userCredential = await createUserWithEmailAndPassword(tempAuth, data.email, data.password);
        const newUserUid = userCredential.user.uid;

        const userRef = doc(db, "companies", companyId, "users", newUserUid);
        const lookupRef = doc(db, "user_company_lookup", newUserUid);
        const batch = writeBatch(db);

        batch.set(userRef, {
            fullName: data.fullName,
            email: data.email,
            role: data.role,
            dashboardUrl: null,
            isActive: true,
            createdAt: serverTimestamp(),
        });
        batch.set(lookupRef, { companyId: companyId });
        await batch.commit();
        
        await createAuditLog(companyId, actor, `Created a new user account for ${data.fullName} (${data.email}) with role "${data.role}".`);
    } catch(error) {
        console.error("Error creating user:", error);
        throw error;
    } finally {
        await deleteApp(tempApp);
    }
}


export async function getCompanyUsers(companyId: string): Promise<UserProfile[]> {
    const usersRef = collection(db, "companies", companyId, "users");
    const rolesRef = collection(db, "companies", companyId, "roles");
    const companyRef = doc(db, "companies", companyId);

    const [usersSnapshot, rolesSnapshot, companySnap] = await Promise.all([
        getDocs(usersRef),
        getDocs(rolesSnapshot),
        getDoc(companyRef)
    ]);

    if (!companySnap.exists()) {
        throw new Error("Company not found");
    }

    const companyData = companySnap.data() as Omit<Company, 'id'>;
    const companyName = companyData.company_name;

    const rolesMap = new Map<string, string[]>();
    rolesSnapshot.forEach(doc => {
        const roleData = doc.data();
        rolesMap.set(roleData.role_name, Object.keys(roleData.allowed_actions || {}));
    });

    const userProfiles: UserProfile[] = usersSnapshot.docs.map(doc => {
        const userData = doc.data();
        const userRole = userData.role || "";
        const allowed_actions = rolesMap.get(userRole) || [];
        
        return {
            id: doc.id,
            fullName: userData.fullName,
            email: userData.email,
            role: userRole,
            allowed_actions: allowed_actions,
            dashboardUrl: userData.dashboardUrl,
            isActive: userData.isActive,
            createdAt: userData.createdAt,
            companyId: companyId,
            companyName: companyName,
        };
    });
    
    return userProfiles;
}

export async function getCompanyRoles(companyId: string): Promise<Role[]> {
    const rolesRef = collection(db, "companies", companyId, "roles");
    const rolesSnap = await getDocs(query(rolesRef, orderBy("role_name")));
    
    const roles: Role[] = [];
    rolesSnap.forEach((doc) => {
        roles.push({ id: doc.id, ...doc.data() } as Role);
    });
    return roles;
}

export async function addRole(companyId: string, roleName: string, permissions: string[], actor: Actor): Promise<void> {
    const roleRef = doc(db, "companies", companyId, "roles", roleName);
    
    const permissionsMap = permissions.reduce((acc, perm) => {
        acc[perm] = true;
        return acc;
    }, {} as { [key: string]: boolean });

    await setDoc(roleRef, {
        role_name: roleName,
        allowed_actions: permissionsMap
    });
    await createAuditLog(companyId, actor, `Created new role: "${roleName}".`);
}

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
    console.warn(`User ${user.email} was removed from the company in Firestore, but their Auth account still exists.`);

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

export async function getAllCompanies(): Promise<Company[]> {
    const companiesCollection = collection(db, "companies");
    const q = query(companiesCollection, orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);

    const companies: Company[] = [];
    querySnapshot.forEach((doc) => {
        companies.push({ id: doc.id, ...doc.data() } as Company);
    });

    return companies;
}

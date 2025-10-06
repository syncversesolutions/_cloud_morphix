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
    domoUrl?: string;  // Added domoUrl field here
    isActive: boolean;
    createdAt: any;
    companyId: string;
    companyName: string;
    isPlatformAdmin?: boolean;
}

export interface Company {
    id: string;
    company_name: string;
    industry: string;
    domoUrl?: string;  // Added domo_url field here
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
  domoUrl: z.string().url(),  // Simple string URL
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
    
    console.log("before Doc");

    const lookupRef = doc(db, "user_company_lookup", uid);
    console.log("inside mid");
    const lookupSnap = await getDoc(lookupRef);

    console.log("after getDoc");

    if (!lookupSnap.exists()) {
        console.log("No company lookup found for user:", uid);
        return null;
    }
    const companyId = lookupSnap.data()?.companyId;
    
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
            allowed_actions = Object.keys(roleData.allowed_actions || {});
        }
    }
    
    return {
        id: uid,
        fullName: userData.fullName,
        email: userData.email,
        role: userRoleName,
        allowed_actions: allowed_actions,
        domoUrl: userData.domoUrl,  // Include domoUrl here
        isActive: userData.isActive,
        createdAt: userData.createdAt,
        companyId: companyId,
        companyName: companyData.company_name,
        isPlatformAdmin: userData.isPlatformAdmin || false,
    };
}

interface CompanyData {
    company_name: string;
    industry: string;
    domoUrl?: string;  // New optional field
}

interface AdminData {
    uid: string;
    email: string;
    fullName: string;
}

export async function createCompanyAndAdmin({ companyData, adminData, isPlatformAdminFlag = false }: { companyData: CompanyData, adminData: AdminData, isPlatformAdminFlag?: boolean }): Promise<void> {
    const companyRef = doc(collection(db, "companies"));
    const userRef = doc(db, "companies", companyRef.id, "users", adminData.uid);
    const lookupRef = doc(db, "user_company_lookup", adminData.uid);

    const batch = writeBatch(db);

    // Set company document
    batch.set(companyRef, {
        company_name: companyData.company_name,
        industry: companyData.industry,
        domoUrl: companyData.domoUrl || null,
        subscription_plan: 'Trial',
        is_active: true,
        created_at: serverTimestamp(),
        plan_expiry_date: null,
    });

    // Set default roles for the new company
    const rolesRef = collection(db, "companies", companyRef.id, "roles");
    const allPermissionsMap = availablePermissions.reduce((acc, p) => {
        acc[p.id] = true;
        return acc;
    }, {} as { [key: string]: boolean });

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

    // Set user document (company admin user), with isPlatformAdminFlag controlling platform admin status
    batch.set(userRef, {
        fullName: adminData.fullName,
        email: adminData.email,
        domoUrl: companyData.domoUrl,
        role: "Admin",
        isActive: true,
        createdAt: serverTimestamp(),
        isPlatformAdmin: isPlatformAdminFlag,   // Now false by default
    });

    // Set user_company_lookup doc
    batch.set(lookupRef, { companyId: companyRef.id, isPlatformAdmin: isPlatformAdminFlag });

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
            domoUrl:data.domoUrl,
            isActive: true,
            createdAt: serverTimestamp(),
            isPlatformAdmin: false, // Regular users are never platform admins
        });
        batch.set(lookupRef, { companyId: companyId, isPlatformAdmin: false });
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
        getDocs(rolesRef),
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
            domoUrl: userData.domoUrl || null,   // ✅ consistent with user creation
            isActive: userData.isActive,
            createdAt: userData.createdAt,
            companyId: companyId,
            companyName: companyName,
            isPlatformAdmin: userData.isPlatformAdmin || false,
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
    console.warn(`Attempting to remove user ${user.email} from company.`);
  
    const userRef   = doc(db, "companies", user.companyId, "users", user.id);
    const lookupRef = doc(db, "user_company_lookup", user.id);
  
    console.log("STEP 1: delete company user:", userRef.path);
    try {
      await deleteDoc(userRef);
      console.log("STEP 1 OK");
    } catch (error) {
      console.error("STEP 1 FAILED (company user delete):", error);
      throw error;
    }
  
    console.log("STEP 2: delete lookup:", lookupRef.path);
    try {
      await deleteDoc(lookupRef);
      console.log("STEP 2 OK");
    } catch (error) {
      console.error("STEP 2 FAILED (lookup delete):", error);
      throw error;
    }
  
    console.log("STEP 3: create audit log");
    try {
      await createAuditLog(
        user.companyId,
        actor,
        `Removed user ${user.fullName} (${user.email}) from the company.`
      );
      console.log("STEP 3 OK");
    } catch (error) {
      console.error("STEP 3 FAILED (audit log create):", error);
      // don't rethrow if you don't want to block UX on logging
    }
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

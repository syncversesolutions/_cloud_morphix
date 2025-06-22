import { doc, getDoc, setDoc, serverTimestamp, collection, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getDashboardUrl(uid: string): Promise<string | null> {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userData = userSnap.data();
        if(userData.company_id) {
            const companyRef = doc(db, "companies", userData.company_id);
            const companySnap = await getDoc(companyRef);
            if (companySnap.exists()) {
                const companyData = companySnap.data();
                return companyData.lookerUrl || null;
            }
        }
        return null;
    } else {
        // Fallback for old data model, can be removed later
        const oldDashboardRef = doc(db, "dashboards", uid);
        const oldDashboardSnap = await getDoc(oldDashboardRef);
        if (oldDashboardSnap.exists()) {
            return oldDashboardSnap.data().lookerUrl || null;
        }
        return null;
    }
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
        lookerUrl: null, // Placeholder for dashboard Looker URL
    });

    batch.set(userRef, {
        user_id: adminData.uid,
        full_name: adminData.fullName,
        email: adminData.email,
        company_id: companyRef.id,
        role: "Admin",
        created_at: serverTimestamp(),
    });

    await batch.commit();
}


interface UserData {
    uid: string;
    fullName: string;
    email: string;
    companyId: string;
    role: "Admin" | "Analyst" | "Viewer";
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

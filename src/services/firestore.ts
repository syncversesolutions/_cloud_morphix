import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getDashboardUrl(uid: string): Promise<string | null> {
    const docRef = doc(db, "dashboards", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return data.embedUrl || null;
    } else {
        return null;
    }
}

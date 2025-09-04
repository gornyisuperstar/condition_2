import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function updateOrgBoundsFromTerritory() {
  if (!auth.currentUser) throw new Error("Not signed in");
  const ref = doc(db, "organizations", auth.currentUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Org doc not found");
  const t = (snap.data().territory || []).map(p => ({
    latitude: p.latitude ?? p.lat,
    longitude: p.longitude ?? p.lng
  }));
  if (t.length === 0) return;

  const lats = t.map(p => p.latitude);
  const lngs = t.map(p => p.longitude);
  await updateDoc(ref, {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
    updatedAt: new Date()
  });
}

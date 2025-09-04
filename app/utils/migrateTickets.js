import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { isPointInPolygon } from "./geo"; // 👈 используем твой хелпер для проверки в полигоне

export async function migrateTickets() {
  try {
    const orgSnap = await getDocs(collection(db, "organizations"));
    const orgs = orgSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const ticketSnap = await getDocs(collection(db, "tickets"));

    let updated = 0;
    for (let ticketDoc of ticketSnap.docs) {
      const ticket = ticketDoc.data();
      if (ticket.orgCode) continue; // пропускаем если уже есть orgCode

      let matchedOrg = null;
      for (let org of orgs) {
        if (
          org.territory &&
          isPointInPolygon(
            { latitude: ticket.latitude, longitude: ticket.longitude },
            org.territory
          )
        ) {
          matchedOrg = org.orgCode;
          break;
        }
      }

      if (matchedOrg) {
        await updateDoc(doc(db, "tickets", ticketDoc.id), { orgCode: matchedOrg });
        updated++;
      }
    }

    return `✅ Migration complete. Updated ${updated} tickets.`;
  } catch (e) {
    console.error("Migration failed:", e);
    throw e;
  }
}

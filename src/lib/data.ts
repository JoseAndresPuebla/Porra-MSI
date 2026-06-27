import { collection, doc, getDocs, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Match } from "../types";

export async function cleanMatches() {
  // Let's clean up old matches and predictions that don't match the new schema
  const matchesSnap = await getDocs(collection(db, "matches"));
  
  // Purge old matches
  let countMatches = 0;
  for (const d of matchesSnap.docs) {
    const dbMatch = d.data();
    if (dbMatch.phase !== 'play-in' && dbMatch.phase !== 'main-stage') {
      await deleteDoc(d.ref);
      countMatches++;
    }
  }

  // Also purge all old predictions, just to be sure we are clean if needed
  // Only purge predictions that reference deleted matches
  const predictionsSnap = await getDocs(collection(db, "predictions"));
  let countPreds = 0;
  for (const d of predictionsSnap.docs) {
    const pInfo = d.data();
    // if the match it points to is no longer valid
    if (!matchesSnap.docs.find(m => m.id === pInfo.matchId && (m.data().phase === 'play-in' || m.data().phase === 'main-stage'))) {
      await deleteDoc(d.ref);
      countPreds++;
    }
  }

  return { deletedMatches: countMatches, deletedPredictions: countPreds };
}

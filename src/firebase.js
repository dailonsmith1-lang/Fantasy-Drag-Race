import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA4sf29Ku0cYKdU9GUkd1mKl0u_lvffWBY",
  authDomain: "fantasy-drag-race-e353d.firebaseapp.com",
  projectId: "fantasy-drag-race-e353d",
  storageBucket: "fantasy-drag-race-e353d.firebasestorage.app",
  messagingSenderId: "349743237200",
  appId: "1:349743237200:web:1b5505b23cf70a903d2955"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function persistRoom(code, data) {
  try {
    await setDoc(doc(db, "rooms", code), { data: JSON.stringify(data) });
  } catch(e) { console.error("persist error:", e); }
}

export async function fetchRoom(code) {
  try {
    const snap = await getDoc(doc(db, "rooms", code));
    if (!snap.exists()) return null;
    return JSON.parse(snap.data().data);
  } catch(e) { console.error("fetch error:", e); return null; }
}

export function subscribeRoom(code, callback) {
  return onSnapshot(doc(db, "rooms", code), (snap) => {
    if (snap.exists()) {
      try { callback(JSON.parse(snap.data().data)); } catch {}
    }
  });
}

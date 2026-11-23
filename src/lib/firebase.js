// Firebase: anonieme login + punten in Firestore.
// Er worden NOOIT beelden verstuurd: enkel label, zekerheid en punten.
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(config)
const auth = getAuth(app)
const db = getFirestore(app)

/** Logt anoniem in en roept callback(uid) aan zodra de gebruiker gekend is. */
export function watchUser(callback) {
  signInAnonymously(auth).catch((err) => callback(null, err))
  return onAuthStateChanged(auth, (user) => user && callback(user.uid))
}

/** Volgt het puntentotaal van een gebruiker live. */
export function watchPoints(uid, callback) {
  return onSnapshot(doc(db, 'users', uid), (snap) => callback(snap.data()?.points ?? 0))
}

/** Slaat een bevestigde scan op en telt punten bij. */
export async function saveScan(uid, { label, confidence, points }) {
  await addDoc(collection(db, 'scans'), {
    uid,
    label,
    confidence,
    points,
    createdAt: serverTimestamp(),
  })
  await setDoc(
    doc(db, 'users', uid),
    { points: increment(points), scans: increment(1), updatedAt: serverTimestamp() },
    { merge: true },
  )
}

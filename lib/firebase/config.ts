import { initializeApp, getApps } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Validate required environment variables
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

// Check for missing environment variables
const missingVars: string[] = [];
if (!apiKey) missingVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
if (!authDomain) missingVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
if (!projectId) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
if (!storageBucket) missingVars.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
if (!messagingSenderId) missingVars.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
if (!appId) missingVars.push('NEXT_PUBLIC_FIREBASE_APP_ID');

if (missingVars.length > 0) {
  const errorMessage = 
    `Missing required Firebase environment variables: ${missingVars.join(', ')}\n\n` +
    `To fix this:\n` +
    `1. Update your .env or .env.local file in your project root\n` +
    `2. Add your Firebase configuration with NEXT_PUBLIC_ prefix (required for client-side access):\n` +
    `   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key\n` +
    `   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain\n` +
    `   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id\n` +
    `   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket\n` +
    `   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id\n` +
    `   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id\n` +
    `3. Restart your Next.js dev server\n\n` +
    `Note: Variables without NEXT_PUBLIC_ prefix won't be available in the browser.\n` +
    `You can find these values in your Firebase Console > Project Settings > General > Your apps`;
  
  // Only throw error on client side to prevent SSR crashes
  if (typeof window !== "undefined") {
    console.error(errorMessage);
  }
  throw new Error(errorMessage);
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

// Initialize Firebase only if not already initialized (prevents duplicate instances)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

// Enable persistence for offline support and caching (only on client side)
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn("Firestore persistence already enabled in another tab");
    } else if (err.code === "unimplemented") {
      // Browser doesn't support persistence
      console.warn("Firestore persistence not supported in this browser");
    }
  });
}

import {
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch,
  query,
  limit,
  FirestoreError,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Generic type for Firestore documents with an id
 */
export type FirestoreDocument<T> = T & { id: string };

/**
 * Reads all documents from a Firestore collection
 * @param collectionName - Name of the collection to read from
 * @param maxItems - Optional limit on number of items to fetch (default: no limit)
 * @returns Array of documents with their IDs
 */
export async function readCollection<T extends Record<string, any>>(
  collectionName: string,
  maxItems?: number
): Promise<FirestoreDocument<T>[]> {
  try {
    const ref = collection(db, collectionName);
    const q = maxItems ? query(ref, limit(maxItems)) : query(ref);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as T),
    }));
  } catch (err) {
    const firestoreError = err as FirestoreError;
    if (firestoreError.code === "permission-denied") {
      console.error(
        `Firestore permission denied for collection '${collectionName}'. Please update your Firestore security rules.`
      );
    }
    throw err;
  }
}

/**
 * Adds a single document to a Firestore collection
 * @param collectionName - Name of the collection to add to
 * @param item - The item data to add (without id)
 * @param docId - Optional document ID. If not provided, Firestore will generate one
 * @returns The document ID
 * @throws FirestoreError with code 'permission-denied' if user lacks write permissions
 */
export async function addToCollection<T extends Record<string, any>>(
  collectionName: string,
  item: T,
  docId?: string
): Promise<string> {
  const docRef = docId
    ? doc(db, collectionName, docId)
    : doc(collection(db, collectionName));
  
  await setDoc(docRef, item);
  return docRef.id;
}

/**
 * Adds multiple documents to a Firestore collection using a batch write
 * This is more efficient than individual writes (single network round trip)
 * @param collectionName - Name of the collection to add to
 * @param items - Object where keys are document IDs and values are the item data
 * @returns Promise that resolves when the batch is committed
 * @throws FirestoreError with code 'permission-denied' if user lacks write permissions
 */
export async function addToCollectionBatch<T extends Record<string, any>>(
  collectionName: string,
  items: Record<string, T>
): Promise<void> {
  const batch = writeBatch(db);

  Object.entries(items).forEach(([id, item]) => {
    const docRef = doc(db, collectionName, id);
    batch.set(docRef, item);
  });

  await batch.commit();
}

/**
 * Removes a single document from a Firestore collection
 * @param collectionName - Name of the collection to remove from
 * @param docId - The document ID to remove
 * @throws FirestoreError with code 'not-found' if the document does not exist
 */
export async function removeFromCollection(
  collectionName: string,
  docId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (err) {
    const firestoreError = err as FirestoreError;
    if (firestoreError.code === "not-found") {
      console.error(
        `Document with ID '${docId}' not found in collection '${collectionName}'.`
      );
    }
    throw err;
  }
}
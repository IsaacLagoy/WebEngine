import {
  collection,
  getDocs,
  getDocsFromCache,
  doc,
  getDoc,
  getDocFromCache,
  setDoc,
  writeBatch,
  query,
  limit,
  orderBy,
  startAfter,
  documentId,
  QueryConstraint,
  FirestoreError,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Generic type for Firestore documents with an id
 */
export type FirestoreDocument<T> = T & { id: string };

export type ReadCollectionOptions = {
  maxItems?: number;
  preferCache?: boolean;
};

export type ReadCollectionPageResult<T extends Record<string, any>> = {
  items: FirestoreDocument<T>[];
  nextCursor: string | null;
};

/**
 * Reads all documents from a Firestore collection
 * @param collectionName - Name of the collection to read from
 * @param maxItems - Optional limit on number of items to fetch (default: no limit)
 * @returns Array of documents with their IDs
 */
export async function readCollection<T extends Record<string, any>>(
  collectionName: string,
  options?: number | ReadCollectionOptions
): Promise<FirestoreDocument<T>[]> {
  try {
    const normalizedOptions: ReadCollectionOptions =
      typeof options === "number"
        ? { maxItems: options, preferCache: true }
        : { maxItems: options?.maxItems, preferCache: options?.preferCache ?? true };

    const ref = collection(db, collectionName);
    const constraints: QueryConstraint[] = [];
    if (normalizedOptions.maxItems) {
      constraints.push(limit(normalizedOptions.maxItems));
    }
    const q = query(ref, ...constraints);

    let snapshot;
    if (normalizedOptions.preferCache) {
      try {
        const cachedSnapshot = await getDocsFromCache(q);
        // Cold caches can return empty results without throwing.
        snapshot = cachedSnapshot.empty ? await getDocs(q) : cachedSnapshot;
      } catch {
        snapshot = await getDocs(q);
      }
    } else {
      snapshot = await getDocs(q);
    }

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

export async function readCollectionPage<T extends Record<string, any>>(
  collectionName: string,
  pageSize = 50,
  afterId?: string,
  preferCache = true
): Promise<ReadCollectionPageResult<T>> {
  const ref = collection(db, collectionName);
  const constraints: QueryConstraint[] = [orderBy(documentId()), limit(pageSize)];
  if (afterId) {
    constraints.push(startAfter(afterId));
  }

  const q = query(ref, ...constraints);
  let snapshot;
  if (preferCache) {
    try {
      const cachedSnapshot = await getDocsFromCache(q);
      // Cold caches can return empty results without throwing.
      snapshot = cachedSnapshot.empty ? await getDocs(q) : cachedSnapshot;
    } catch {
      snapshot = await getDocs(q);
    }
  } else {
    snapshot = await getDocs(q);
  }

  const items = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as T),
  }));
  const nextCursor = items.length === pageSize ? items[items.length - 1].id : null;

  return { items, nextCursor };
}

export async function readDocumentById<T extends Record<string, any>>(
  collectionName: string,
  id: string,
  preferCache = true
): Promise<FirestoreDocument<T> | null> {
  const ref = doc(db, collectionName, id);
  let snapshot;
  if (preferCache) {
    try {
      const cachedSnapshot = await getDocFromCache(ref);
      // Cold caches can return non-existent docs without throwing.
      snapshot = cachedSnapshot.exists() ? cachedSnapshot : await getDoc(ref);
    } catch {
      snapshot = await getDoc(ref);
    }
  } else {
    snapshot = await getDoc(ref);
  }

  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...(snapshot.data() as T),
  };
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
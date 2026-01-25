// Central export point for Firebase utilities
export { db } from "./config";
export { readCollection, addToCollection, addToCollectionBatch, removeFromCollection, type FirestoreDocument } from "./firestore-utils";
export type { MagicElement, MagicElementData } from "./types";

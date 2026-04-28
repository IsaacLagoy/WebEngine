// Central export point for Firebase utilities
export { db } from "./config";
export { readCollection, readCollectionPage, readDocumentById, addToCollection, addToCollectionBatch, removeFromCollection, type FirestoreDocument } from "./firestore-utils";
export type { MagicElement, MagicElementData, Spell, SpellData, Skill, SkillData, SkillSheet, SkillSheetData, ClassData, DndClass, RaceData, Race, PotionFormField, PotionData, Potion } from "./types";

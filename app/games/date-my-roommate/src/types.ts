export type Side = "left" | "right";

// ----------------------------------------------------------
// Clothing
// ----------------------------------------------------------

export interface Clothing {
  id: string;
  name: string;
}

export const CLOTHING_SLOTS = ["head", "top", "bottom", "shoes"] as const;
export type ClothingSlot = (typeof CLOTHING_SLOTS)[number];

export const CLOTHING_ITEMS: Clothing[] = [
  { id: "head_1", name: "🎩 Top Hat" },
  { id: "head_2", name: "🕶️ Shades" },
  { id: "top_1",  name: "👕 T-Shirt" },
  { id: "bottom_1", name: "👖 Pants" },
  { id: "shoes_1", name: "👟 Sneakers" },
];

// ----------------------------------------------------------
// Player
// ----------------------------------------------------------

export interface Player {
  clothing: Partial<Record<ClothingSlot, Clothing>>;
  money: number;
}

export const DEFAULT_PLAYER: Player = {
  clothing: {},
  money: 0,
};

// ----------------------------------------------------------
// Character
// ----------------------------------------------------------

export interface Character {
  id: string;
  name: string;
  imageSrc: string;
  disposition?: number;
  nameColor?: string;
}

export interface SceneCharacter {
  character: Character;
  side: Side;
  isIn: boolean;
  isSpeaking: boolean;
}

// ----------------------------------------------------------
// Dialogue
// ----------------------------------------------------------

export interface DialogueState {
  visible: boolean;
  speakerName: string;
  speakerColor: string;
  text: string;
}

// ----------------------------------------------------------
// Boba
// ----------------------------------------------------------

export interface Topping {
  name: string;
  price: number;
  imageSrc: string;
}

export interface DrinkColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export const TOPPING_ITEMS: Topping[] = [
  { name: "Tapioca",       price: 0.5,  imageSrc: "" },
  { name: "Lychee Jelly",  price: 0.5,  imageSrc: "" },
  { name: "Rainbow Jelly", price: 0.75, imageSrc: "" },
];

export interface Drink {
  name: string;
  price: number;
  color: DrinkColor;
}

export const DRINK_ITEMS: Drink[] = [
  { name: "Milk Tea",   price: 5.0, color: { r: 210, g: 170, b: 120, a: 200 } },
  { name: "Green Tea",  price: 5.0, color: { r: 100, g: 180, b: 100, a: 160 } },
  { name: "Black Tea",  price: 5.0, color: { r: 50,  g: 30,  b: 15,  a: 180 } },
  { name: "Oolong Tea", price: 5.0, color: { r: 190, g: 160, b: 60,  a: 160 } },
];

export interface Syrup {
  name: string;
  price: number;
  color: DrinkColor;
}

export const SYRUP_ITEMS: Syrup[] = [
  { name: "Mango",      price: 0.5, color: { r: 255, g: 165, b: 0,   a: 200 } },
  { name: "Strawberry", price: 0.5, color: { r: 220, g: 80,  b: 100, a: 200 } },
  { name: "Raspberry",  price: 0.5, color: { r: 180, g: 40,  b: 80,  a: 200 } },
];

/** A topping plus how many scoops were added to this cup. */
export interface ToppingEntry {
  topping: Topping;
  quantity: number;
}

export class Boba {
  base: Drink;
  toppings: ToppingEntry[];
  syrup?: Syrup;

  constructor(base: Drink, toppings: ToppingEntry[], syrup?: Syrup) {
    this.base = base;
    this.syrup = syrup;
    this.toppings = toppings;
  }

  get price(): number {
    const toppingTotal = this.toppings.reduce(
      (acc, e) => acc + e.topping.price * e.quantity,
      0
    );
    return this.base.price + toppingTotal + (this.syrup?.price ?? 0);
  }
}

/**
 * An in-progress cup moving through the shop stations.
 * Pure in-memory — never persisted.
 */
export interface Cup {
  id: string;
  base?: Drink;
  syrup?: Syrup;
  toppings: ToppingEntry[];
  quality?: BobaQuality;
}

export interface BobaQuality {
  base: number;
  toppings: number;
  syrup: number;
  mix: number;
  lid: number;
}

// ----------------------------------------------------------
// Scene
// ----------------------------------------------------------

export interface GameData {
  characters: Record<string, Character>;
  player: Player;
  currentScene: string;
}

export const DEFAULT_GAME_DATA: GameData = {
  characters: {},
  player: DEFAULT_PLAYER,
  currentScene: "apartment",
};

export interface SceneState {
  characters: Record<string, SceneCharacter>;
  dialogue: DialogueState;
  lastSpeakerId: string | null;
}
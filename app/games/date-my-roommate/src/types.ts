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

// ID prefix convention: "head_", "top_", "bottom_", "shoes_"
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
  disposition?: number; // TODO: default to 50
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
  { name: "Tapioca", price: 0.5, imageSrc: "" },
  { name: "Lychee Jelly", price: 0.5, imageSrc: "" },
  { name: "Rainbow Jelly", price: 0.75, imageSrc: "" }
];

export interface Drink {
  name: string;
  price: number;
  color: DrinkColor;
}

export const DRINK_ITEMS: Drink[] = [
  { name: "Milk Tea", price: 5.0, color: { r: 255, g: 255, b: 255, a: 255 } },
  { name: "Green Tea", price: 5.0, color: { r: 0, g: 255, b: 0, a: 150 } },
  { name: "Black Tea", price: 5.0, color: { r: 0, g: 0, b: 0, a: 150 } },
  { name: "Oolong Tea", price: 5.0, color: { r: 255, g: 255, b: 0, a: 150 } },
];

export interface Syrup {
  name: string;
  price: number;
  color: DrinkColor;
}

export const SYRUP_ITEMS: Syrup[] = [
  { name: "Mango", price: 0.5, color: { r: 255, g: 165, b: 0, a: 255 } },
  { name: "Strawberry", price: 0.5, color: { r: 255, g: 215, b: 0, a: 255 } },
  { name: "Raspberry", price: 0.5, color: { r: 255, g: 100, b: 100, a: 255 } },
];

export class Boba {
  base: Drink;
  toppings: Topping[];
  syrup?: Syrup;

  constructor(base: Drink, toppings: Topping[], syrup?: Syrup) {
    this.base = base;
    this.syrup = syrup;
    this.toppings = toppings;
  }

  get price(): number {
    return this.base.price + this.toppings.reduce((acc, topping) => acc + topping.price, 0);
  }
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


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

export interface Drink {
  name: string;
  price: number;
  imageSrc: string;
}

export class Boba {
  base: Drink;
  toppings: Topping[];

  constructor(base: Drink, toppings: Topping[]) {
    this.base = base;
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


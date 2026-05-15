import type { DialogueStep } from "./dialogue/engine";
import { DialogueEngine } from "./dialogue/engine";
import type { BobaSession } from "./boba/session";
import type {
  Boba,
  Character,
  Clothing,
  ClothingSlot,
  GameData,
  Gift,
  Player,
  PlayerInventory,
} from "../types";
import { createInitialGameData, type ShopListingRow } from "../items/catalog";
import { buildCheckoutInteraction } from "./dialogue/interactions/checkout";
import { buildOrderInteraction } from "./dialogue/interactions/order";
import type { createDialoguePlayback } from "./dialogue/playback";

type DialoguePlayback = ReturnType<typeof createDialoguePlayback>;

type GamePersistence = {
  save: () => void;
  reset: () => void;
};

export class DateMyRoommateGame {
  readonly engine = new DialogueEngine();
  private data: GameData;
  private playback: DialoguePlayback | null = null;
  private bobaSession: BobaSession | null = null;
  private persistence: GamePersistence | null = null;
  private readonly onDataChange?: (data: GameData) => void;

  constructor(initialData: GameData = createInitialGameData(), onDataChange?: (data: GameData) => void) {
    this.data = initialData;
    this.onDataChange = onDataChange;
  }

  attachPlayback(playback: DialoguePlayback): void {
    this.playback = playback;
  }

  attachBoba(session: BobaSession): void {
    this.bobaSession = session;
  }

  get boba(): BobaSession {
    if (!this.bobaSession) {
      throw new Error("DateMyRoommateGame: boba session not attached");
    }
    return this.bobaSession;
  }

  attachPersistence(persistence: GamePersistence): void {
    this.persistence = persistence;
  }

  private commit(next: GameData): void {
    this.data = next;
    this.onDataChange?.(next);
  }

  replaceData(data: GameData): void {
    this.commit(data);
  }

  get gameData(): GameData {
    return this.data;
  }

  get player(): Player {
    return this.data.player;
  }

  get characters(): Record<string, Character> {
    return this.data.characters;
  }

  getCharacter(id: string): Character | undefined {
    return this.data.characters[id];
  }

  setMoney(money: number): void {
    this.commit({
      ...this.data,
      player: { ...this.data.player, money },
    });
  }

  addMoney(delta: number): void {
    this.setMoney(this.data.player.money + delta);
  }

  setClothing(slot: ClothingSlot, clothing: Clothing | null): void {
    const nextClothing = { ...this.data.player.clothing };
    if (clothing) nextClothing[slot] = clothing;
    else delete nextClothing[slot];
    this.commit({
      ...this.data,
      player: { ...this.data.player, clothing: nextClothing },
    });
  }

  setInventory(inventory: PlayerInventory): void {
    this.commit({ ...this.data, inventory });
  }

  addOwnedClothing(item: Clothing): void {
    if (this.data.inventory.ownedClothes.some((c) => c.id === item.id)) return;
    this.commit({
      ...this.data,
      inventory: {
        ...this.data.inventory,
        ownedClothes: [...this.data.inventory.ownedClothes, item],
      },
    });
  }

  addOwnedGift(gift: Gift, amount = 1): void {
    if (amount < 1) return;
    const ownedGifts = { ...this.data.inventory.ownedGifts };
    ownedGifts[gift.id] = (ownedGifts[gift.id] ?? 0) + amount;
    this.commit({
      ...this.data,
      inventory: {
        ...this.data.inventory,
        ownedGifts,
      },
    });
  }

  /** One transaction: deduct price and add listing to inventory. Returns false if unaffordable or clothing already owned. */
  tryPurchaseStoreListing(row: ShopListingRow): boolean {
    if (this.data.player.money < row.price) return false;
    const nextMoney = this.data.player.money - row.price;
    if (row.type === "gift") {
      const ownedGifts = { ...this.data.inventory.ownedGifts };
      ownedGifts[row.id] = (ownedGifts[row.id] ?? 0) + 1;
      this.commit({
        ...this.data,
        player: { ...this.data.player, money: nextMoney },
        inventory: { ...this.data.inventory, ownedGifts },
      });
      return true;
    }
    if (this.data.inventory.ownedClothes.some((c) => c.id === row.id)) return false;
    this.commit({
      ...this.data,
      player: { ...this.data.player, money: nextMoney },
      inventory: {
        ...this.data.inventory,
        ownedClothes: [...this.data.inventory.ownedClothes, { id: row.id, name: row.name }],
      },
    });
    return true;
  }

  setCurrentScene(scene: string): void {
    this.commit({ ...this.data, currentScene: scene });
  }

  upsertCharacter(character: Character): void {
    this.commit({
      ...this.data,
      characters: { ...this.data.characters, [character.id]: character },
    });
  }

  resetProgress(): void {
    this.commit(createInitialGameData());
    this.persistence?.reset();
  }

  saveProgress(): void {
    this.persistence?.save();
  }

  private requirePlayback(): DialoguePlayback {
    if (!this.playback) {
      throw new Error("DateMyRoommateGame: dialogue playback not attached");
    }
    return this.playback;
  }

  enqueueSteps(steps: DialogueStep[]): void {
    this.requirePlayback().queueScript(steps);
  }

  queueScript(steps: DialogueStep[]): void {
    this.enqueueSteps(steps);
  }

  clearScript(): void {
    this.requirePlayback().clearScript();
  }

  resetScene(): void {
    this.requirePlayback().resetScene();
  }

  advance(): void {
    this.requirePlayback().advance();
  }

  startOrder(params: {
    customer: Character;
    boba: Boba;
    onAddOrder: () => void;
  }): void {
    const playback = this.requirePlayback();
    playback.resetScene();
    playback.clearScript();
    playback.queueScript(buildOrderInteraction(this, params));
    playback.advance();
  }

  startCheckout(params: {
    customer: Character;
    score: number;
    order: Boba;
    onComplete: () => void;
  }): void {
    const playback = this.requirePlayback();
    playback.resetScene();
    playback.clearScript();
    playback.queueScript(buildCheckoutInteraction(this, params));
    playback.advance();
  }
}

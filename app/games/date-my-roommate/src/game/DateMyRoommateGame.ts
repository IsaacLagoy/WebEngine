import type { DialogueStep } from "./dialogue/engine";
import { DialogueEngine } from "./dialogue/engine";
import type { BobaSession } from "./boba/session";
import {
  Character,
  type Boba,
  type Clothing,
  type ClothingSlot,
  type GameData,
  type Gift,
  type Player,
  type PlayerInventory,
} from "../types";
import {
  requireCharacterFromGame,
  resolveCharacterFromGame,
} from "../characters/resolveCharacter";
import {
  characterFromDefinition,
  getCharacterDefinitionById,
  mergePersistedCharacter,
} from "../characters/characterCatalog";
import {
  createInitialGameData,
  getShopCatalog,
  type ShopListingRow,
} from "../items/catalog";
import {
  checkoutScriptId,
  orderScriptId,
} from "./dialogue/characterScripts";
import {
  characterNameForEventScript,
  isEventScriptId,
} from "./eventScripts";
import type { DialogueContext } from "./dialogue/context";
import { DialogueResolver } from "./dialogue/resolver";
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
  private dialogueResolver: DialogueResolver | null = null;
  /** Ephemeral flags for in-scene dialogue branches (not persisted). */
  private dialogueFlags: Record<string, boolean> = {};
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
    const def = getCharacterDefinitionById(id);
    if (!def) return undefined;
    return mergePersistedCharacter(def, this.data.characters[id]);
  }

  /** Resolve by display name or id (case-insensitive name). */
  getCharacterByName(nameOrId: string): Character | undefined {
    return resolveCharacterFromGame(this, nameOrId) ?? undefined;
  }

  requireCharacterByName(nameOrId: string): Character {
    return requireCharacterFromGame(this, nameOrId);
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

  trySpendMoney(amount: number): boolean {
    if (amount < 0 || this.data.player.money < amount) return false;
    this.addMoney(-amount);
    return true;
  }

  addDisposition(nameOrId: string, delta: number): void {
    const current = this.requireCharacterByName(nameOrId);
    const next = (current.disposition ?? 0) + delta;
    this.upsertCharacter(
      new Character(
        current.id,
        current.name,
        current.imageSrc,
        next,
        current.nameColor,
        current.appearanceChance
      )
    );
  }

  setDisposition(nameOrId: string, value: number): void {
    const current = this.requireCharacterByName(nameOrId);
    this.upsertCharacter(
      new Character(
        current.id,
        current.name,
        current.imageSrc,
        value,
        current.nameColor,
        current.appearanceChance
      )
    );
  }

  addInventoryItem(itemId: string, quantity = 1): void {
    if (quantity < 1) return;
    const row = getShopCatalog().find((r) => r.id === itemId);
    if (!row) {
      console.warn(`Unknown catalog item: ${itemId}`);
      return;
    }
    if (row.type === "gift") {
      this.addOwnedGift({ id: row.id, name: row.name }, quantity);
      return;
    }
    if (quantity > 1) {
      console.warn(`Clothing item ${itemId} ignores quantity > 1`);
    }
    this.addOwnedClothing({ id: row.id, name: row.name });
  }

  removeInventoryItem(itemId: string, quantity = 1): boolean {
    if (quantity < 1) return false;
    const row = getShopCatalog().find((r) => r.id === itemId);
    if (!row) return false;

    if (row.type === "gift") {
      const ownedGifts = { ...this.data.inventory.ownedGifts };
      const current = ownedGifts[itemId] ?? 0;
      if (current < quantity) return false;
      const next = current - quantity;
      if (next <= 0) delete ownedGifts[itemId];
      else ownedGifts[itemId] = next;
      this.commit({
        ...this.data,
        inventory: { ...this.data.inventory, ownedGifts },
      });
      return true;
    }

    const idx = this.data.inventory.ownedClothes.findIndex((c) => c.id === itemId);
    if (idx === -1) return false;
    const ownedClothes = [...this.data.inventory.ownedClothes];
    ownedClothes.splice(idx, 1);
    this.commit({
      ...this.data,
      inventory: { ...this.data.inventory, ownedClothes },
    });
    return true;
  }

  /** Player gives a gift item to a character (removes one from inventory). */
  tryGiveGift(nameOrId: string, itemId: string): boolean {
    const row = getShopCatalog().find((r) => r.id === itemId);
    if (!row || row.type !== "gift") {
      console.warn(`Cannot give non-gift item: ${itemId}`);
      return false;
    }
    if (!this.removeInventoryItem(itemId, 1)) return false;
    this.requireCharacterByName(nameOrId);
    return true;
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

  scheduleEvent(eventId: string): void {
    this.commit({
      ...this.data,
      scheduledEvent: { eventId },
    });
  }

  clearScheduledEvent(): void {
    if (!this.data.scheduledEvent) return;
    this.commit({ ...this.data, scheduledEvent: null });
  }

  hasScheduledEvent(): boolean {
    return this.data.scheduledEvent != null;
  }

  getDialogueFlag(key: string): boolean {
    return this.dialogueFlags[key] === true;
  }

  setDialogueFlag(key: string, value: boolean): void {
    this.dialogueFlags[key] = value;
  }

  clearDialogueFlags(): void {
    this.dialogueFlags = {};
  }

  /**
   * Start an after-work event: clears the schedule, sets currentScene to the script id,
   * resets session flags, and runs dialogue.
   */
  beginEvent(
    eventScriptId: string,
    hooks: { onEventComplete?: () => void } = {}
  ): void {
    this.clearScheduledEvent();
    this.setCurrentScene(eventScriptId);
    this.clearDialogueFlags();

    const characterName = characterNameForEventScript(eventScriptId);
    if (!characterName) {
      throw new Error(`Unknown event script: ${eventScriptId}`);
    }

    const customer = this.requireCharacterByName(characterName);
    this.startDialogue(eventScriptId, {
      customer,
      hooks: { onEventComplete: hooks.onEventComplete },
    });
  }

  upsertCharacter(character: Character): void {
    const def = getCharacterDefinitionById(character.id);
    const toStore = def
      ? characterFromDefinition(def, {
          disposition: character.disposition,
          nameColor: character.nameColor,
        })
      : character;
    this.commit({
      ...this.data,
      characters: { ...this.data.characters, [toStore.id]: toStore },
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

  private getDialogueResolver(): DialogueResolver {
    if (!this.dialogueResolver) {
      this.dialogueResolver = new DialogueResolver(this);
    }
    return this.dialogueResolver;
  }

  queueDialogue(scriptId: string, ctx: DialogueContext): void {
    const steps = this.getDialogueResolver().resolve(scriptId, ctx);
    this.enqueueSteps(steps);
  }

  startDialogue(scriptId: string, ctx: DialogueContext): void {
    const playback = this.requirePlayback();
    playback.resetScene();
    playback.clearScript();
    this.queueDialogue(scriptId, ctx);
    playback.advance();
  }

  /** Resolve saved scene to an event script id when resuming mid-flow. */
  resolveEventScriptIdForResume(): string | null {
    const { currentScene, scheduledEvent } = this.data;
    if (isEventScriptId(currentScene)) return currentScene;
    if (scheduledEvent && isEventScriptId(scheduledEvent.eventId)) {
      return scheduledEvent.eventId;
    }
    if (currentScene === "event" && scheduledEvent) {
      return scheduledEvent.eventId;
    }
    return null;
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
    const ctx: DialogueContext = {
      customer: params.customer,
      boba: params.boba,
      hooks: { onAddOrder: params.onAddOrder },
    };
    this.startDialogue(orderScriptId(params.customer.id), ctx);
  }

  startCheckout(params: {
    customer: Character;
    score: number;
    order: Boba;
    onComplete: () => void;
  }): void {
    const ctx: DialogueContext = {
      customer: params.customer,
      score: params.score,
      hooks: { onComplete: params.onComplete },
    };
    this.startDialogue(checkoutScriptId(params.customer.id), ctx);
  }
}

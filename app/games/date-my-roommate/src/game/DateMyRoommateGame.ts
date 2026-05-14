import type { DialogueStep } from "./dialogue/engine";
import { DialogueEngine } from "./dialogue/engine";
import type { BobaSession } from "./boba/session";
import type { Boba, Character, Clothing, ClothingSlot, GameData, Player } from "../types";
import { DEFAULT_GAME_DATA } from "../types";
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

  constructor(initialData: GameData = DEFAULT_GAME_DATA, onDataChange?: (data: GameData) => void) {
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
    this.commit(DEFAULT_GAME_DATA);
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

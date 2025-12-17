export type MagicElement = {
  id: string;
  name: string;
  weaknessIds: string[];
};

export type MagicElementData = Omit<MagicElement, "id">;

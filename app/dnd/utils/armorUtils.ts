import type { ArmorMaterial } from "@/lib/firebase";
import armorProps from "@/app/dnd/json/armor_props.json";

export type ArmorPiece = keyof typeof armorProps;

export const ARMOR_PIECES = Object.keys(armorProps) as ArmorPiece[];

export const ARMOR_NUMERIC_PROPS = [
  "damage_reduction",
  "magic_reduction",
  "rogue_reduction",
  "magic_resistance",
  "full_price",
] as const;

export type ArmorNumericProp = (typeof ARMOR_NUMERIC_PROPS)[number];

export const ARMOR_PROP_LABELS: Record<ArmorNumericProp | "class", string> = {
  class: "Class",
  damage_reduction: "Damage Reduction",
  magic_reduction: "Magic Reduction",
  rogue_reduction: "Rogue Reduction",
  magic_resistance: "Magic Resistance",
  full_price: "Price",
};

export function getPieceFraction(piece: ArmorPiece): number {
  return armorProps[piece];
}

export function scaleArmorValue(value: number, fraction: number): number {
  return Math.round(value * fraction);
}

export type ScaledArmorStats = Pick<ArmorMaterial, ArmorNumericProp | "class">;

export function scaleArmorMaterial(
  material: ArmorMaterial,
  fraction: number
): ScaledArmorStats {
  return {
    class: material.class,
    damage_reduction: scaleArmorValue(material.damage_reduction, fraction),
    magic_reduction: scaleArmorValue(material.magic_reduction, fraction),
    rogue_reduction: scaleArmorValue(material.rogue_reduction, fraction),
    magic_resistance: scaleArmorValue(material.magic_resistance, fraction),
    full_price: scaleArmorValue(material.full_price, fraction),
  };
}

export function computeArmorPieceBasePrice(
  material: ArmorMaterial,
  piece: ArmorPiece
): number {
  return scaleArmorValue(material.full_price, getPieceFraction(piece));
}

/** Mitigation stats for one piece — matches the armor builder piece scaling. */
export interface PieceMitigationStats {
  damage_reduction: number;
  magic_reduction: number;
  rogue_reduction: number;
  magic_resistance: number;
}

export function createEmptyPieceMitigation(): PieceMitigationStats {
  return {
    damage_reduction: 0,
    magic_reduction: 0,
    rogue_reduction: 0,
    magic_resistance: 0,
  };
}

export function materialToPieceMitigation(
  material: ArmorMaterial,
  piece: ArmorPiece
): PieceMitigationStats {
  const scaled = scaleArmorMaterial(material, getPieceFraction(piece));
  return {
    damage_reduction: scaled.damage_reduction,
    magic_reduction: scaled.magic_reduction,
    rogue_reduction: scaled.rogue_reduction,
    magic_resistance: scaled.magic_resistance,
  };
}

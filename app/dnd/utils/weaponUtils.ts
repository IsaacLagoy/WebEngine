import type { WeaponMaterial } from "@/lib/firebase";
import weaponProps from "@/app/dnd/json/weapon_props.json";

export type WeaponHandedness = keyof typeof weaponProps;

export const WEAPON_HANDEDNESS_OPTIONS: { id: WeaponHandedness; label: string }[] = [
  { id: "one_handed", label: "One Handed" },
  { id: "two_handed", label: "Two Handed" },
];

export const WEAPON_NUMERIC_PROPS = ["thac0", "price"] as const;

export type WeaponNumericProp = (typeof WEAPON_NUMERIC_PROPS)[number];

export const WEAPON_PROP_LABELS: Record<WeaponNumericProp, string> = {
  thac0: "THAC0",
  price: "Price",
};

export function getHandednessFraction(handedness: WeaponHandedness): number {
  return weaponProps[handedness];
}

export function scaleWeaponValue(value: number, fraction: number): number {
  return Math.round(value * fraction);
}

export type ScaledWeaponStats = Pick<WeaponMaterial, WeaponNumericProp>;

export function scaleWeaponMaterial(
  material: WeaponMaterial,
  handedness: WeaponHandedness
): ScaledWeaponStats {
  const fraction = getHandednessFraction(handedness);
  return {
    thac0: material.thac0,
    price: scaleWeaponValue(material.price, fraction),
  };
}

export function computeWeaponPrice(
  material: WeaponMaterial,
  handedness: WeaponHandedness
): number {
  return scaleWeaponValue(material.price, getHandednessFraction(handedness));
}

export function formatHandednessLabel(handedness: WeaponHandedness): string {
  return WEAPON_HANDEDNESS_OPTIONS.find((o) => o.id === handedness)?.label ?? handedness;
}

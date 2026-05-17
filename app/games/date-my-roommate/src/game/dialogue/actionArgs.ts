export type DialogueActionArgs = Record<string, unknown> | undefined;

export function optionalString(
  args: DialogueActionArgs,
  key: string
): string | undefined {
  const v = args?.[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export function requireString(args: DialogueActionArgs, key: string): string {
  const v = optionalString(args, key);
  if (!v) throw new Error(`Dialogue action missing string arg: ${key}`);
  return v;
}

export function optionalNumber(
  args: DialogueActionArgs,
  key: string
): number | undefined {
  const v = args?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export function requireNumber(args: DialogueActionArgs, key: string): number {
  const v = optionalNumber(args, key);
  if (v === undefined) throw new Error(`Dialogue action missing number arg: ${key}`);
  return v;
}

import { getBobaCustomerDefinitions } from "../../characters/characterCatalog";

const SCRIPT_KEY_BY_CUSTOMER_ID = Object.fromEntries(
  getBobaCustomerDefinitions().map((d) => [d.id, d.scriptKey])
) as Record<string, string>;

export function characterScriptKey(customerId: string): string {
  return SCRIPT_KEY_BY_CUSTOMER_ID[customerId] ?? "generic";
}

export function orderScriptId(customerId: string): string {
  return `${characterScriptKey(customerId)}-order`;
}

export function checkoutScriptId(customerId: string): string {
  return `${characterScriptKey(customerId)}-checkout`;
}

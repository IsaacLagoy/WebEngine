import { NextRequest, NextResponse } from "next/server";
import { readCollection, addToCollectionBatch } from "@/lib/firebase";
import type { ShopItemData } from "@/lib/firebase";

export async function GET() {
  try {
    const items = await readCollection<ShopItemData>("shopItems");
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();
    if (!items || typeof items !== "object") {
      return NextResponse.json({ success: false, error: "Expected { items: Record<string, ShopItemData> }" }, { status: 400 });
    }
    await addToCollectionBatch("shopItems", items);
    return NextResponse.json({ success: true, message: "Shop items created successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
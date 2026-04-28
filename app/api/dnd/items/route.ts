import { NextRequest, NextResponse } from "next/server";
import { readCollection, addToCollectionBatch } from "@/lib/firebase";
import type { EnchantmentData, MaterialData } from "@/lib/firebase";

export async function GET() {
  try {
    const [enchantments, materials] = await Promise.all([
      readCollection<EnchantmentData>("enchantments"),
      readCollection<MaterialData>("materials"),
    ]);
    return NextResponse.json({ success: true, enchantments, materials });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { collection, items } = await request.json();
    if (!items || !collection) {
      return NextResponse.json({ success: false, error: "Expected { collection, items }" }, { status: 400 });
    }
    await addToCollectionBatch(collection, items);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
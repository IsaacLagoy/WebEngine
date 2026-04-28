import { NextRequest, NextResponse } from "next/server";
import { readCollection, addToCollectionBatch } from "@/lib/firebase";
import type { PotionData } from "@/lib/firebase";

export async function GET() {
  try {
    const potions = await readCollection<PotionData>("potions");
    return NextResponse.json({ success: true, data: potions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();
    if (!items || typeof items !== "object") {
      return NextResponse.json({ success: false, error: "Expected { items: Record<string, PotionData> }" }, { status: 400 });
    }
    await addToCollectionBatch("potions", items);
    return NextResponse.json({ success: true, message: "Potions created successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { readCollection, addToCollectionBatch } from "@/lib/firebase";
import type { SpellData } from "@/lib/firebase";

/**
 * GET /api/dnd/spells
 * Fetches all spells from Firestore
 */
export async function GET() {
  try {
    const spells = await readCollection<SpellData>("spells");
    return NextResponse.json({ success: true, data: spells });
  } catch (error: any) {
    console.error("Error fetching spells:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dnd/spells
 * Creates spells in Firestore
 * Body: { items: Record<string, SpellData> }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || typeof items !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected { items: Record<string, SpellData> }" },
        { status: 400 }
      );
    }

    await addToCollectionBatch("spells", items);
    return NextResponse.json({ success: true, message: "Spells created successfully" });
  } catch (error: any) {
    console.error("Error creating spells:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
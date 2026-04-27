import { NextRequest, NextResponse } from "next/server";
import { readCollection, addToCollectionBatch } from "@/lib/firebase";
import type { RaceData } from "@/lib/firebase";

/**
 * GET /api/dnd/races
 * Fetches all races from Firestore
 */
export async function GET() {
  try {
    const races = await readCollection<RaceData>("races");
    return NextResponse.json({ success: true, data: races });
  } catch (error: any) {
    console.error("Error fetching races:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dnd/races
 * Creates races in Firestore
 * Body: { items: Record<string, RaceData> }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || typeof items !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected { items: Record<string, RaceData> }" },
        { status: 400 }
      );
    }

    await addToCollectionBatch("races", items);
    return NextResponse.json({ success: true, message: "Races created successfully" });
  } catch (error: any) {
    console.error("Error creating races:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
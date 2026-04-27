import { NextRequest, NextResponse } from "next/server";
import { readCollection, addToCollectionBatch } from "@/lib/firebase";
import type { SkillSheetData } from "@/lib/firebase";

/**
 * GET /api/dnd/skill-sheets
 * Fetches all skill sheets from Firestore
 */
export async function GET() {
  try {
    const sheets = await readCollection<SkillSheetData>("skillSheets");
    return NextResponse.json({ success: true, data: sheets });
  } catch (error: any) {
    console.error("Error fetching skill sheets:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dnd/skill-sheets
 * Creates skill sheets in Firestore
 * Body: { items: Record<string, SkillSheetData> }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || typeof items !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected { items: Record<string, SkillSheetData> }" },
        { status: 400 }
      );
    }

    await addToCollectionBatch("skillSheets", items);
    return NextResponse.json({ success: true, message: "Skill sheets created successfully" });
  } catch (error: any) {
    console.error("Error creating skill sheets:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
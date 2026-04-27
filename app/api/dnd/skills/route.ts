import { NextRequest, NextResponse } from "next/server";
import { readCollection, addToCollectionBatch } from "@/lib/firebase";
import type { SkillData } from "@/lib/firebase";

/**
 * GET /api/dnd/skills
 * Fetches all skills from Firestore
 */
export async function GET() {
  try {
    const skills = await readCollection<SkillData>("skills");
    return NextResponse.json({ success: true, data: skills });
  } catch (error: any) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dnd/skills
 * Creates skills in Firestore
 * Body: { items: Record<string, SkillData> }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || typeof items !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected { items: Record<string, SkillData> }" },
        { status: 400 }
      );
    }

    await addToCollectionBatch("skills", items);
    return NextResponse.json({ success: true, message: "Skills created successfully" });
  } catch (error: any) {
    console.error("Error creating skills:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
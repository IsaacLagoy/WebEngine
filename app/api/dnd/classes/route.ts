import { NextRequest, NextResponse } from "next/server";
import { readCollection, addToCollectionBatch } from "@/lib/firebase";
import type { ClassData } from "@/lib/firebase";

/**
 * GET /api/dnd/classes
 * Fetches all classes from Firestore
 */
export async function GET() {
  try {
    const classes = await readCollection<ClassData>("classes");
    return NextResponse.json({ success: true, data: classes });
  } catch (error: any) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dnd/classes
 * Creates classes in Firestore
 * Body: { items: Record<string, ClassData> }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || typeof items !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected { items: Record<string, ClassData> }" },
        { status: 400 }
      );
    }

    await addToCollectionBatch("classes", items);
    return NextResponse.json({ success: true, message: "Classes created successfully" });
  } catch (error: any) {
    console.error("Error creating classes:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { readCollection, addToCollectionBatch } from "@/lib/firebase";
import type { MagicElementData } from "@/lib/firebase";

/**
 * GET /api/dnd/magic-elements
 * Fetches all magic elements from Firestore
 */
export async function GET() {
  try {
    const elements = await readCollection<MagicElementData>("magicElements");
    return NextResponse.json({ success: true, data: elements });
  } catch (error: any) {
    console.error("Error fetching magic elements:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dnd/magic-elements
 * Creates magic elements in Firestore
 * Body: { items: Record<string, MagicElementData> }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || typeof items !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected { items: Record<string, MagicElementData> }" },
        { status: 400 }
      );
    }

    // Server-side validation could go here
    // For example: validate element structure, check permissions, etc.

    await addToCollectionBatch("magicElements", items);
    return NextResponse.json({ success: true, message: "Elements created successfully" });
  } catch (error: any) {
    console.error("Error creating magic elements:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

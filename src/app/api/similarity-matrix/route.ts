import { NextResponse } from "next/server";
import { computeSimilarityMatrix } from "@/lib/recommendation/engine";

export async function GET() {
  const result = computeSimilarityMatrix();
  return NextResponse.json(result);
}

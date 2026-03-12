import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/data/users";
import {
  getContentBasedRecommendations,
  getFrequentlyBoughtTogether,
  getUserBasedRecommendations,
  getMatrixFactorizationRecommendations,
  getHybridRecommendations,
} from "@/lib/recommendation/engine";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "userId query parameter is required" },
      { status: 400 }
    );
  }

  const user = getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const contentBased = getContentBasedRecommendations(user, 6);
  const frequentlyBoughtTogether = getFrequentlyBoughtTogether(user, 4);
  const userBased = getUserBasedRecommendations(user, 4);
  const matrixFactorization = getMatrixFactorizationRecommendations(user, 4);
  const hybridRanked = getHybridRecommendations(user, 6);

  return NextResponse.json({
    userId: user.id,
    userName: user.name,
    contentBased,
    frequentlyBoughtTogether,
    userBased,
    matrixFactorization,
    hybridRanked,
  });
}

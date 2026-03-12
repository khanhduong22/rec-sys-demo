import { Product, products, getProductsByIds } from "@/lib/data/products";
import { User, users } from "@/lib/data/users";

export interface Recommendation {
  product: Product;
  score: number;
  reason: string;
  reasonType: "content-based" | "frequently-bought-together" | "user-based" | "matrix-factorization" | "hybrid";
  sourceProductId?: string;
  sourceProductName?: string;
}

// ============================================================
// TAG VOCABULARY & VECTOR ENCODING
// ============================================================

function buildTagVocabulary(allProducts: Product[]): string[] {
  const tagSet = new Set<string>();
  for (const product of allProducts) {
    for (const tag of product.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}

function encodeProduct(product: Product, vocabulary: string[]): number[] {
  return vocabulary.map((tag) => (product.tags.includes(tag) ? 1 : 0));
}

// ============================================================
// COSINE SIMILARITY
// ============================================================

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (const [i, val] of a.entries()) {
    sum += val * b[i];
  }
  return sum;
}

function magnitude(v: number[]): number {
  let sum = 0;
  for (const val of v) {
    sum += val * val;
  }
  return Math.sqrt(sum);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}

// ============================================================
// CONTENT-BASED FILTERING
// ============================================================

function findBestMatch(
  productVector: number[],
  purchasedProducts: Product[],
  productVectors: Map<string, number[]>
): { score: number; matchId: string; matchName: string } {
  let bestScore = 0;
  let matchId = "";
  let matchName = "";

  for (const purchased of purchasedProducts) {
    const purchasedVector = productVectors.get(purchased.id);
    if (!purchasedVector) continue;
    const similarity = cosineSimilarity(productVector, purchasedVector);
    if (similarity > bestScore) {
      bestScore = similarity;
      matchId = purchased.id;
      matchName = purchased.name;
    }
  }

  return { score: bestScore, matchId, matchName };
}

export function getContentBasedRecommendations(
  user: User,
  topN: number = 6
): Recommendation[] {
  const vocabulary = buildTagVocabulary(products);
  const purchasedProducts = getProductsByIds(user.purchaseHistory);
  const purchasedIds = new Set(user.purchaseHistory);

  // Encode all products
  const productVectors = new Map<string, number[]>();
  for (const product of products) {
    productVectors.set(product.id, encodeProduct(product, vocabulary));
  }

  // For each non-purchased product, find max similarity with any purchased product
  const candidates: Array<{
    product: Product;
    score: number;
    bestMatchId: string;
    bestMatchName: string;
  }> = [];

  for (const product of products) {
    if (purchasedIds.has(product.id)) continue;

    const productVector = productVectors.get(product.id);
    if (!productVector) continue;

    const best = findBestMatch(productVector, purchasedProducts, productVectors);

    if (best.score > 0) {
      candidates.push({
        product,
        score: best.score,
        bestMatchId: best.matchId,
        bestMatchName: best.matchName,
      });
    }
  }

  // Sort by score descending and take top-N
  candidates.sort((a, b) => b.score - a.score);

  return candidates.slice(0, topN).map((c) => ({
    product: c.product,
    score: Math.round(c.score * 100) / 100,
    reason: `Because you liked "${c.bestMatchName}"`,
    reasonType: "content-based",
    sourceProductId: c.bestMatchId,
    sourceProductName: c.bestMatchName,
  }));
}

// ============================================================
// FREQUENTLY BOUGHT TOGETHER
// ============================================================

export function getFrequentlyBoughtTogether(
  user: User,
  topN: number = 4
): Recommendation[] {
  const purchasedIds = new Set(user.purchaseHistory);

  // Count co-occurrences: for each product the user owns,
  // check what other users who also bought that product have bought
  const coOccurrenceMap = new Map<string, { count: number; sourceProducts: Set<string> }>();

  for (const purchasedId of user.purchaseHistory) {
    // Find other users who also purchased this item
    const otherBuyers = users.filter(
      (u) => u.id !== user.id && u.purchaseHistory.includes(purchasedId)
    );

    for (const otherUser of otherBuyers) {
      for (const otherProductId of otherUser.purchaseHistory) {
        // Skip products the user already owns or the source product itself
        if (purchasedIds.has(otherProductId) || otherProductId === purchasedId) continue;

        const existing = coOccurrenceMap.get(otherProductId);
        if (existing) {
          existing.count += 1;
          existing.sourceProducts.add(purchasedId);
        } else {
          coOccurrenceMap.set(otherProductId, {
            count: 1,
            sourceProducts: new Set([purchasedId]),
          });
        }
      }
    }
  }

  // Convert to sorted array
  const candidates = Array.from(coOccurrenceMap.entries())
    .map(([productId, data]) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return null;

      // Pick the source product with highest co-occurrence
      const sourceId = Array.from(data.sourceProducts)[0];
      const sourceProduct = products.find((p) => p.id === sourceId);

      return {
        product,
        score: data.count,
        sourceProductId: sourceId,
        sourceProductName: sourceProduct?.name || "an item",
      };
    })
    .filter(Boolean) as Array<{
    product: Product;
    score: number;
    sourceProductId: string;
    sourceProductName: string;
  }>;

  candidates.sort((a, b) => b.score - a.score);

  return candidates.slice(0, topN).map((c) => ({
    product: c.product,
    score: c.score,
    reason: `Often bought with "${c.sourceProductName}"`,
    reasonType: "frequently-bought-together",
    sourceProductId: c.sourceProductId,
    sourceProductName: c.sourceProductName,
  }));
}

// ============================================================
// USER-BASED COLLABORATIVE FILTERING
// ============================================================

function encodeUserPurchaseVector(user: User, allProducts: Product[]): number[] {
  const purchaseSet = new Set(user.purchaseHistory);
  return allProducts.map((p) => (purchaseSet.has(p.id) ? 1 : 0));
}

export function getUserBasedRecommendations(
  targetUser: User,
  topN: number = 4
): Recommendation[] {
  const targetVector = encodeUserPurchaseVector(targetUser, products);
  const targetPurchaseSet = new Set(targetUser.purchaseHistory);

  // Compute similarity with all other users
  const userSimilarities: Array<{ user: User; similarity: number }> = [];
  for (const otherUser of users) {
    if (otherUser.id === targetUser.id) continue;
    const otherVector = encodeUserPurchaseVector(otherUser, products);
    const sim = cosineSimilarity(targetVector, otherVector);
    if (sim > 0) {
      userSimilarities.push({ user: otherUser, similarity: sim });
    }
  }

  userSimilarities.sort((a, b) => b.similarity - a.similarity);

  // Aggregate product scores from similar users
  const productScores = new Map<string, { score: number; fromUser: string }>(); 

  for (const { user: simUser, similarity } of userSimilarities) {
    for (const productId of simUser.purchaseHistory) {
      if (targetPurchaseSet.has(productId)) continue;
      const existing = productScores.get(productId);
      const weightedScore = similarity;
      if (!existing || weightedScore > existing.score) {
        productScores.set(productId, {
          score: weightedScore,
          fromUser: simUser.name,
        });
      }
    }
  }

  const candidates = Array.from(productScores.entries())
    .map(([productId, data]) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return null;
      return { product, score: data.score, fromUser: data.fromUser };
    })
    .filter(Boolean) as Array<{ product: Product; score: number; fromUser: string }>;

  candidates.sort((a, b) => b.score - a.score);

  return candidates.slice(0, topN).map((c) => ({
    product: c.product,
    score: Math.round(c.score * 100) / 100,
    reason: `Users like you also liked this`,
    reasonType: "user-based",
    sourceProductName: c.fromUser,
  }));
}

// ============================================================
// MATRIX FACTORIZATION (Alternating Least Squares)
// ============================================================

export function createInteractionMatrix(allUsers: User[], allProducts: Product[]): number[][] {
  return allUsers.map((user) => {
    const purchaseSet = new Set(user.purchaseHistory);
    return allProducts.map((p) => (purchaseSet.has(p.id) ? 1 : 0));
  });
}

function randomMatrix(rows: number, cols: number, seed: number = 42): number[][] {
  // Simple deterministic pseudo-random for reproducibility
  let s = seed;
  const next = (): number => {
    s = (s * 16807 + 0) % 2147483647;
    return (s / 2147483647) * 0.5;
  };
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => next())
  );
}

export function alsFactorize(
  R: number[][],
  k: number = 5,
  iterations: number = 50,
  lambda: number = 0.1
): { U: number[][]; V: number[][] } {
  const numUsers = R.length;
  const numProducts = R[0].length;

  // Initialize factor matrices
  const U = randomMatrix(numUsers, k, 42);
  const V = randomMatrix(numProducts, k, 123);

  for (let iter = 0; iter < iterations; iter++) {
    // Fix V, solve for U
    for (let i = 0; i < numUsers; i++) {
      for (let f = 0; f < k; f++) {
        let numerator = 0;
        let denominator = lambda;
        for (let j = 0; j < numProducts; j++) {
          if (R[i][j] === 0) continue;
          let prediction = 0;
          for (let ff = 0; ff < k; ff++) {
            if (ff !== f) prediction += U[i][ff] * V[j][ff];
          }
          numerator += V[j][f] * (R[i][j] - prediction);
          denominator += V[j][f] * V[j][f];
        }
        U[i][f] = denominator !== 0 ? numerator / denominator : 0;
      }
    }

    // Fix U, solve for V
    for (let j = 0; j < numProducts; j++) {
      for (let f = 0; f < k; f++) {
        let numerator = 0;
        let denominator = lambda;
        for (let i = 0; i < numUsers; i++) {
          if (R[i][j] === 0) continue;
          let prediction = 0;
          for (let ff = 0; ff < k; ff++) {
            if (ff !== f) prediction += U[i][ff] * V[j][ff];
          }
          numerator += U[i][f] * (R[i][j] - prediction);
          denominator += U[i][f] * U[i][f];
        }
        V[j][f] = denominator !== 0 ? numerator / denominator : 0;
      }
    }
  }

  return { U, V };
}

export function getMatrixFactorizationRecommendations(
  targetUser: User,
  topN: number = 4
): Recommendation[] {
  const R = createInteractionMatrix(users, products);
  const userIndex = users.findIndex((u) => u.id === targetUser.id);
  if (userIndex === -1) return [];

  const { U, V } = alsFactorize(R, 5, 50, 0.1);

  // Predict scores for all products
  const targetPurchaseSet = new Set(targetUser.purchaseHistory);
  const candidates: Array<{ product: Product; score: number }> = [];

  for (let j = 0; j < products.length; j++) {
    if (targetPurchaseSet.has(products[j].id)) continue;
    let predictedScore = 0;
    for (let f = 0; f < U[userIndex].length; f++) {
      predictedScore += U[userIndex][f] * V[j][f];
    }
    if (predictedScore > 0) {
      candidates.push({ product: products[j], score: predictedScore });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  return candidates.slice(0, topN).map((c) => ({
    product: c.product,
    score: Math.round(c.score * 100) / 100,
    reason: `Discovered by AI pattern analysis`,
    reasonType: "matrix-factorization",
  }));
}

// ============================================================
// HYBRID RANKER — Weighted Ensemble
// ============================================================

export interface HybridWeights {
  contentBased: number;
  userBased: number;
  frequentlyBought: number;
  matrixFactorization: number;
}

const DEFAULT_WEIGHTS: HybridWeights = {
  contentBased: 0.3,
  userBased: 0.25,
  frequentlyBought: 0.2,
  matrixFactorization: 0.25,
};

function normalizeScores(recs: Recommendation[]): Map<string, number> {
  const map = new Map<string, number>();
  if (recs.length === 0) return map;
  const maxScore = Math.max(...recs.map((r) => r.score), 0.01);
  for (const rec of recs) {
    map.set(rec.product.id, rec.score / maxScore);
  }
  return map;
}

const SOURCE_LABELS: Record<string, string> = {
  "content-based": "CB",
  "user-based": "UB",
  "frequently-bought-together": "FBT",
  "matrix-factorization": "MF",
};

export function getHybridRecommendations(
  user: User,
  topN: number = 6,
  weights: HybridWeights = DEFAULT_WEIGHTS,
  boosts: Map<string, number> = new Map(),
): Recommendation[] {
  const cb = getContentBasedRecommendations(user, 10);
  const ub = getUserBasedRecommendations(user, 10);
  const fbt = getFrequentlyBoughtTogether(user, 10);
  const mf = getMatrixFactorizationRecommendations(user, 10);

  const cbScores = normalizeScores(cb);
  const ubScores = normalizeScores(ub);
  const fbtScores = normalizeScores(fbt);
  const mfScores = normalizeScores(mf);

  // Collect all candidate product IDs
  const allProductIds = new Set([
    ...cbScores.keys(),
    ...ubScores.keys(),
    ...fbtScores.keys(),
    ...mfScores.keys(),
  ]);

  const scored: Array<{ productId: string; finalScore: number; sources: string[] }> = [];

  for (const pid of allProductIds) {
    const cbVal = cbScores.get(pid) ?? 0;
    const ubVal = ubScores.get(pid) ?? 0;
    const fbtVal = fbtScores.get(pid) ?? 0;
    const mfVal = mfScores.get(pid) ?? 0;

    let finalScore =
      cbVal * weights.contentBased +
      ubVal * weights.userBased +
      fbtVal * weights.frequentlyBought +
      mfVal * weights.matrixFactorization;

    // Apply user feedback boosts
    const boost = boosts.get(pid);
    if (boost !== undefined) {
      finalScore += boost;
    }

    const sources: string[] = [];
    if (cbVal > 0) sources.push(SOURCE_LABELS["content-based"]);
    if (ubVal > 0) sources.push(SOURCE_LABELS["user-based"]);
    if (fbtVal > 0) sources.push(SOURCE_LABELS["frequently-bought-together"]);
    if (mfVal > 0) sources.push(SOURCE_LABELS["matrix-factorization"]);

    scored.push({ productId: pid, finalScore, sources });
  }

  scored.sort((a, b) => b.finalScore - a.finalScore);

  return scored.slice(0, topN).map((s) => {
    const product = products.find((p) => p.id === s.productId)!;
    return {
      product,
      score: Math.round(s.finalScore * 100) / 100,
      reason: `Ensemble (${s.sources.join(" + ")})`,
      reasonType: "hybrid" as const,
    };
  });
}

// ============================================================
// SIMILARITY MATRIX
// ============================================================

export interface SimilarityMatrixEntry {
  productA: { id: string; name: string; category: string };
  productB: { id: string; name: string; category: string };
  similarity: number;
}

export function computeSimilarityMatrix(): {
  products: Array<{ id: string; name: string; category: string }>;
  matrix: number[][];
} {
  const vocabulary = buildTagVocabulary(products);
  const vectors = products.map((p) => encodeProduct(p, vocabulary));

  const matrix: number[][] = [];
  for (let i = 0; i < products.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < products.length; j++) {
      const sim = cosineSimilarity(vectors[i], vectors[j]);
      row.push(Math.round(sim * 100) / 100);
    }
    matrix.push(row);
  }

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
    })),
    matrix,
  };
}

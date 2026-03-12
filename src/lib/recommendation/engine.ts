import { Product, products, getProductsByIds } from "@/lib/data/products";
import { User, users } from "@/lib/data/users";

export interface Recommendation {
  product: Product;
  score: number;
  reason: string;
  reasonType: "content-based" | "frequently-bought-together";
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

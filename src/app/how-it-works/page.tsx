"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  ArrowLeft,
  ArrowRight,
  Binary,
  GitCompare,
  Users,
  ShoppingBag,
  Sparkles,
  Target,
  Lightbulb,
  UserCheck,
  Cpu,
  ThumbsUp,
  ThumbsDown,
  CircleAlert,
} from "lucide-react";
import { products } from "@/lib/data/products";
import { users } from "@/lib/data/users";
import {
  cosineSimilarity,
  createInteractionMatrix,
  alsFactorize,
} from "@/lib/recommendation/engine";

// ============================================================
// HELPERS
// ============================================================

function getSimilarityColor(value: number): string {
  if (value >= 0.6) return "text-emerald-400";
  if (value >= 0.3) return "text-amber-400";
  return "text-rose-400";
}

// ============================================================
// TAB 1: ITEM-BASED (CONTENT-BASED) FILTERING
// ============================================================

function ItemBasedTab() {
  const [selectedA, setSelectedA] = useState("e1");
  const [selectedB, setSelectedB] = useState("e7");
  const [selectedUser, setSelectedUser] = useState(0);

  const productA = products.find((p) => p.id === selectedA)!;
  const productB = products.find((p) => p.id === selectedB)!;

  const allTags = [...new Set([...productA.tags, ...productB.tags])].sort((a, b) =>
    a.localeCompare(b)
  );
  const vectorA: number[] = allTags.map((tag) => (productA.tags.includes(tag) ? 1 : 0));
  const vectorB: number[] = allTags.map((tag) => (productB.tags.includes(tag) ? 1 : 0));
  const similarity = cosineSimilarity(vectorA, vectorB);
  const dotProd = vectorA.reduce((sum: number, val: number, i: number) => sum + val * vectorB[i], 0);
  const magA = Math.sqrt(vectorA.reduce((sum: number, val: number) => sum + val * val, 0));
  const magB = Math.sqrt(vectorB.reduce((sum: number, val: number) => sum + val * val, 0));

  // Step 4: Generate recommendations for selected user
  const user = users[selectedUser];
  const userPurchased = new Set(user.purchaseHistory);
  const userProducts = products.filter((p) => userPurchased.has(p.id));

  // Build full-vocab vectors for recommendation
  const fullVocab = [...new Set(products.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b));
  const encode = (p: typeof products[0]) => fullVocab.map((tag) => (p.tags.includes(tag) ? 1 : 0));

  const candidates = products
    .filter((p) => !userPurchased.has(p.id))
    .map((candidate) => {
      const candidateVec = encode(candidate);
      let bestScore = 0;
      let bestMatch = "";
      for (const owned of userProducts) {
        const ownedVec = encode(owned);
        const sim = cosineSimilarity(candidateVec, ownedVec);
        if (sim > bestScore) {
          bestScore = sim;
          bestMatch = `${owned.image} ${owned.name.split(" ").slice(0, 2).join(" ")}`;
        }
      }
      return { product: candidate, score: bestScore, bestMatch };
    })
    .sort((a, b) => b.score - a.score);



  return (
    <div className="space-y-6">
      {/* Step 1: Tag Vocabulary */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-400" />
            Step 1: Tag Vocabulary & Binary Encoding
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Every product has tags (e.g., &quot;wireless&quot;, &quot;premium&quot;). The engine collects all unique
            tags into a vocabulary, then encodes each product as a binary vector: <strong className="text-foreground">1</strong> if
            the product has that tag, <strong className="text-foreground">0</strong> if not.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border/30">
            <table className="text-[10px]">
              <thead>
                <tr className="bg-muted/30">
                  <th className="p-1.5 text-left font-medium sticky left-0 bg-muted/30 z-10">Product</th>
                  {["audio", "bluetooth", "wireless", "premium", "casual", "athletic", "..."].map((tag) => (
                    <th key={tag} className="p-1.5 text-center">{tag}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((p) => (
                  <tr key={p.id} className="border-t border-border/10">
                    <td className="p-1.5 font-medium sticky left-0 bg-card/40 z-10 whitespace-nowrap">
                      {p.image} {p.name.split(" ").slice(0, 2).join(" ")}
                    </td>
                    {["audio", "bluetooth", "wireless", "premium", "casual", "athletic"].map((tag) => (
                      <td
                        key={tag}
                        className={`p-1.5 text-center font-mono font-bold ${
                          p.tags.includes(tag) ? "text-green-400 bg-green-500/10" : "text-muted-foreground/20"
                        }`}
                      >
                        {p.tags.includes(tag) ? "1" : "0"}
                      </td>
                    ))}
                    <td className="p-1.5 text-center text-muted-foreground">...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Cosine Similarity */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-violet-400" />
            Step 2: Cosine Similarity — Compare Any Two Products
          </h3>

          <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 rounded-xl p-5 border border-violet-500/20 text-center mb-5">
            <div className="text-xl font-mono font-bold text-foreground">
              cos(A, B) = <span className="text-green-400">A · B</span> / <span className="text-amber-400">‖A‖ × ‖B‖</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
              <div><span className="text-green-400 font-bold">A · B</span> = matching tags count</div>
              <div><span className="text-amber-400 font-bold">‖A‖</span> = √(Σ Aᵢ²)</div>
              <div><strong className="text-foreground">Result</strong>: 0 → 1 (0 = unrelated, 1 = identical)</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="item-a" className="text-xs text-muted-foreground mb-1 block">Product A</label>
              <select
                id="item-a"
                value={selectedA}
                onChange={(e) => setSelectedA(e.target.value)}
                className="w-full bg-muted/30 border border-border/50 rounded-lg py-2 px-3 text-sm text-foreground"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.image} {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="item-b" className="text-xs text-muted-foreground mb-1 block">Product B</label>
              <select
                id="item-b"
                value={selectedB}
                onChange={(e) => setSelectedB(e.target.value)}
                className="w-full bg-muted/30 border border-border/50 rounded-lg py-2 px-3 text-sm text-foreground"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.image} {p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Vector comparison table */}
          <div className="overflow-x-auto rounded-lg border border-border/30 mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30">
                  <th className="p-2 text-left font-medium">Tag</th>
                  <th className="p-2 text-center text-blue-400">{productA.image} A</th>
                  <th className="p-2 text-center text-pink-400">{productB.image} B</th>
                  <th className="p-2 text-center text-green-400">A × B</th>
                </tr>
              </thead>
              <tbody>
                {allTags.map((tag, i) => (
                  <tr key={tag} className={`border-t border-border/20 ${vectorA[i] === 1 && vectorB[i] === 1 ? "bg-green-500/10" : ""}`}>
                    <td className="p-2 font-mono">{tag}</td>
                    <td className={`p-2 text-center font-mono font-bold ${vectorA[i] === 1 ? "text-blue-400" : "text-muted-foreground/30"}`}>{vectorA[i]}</td>
                    <td className={`p-2 text-center font-mono font-bold ${vectorB[i] === 1 ? "text-pink-400" : "text-muted-foreground/30"}`}>{vectorB[i]}</td>
                    <td className={`p-2 text-center font-mono font-bold ${vectorA[i] * vectorB[i] === 1 ? "text-green-400" : "text-muted-foreground/30"}`}>{vectorA[i] * vectorB[i]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation result */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card/50 rounded-lg p-3 border border-border/20 text-center">
              <p className="text-xs text-muted-foreground mb-1">Dot Product</p>
              <p className="text-xl font-bold font-mono text-green-400">{dotProd}</p>
            </div>
            <div className="bg-card/50 rounded-lg p-3 border border-border/20 text-center">
              <p className="text-xs text-muted-foreground mb-1">‖A‖ × ‖B‖</p>
              <p className="text-lg font-bold font-mono text-amber-400">{(magA * magB).toFixed(2)}</p>
            </div>
            <div className="bg-card/50 rounded-lg p-3 border border-border/20 text-center">
              <p className="text-xs text-muted-foreground mb-1">Similarity</p>
              <p className={`text-2xl font-bold font-mono ${getSimilarityColor(similarity)}`}>
                {(similarity * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Recommendation Generation */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            Step 3: Generate Recommendations for a User
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            For each product the user <strong className="text-foreground">hasn&apos;t</strong> purchased,
            compute similarity against <strong className="text-foreground">every</strong> owned product,
            keep the max score, then rank.
          </p>

          <div className="flex flex-wrap gap-2 mb-5">
            {users.map((u, i) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  i === selectedUser
                    ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                    : "bg-muted/20 text-muted-foreground border border-border/30 hover:bg-muted/40"
                }`}
              >
                {u.avatar} {u.name}
              </button>
            ))}
          </div>

          <div className="bg-violet-500/10 rounded-lg p-3 border border-violet-500/20 mb-4">
            <p className="text-xs text-violet-300 font-semibold mb-1">{user.avatar} {user.name}&apos;s purchases:</p>
            <div className="flex flex-wrap gap-1.5">
              {userProducts.map((p) => (
                <Badge key={p.id} variant="outline" className="bg-violet-500/10 border-violet-500/20 text-violet-300 text-[10px]">
                  {p.image} {p.name.split(" ").slice(0, 2).join(" ")}
                </Badge>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border/30 mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30">
                  <th className="p-2 text-left">Candidate</th>
                  <th className="p-2 text-center">Best Match</th>
                  <th className="p-2 text-center">Score</th>
                  <th className="p-2 text-center">Result</th>
                </tr>
              </thead>
              <tbody>
                {candidates.slice(0, 8).map((c, idx) => (
                  <tr key={c.product.id} className={`border-t border-border/10 ${idx < 6 ? "bg-violet-500/5" : ""}`}>
                    <td className="p-2">{c.product.image} {c.product.name.split(" ").slice(0, 3).join(" ")}</td>
                    <td className="p-2 text-center text-muted-foreground">{c.bestMatch}</td>
                    <td className={`p-2 text-center font-mono font-bold ${getSimilarityColor(c.score)}`}>
                      {(c.score * 100).toFixed(1)}%
                    </td>
                    <td className="p-2 text-center">
                      {idx < 6 && (
                        <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-muted/20 rounded-lg p-3 border border-border/30 text-sm">
            <Lightbulb className="w-4 h-4 inline mr-1 text-violet-400" />
            <strong>Try clicking different users</strong> — each user&apos;s owned products change
            the similarity rankings. This is pure content analysis — no user behavior needed.
          </div>
        </CardContent>
      </Card>

      {/* Advantages & Disadvantages */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <CircleAlert className="w-4 h-4 text-violet-400" />
            Advantages & Disadvantages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10">
              <p className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5" /> Advantages
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>✅ <strong className="text-foreground">No cold-start</strong> — works instantly for new users (only needs product data)</li>
                <li>✅ <strong className="text-foreground">Transparent</strong> — easy to explain why a product was recommended</li>
                <li>✅ <strong className="text-foreground">No user data needed</strong> — only product tags/attributes required</li>
                <li>✅ <strong className="text-foreground">Scales well</strong> — similarity can be precomputed offline</li>
              </ul>
            </div>
            <div className="bg-rose-500/5 rounded-lg p-4 border border-rose-500/10">
              <p className="text-xs font-bold text-rose-400 mb-3 flex items-center gap-1.5">
                <ThumbsDown className="w-3.5 h-3.5" /> Disadvantages
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>❌ <strong className="text-foreground">Filter bubble</strong> — only recommends similar items, no serendipity</li>
                <li>❌ <strong className="text-foreground">Tag quality dependent</strong> — garbage tags → garbage recommendations</li>
                <li>❌ <strong className="text-foreground">Can&apos;t cross categories</strong> — tech buyer won&apos;t get fashion suggestions</li>
                <li>❌ <strong className="text-foreground">Ignores popularity</strong> — doesn&apos;t know if items are actually good</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// TAB 2: USER-BASED COLLABORATIVE FILTERING
// ============================================================

function UserBasedTab() {
  const [selectedUser, setSelectedUser] = useState(0);

  const targetUser = users[selectedUser];
  const targetPurchaseSet = new Set(targetUser.purchaseHistory);

  // Encode all users as purchase vectors
  const encodeUser = (user: typeof users[0]) =>
    products.map((p) => (user.purchaseHistory.includes(p.id) ? 1 : 0));

  const targetVector = encodeUser(targetUser);

  // Compute similarity with all other users
  const userSimilarities = users
    .filter((u) => u.id !== targetUser.id)
    .map((otherUser) => {
      const otherVec = encodeUser(otherUser);
      const sim = cosineSimilarity(targetVector, otherVec);
      return { user: otherUser, similarity: sim, vector: otherVec };
    })
    .sort((a, b) => b.similarity - a.similarity);

  // Aggregate product recommendations
  const productScores = new Map<string, { score: number; fromUser: string }>();
  for (const { user: simUser, similarity } of userSimilarities) {
    for (const productId of simUser.purchaseHistory) {
      if (targetPurchaseSet.has(productId)) continue;
      const existing = productScores.get(productId);
      if (!existing || similarity > existing.score) {
        productScores.set(productId, { score: similarity, fromUser: simUser.name });
      }
    }
  }

  const recommendations = Array.from(productScores.entries())
    .map(([productId, data]) => {
      const product = products.find((p) => p.id === productId);
      return product ? { product, score: data.score, fromUser: data.fromUser } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0)) as Array<{ product: typeof products[0]; score: number; fromUser: string }>;

  const topRecs = new Set(recommendations.slice(0, 4).map((r) => r.product.id));

  return (
    <div className="space-y-6">
      {/* Step 1: User Purchase Vectors */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Binary className="w-4 h-4 text-emerald-400" />
            Step 1: Encode Users as Purchase Vectors
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Each user → a binary vector across all {products.length} products.
            <strong className="text-foreground"> 1</strong> = purchased, <strong className="text-foreground">0</strong> = not purchased.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border/30">
            <table className="text-[10px]">
              <thead>
                <tr className="bg-muted/30">
                  <th className="p-1.5 text-left font-medium sticky left-0 bg-muted/30 z-10">User</th>
                  {products.map((p) => (
                    <th key={p.id} className="p-1.5 text-center" title={p.name}>{p.image}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr
                    key={user.id}
                    className={`border-t border-border/10 cursor-pointer transition-colors ${
                      i === selectedUser ? "bg-emerald-500/10" : "hover:bg-muted/20"
                    }`}
                    onClick={() => setSelectedUser(i)}
                  >
                    <td className={`p-1.5 font-medium sticky left-0 z-10 whitespace-nowrap ${
                      i === selectedUser ? "bg-emerald-500/10 text-emerald-400" : "bg-card/40"
                    }`}>
                      {user.avatar} {user.name.split(" ")[0]}
                    </td>
                    {products.map((p) => {
                      const has = user.purchaseHistory.includes(p.id);
                      return (
                        <td key={p.id} className={`p-1.5 text-center font-mono font-bold ${has ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground/20"}`}>
                          {has ? "1" : "0"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: User Similarity */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Step 2: Find Similar Users (Cosine Similarity on user vectors)
          </h3>

          <div className="flex flex-wrap gap-2 mb-5">
            {users.map((u, i) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  i === selectedUser
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-muted/20 text-muted-foreground border border-border/30 hover:bg-muted/40"
                }`}
              >
                {u.avatar} {u.name}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {userSimilarities.map(({ user: otherUser, similarity: sim }) => {
              const width = sim * 100;
              return (
                <div key={otherUser.id} className="flex items-center gap-3">
                  <span className="text-xs w-28 shrink-0">{otherUser.avatar} {otherUser.name}</span>
                  <div className="flex-1 h-5 bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500/40 rounded-full transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className={`text-xs font-mono font-bold w-14 text-right ${getSimilarityColor(sim)}`}>
                    {(sim * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Recommendations */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Step 3: Recommend products from similar users
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Products that similar users bought but <strong className="text-foreground">{targetUser.name}</strong> hasn&apos;t,
            weighted by user similarity score.
          </p>

          <div className="overflow-x-auto rounded-lg border border-border/30 mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30">
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-center">From User</th>
                  <th className="p-2 text-center">Similarity</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.slice(0, 8).map((rec) => (
                  <tr key={rec.product.id} className={`border-t border-border/10 ${topRecs.has(rec.product.id) ? "bg-emerald-500/5" : ""}`}>
                    <td className="p-2">{rec.product.image} {rec.product.name.split(" ").slice(0, 3).join(" ")}</td>
                    <td className="p-2 text-center text-muted-foreground">{rec.fromUser}</td>
                    <td className={`p-2 text-center font-mono font-bold ${getSimilarityColor(rec.score)}`}>
                      {(rec.score * 100).toFixed(1)}%
                    </td>
                    <td className="p-2 text-center">
                      {topRecs.has(rec.product.id) && (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-muted/20 rounded-lg p-3 border border-border/30 text-sm">
            <Lightbulb className="w-4 h-4 inline mr-1 text-emerald-400" />
            <strong>Key insight:</strong> This can recommend across categories.
            If Alex (tech) and Jordan (fashion) share a few purchases, Alex might get
            fashion recommendations — something item-based filtering can&apos;t do.
          </div>
        </CardContent>
      </Card>

      {/* Advantages & Disadvantages */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <CircleAlert className="w-4 h-4 text-emerald-400" />
            Advantages & Disadvantages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10">
              <p className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5" /> Advantages
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>✅ <strong className="text-foreground">Cross-category discovery</strong> — can recommend fashion to a tech buyer</li>
                <li>✅ <strong className="text-foreground">No content analysis</strong> — works without product tags or descriptions</li>
                <li>✅ <strong className="text-foreground">Serendipity</strong> — surfaces unexpected but relevant items</li>
                <li>✅ <strong className="text-foreground">Social proof</strong> — recommendations backed by real user behavior</li>
              </ul>
            </div>
            <div className="bg-rose-500/5 rounded-lg p-4 border border-rose-500/10">
              <p className="text-xs font-bold text-rose-400 mb-3 flex items-center gap-1.5">
                <ThumbsDown className="w-3.5 h-3.5" /> Disadvantages
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>❌ <strong className="text-foreground">Cold-start problem</strong> — new users with no purchases get nothing</li>
                <li>❌ <strong className="text-foreground">Sparsity</strong> — most users buy very few items → thin similarity signals</li>
                <li>❌ <strong className="text-foreground">Scalability</strong> — O(n²) user comparisons become expensive at scale</li>
                <li>❌ <strong className="text-foreground">Popularity bias</strong> — tends to recommend popular mainstream products</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// TAB 3: FREQUENTLY BOUGHT TOGETHER
// ============================================================

function FBTTab() {
  const [selectedUser, setSelectedUser] = useState(0);
  const [trackedProduct, setTrackedProduct] = useState(0);

  const user = users[selectedUser];
  const purchasedProducts = products.filter((p) => user.purchaseHistory.includes(p.id));
  const tracked = purchasedProducts[trackedProduct] ?? purchasedProducts[0];

  // Who else bought this product?
  const otherBuyers = users.filter(
    (u) => u.id !== user.id && u.purchaseHistory.includes(tracked.id)
  );

  // Score co-purchase items
  const coScores = new Map<string, number>();
  for (const buyer of otherBuyers) {
    for (const productId of buyer.purchaseHistory) {
      if (productId === tracked.id || user.purchaseHistory.includes(productId)) continue;
      coScores.set(productId, (coScores.get(productId) ?? 0) + 1);
    }
  }

  const coResults = Array.from(coScores.entries())
    .map(([pid, count]) => ({ product: products.find((p) => p.id === pid)!, count }))
    .filter((r) => r.product)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Step 1: Select user */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            Step 1: Select a user and one of their purchased products
          </h3>

          <div className="flex flex-wrap gap-2 mb-4">
            {users.map((u, i) => (
              <button
                key={u.id}
                onClick={() => { setSelectedUser(i); setTrackedProduct(0); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  i === selectedUser
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-muted/20 text-muted-foreground border border-border/30 hover:bg-muted/40"
                }`}
              >
                {u.avatar} {u.name}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mb-2">
            {user.avatar} <strong className="text-foreground">{user.name}</strong>&apos;s purchases — click one to trace:
          </p>
          <div className="flex flex-wrap gap-2">
            {purchasedProducts.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setTrackedProduct(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  i === trackedProduct
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-muted/20 text-muted-foreground border border-border/30 hover:bg-muted/40"
                }`}
              >
                {p.image} {p.name.split(" ").slice(0, 2).join(" ")}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Find co-purchasers */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Step 2: Who else bought {tracked.image} {tracked.name.split(" ").slice(0, 2).join(" ")}?
          </h3>

          {otherBuyers.length > 0 ? (
            <div className="space-y-3">
              {otherBuyers.map((buyer) => {
                const otherItems = buyer.purchaseHistory
                  .filter((id) => id !== tracked.id && !user.purchaseHistory.includes(id))
                  .map((id) => products.find((p) => p.id === id))
                  .filter(Boolean);

                return (
                  <div key={buyer.id} className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                    <p className="text-xs font-semibold mb-2">{buyer.avatar} {buyer.name} also bought:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {otherItems.map((item) =>
                        item ? (
                          <Badge key={item.id} variant="outline" className="bg-amber-500/10 border-amber-500/20 text-amber-300 text-[10px]">
                            {item.image} {item.name.split(" ").slice(0, 2).join(" ")}
                          </Badge>
                        ) : null
                      )}
                      {otherItems.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">(All overlapping — no new recommendations)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No other users bought this item.</p>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Aggregated scores */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            Step 3: Co-purchase Scores (aggregated across all owned products)
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            The engine repeats Step 2 for <strong className="text-foreground">every</strong> product 
            {" "}{user.name} owns, then counts how often each candidate appears. Higher count = stronger signal.
          </p>

          {coResults.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border/30 mb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-center">Co-purchase Count</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {coResults.slice(0, 6).map((r, idx) => (
                    <tr key={r.product.id} className={`border-t border-border/10 ${idx < 4 ? "bg-amber-500/5" : ""}`}>
                      <td className="p-2">{r.product.image} {r.product.name.split(" ").slice(0, 3).join(" ")}</td>
                      <td className="p-2 text-center font-mono font-bold text-amber-400">{r.count}</td>
                      <td className="p-2 text-center">
                        {idx < 4 && (
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                            <ShoppingBag className="w-3 h-3 mr-1" />
                            FBT
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic mb-4">
              No co-purchase patterns found for this combination. Try a different product above.
            </p>
          )}

          <div className="bg-muted/20 rounded-lg p-3 border border-border/30 text-sm">
            <Lightbulb className="w-4 h-4 inline mr-1 text-amber-400" />
            <strong>Simple but powerful:</strong> No math needed — just counting.
            This method excels at finding bundles (e.g., laptop + bag + mouse) that AI
            methods might miss because the tags don&apos;t overlap.
          </div>
        </CardContent>
      </Card>

      {/* Advantages & Disadvantages */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <CircleAlert className="w-4 h-4 text-amber-400" />
            Advantages & Disadvantages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10">
              <p className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5" /> Advantages
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>✅ <strong className="text-foreground">Intuitive</strong> — &quot;people who bought X also bought Y&quot; is immediately understandable</li>
                <li>✅ <strong className="text-foreground">No math needed</strong> — simple counting, no vectors or matrices</li>
                <li>✅ <strong className="text-foreground">Cross-category bundles</strong> — finds laptop + bag combos without tag overlap</li>
                <li>✅ <strong className="text-foreground">High conversion</strong> — proven to boost average order value in e-commerce</li>
              </ul>
            </div>
            <div className="bg-rose-500/5 rounded-lg p-4 border border-rose-500/10">
              <p className="text-xs font-bold text-rose-400 mb-3 flex items-center gap-1.5">
                <ThumbsDown className="w-3.5 h-3.5" /> Disadvantages
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>❌ <strong className="text-foreground">Needs purchase data</strong> — useless for new platforms with no history</li>
                <li>❌ <strong className="text-foreground">Popularity bias</strong> — bestsellers dominate co-purchase counts</li>
                <li>❌ <strong className="text-foreground">Not personalized</strong> — same results for everyone who bought item X</li>
                <li>❌ <strong className="text-foreground">Temporal decay</strong> — old purchase patterns may be outdated</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// TAB 4: MATRIX FACTORIZATION (ALS)
// ============================================================

function MatrixFactorizationTab() {
  const [selectedUser, setSelectedUser] = useState(0);

  const R = useMemo(() => createInteractionMatrix(users, products), []);
  const k = 5;
  const { U, V } = useMemo(() => alsFactorize(R, k, 50, 0.1), [R]);

  const userPurchaseSet = new Set(users[selectedUser].purchaseHistory);
  const predictions = products.map((p, j) => {
    let score = 0;
    for (let f = 0; f < k; f++) {
      score += U[selectedUser][f] * V[j][f];
    }
    return {
      product: p,
      score: Math.round(score * 100) / 100,
      owned: userPurchaseSet.has(p.id),
    };
  });

  const unownedPredictions = predictions
    .filter((p) => !p.owned)
    .sort((a, b) => b.score - a.score);

  const topRecs = new Set(unownedPredictions.slice(0, 4).map((p) => p.product.id));

  const heatColor = (val: number, isOwned: boolean): string => {
    if (isOwned) return "bg-cyan-500/30 text-cyan-300";
    if (val >= 0.5) return "bg-emerald-500/20 text-emerald-400";
    if (val >= 0.3) return "bg-amber-500/20 text-amber-400";
    if (val >= 0.1) return "bg-muted/20 text-muted-foreground";
    return "text-muted-foreground/30";
  };

  return (
    <div className="space-y-6">
      {/* Formula */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-5 border border-cyan-500/20 text-center mb-5">
            <div className="text-lg font-mono font-bold text-foreground flex items-center justify-center gap-3 flex-wrap">
              <span className="px-3 py-1 bg-muted/30 rounded">
                R<sub className="text-xs">{users.length}×{products.length}</sub>
              </span>
              <span className="text-muted-foreground">≈</span>
              <span className="px-3 py-1 bg-cyan-500/20 rounded text-cyan-400">
                U<sub className="text-xs">{users.length}×{k}</sub>
              </span>
              <span className="text-muted-foreground">×</span>
              <span className="px-3 py-1 bg-blue-500/20 rounded text-blue-400">
                V<sub className="text-xs">{products.length}×{k}</sub>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ALS decomposes the interaction matrix into User factors (U) × Product factors (V) with k={k} latent dimensions
            </p>
          </div>

          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Binary className="w-4 h-4 text-cyan-400" />
            Step 1: Interaction Matrix R (who bought what)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border/30">
            <table className="text-[10px]">
              <thead>
                <tr className="bg-muted/30">
                  <th className="p-1.5 text-left font-medium sticky left-0 bg-muted/30 z-10">User</th>
                  {products.map((p) => (
                    <th key={p.id} className="p-1.5 text-center whitespace-nowrap" title={p.name}>{p.image}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr
                    key={user.id}
                    className={`border-t border-border/10 cursor-pointer transition-colors ${
                      i === selectedUser ? "bg-cyan-500/10" : "hover:bg-muted/20"
                    }`}
                    onClick={() => setSelectedUser(i)}
                  >
                    <td className={`p-1.5 font-medium sticky left-0 z-10 whitespace-nowrap ${
                      i === selectedUser ? "bg-cyan-500/10 text-cyan-400" : "bg-card/40"
                    }`}>
                      {user.avatar} {user.name.split(" ")[0]}
                    </td>
                    {R[i].map((val, j) => (
                      <td
                        key={products[j].id}
                        className={`p-1.5 text-center font-mono font-bold ${
                          val === 1 ? "bg-cyan-500/20 text-cyan-400" : "text-muted-foreground/20"
                        }`}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Latent Factors with V Matrix Interpretation */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            Step 2: Latent Factor Profile — What do the factors mean?
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            ALS discovers hidden dimensions that <strong className="text-foreground">don&apos;t have names</strong> — but
            we can interpret them by looking at which products score highest on each factor.
          </p>

          <div className="flex flex-wrap gap-2 mb-5">
            {users.map((user, i) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  i === selectedUser
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-muted/20 text-muted-foreground border border-border/30 hover:bg-muted/40"
                }`}
              >
                {user.avatar} {user.name}
              </button>
            ))}
          </div>

          {/* U factors (user) + V factors (top products per factor) side by side */}
          <div className="space-y-3 mb-5">
            {U[selectedUser].map((val, f) => {
              const maxVal = Math.max(...U[selectedUser].map(Math.abs));
              const width = maxVal > 0 ? (Math.abs(val) / maxVal) * 100 : 0;
              // Find top-3 products for this factor from V
              const topProducts = products
                .map((p, j) => ({ product: p, weight: V[j][f] }))
                .sort((a, b) => b.weight - a.weight)
                .slice(0, 3);
              // Infer factor name from top products
              const topTags = topProducts.flatMap((tp) => tp.product.tags);
              const tagCounts = new Map<string, number>();
              for (const t of topTags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
              const dominantTag = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown";

              return (
                <div key={`f-${String(f)}`} className="bg-muted/10 rounded-lg p-3 border border-border/20">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-cyan-400 w-28 shrink-0 font-bold">
                      Factor {f + 1}: {val.toFixed(3)}
                    </span>
                    <div className="flex-1 h-3 bg-muted/20 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${val >= 0 ? "bg-cyan-500/50" : "bg-rose-500/50"}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground pl-1">
                    <span className="text-foreground/60">≈ &quot;{dominantTag}&quot;</span>
                    <span className="text-muted-foreground/40">|</span>
                    <span>Top products:</span>
                    {topProducts.map((tp) => (
                      <span key={tp.product.id} className="text-foreground/70">
                        {tp.product.image}{tp.weight.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-muted/20 rounded-lg p-3 border border-border/30 text-xs text-muted-foreground">
            <Lightbulb className="w-4 h-4 inline mr-1 text-cyan-400" />
            <strong className="text-foreground">How to read:</strong> Each factor captures a hidden preference.
            High user value + high product value on the same factor → strong predicted preference.
            E.g., if Factor 1 ≈ &quot;premium&quot; and Alex scores 0.886, he&apos;ll get high predictions for premium products.
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Predictions */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Step 3: Predictions for {users[selectedUser].name}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Score = U[{users[selectedUser].name.split(" ")[0]}] · V[product] = Σ (user_factor × product_factor) across all {k} dimensions.
          </p>

          <div className="overflow-x-auto rounded-lg border border-border/30 mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30">
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-center">Predicted</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {predictions
                  .toSorted((a, b) => b.score - a.score)
                  .slice(0, 12)
                  .map((p) => (
                    <tr
                      key={p.product.id}
                      className={`border-t border-border/10 ${p.owned ? "opacity-40" : ""} ${
                        !p.owned && topRecs.has(p.product.id) ? "bg-cyan-500/5" : ""
                      }`}
                    >
                      <td className="p-2">{p.product.image} {p.product.name.split(" ").slice(0, 3).join(" ")}</td>
                      <td className={`p-2 text-center font-mono font-bold ${heatColor(p.score, p.owned)}`}>
                        {p.score.toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        {p.owned && <span className="text-muted-foreground">Owned</span>}
                        {!p.owned && topRecs.has(p.product.id) && (
                          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px]">
                            <Cpu className="w-3 h-3 mr-1" />
                            Recommended
                          </Badge>
                        )}
                        {!p.owned && !topRecs.has(p.product.id) && (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MF Variants */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Binary className="w-4 h-4 text-cyan-400" />
            Deep Dive: 3 Variants of Matrix Factorization
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Our demo uses <strong className="text-cyan-400">Observed Only MF</strong> with regularization.
            Here&apos;s how all 3 variants compare:
          </p>

          <div className="space-y-3 mb-4">
            <div className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/20">
              <p className="text-xs font-bold text-cyan-400 mb-2">
                1. Observed Only MF ← <span className="text-foreground">(Our implementation)</span>
              </p>
              <div className="font-mono text-xs text-foreground/80 mb-2 bg-muted/20 rounded px-3 py-2 text-center">
                min Σ<sub>(i,j) ∈ obs</sub> (R<sub>ij</sub> - U<sub>i</sub>·V<sub>j</sub>)² + λ(‖U‖² + ‖V‖²)
              </div>
              <p className="text-[11px] text-muted-foreground">
                Only computes error for cells where the user actually interacted (purchased = 1).
                Empty cells are <strong className="text-foreground">ignored entirely</strong>.
                Regularization (λ = 0.1) prevents U and V from growing too large.
              </p>
            </div>

            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <p className="text-xs font-bold text-blue-400 mb-2">
                2. Weighted MF <span className="text-muted-foreground">(Netflix, YouTube use this)</span>
              </p>
              <div className="font-mono text-xs text-foreground/80 mb-2 bg-muted/20 rounded px-3 py-2 text-center">
                Σ<sub>obs</sub> (R<sub>ij</sub> - U<sub>i</sub>·V<sub>j</sub>)² + w₀ Σ<sub>unobs</sub> (0 - U<sub>i</sub>·V<sub>j</sub>)²
              </div>
              <p className="text-[11px] text-muted-foreground">
                Also penalizes unobserved cells, but with a <strong className="text-foreground">small weight w₀</strong>.
                Logic: &quot;not purchased&quot; ≠ &quot;disliked&quot;, but <em>probably</em> not interested → mild penalty.
              </p>
            </div>

            <div className="bg-muted/20 rounded-lg p-4 border border-border/30">
              <p className="text-xs font-bold text-muted-foreground mb-2">
                3. SVD <span className="text-rose-400">(Not recommended for recommendations)</span>
              </p>
              <div className="font-mono text-xs text-foreground/80 mb-2 bg-muted/20 rounded px-3 py-2 text-center">
                ‖R - UV<sup>T</sup>‖²<sub>F</sub> = Σ<sub>all (i,j)</sub> (R<sub>ij</sub> - U<sub>i</sub>·V<sub>j</sub>)²
              </div>
              <p className="text-[11px] text-muted-foreground">
                Minimizes error on <strong className="text-foreground">all cells equally</strong> — observed and unobserved.
                Since 90%+ of cells are 0, SVD forces UV<sup>T</sup> ≈ 0 everywhere → predictions collapse to near-zero.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advantages & Disadvantages */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <CircleAlert className="w-4 h-4 text-cyan-400" />
            Advantages & Disadvantages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10">
              <p className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5" /> Advantages
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>✅ <strong className="text-foreground">Hidden pattern discovery</strong> — finds connections invisible to rule-based methods</li>
                <li>✅ <strong className="text-foreground">Handles sparsity</strong> — works well even when most cells are empty</li>
                <li>✅ <strong className="text-foreground">Dimensionality reduction</strong> — compresses large matrices into compact factors</li>
                <li>✅ <strong className="text-foreground">Unified model</strong> — single framework handles users and items together</li>
              </ul>
            </div>
            <div className="bg-rose-500/5 rounded-lg p-4 border border-rose-500/10">
              <p className="text-xs font-bold text-rose-400 mb-3 flex items-center gap-1.5">
                <ThumbsDown className="w-3.5 h-3.5" /> Disadvantages
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>❌ <strong className="text-foreground">Black box</strong> — hard to explain why a specific product was recommended</li>
                <li>❌ <strong className="text-foreground">Computationally expensive</strong> — ALS requires many iterations over large matrices</li>
                <li>❌ <strong className="text-foreground">Cold-start</strong> — new users/products have no latent factors until retrained</li>
                <li>❌ <strong className="text-foreground">Hyperparameter tuning</strong> — k, λ, iterations all affect quality significantly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Demo
          </Link>
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-violet-400" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">How the Algorithms Work</h1>
              <p className="text-muted-foreground mt-1">
                4 recommendation algorithms explained step-by-step with live interactive demos
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Algorithm Comparison Table */}
        <section>
          <h2 className="text-xl font-bold mb-6">📊 Algorithm Comparison</h2>
          <Card className="bg-card/40 backdrop-blur-sm border-border/30">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="p-3 text-left">Aspect</th>
                      <th className="p-3 text-left text-violet-400">Item-Based</th>
                      <th className="p-3 text-left text-emerald-400">User-Based</th>
                      <th className="p-3 text-left text-amber-400">FBT</th>
                      <th className="p-3 text-left text-cyan-400">Matrix Factorization</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border/20">
                      <td className="p-3 font-medium">Data</td>
                      <td className="p-3">Product tags</td>
                      <td className="p-3">User purchase vectors</td>
                      <td className="p-3">Co-purchase counts</td>
                      <td className="p-3">User×Product matrix</td>
                    </tr>
                    <tr className="border-t border-border/20">
                      <td className="p-3 font-medium">Method</td>
                      <td className="p-3">Cosine on tag vectors</td>
                      <td className="p-3">Cosine on user vectors</td>
                      <td className="p-3">Co-occurrence</td>
                      <td className="p-3">ALS latent factors</td>
                    </tr>
                    <tr className="border-t border-border/20">
                      <td className="p-3 font-medium">Strength</td>
                      <td className="p-3">No user data needed</td>
                      <td className="p-3">Cross-category discovery</td>
                      <td className="p-3">Simple, intuitive</td>
                      <td className="p-3">Hidden pattern detection</td>
                    </tr>
                    <tr className="border-t border-border/20">
                      <td className="p-3 font-medium">Weakness</td>
                      <td className="p-3">Tag quality dependent</td>
                      <td className="p-3">Cold-start problem</td>
                      <td className="p-3">Needs purchase data</td>
                      <td className="p-3">Computationally expensive</td>
                    </tr>
                    <tr className="border-t border-border/20">
                      <td className="p-3 font-medium">Badge</td>
                      <td className="p-3">
                        <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Because you liked X
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          Users like you
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                          <ShoppingBag className="w-3 h-3 mr-1" />
                          Often bought with X
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs">
                          <Cpu className="w-3 h-3 mr-1" />
                          AI-discovered
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tabbed Algorithm Deep Dives */}
        <Tabs defaultValue="item-based" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto bg-muted/30 p-1 rounded-xl">
            <TabsTrigger
              value="item-based"
              className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400 data-[state=active]:shadow-sm rounded-lg"
            >
              <Sparkles className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Item-Based
            </TabsTrigger>
            <TabsTrigger
              value="user-based"
              className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm rounded-lg"
            >
              <UserCheck className="w-4 h-4 mr-1.5 hidden sm:inline" />
              User-Based
            </TabsTrigger>
            <TabsTrigger
              value="fbt"
              className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 data-[state=active]:shadow-sm rounded-lg"
            >
              <ShoppingBag className="w-4 h-4 mr-1.5 hidden sm:inline" />
              FBT
            </TabsTrigger>
            <TabsTrigger
              value="mf"
              className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 data-[state=active]:shadow-sm rounded-lg"
            >
              <Cpu className="w-4 h-4 mr-1.5 hidden sm:inline" />
              MF (ALS)
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="item-based">
              <ItemBasedTab />
            </TabsContent>
            <TabsContent value="user-based">
              <UserBasedTab />
            </TabsContent>
            <TabsContent value="fbt">
              <FBTTab />
            </TabsContent>
            <TabsContent value="mf">
              <MatrixFactorizationTab />
            </TabsContent>
          </div>
        </Tabs>

        {/* Evolution Timeline */}
        <section>
          <h2 className="text-xl font-bold mb-6">🕰️ Evolution of Recommendation Systems</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-muted-foreground/20 via-cyan-500/40 to-muted-foreground/20" />

            {[
              {
                era: "Gen 1",
                year: "1990s",
                title: "Keyword Matching / Content-Based",
                desc: "Simple text search and tag matching. Products recommended based on shared attributes.",
                example: "Early search engines, basic e-commerce filters",
                color: "text-muted-foreground",
                bg: "bg-muted/20 border-border/30",
                dot: "bg-muted-foreground/50",
              },
              {
                era: "Gen 2",
                year: "2000s",
                title: "Collaborative Filtering (User-Item)",
                desc: "\"People who bought X also bought Y.\" Pioneered by Amazon. Uses purchase co-occurrence and user similarity.",
                example: "Amazon, early Netflix",
                color: "text-emerald-400",
                bg: "bg-emerald-500/5 border-emerald-500/20",
                dot: "bg-emerald-500",
              },
              {
                era: "Gen 3",
                year: "2009+",
                title: "Matrix Factorization (SVD / ALS)",
                desc: "Decompose user×item matrix into latent factors. Netflix Prize ($1M) advanced this dramatically.",
                example: "Netflix Prize winner, Spotify Discover Weekly",
                color: "text-cyan-400",
                bg: "bg-cyan-500/10 border-cyan-500/30",
                dot: "bg-cyan-500",
                current: true,
              },
              {
                era: "Gen 4",
                year: "2016+",
                title: "Deep Learning (Neural CF, Wide & Deep)",
                desc: "Neural networks learn non-linear user-item interactions. Two-Tower models for retrieval + ranking.",
                example: "YouTube DNN, Google Play Wide & Deep",
                color: "text-blue-400",
                bg: "bg-blue-500/5 border-blue-500/20",
                dot: "bg-blue-500/50",
              },
              {
                era: "Gen 5",
                year: "2022+",
                title: "Graph, Transformer & Generative AI",
                desc: "Graph Neural Networks model user-item-context relationships. LLMs generate personalized recommendations via conversation.",
                example: "TikTok For You, ChatGPT Shopping, Pinterest",
                color: "text-violet-400",
                bg: "bg-violet-500/5 border-violet-500/20",
                dot: "bg-violet-500/50",
              },
            ].map((item, i) => (
              <div key={item.era} className="relative pl-16 pb-8 last:pb-0">
                {/* Dot */}
                <div className={`absolute left-4 top-2 w-5 h-5 rounded-full border-2 border-background ${item.dot} ${item.current ? "ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-background" : ""}`} />

                <Card className={`${item.bg} backdrop-blur-sm ${item.current ? "shadow-lg shadow-cyan-500/10" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${item.color}`}>
                        {item.era}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.year}</span>
                      {item.current && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px]">
                          ← We Are Here
                        </Badge>
                      )}
                    </div>
                    <h3 className={`text-sm font-bold ${item.color} mb-1`}>{item.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{item.desc}</p>
                    <p className="text-[10px] text-muted-foreground/60">
                      📌 {item.example}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Try the Demo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}

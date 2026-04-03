"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
  Database,
  Ruler,
  MapPin,
  Fingerprint,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { products } from "@/lib/data/products";
import { users } from "@/lib/data/users";
import {
  cosineSimilarity,
  createInteractionMatrix,
  alsFactorize,
} from "@/lib/recommendation/engine";
import { FingerprintDemo } from "@/components/fingerprint-demo";

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
// TAB 5: VECTOR DATABASE OPERATORS
// ============================================================

const OPERATOR_EXAMPLES = [
  {
    id: "cosine",
    name: "Cosine Similarity",
    icon: "↗️",
    color: "rose",
    symbol: "<=>",
    pgvector: "1 - (embedding <=> query)",
    formula: "cos(A, B) = (A · B) / (‖A‖ × ‖B‖)",
    range: "0 → 1 (1 = identical direction)",
    description:
      "Measures the angle between two vectors, ignoring magnitude. Two vectors pointing the same direction have similarity 1, regardless of how long they are.",
    whenToUse:
      "Best for text embeddings (e.g., OpenAI, Gemini) where you care about semantic meaning, not vector length. Most common choice for NLP tasks.",
    sql: `-- Find top 5 similar products by semantic meaning
SELECT name, 1 - (embedding <=> query_embedding) AS similarity
FROM products
ORDER BY embedding <=> query_embedding
LIMIT 5;`,
  },
  {
    id: "euclidean",
    name: "Euclidean Distance (L2)",
    icon: "📏",
    color: "blue",
    symbol: "<->",
    pgvector: "embedding <-> query",
    formula: "d(A, B) = √(Σ (Aᵢ - Bᵢ)²)",
    range: "0 → ∞ (0 = identical point)",
    description:
      "Straight-line distance between two points in space. Sensitive to magnitude — considers both direction AND scale of the vectors.",
    whenToUse:
      "Best for image embeddings, geographic data, or when magnitude carries meaning (e.g., user activity intensity).",
    sql: `-- Find nearest neighbors by L2 distance
SELECT name, embedding <-> query_embedding AS distance
FROM products
ORDER BY embedding <-> query_embedding
LIMIT 5;`,
  },
  {
    id: "dotproduct",
    name: "Inner Product (Dot Product)",
    icon: "⚡",
    color: "amber",
    symbol: "<#>",
    pgvector: "(embedding <#> query) * -1",
    formula: "A · B = Σ (Aᵢ × Bᵢ)",
    range: "-∞ → +∞ (higher = more similar)",
    description:
      "Combines both angle and magnitude. If vectors are normalized (length = 1), dot product equals cosine similarity. Magnitude matters: a popular item with long vector gets boosted.",
    whenToUse:
      "Best when you want popularity/magnitude to influence ranking. Used in Maximum Inner Product Search (MIPS) for retrieval+ranking in one step.",
    sql: `-- pgvector uses NEGATIVE inner product (for ORDER BY ASC)
SELECT name, (embedding <#> query_embedding) * -1 AS score
FROM products
ORDER BY embedding <#> query_embedding
LIMIT 5;`,
  },
  {
    id: "manhattan",
    name: "Manhattan Distance (L1)",
    icon: "🏙️",
    color: "emerald",
    symbol: "custom",
    pgvector: "SUM(ABS(a - b))",
    formula: "d(A, B) = Σ |Aᵢ - Bᵢ|",
    range: "0 → ∞ (0 = identical)",
    description:
      "Also called \"taxicab distance\" — the sum of absolute differences along each axis. Like walking city blocks instead of flying straight. More robust to outliers than L2.",
    whenToUse:
      "Best for sparse, high-dimensional data or when outlier resilience matters. Common in NLP bag-of-words and recommendation feature vectors.",
    sql: `-- Manhattan via pgvector custom function
-- (Not a built-in operator, use SQL expression)
SELECT name,
  (SELECT SUM(ABS(a.val - b.val))
   FROM unnest(embedding) WITH ORDINALITY a(val, idx)
   JOIN unnest(query_embedding) WITH ORDINALITY b(val, idx)
     USING (idx)) AS l1_distance
FROM products
ORDER BY l1_distance
LIMIT 5;`,
  },
];

const HNSW_LAYERS = [
  { level: 3, nodes: 2, label: "Express highway", desc: "Very few nodes, long-range connections" },
  { level: 2, nodes: 5, label: "Regional roads", desc: "More nodes, medium-range links" },
  { level: 1, nodes: 10, label: "Local streets", desc: "Many nodes, short-range connections" },
  { level: 0, nodes: 20, label: "All data points", desc: "Every vector, fine-grained neighbors" },
];

function VectorOpsTab() {
  const [selectedA, setSelectedA] = useState("e1");
  const [selectedB, setSelectedB] = useState("e7");
  const [activeOperator, setActiveOperator] = useState("cosine");

  const productA = products.find((p) => p.id === selectedA)!;
  const productB = products.find((p) => p.id === selectedB)!;

  // Build vectors from tags (same approach as Item-Based tab)
  const allTags = [...new Set(products.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b));
  const vectorA: number[] = allTags.map((tag) => (productA.tags.includes(tag) ? 1 : 0));
  const vectorB: number[] = allTags.map((tag) => (productB.tags.includes(tag) ? 1 : 0));

  // Calculate all metrics
  const dotProd = vectorA.reduce((sum, val, i) => sum + val * vectorB[i], 0);
  const magA = Math.sqrt(vectorA.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(vectorB.reduce((sum, val) => sum + val * val, 0));
  const cosine = magA && magB ? dotProd / (magA * magB) : 0;
  const euclidean = Math.sqrt(vectorA.reduce((sum, val, i) => sum + (val - vectorB[i]) ** 2, 0));
  const manhattan = vectorA.reduce((sum, val, i) => sum + Math.abs(val - vectorB[i]), 0);

  const metrics = [
    { id: "cosine", label: "Cosine Sim", value: cosine, formatted: (cosine * 100).toFixed(1) + "%", higher: true },
    { id: "euclidean", label: "L2 Distance", value: euclidean, formatted: euclidean.toFixed(3), higher: false },
    { id: "dotproduct", label: "Dot Product", value: dotProd, formatted: String(dotProd), higher: true },
    { id: "manhattan", label: "L1 Distance", value: manhattan, formatted: String(manhattan), higher: false },
  ];

  const activeOp = OPERATOR_EXAMPLES.find((op) => op.id === activeOperator)!;

  const colorMap: Record<string, { text: string; bg: string; border: string; bgLight: string }> = {
    rose: { text: "text-rose-400", bg: "bg-rose-500/20", border: "border-rose-500/20", bgLight: "bg-rose-500/5" },
    blue: { text: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/20", bgLight: "bg-blue-500/5" },
    amber: { text: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/20", bgLight: "bg-amber-500/5" },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/20", bgLight: "bg-emerald-500/5" },
  };

  return (
    <div className="space-y-6">
      {/* Intro: What is a Vector Database? */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-rose-400" />
            What is a Vector Database?
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            A vector database stores data as <strong className="text-foreground">high-dimensional numerical vectors</strong> (arrays of floats)
            instead of rows and columns. When you search, it finds the <strong className="text-foreground">nearest vectors</strong> using
            distance/similarity operators — this is how AI-powered &quot;find similar&quot; features work.
          </p>
          <div className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 rounded-xl p-5 border border-rose-500/20">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="text-2xl mb-1">📝</div>
                <p className="font-bold text-foreground mb-1">Text / Product</p>
                <p className="text-muted-foreground">&quot;Premium wireless headphones with noise cancellation&quot;</p>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-xl text-rose-400">→ AI Embedding →</div>
              </div>
              <div>
                <div className="text-2xl mb-1">🔢</div>
                <p className="font-bold text-foreground mb-1">Vector</p>
                <p className="font-mono text-muted-foreground text-[10px]">[0.12, -0.45, 0.78, 0.23, ...]</p>
                <p className="text-muted-foreground mt-1">768 or 1536 dimensions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Operator Comparison */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Ruler className="w-4 h-4 text-rose-400" />
            Interactive Comparison: All Operators at a Glance
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Select two products to see how each distance/similarity operator compares their tag vectors.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label htmlFor="vec-a" className="text-xs text-muted-foreground mb-1 block">Product A</label>
              <select
                id="vec-a"
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
              <label htmlFor="vec-b" className="text-xs text-muted-foreground mb-1 block">Product B</label>
              <select
                id="vec-b"
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

          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {metrics.map((m) => {
              const op = OPERATOR_EXAMPLES.find((o) => o.id === m.id)!;
              const colors = colorMap[op.color];
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveOperator(m.id)}
                  className={`rounded-lg p-3 border text-center transition-all ${
                    activeOperator === m.id
                      ? `${colors.bg} ${colors.border} ring-1 ring-offset-1 ring-offset-background ${colors.border}`
                      : "bg-card/50 border-border/20 hover:bg-muted/30"
                  }`}
                >
                  <p className="text-[10px] text-muted-foreground mb-1">{op.icon} {m.label}</p>
                  <p className={`text-lg font-bold font-mono ${colors.text}`}>{m.formatted}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">
                    {m.higher ? "↑ higher = more similar" : "↓ lower = more similar"}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Visual: vector components side-by-side (condensed) */}
          <div className="overflow-x-auto rounded-lg border border-border/30">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-muted/30">
                  <th className="p-1.5 text-left font-medium sticky left-0 bg-muted/30 z-10">Dimension</th>
                  <th className="p-1.5 text-center text-blue-400">{productA.image} A</th>
                  <th className="p-1.5 text-center text-pink-400">{productB.image} B</th>
                  <th className="p-1.5 text-center text-green-400">A×B</th>
                  <th className="p-1.5 text-center text-amber-400">(A-B)²</th>
                  <th className="p-1.5 text-center text-emerald-400">|A-B|</th>
                </tr>
              </thead>
              <tbody>
                {allTags.slice(0, 12).map((tag, i) => (
                  <tr key={tag} className={`border-t border-border/10 ${vectorA[i] === 1 && vectorB[i] === 1 ? "bg-green-500/10" : ""}`}>
                    <td className="p-1.5 font-mono sticky left-0 bg-card/40 z-10">{tag}</td>
                    <td className={`p-1.5 text-center font-mono font-bold ${vectorA[i] === 1 ? "text-blue-400" : "text-muted-foreground/30"}`}>{vectorA[i]}</td>
                    <td className={`p-1.5 text-center font-mono font-bold ${vectorB[i] === 1 ? "text-pink-400" : "text-muted-foreground/30"}`}>{vectorB[i]}</td>
                    <td className={`p-1.5 text-center font-mono font-bold ${vectorA[i] * vectorB[i] === 1 ? "text-green-400" : "text-muted-foreground/30"}`}>{vectorA[i] * vectorB[i]}</td>
                    <td className={`p-1.5 text-center font-mono font-bold ${(vectorA[i] - vectorB[i]) ** 2 > 0 ? "text-amber-400" : "text-muted-foreground/30"}`}>{(vectorA[i] - vectorB[i]) ** 2}</td>
                    <td className={`p-1.5 text-center font-mono font-bold ${Math.abs(vectorA[i] - vectorB[i]) > 0 ? "text-emerald-400" : "text-muted-foreground/30"}`}>{Math.abs(vectorA[i] - vectorB[i])}</td>
                  </tr>
                ))}
                {allTags.length > 12 && (
                  <tr className="border-t border-border/10">
                    <td colSpan={6} className="p-1.5 text-center text-muted-foreground italic">
                      ...and {allTags.length - 12} more dimensions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Operator Deep Dive */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-400" />
            Operator Deep Dive — Click to Explore
          </h3>

          {/* Operator selector pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {OPERATOR_EXAMPLES.map((op) => {
              const colors = colorMap[op.color];
              return (
                <button
                  key={op.id}
                  onClick={() => setActiveOperator(op.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeOperator === op.id
                      ? `${colors.bg} ${colors.text} border ${colors.border}`
                      : "bg-muted/20 text-muted-foreground border border-border/30 hover:bg-muted/40"
                  }`}
                >
                  {op.icon} {op.name}
                </button>
              );
            })}
          </div>

          {/* Active operator detail */}
          {(() => {
            const colors = colorMap[activeOp.color];
            return (
              <div className="space-y-4">
                {/* Formula */}
                <div className={`bg-gradient-to-r ${colors.bgLight} rounded-xl p-5 border ${colors.border} text-center`}>
                  <div className={`text-lg font-mono font-bold ${colors.text}`}>
                    {activeOp.formula}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    pgvector operator: <code className={`font-mono font-bold ${colors.text}`}>{activeOp.symbol}</code>{" "}
                    <span className="mx-2">|</span>{" "}
                    Range: <strong className="text-foreground">{activeOp.range}</strong>
                  </div>
                </div>

                {/* Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`${colors.bgLight} rounded-lg p-4 border ${colors.border}`}>
                    <p className={`text-xs font-bold ${colors.text} mb-2`}>📖 How it works</p>
                    <p className="text-xs text-muted-foreground">{activeOp.description}</p>
                  </div>
                  <div className={`${colors.bgLight} rounded-lg p-4 border ${colors.border}`}>
                    <p className={`text-xs font-bold ${colors.text} mb-2`}>✅ When to use</p>
                    <p className="text-xs text-muted-foreground">{activeOp.whenToUse}</p>
                  </div>
                </div>

                {/* SQL Example */}
                <div className="bg-muted/20 rounded-lg border border-border/30 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border/30">
                    <Database className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground">pgvector SQL</span>
                    <Badge variant="outline" className={`text-[9px] ml-auto ${colors.text} ${colors.border}`}>
                      {activeOp.symbol}
                    </Badge>
                  </div>
                  <pre className="p-4 text-[11px] font-mono text-foreground/80 overflow-x-auto leading-relaxed">
                    <code>{activeOp.sql}</code>
                  </pre>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* HNSW Index Explainer */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-rose-400" />
            HNSW Index — How Vector Search Stays Fast
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Without an index, vector search computes distance to <strong className="text-foreground">every single row</strong> (brute force, O(n)).{" "}
            <strong className="text-foreground">HNSW</strong> (Hierarchical Navigable Small World) builds a multi-layer graph
            to find approximate nearest neighbors in <strong className="text-foreground">O(log n)</strong> time.
          </p>

          {/* Visual layers */}
          <div className="space-y-2 mb-5">
            {HNSW_LAYERS.map((layer) => {
              const width = ((layer.nodes / 20) * 100);
              return (
                <div key={layer.level} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-rose-400 w-16 shrink-0 font-bold">L{layer.level}</span>
                  <div className="flex-1 relative">
                    <div className="h-8 bg-muted/10 rounded-lg border border-border/20 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500/30 to-pink-500/20 rounded-lg flex items-center px-3 transition-all"
                        style={{ width: `${width}%` }}
                      >
                        <div className="flex gap-1.5">
                          {Array.from({ length: Math.min(layer.nodes, 12) }).map((_, j) => (
                            <div
                              key={`n-${layer.level}-${String(j)}`}
                              className="w-2 h-2 rounded-full bg-rose-400/70"
                            />
                          ))}
                          {layer.nodes > 12 && <span className="text-[9px] text-rose-300">+{layer.nodes - 12}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-36 shrink-0">
                    <p className="text-[10px] font-medium text-foreground">{layer.label}</p>
                    <p className="text-[9px] text-muted-foreground">{layer.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* HNSW search steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-rose-500/5 rounded-lg p-3 border border-rose-500/10 text-center">
              <div className="text-xl mb-1">🔍</div>
              <p className="text-[10px] font-bold text-rose-400 mb-1">1. Enter at Top Layer</p>
              <p className="text-[10px] text-muted-foreground">Start at L3 with few nodes, jump to nearest neighbor quickly</p>
            </div>
            <div className="bg-rose-500/5 rounded-lg p-3 border border-rose-500/10 text-center">
              <div className="text-xl mb-1">⬇️</div>
              <p className="text-[10px] font-bold text-rose-400 mb-1">2. Descend Layers</p>
              <p className="text-[10px] text-muted-foreground">Move down to denser layers, refining the neighborhood at each level</p>
            </div>
            <div className="bg-rose-500/5 rounded-lg p-3 border border-rose-500/10 text-center">
              <div className="text-xl mb-1">🎯</div>
              <p className="text-[10px] font-bold text-rose-400 mb-1">3. Find at L0</p>
              <p className="text-[10px] text-muted-foreground">At the bottom layer, explore fine-grained connections → return top-K results</p>
            </div>
          </div>

          {/* HNSW SQL */}
          <div className="bg-muted/20 rounded-lg border border-border/30 overflow-hidden mb-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border/30">
              <Database className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">Create HNSW Index in pgvector</span>
            </div>
            <pre className="p-4 text-[11px] font-mono text-foreground/80 overflow-x-auto leading-relaxed">
              <code>{`-- Create an HNSW index on the embedding column
CREATE INDEX ON products
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- m = max connections per node (higher = better recall, more memory)
-- ef_construction = search width during build (higher = better index, slower build)

-- At query time, set ef_search for recall vs speed tradeoff:
SET hnsw.ef_search = 100;  -- default 40, increase for better recall`}</code>
            </pre>
          </div>

          {/* Performance comparison */}
          <div className="overflow-x-auto rounded-lg border border-border/30 mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30">
                  <th className="p-2 text-left">Method</th>
                  <th className="p-2 text-center">Speed</th>
                  <th className="p-2 text-center">Accuracy</th>
                  <th className="p-2 text-center">Memory</th>
                  <th className="p-2 text-center">Best For</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border/10">
                  <td className="p-2 font-medium">Brute Force (seq scan)</td>
                  <td className="p-2 text-center text-rose-400">🐌 O(n)</td>
                  <td className="p-2 text-center text-emerald-400">100%</td>
                  <td className="p-2 text-center text-emerald-400">Low</td>
                  <td className="p-2 text-muted-foreground">&lt; 10K vectors</td>
                </tr>
                <tr className="border-t border-border/10 bg-rose-500/5">
                  <td className="p-2 font-medium text-rose-400">HNSW</td>
                  <td className="p-2 text-center text-emerald-400">⚡ O(log n)</td>
                  <td className="p-2 text-center text-amber-400">~95-99%</td>
                  <td className="p-2 text-center text-amber-400">High</td>
                  <td className="p-2 text-muted-foreground">10K–10M vectors</td>
                </tr>
                <tr className="border-t border-border/10">
                  <td className="p-2 font-medium">IVFFlat</td>
                  <td className="p-2 text-center text-amber-400">🏃 O(n/k)</td>
                  <td className="p-2 text-center text-amber-400">~90-95%</td>
                  <td className="p-2 text-center text-emerald-400">Low</td>
                  <td className="p-2 text-muted-foreground">1M+ vectors, memory-constrained</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-muted/20 rounded-lg p-3 border border-border/30 text-sm">
            <Lightbulb className="w-4 h-4 inline mr-1 text-rose-400" />
            <strong>Key insight:</strong> HNSW trades a bit of accuracy for massive speed gains.
            At 1M vectors, brute force takes ~500ms but HNSW returns results in ~2ms — that&apos;s a <strong className="text-rose-400">250× speedup</strong>.
          </div>
        </CardContent>
      </Card>

      {/* Operator Comparison Summary */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <CircleAlert className="w-4 h-4 text-rose-400" />
            Which Operator Should You Use?
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border/30">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30">
                  <th className="p-2 text-left">Operator</th>
                  <th className="p-2 text-center">pgvector</th>
                  <th className="p-2 text-left">Best Scenario</th>
                  <th className="p-2 text-center">Normalized?</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border/10 bg-rose-500/5">
                  <td className="p-2 font-medium text-rose-400">Cosine</td>
                  <td className="p-2 text-center font-mono text-rose-400">&lt;=&gt;</td>
                  <td className="p-2 text-muted-foreground">Text embeddings, semantic search</td>
                  <td className="p-2 text-center">Not required</td>
                </tr>
                <tr className="border-t border-border/10 bg-blue-500/5">
                  <td className="p-2 font-medium text-blue-400">Euclidean (L2)</td>
                  <td className="p-2 text-center font-mono text-blue-400">&lt;-&gt;</td>
                  <td className="p-2 text-muted-foreground">Image embeddings, spatial data</td>
                  <td className="p-2 text-center">Recommended</td>
                </tr>
                <tr className="border-t border-border/10 bg-amber-500/5">
                  <td className="p-2 font-medium text-amber-400">Inner Product</td>
                  <td className="p-2 text-center font-mono text-amber-400">&lt;#&gt;</td>
                  <td className="p-2 text-muted-foreground">Retrieval + ranking (MIPS)</td>
                  <td className="p-2 text-center">No (magnitude = score)</td>
                </tr>
                <tr className="border-t border-border/10 bg-emerald-500/5">
                  <td className="p-2 font-medium text-emerald-400">Manhattan (L1)</td>
                  <td className="p-2 text-center font-mono text-emerald-400">custom</td>
                  <td className="p-2 text-muted-foreground">Sparse/high-dim, outlier-robust</td>
                  <td className="p-2 text-center">Optional</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 bg-muted/20 rounded-lg p-3 border border-border/30 text-sm">
            <Lightbulb className="w-4 h-4 inline mr-1 text-rose-400" />
            <strong>Rule of thumb:</strong> start with <strong className="text-rose-400">Cosine Similarity</strong> for text/NLP tasks.
            If your embeddings are already normalized (most modern models do this), Cosine ≡ Dot Product — so use{" "}
            <strong className="text-amber-400">Inner Product</strong> for a slight speed boost.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// TAB 6: ANONYMOUS IDENTITY (FINGERPRINTING)
// ============================================================

function AnonymousIdentityTab() {
  return (
    <div className="space-y-6">
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-violet-400" />
            Live Demo: ThumbmarkJS vs FingerprintJS
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Below is a real-time extraction of your browser&apos;s entropy (hardware specs, canvas rendering, user agent, etc.) processed by two leading open-source fingerprinting libraries.
          </p>
          
          <FingerprintDemo />

        </CardContent>
      </Card>

      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Binary className="w-4 h-4 text-indigo-400" />
            How this interacts with Recommendation Systems
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Instead of demanding an immediate login, modern platforms (like TikTok or eCommerce sites) build a shadow profile using device fingerprints. Here is how it flows:
          </p>
          
          <div className="space-y-4">
            <div className="bg-muted/20 border border-border/30 rounded-lg p-4 relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/50 rounded-l-lg group-hover:w-2 transition-all" />
              <h4 className="text-xs font-bold text-foreground mb-1 ml-3">1. First Touch (Anonymous Session)</h4>
              <p className="text-xs text-muted-foreground ml-3">
                A user visits the site. We generate a Fingerprint ID (e.g., <code className="bg-black/30 px-1 rounded">fa92b...</code>). A temporary user profile is created in the database tied to this ID rather than an email address.
              </p>
            </div>

            <div className="bg-muted/20 border border-border/30 rounded-lg p-4 relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500/50 rounded-l-lg group-hover:w-2 transition-all" />
              <h4 className="text-xs font-bold text-foreground mb-1 ml-3">2. Cold-Start Mitigation & Interaction Tracking</h4>
              <p className="text-xs text-muted-foreground ml-3">
                As the user clicks products or adds them to a cart, we associate these events with the Fingerprint ID.
                The <strong>Item-Based API</strong> immediately provides related recommendations, updating the feed dynamically without knowing their real identity.
              </p>
            </div>

            <div className="bg-muted/20 border border-border/30 rounded-lg p-4 relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/50 rounded-l-lg group-hover:w-2 transition-all" />
              <h4 className="text-xs font-bold text-foreground mb-1 ml-3">3. External Data Enrichment (Bought Data)</h4>
              <p className="text-xs text-muted-foreground ml-3">
                If we have no initial interaction data, we can purchase Audience Data from Data Brokers. Data Brokers often map device fingerprints to demographic segments (e.g., &apos;Tech Enthusiast&apos;, &apos;Male 20-30&apos;). When a fingerprint matches purchased data, we can instantly serve hyper-targeted recommendations on their very first page load!
              </p>
            </div>

            <div className="bg-muted/20 border border-border/30 rounded-lg p-4 relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/50 rounded-l-lg group-hover:w-2 transition-all" />
              <h4 className="text-xs font-bold text-foreground mb-1 ml-3">4. Profile Merging (The Login Event)</h4>
              <p className="text-xs text-muted-foreground ml-3">
                When the user finally creates an account or logs in, we <strong>merge</strong> the anonymous Fingerprint history with their authenticated Profile.
                They get to keep the highly personalized Discover feed they built during their completely anonymous browsing session.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-orange-400" />
            Library Comparison: ThumbmarkJS vs FingerprintJS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
            {/* ThumbmarkJS */}
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-4">
              <h4 className="text-sm font-bold text-indigo-400 mb-3 flex items-center gap-2">
                <Fingerprint className="w-4 h-4" />
                ThumbmarkJS
              </h4>
              <ul className="space-y-2">
                <li>• <strong>Execution:</strong> 100% Client-side.</li>
                <li>• <strong>Customization:</strong> High. You can choose exactly which entropy modules to run (audio, canvas, webgl).</li>
                <li>• <strong>Accuracy:</strong> Moderate. Great for stopping basic bot abuse, but susceptible to collisions on identical corporate devices.</li>
                <li>• <strong>Pricing:</strong> 100% Free & Open Source (MIT).</li>
              </ul>
            </div>

            {/* FingerprintJS Free */}
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
              <h4 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                <Database className="w-4 h-4" />
                FingerprintJS (Free)
              </h4>
              <ul className="space-y-2">
                <li>• <strong>Execution:</strong> 100% Client-side.</li>
                <li>• <strong>Accuracy:</strong> Around 40-60%. Hashes will change if the user upgrades their OS or Browser version.</li>
                <li>• <strong>Vulnerability:</strong> Easily blocked by AdBlockers, Brave shield, and Safari Intelligent Tracking Prevention (ITP).</li>
                <li>• <strong>Pricing:</strong> Free (BSL / Open Source).</li>
              </ul>
            </div>

            {/* FingerprintJS Pro */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <h4 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                FingerprintJS (Pro SaaS)
              </h4>
              <ul className="space-y-2">
                <li>• <strong>Execution:</strong> Server-side API. The script sends raw entropy to Fingerprint servers for analysis.</li>
                <li>• <strong>Accuracy:</strong> 99.5%. Uses machine learning, fuzzy matching, and probability to deduplicate users securely.</li>
                <li>• <strong>Unstoppable:</strong> Penetrates AdBlockers via Custom Subdomain CNAME routing (acts as a first-party request).</li>
                <li>• <strong>Stability:</strong> The hash stays the same even if the user updates iOS or clears cookies.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <CircleAlert className="w-4 h-4 text-violet-400" />
            Advantages & Disadvantages of Anonymous Tracking
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10">
              <p className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5" /> Advantages
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>✅ <strong className="text-foreground">Frictionless</strong> — Instant personalized experience on first visit.</li>
                <li>✅ <strong className="text-foreground">Stable</strong> — Persists across browser restarts, incognito windows, and OS updates.</li>
                <li>✅ <strong className="text-foreground">Seamless tracking</strong> — Understand the user journey prior to sign-up.</li>
              </ul>
            </div>
            <div className="bg-rose-500/5 rounded-lg p-4 border border-rose-500/10">
              <p className="text-xs font-bold text-rose-400 mb-3 flex items-center gap-1.5">
                <ThumbsDown className="w-3.5 h-3.5" /> Disadvantages
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>❌ <strong className="text-foreground">Privacy Concerns</strong> — Often blocked by AdBlockers and strict browser settings.</li>
                <li>❌ <strong className="text-foreground">Collisions</strong> — Users on identical corporate laptops/networks might generate the exact same fingerprint.</li>
                <li>❌ <strong className="text-foreground">Changeable</strong> — Updating browsers or swapping hardware might alter the hash completely.</li>
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

export function HowItWorksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const currentTab = searchParams.get("tab") || "item-based";
  
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

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
                4 recommendation algorithms + vector database deep dive — explained step-by-step with live interactive demos
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
                      <th className="p-3 text-left text-rose-400">Vector DB Ops</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border/20">
                      <td className="p-3 font-medium">Data</td>
                      <td className="p-3">Product tags</td>
                      <td className="p-3">User purchase vectors</td>
                      <td className="p-3">Co-purchase counts</td>
                      <td className="p-3">User×Product matrix</td>
                      <td className="p-3">Embedding vectors</td>
                    </tr>
                    <tr className="border-t border-border/20">
                      <td className="p-3 font-medium">Method</td>
                      <td className="p-3">Cosine on tag vectors</td>
                      <td className="p-3">Cosine on user vectors</td>
                      <td className="p-3">Co-occurrence</td>
                      <td className="p-3">ALS latent factors</td>
                      <td className="p-3">Distance / similarity operators</td>
                    </tr>
                    <tr className="border-t border-border/20">
                      <td className="p-3 font-medium">Strength</td>
                      <td className="p-3">No user data needed</td>
                      <td className="p-3">Cross-category discovery</td>
                      <td className="p-3">Simple, intuitive</td>
                      <td className="p-3">Hidden pattern detection</td>
                      <td className="p-3">Semantic search at scale</td>
                    </tr>
                    <tr className="border-t border-border/20">
                      <td className="p-3 font-medium">Weakness</td>
                      <td className="p-3">Tag quality dependent</td>
                      <td className="p-3">Cold-start problem</td>
                      <td className="p-3">Needs purchase data</td>
                      <td className="p-3">Computationally expensive</td>
                      <td className="p-3">Requires AI embedding model</td>
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
                      <td className="p-3">
                        <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-xs">
                          <Database className="w-3 h-3 mr-1" />
                          Similar vibe
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
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="flex flex-wrap w-full justify-start h-auto bg-muted/30 p-1.5 rounded-xl gap-1.5">
            <TabsTrigger
              value="item-based"
              className="flex-1 min-w-[120px] text-xs sm:text-sm py-2.5 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400 data-[state=active]:shadow-sm rounded-lg"
            >
              <Sparkles className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Item-Based
            </TabsTrigger>
            <TabsTrigger
              value="user-based"
              className="flex-1 min-w-[120px] text-xs sm:text-sm py-2.5 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm rounded-lg"
            >
              <UserCheck className="w-4 h-4 mr-1.5 hidden sm:inline" />
              User-Based
            </TabsTrigger>
            <TabsTrigger
              value="fbt"
              className="flex-1 min-w-[80px] text-xs sm:text-sm py-2.5 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 data-[state=active]:shadow-sm rounded-lg"
            >
              <ShoppingBag className="w-4 h-4 mr-1.5 hidden sm:inline" />
              FBT
            </TabsTrigger>
            <TabsTrigger
              value="mf"
              className="flex-1 min-w-[100px] text-xs sm:text-sm py-2.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 data-[state=active]:shadow-sm rounded-lg"
            >
              <Cpu className="w-4 h-4 mr-1.5 hidden sm:inline" />
              MF (ALS)
            </TabsTrigger>
            <TabsTrigger
              value="vector-ops"
              className="flex-1 min-w-[120px] text-xs sm:text-sm py-2.5 data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400 data-[state=active]:shadow-sm rounded-lg"
            >
              <Database className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Vector DB
            </TabsTrigger>
            <TabsTrigger
              value="anonymous"
              className="flex-1 min-w-[160px] text-xs sm:text-sm py-2.5 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm rounded-lg"
            >
              <Fingerprint className="w-4 h-4 mr-1.5 hidden sm:inline" />
              Anonymous Identity
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
            <TabsContent value="vector-ops">
              <VectorOpsTab />
            </TabsContent>
            <TabsContent value="anonymous">
              <AnonymousIdentityTab />
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
            ].map((item) => (
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

export default function HowItWorksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse font-medium text-muted-foreground">Loading...</div></div>}>
      <HowItWorksContent />
    </Suspense>
  );
}

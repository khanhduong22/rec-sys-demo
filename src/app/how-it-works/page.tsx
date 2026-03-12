"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  ChevronRight,
  UserCheck,
  Cpu,
} from "lucide-react";
import { products } from "@/lib/data/products";
import { users } from "@/lib/data/users";
import { cosineSimilarity, createInteractionMatrix, alsFactorize } from "@/lib/recommendation/engine";

// ============================================================
// HELPERS
// ============================================================

function getSimilarityColor(value: number): string {
  if (value >= 0.6) return "text-emerald-400";
  if (value >= 0.3) return "text-amber-400";
  return "text-rose-400";
}

// ============================================================
// INTERACTIVE VECTOR DEMO
// ============================================================

function VectorDemo() {
  const [selectedA, setSelectedA] = useState("e1"); // Earbuds
  const [selectedB, setSelectedB] = useState("e7"); // Headphones

  const productA = products.find((p) => p.id === selectedA)!;
  const productB = products.find((p) => p.id === selectedB)!;

  // Build vocabulary from just these two products for visibility
  const allTags = [...new Set([...productA.tags, ...productB.tags])].sort((a, b) =>
    a.localeCompare(b)
  );

  const vectorA: number[] = allTags.map((tag) => (productA.tags.includes(tag) ? 1 : 0));
  const vectorB: number[] = allTags.map((tag) => (productB.tags.includes(tag) ? 1 : 0));
  const similarity = cosineSimilarity(vectorA, vectorB);

  const dotProd = vectorA.reduce((sum: number, val: number, i: number) => sum + val * vectorB[i], 0);
  const magA = Math.sqrt(vectorA.reduce((sum: number, val: number) => sum + val * val, 0));
  const magB = Math.sqrt(vectorB.reduce((sum: number, val: number) => sum + val * val, 0));

  return (
    <Card className="bg-card/40 backdrop-blur-sm border-border/30 overflow-hidden">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Binary className="w-5 h-5 text-cyan-400" />
          Interactive Vector Comparison
        </h3>

        {/* Product Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="product-a-select" className="text-xs text-muted-foreground mb-2 block">Product A</label>
            <select
              id="product-a-select"
              value={selectedA}
              onChange={(e) => setSelectedA(e.target.value)}
              className="w-full bg-muted/30 border border-border/50 rounded-lg py-2 px-3 text-sm text-foreground"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.image} {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="product-b-select" className="text-xs text-muted-foreground mb-2 block">Product B</label>
            <select
              id="product-b-select"
              value={selectedB}
              onChange={(e) => setSelectedB(e.target.value)}
              className="w-full bg-muted/30 border border-border/50 rounded-lg py-2 px-3 text-sm text-foreground"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.image} {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vector Table */}
        <div className="overflow-x-auto rounded-lg border border-border/30 mb-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30">
                <th className="p-2 text-left font-medium text-muted-foreground">Tag</th>
                <th className="p-2 text-center font-medium text-blue-400">
                  {productA.image} A
                </th>
                <th className="p-2 text-center font-medium text-pink-400">
                  {productB.image} B
                </th>
                <th className="p-2 text-center font-medium text-green-400">A × B</th>
              </tr>
            </thead>
            <tbody>
              {allTags.map((tag, i) => (
                <tr
                  key={tag}
                  className={`border-t border-border/20 ${
                    vectorA[i] === 1 && vectorB[i] === 1
                      ? "bg-green-500/10"
                      : ""
                  }`}
                >
                  <td className="p-2 font-mono">{tag}</td>
                  <td
                    className={`p-2 text-center font-mono font-bold ${
                      vectorA[i] === 1 ? "text-blue-400" : "text-muted-foreground/30"
                    }`}
                  >
                    {vectorA[i]}
                  </td>
                  <td
                    className={`p-2 text-center font-mono font-bold ${
                      vectorB[i] === 1 ? "text-pink-400" : "text-muted-foreground/30"
                    }`}
                  >
                    {vectorB[i]}
                  </td>
                  <td
                    className={`p-2 text-center font-mono font-bold ${
                      vectorA[i] * vectorB[i] === 1
                        ? "text-green-400"
                        : "text-muted-foreground/30"
                    }`}
                  >
                    {vectorA[i] * vectorB[i]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Breakdown */}
        <div className="bg-muted/20 rounded-xl p-4 border border-border/30 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">📐 Calculation Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="bg-card/50 rounded-lg p-3 border border-border/20">
              <p className="text-xs text-muted-foreground mb-1">Dot Product (A · B)</p>
              <p className="text-xl font-bold font-mono text-green-400">{dotProd}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Matching tags count
              </p>
            </div>
            <div className="bg-card/50 rounded-lg p-3 border border-border/20">
              <p className="text-xs text-muted-foreground mb-1">‖A‖ × ‖B‖</p>
              <p className="text-xl font-bold font-mono text-amber-400">
                {magA.toFixed(2)} × {magB.toFixed(2)} = {(magA * magB).toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Vector magnitudes
              </p>
            </div>
            <div className="bg-card/50 rounded-lg p-3 border border-border/20">
              <p className="text-xs text-muted-foreground mb-1">Cosine Similarity</p>
              <p
                className={`text-2xl font-bold font-mono ${getSimilarityColor(similarity)}`}
              >
                {similarity.toFixed(4)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {dotProd} / {(magA * magB).toFixed(2)} ={" "}
                {(similarity * 100).toFixed(1)}% similar
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// FBT DEMO
// ============================================================

function FBTDemo() {
  const user = users[0]; // Alex Chen
  const purchasedNames = user.purchaseHistory.map((id) => {
    const p = products.find((pr) => pr.id === id);
    return p ? `${p.image} ${p.name}` : id;
  });

  // Show co-occurrence for Alex's first product
  const firstPurchase = products.find((p) => p.id === user.purchaseHistory[0])!;
  const otherBuyers = users.filter(
    (u) => u.id !== user.id && u.purchaseHistory.includes(firstPurchase.id)
  );

  return (
    <Card className="bg-card/40 backdrop-blur-sm border-border/30">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-400" />
          How &quot;Frequently Bought Together&quot; Works
        </h3>

        <div className="space-y-4">
          {/* User's purchases */}
          <div className="bg-violet-500/10 rounded-xl p-4 border border-violet-500/20">
            <p className="text-sm text-violet-300 font-semibold mb-2">
              {user.avatar} {user.name}&apos;s Purchases:
            </p>
            <div className="flex flex-wrap gap-2">
              {purchasedNames.map((name) => (
                <Badge
                  key={name}
                  variant="outline"
                  className="bg-violet-500/10 border-violet-500/20 text-violet-300"
                >
                  {name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Trace: first product */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ChevronRight className="w-4 h-4" />
            Looking at <span className="text-foreground font-semibold">{firstPurchase.image} {firstPurchase.name}</span>...
            Who else bought this?
          </div>

          {/* Other buyers */}
          {otherBuyers.length > 0 ? (
            <div className="space-y-3 pl-6 border-l-2 border-amber-500/30">
              {otherBuyers.map((buyer) => {
                const otherItems = buyer.purchaseHistory
                  .filter((id) => id !== firstPurchase.id && !user.purchaseHistory.includes(id))
                  .map((id) => products.find((p) => p.id === id))
                  .filter(Boolean);

                return (
                  <div
                    key={buyer.id}
                    className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10"
                  >
                    <p className="text-sm font-semibold mb-2">
                      {buyer.avatar} {buyer.name} also bought:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {otherItems.map((item) =>
                        item ? (
                          <Badge
                            key={item.id}
                            variant="outline"
                            className="bg-amber-500/10 border-amber-500/20 text-amber-300"
                          >
                            {item.image} {item.name}
                          </Badge>
                        ) : null
                      )}
                      {otherItems.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">
                          (No new items to recommend)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic pl-6">
              No other users bought this item.
            </p>
          )}

          <div className="bg-muted/20 rounded-lg p-3 border border-border/30 text-sm">
            <p className="text-muted-foreground">
              <Lightbulb className="w-4 h-4 inline mr-1 text-amber-400" />
              Items that appear most frequently across other buyers&apos; carts get the highest
              &quot;Frequently Bought Together&quot; score. Products the user already owns are excluded.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// ALS INTERACTIVE DEMO
// ============================================================

function ALSDemo() {
  const [selectedUser, setSelectedUser] = useState(0);

  // Run ALS computation
  const R = createInteractionMatrix(users, products);
  const k = 5;
  const { U, V } = alsFactorize(R, k, 50, 0.1);

  // Compute predictions for selected user
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

  const topRecommendations = new Set(
    unownedPredictions.slice(0, 4).map((p) => p.product.id)
  );

  // Color for heatmap cell
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
              ALS decomposes the interaction matrix R into User factors (U) × Product factors (V) with k={k} latent dimensions
            </p>
          </div>

          {/* R matrix — Interaction Grid */}
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Binary className="w-4 h-4 text-cyan-400" />
            Step 1: Interaction Matrix R (who bought what)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border/30 mb-6">
            <table className="text-[10px]">
              <thead>
                <tr className="bg-muted/30">
                  <th className="p-1.5 text-left font-medium sticky left-0 bg-muted/30 z-10">User</th>
                  {products.map((p) => (
                    <th key={p.id} className="p-1.5 text-center whitespace-nowrap" title={p.name}>
                      {p.image}
                    </th>
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

      {/* User Selector + Latent Factors */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            Step 2: Select a user to see their latent factor profile
          </h3>

          <div className="flex flex-wrap gap-2 mb-5">
            {users.map((user, i) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  i === selectedUser
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm"
                    : "bg-muted/20 text-muted-foreground border border-border/30 hover:bg-muted/40"
                }`}
              >
                {user.avatar} {user.name}
              </button>
            ))}
          </div>

          {/* Latent factors bars */}
          <div className="bg-muted/10 rounded-lg p-4 border border-border/20">
            <p className="text-xs text-muted-foreground mb-3">
              Latent factors for <strong className="text-cyan-400">{users[selectedUser].name}</strong>
              {" "}— these hidden dimensions capture purchase preferences:
            </p>
            <div className="space-y-2">
              {U[selectedUser].map((val, f) => {
                const maxVal = Math.max(...U[selectedUser].map(Math.abs));
                const width = maxVal > 0 ? (Math.abs(val) / maxVal) * 100 : 0;
                return (
                  <div key={`factor-${String(f)}`} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">
                      Factor {f + 1}: {val.toFixed(3)}
                    </span>
                    <div className="flex-1 h-4 bg-muted/20 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          val >= 0 ? "bg-cyan-500/50" : "bg-rose-500/50"
                        }`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predictions */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Step 3: Predictions for {users[selectedUser].name}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Score = U[{users[selectedUser].name.split(" ")[0]}] · V[product] — dot product of latent vectors.
            Products the user already owns are excluded.
          </p>

          <div className="overflow-x-auto rounded-lg border border-border/30 mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30">
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-center">Predicted Score</th>
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
                      className={`border-t border-border/10 ${
                        p.owned ? "opacity-40" : ""
                      } ${!p.owned && topRecommendations.has(p.product.id) ? "bg-cyan-500/5" : ""}`}
                    >
                      <td className="p-2">
                        {p.product.image} {p.product.name.split(" ").slice(0, 3).join(" ")}
                      </td>
                      <td className={`p-2 text-center font-mono font-bold ${heatColor(p.score, p.owned)}`}>
                        {p.score.toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        {p.owned && (
                          <span className="text-muted-foreground">Already owned</span>
                        )}
                        {!p.owned && topRecommendations.has(p.product.id) && (
                          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px]">
                            <Cpu className="w-3 h-3 mr-1" />
                            Recommended
                          </Badge>
                        )}
                        {!p.owned && !topRecommendations.has(p.product.id) && (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="bg-muted/20 rounded-lg p-3 border border-border/30 text-sm">
            <Lightbulb className="w-4 h-4 inline mr-1 text-cyan-400" />
            <strong>Try clicking different users above</strong> — notice how the latent factors
            and predicted scores change. The algorithm discovers patterns that aren&apos;t
            explicitly encoded in tags or purchase rules.
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
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: <Target className="w-6 h-6 text-violet-400" />,
      title: "1. Tag Vocabulary",
      desc: "Collect all unique tags from every product to create a standard vocabulary.",
    },
    {
      icon: <Binary className="w-6 h-6 text-cyan-400" />,
      title: "2. Binary Encoding",
      desc: "Each product → a vector of 0s and 1s (has tag = 1, doesn't = 0).",
    },
    {
      icon: <GitCompare className="w-6 h-6 text-green-400" />,
      title: "3. Cosine Similarity",
      desc: "Measure the angle between two vectors — smaller angle = more similar.",
    },
    {
      icon: <Sparkles className="w-6 h-6 text-pink-400" />,
      title: "4. Recommendations",
      desc: "Match unpurchased products against user's history and rank by similarity.",
    },
  ];

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
              <h1 className="text-2xl sm:text-3xl font-bold">How the Algorithm Works</h1>
              <p className="text-muted-foreground mt-1">
                A step-by-step breakdown of the recommendation engine internals
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* ============================================================
            STEP FLOW OVERVIEW
        ============================================================ */}
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Content-Based Filtering Pipeline
          </h2>

          {/* Step Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {steps.map((step, i) => (
              <button
                key={step.title}
                onClick={() => setActiveStep(i)}
                className={`text-left p-4 rounded-xl border transition-all duration-300 ${
                  activeStep === i
                    ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5"
                    : "bg-card/30 border-border/30 hover:border-primary/20"
                }`}
              >
                <div className="mb-2">{step.icon}</div>
                <h3 className="font-semibold text-sm">{step.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
              </button>
            ))}
          </div>

          {/* Animated Step Detail */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" key={activeStep}>
            {activeStep === 0 && (
              <Card className="bg-card/40 backdrop-blur-sm border-border/30">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">Step 1: Build Tag Vocabulary</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The engine scans all 20 products and collects every unique tag into a sorted list.
                    This becomes the &quot;dictionary&quot; that defines each dimension of the vector space.
                  </p>
                  <div className="bg-muted/20 rounded-lg p-4 border border-border/30 font-mono text-xs overflow-x-auto">
                    <span className="text-muted-foreground">vocabulary = [</span>
                    {[...new Set(products.flatMap((p) => p.tags))]
                      .sort((a, b) => a.localeCompare(b))
                      .map((tag, i, arr) => (
                        <span key={tag}>
                          <span className="text-cyan-400">&quot;{tag}&quot;</span>
                          {i < arr.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    <span className="text-muted-foreground">]</span>
                    <p className="text-muted-foreground mt-2">
                      → {new Set(products.flatMap((p) => p.tags)).size} unique dimensions
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeStep === 1 && (
              <Card className="bg-card/40 backdrop-blur-sm border-border/30">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">Step 2: Binary Vector Encoding</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Each product is converted into a vector where each position corresponds to a tag.
                    <strong className="text-foreground"> 1 = product has this tag, 0 = doesn&apos;t.</strong>
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-border/30">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="p-2 text-left">Product</th>
                          <th className="p-2 text-center">audio</th>
                          <th className="p-2 text-center">bluetooth</th>
                          <th className="p-2 text-center">wireless</th>
                          <th className="p-2 text-center">premium</th>
                          <th className="p-2 text-center">casual</th>
                          <th className="p-2 text-center">athletic</th>
                          <th className="p-2 text-center">...</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.slice(0, 4).map((p) => (
                          <tr key={p.id} className="border-t border-border/20">
                            <td className="p-2 font-medium">
                              {p.image} {p.name.split(" ").slice(0, 2).join(" ")}
                            </td>
                            {["audio", "bluetooth", "wireless", "premium", "casual", "athletic"].map(
                              (tag) => (
                                <td
                                  key={tag}
                                  className={`p-2 text-center font-mono font-bold ${
                                    p.tags.includes(tag)
                                      ? "text-green-400 bg-green-500/10"
                                      : "text-muted-foreground/30"
                                  }`}
                                >
                                  {p.tags.includes(tag) ? "1" : "0"}
                                </td>
                              )
                            )}
                            <td className="p-2 text-center text-muted-foreground">...</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeStep === 2 && (
              <Card className="bg-card/40 backdrop-blur-sm border-border/30">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">Step 3: Cosine Similarity Formula</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The cosine of the angle between two vectors measures how &quot;aligned&quot; they are,
                    regardless of vector length. This is the core metric.
                  </p>

                  {/* Formula */}
                  <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 rounded-xl p-6 border border-violet-500/20 text-center mb-6">
                    <div className="text-2xl font-mono font-bold text-foreground">
                      cos(A, B) ={" "}
                      <span className="text-green-400">A · B</span> /{" "}
                      <span className="text-amber-400">‖A‖ × ‖B‖</span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="text-green-400 font-bold">A · B</span> = Sum of (Aᵢ × Bᵢ)
                        <br />
                        Count of matching tags
                      </div>
                      <div>
                        <span className="text-amber-400 font-bold">‖A‖</span> = √(ΣAᵢ²)
                        <br />
                        Vector magnitude (length)
                      </div>
                      <div>
                        <span className="text-foreground font-bold">Result</span>: 0 → 1
                        <br />0 = nothing in common, 1 = identical
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    <Lightbulb className="w-4 h-4 inline mr-1 text-amber-400" />
                    The key insight: cosine similarity ignores &quot;how many&quot; tags a product has
                    (magnitude) and focuses on &quot;which&quot; tags overlap (direction). Two products with
                    different numbers of tags can still be highly similar if their tags align.
                  </p>
                </CardContent>
              </Card>
            )}

            {activeStep === 3 && (
              <Card className="bg-card/40 backdrop-blur-sm border-border/30">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">Step 4: Generating Recommendations</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    For each product the user <strong className="text-foreground">hasn&apos;t</strong> purchased,
                    the engine computes similarity against <strong className="text-foreground">every</strong> product
                    they <strong className="text-foreground">have</strong> purchased, then picks the maximum score.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                      <div className="text-2xl">🧑‍💻</div>
                      <div>
                        <p className="font-semibold text-sm">Alex Chen purchased:</p>
                        <p className="text-xs text-muted-foreground">
                          🎧 Earbuds, 💻 Laptop, ⌨️ Keyboard, 🎵 Headphones, 🖱️ Mouse
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ArrowRight className="w-4 h-4" />
                      <span className="text-sm">For each remaining product, find best match:</span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-border/30">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/30">
                            <th className="p-2 text-left">Candidate</th>
                            <th className="p-2 text-center">Best Match</th>
                            <th className="p-2 text-center">Score</th>
                            <th className="p-2 text-left">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-border/20 bg-green-500/5">
                            <td className="p-2">📱 Smart Tablet</td>
                            <td className="p-2 text-center">💻 Laptop</td>
                            <td className="p-2 text-center font-mono text-green-400 font-bold">0.65</td>
                            <td className="p-2">
                              <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">
                                ✅ Recommended
                              </Badge>
                            </td>
                          </tr>
                          <tr className="border-t border-border/20 bg-green-500/5">
                            <td className="p-2">🔊 Smart Speaker</td>
                            <td className="p-2 text-center">🎧 Earbuds</td>
                            <td className="p-2 text-center font-mono text-green-400 font-bold">0.58</td>
                            <td className="p-2">
                              <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">
                                ✅ Recommended
                              </Badge>
                            </td>
                          </tr>
                          <tr className="border-t border-border/20">
                            <td className="p-2">👟 Sneakers</td>
                            <td className="p-2 text-center">—</td>
                            <td className="p-2 text-center font-mono text-rose-400">0.00</td>
                            <td className="p-2 text-muted-foreground">❌ No match</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <Separator className="opacity-30" />

        {/* ============================================================
            INTERACTIVE VECTOR DEMO
        ============================================================ */}
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            🧪 Try It Yourself
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Select any two products below to see how the engine computes their similarity
            in real-time — from binary encoding to the final cosine score.
          </p>
          <VectorDemo />
        </section>

        <Separator className="opacity-30" />

        {/* ============================================================
            FBT DEMO
        ============================================================ */}
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            Collaborative Filtering: &quot;Frequently Bought Together&quot;
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            This algorithm doesn&apos;t look at product attributes — it analyzes{" "}<strong className="text-foreground">user behavior patterns</strong>.
            If many users buy Product A and Product B together, the engine infers a relationship.
          </p>
          <FBTDemo />
        </section>

        <Separator className="opacity-30" />

        {/* ============================================================
            USER-BASED FILTERING
        ============================================================ */}
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            User-Based Collaborative Filtering
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Instead of comparing products, this algorithm compares{" "}
            <strong className="text-foreground">users</strong>. It encodes each
            user as a binary purchase vector and uses Cosine Similarity to find
            &quot;neighbors&quot; with similar tastes.
          </p>
          <Card className="bg-card/40 backdrop-blur-sm border-border/30">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                How It Works
              </h3>
              <div className="space-y-3">
                <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10">
                  <p className="text-sm font-semibold text-emerald-400 mb-2">Step 1: Encode Users</p>
                  <p className="text-sm text-muted-foreground">
                    Each user → a binary vector across all 20 products (1 = purchased, 0 = not).
                    E.g., Alex [1,1,0,0,1,0,1,1,...], Jordan [0,0,1,1,0,1,0,0,...]
                  </p>
                </div>
                <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10">
                  <p className="text-sm font-semibold text-emerald-400 mb-2">Step 2: Find Similar Users</p>
                  <p className="text-sm text-muted-foreground">
                    Compute cosine similarity between user vectors. Users who bought
                    overlapping products get higher similarity scores.
                  </p>
                </div>
                <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10">
                  <p className="text-sm font-semibold text-emerald-400 mb-2">Step 3: Recommend</p>
                  <p className="text-sm text-muted-foreground">
                    Take products from similar users that the target user hasn&apos;t bought yet.
                    Weight recommendations by user similarity score.
                  </p>
                </div>
              </div>
              <div className="bg-muted/20 rounded-lg p-3 border border-border/30 text-sm">
                <Lightbulb className="w-4 h-4 inline mr-1 text-emerald-400" />
                <strong>Key difference from item-based:</strong> This approach can recommend
                products from completely different categories if users with similar taste bought them.
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="opacity-30" />

        {/* ============================================================
            MATRIX FACTORIZATION
        ============================================================ */}
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Matrix Factorization (ALS)
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            The most advanced technique. It discovers{" "}
            <strong className="text-foreground">hidden (latent) factors</strong>{" "}
            that explain purchasing patterns — things like &quot;tech enthusiast&quot; or
            &quot;fashion-forward&quot; that aren&apos;t explicitly tagged.
          </p>
          <ALSDemo />
        </section>

        <Separator className="opacity-30" />

        {/* ============================================================
            COMPARISON TABLE (4 algorithms)
        ============================================================ */}
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

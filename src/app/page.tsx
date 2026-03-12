"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { users } from "@/lib/data/users";
import { products } from "@/lib/data/products";
import { Recommendation } from "@/lib/recommendation/engine";
import { UserSelector } from "@/components/user-selector";
import { ProductCard } from "@/components/product-card";
import { RecommendationSection } from "@/components/recommendation-section";
import { SimilarityMatrix } from "@/components/similarity-matrix";
import { GuidedTour } from "@/components/guided-tour";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Cpu,
  ShoppingBag,
  ArrowDown,
  ExternalLink,
  Package,
  BookOpen,
} from "lucide-react";

export default function HomePage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [contentBased, setContentBased] = useState<Recommendation[]>([]);
  const [frequentlyBought, setFrequentlyBought] = useState<Recommendation[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  const selectedUser = selectedUserId
    ? users.find((u) => u.id === selectedUserId)
    : null;

  const handleUserSelect = useCallback(async (userId: string) => {
    setSelectedUserId(userId);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/recommendations?userId=${userId}`);
      const data = await res.json();
      setContentBased(data.contentBased || []);
      setFrequentlyBought(data.frequentlyBoughtTogether || []);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="relative border-b border-border/30 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Brain className="w-10 h-10 text-violet-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
                Product Recommendation Engine
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
              An AI-powered demo showcasing{" "}
              <Badge variant="secondary" className="mx-1 text-violet-400 border-violet-500/20 bg-violet-500/10">
                <Cpu className="w-3 h-3 mr-1" />
                Content-Based Filtering
              </Badge>{" "}
              with Cosine Similarity and{" "}
              <Badge variant="secondary" className="mx-1 text-amber-400 border-amber-500/20 bg-amber-500/10">
                <ShoppingBag className="w-3 h-3 mr-1" />
                Frequently Bought Together
              </Badge>{" "}
              collaborative patterns.
            </p>

            {/* How It Works Link */}
            <Link
              id="how-it-works-link"
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 text-sm text-muted-foreground hover:text-foreground"
            >
              <BookOpen className="w-4 h-4 text-violet-400" />
              How does the algorithm work?
            </Link>

            {/* User Selector */}
            <div className="pt-4 w-full flex flex-col items-center gap-3">
              <UserSelector
                users={users}
                selectedUserId={selectedUserId}
                onSelect={handleUserSelect}
              />
              {!selectedUserId && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-bounce">
                  <ArrowDown className="w-4 h-4" />
                  Select a user to see personalized recommendations
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Selected User Info */}
        {selectedUser && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div id="user-info-bar" className="flex items-center gap-4 p-4 rounded-xl bg-card/30 backdrop-blur-sm border border-border/30">
              <span className="text-4xl">{selectedUser.avatar}</span>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {selectedUser.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.persona} • {selectedUser.purchaseHistory.length}{" "}
                  past purchases
                </p>
              </div>
              <div className="ml-auto flex flex-wrap gap-1.5">
                {selectedUser.purchaseHistory.map((pid) => {
                  const product = products.find((p) => p.id === pid);
                  return product ? (
                    <Badge
                      key={pid}
                      variant="outline"
                      className="text-xs bg-muted/30 border-border/50"
                    >
                      {product.image} {product.name.split(" ").slice(0, 2).join(" ")}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {(selectedUserId || isLoading) && (
          <RecommendationSection
            contentBased={contentBased}
            frequentlyBoughtTogether={frequentlyBought}
            isLoading={isLoading}
          />
        )}

        {/* All Products Catalog */}
        <section>
          <Separator className="mb-8 opacity-30" />
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                All Products
              </h2>
              <p className="text-sm text-muted-foreground">
                Browse our complete catalog of {products.length} products
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="animate-in fade-in slide-in-from-bottom-2"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "both",
                }}
              >
                <ProductCard product={product} showTags />
              </div>
            ))}
          </div>
        </section>

        {/* Similarity Matrix */}
        <section id="similarity-matrix-section">
          <Separator className="mb-8 opacity-30" />
          <SimilarityMatrix />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" />
            <span>RecSys Demo — AI Recommendation Engine</span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Source</span>
          </a>
        </div>
      </footer>

      {/* Guided Tour */}
      <GuidedTour hasSelectedUser={!!selectedUserId} />
    </div>
  );
}

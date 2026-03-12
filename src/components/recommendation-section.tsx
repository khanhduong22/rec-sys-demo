"use client";

import { Recommendation } from "@/lib/recommendation/engine";
import { ProductCard } from "@/components/product-card";
import { Sparkles, Users, TrendingUp } from "lucide-react";

interface RecommendationSectionProps {
  readonly contentBased: Recommendation[];
  readonly frequentlyBoughtTogether: Recommendation[];
  readonly isLoading: boolean;
}

function SectionSkeleton({ count }: Readonly<{ count: number }>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`skeleton-${String(i)}`}
          className="h-48 rounded-xl bg-muted/30 animate-pulse border border-border/20"
        />
      ))}
    </div>
  );
}

export function RecommendationSection({
  contentBased,
  frequentlyBoughtTogether,
  isLoading,
}: RecommendationSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 w-64 bg-muted/30 rounded-lg animate-pulse mb-4" />
          <SectionSkeleton count={3} />
        </div>
        <div>
          <div className="h-8 w-64 bg-muted/30 rounded-lg animate-pulse mb-4" />
          <SectionSkeleton count={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Content-Based Recommendations */}
      {contentBased.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                Recommended for You
                <TrendingUp className="w-4 h-4 text-green-400" />
              </h2>
              <p className="text-sm text-muted-foreground">
                Based on your purchase history using AI similarity analysis
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentBased.map((rec, index) => (
              <div
                key={rec.product.id}
                className="animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
              >
                <ProductCard
                  product={rec.product}
                  reason={rec.reason}
                  reasonType={rec.reasonType}
                  score={rec.score}
                  showTags
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Frequently Bought Together */}
      {frequentlyBoughtTogether.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Frequently Bought Together
              </h2>
              <p className="text-sm text-muted-foreground">
                Products other shoppers paired with your purchases
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {frequentlyBoughtTogether.map((rec, index) => (
              <div
                key={rec.product.id}
                className="animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100 + 300}ms`, animationFillMode: "both" }}
              >
                <ProductCard
                  product={rec.product}
                  reason={rec.reason}
                  reasonType={rec.reasonType}
                  score={rec.score}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

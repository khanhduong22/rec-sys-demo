"use client";

import { Product } from "@/lib/data/products";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShoppingBag, Tag } from "lucide-react";

interface ProductCardProps {
  readonly product: Product;
  readonly reason?: string;
  readonly reasonType?: "content-based" | "frequently-bought-together";
  readonly score?: number;
  readonly showTags?: boolean;
}

export function ProductCard({
  product,
  reason,
  reasonType,
  score,
  showTags = false,
}: ProductCardProps) {
  return (
    <Card className="group relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/30 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1">
      {/* Gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardContent className="relative p-5">
        {/* Recommendation badge */}
        {reason && (
          <div className="mb-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                reasonType === "content-based"
                  ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              {reasonType === "content-based" ? (
                <Sparkles className="w-3 h-3" />
              ) : (
                <ShoppingBag className="w-3 h-3" />
              )}
              {reason}
            </div>
          </div>
        )}

        {/* Product image & info */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
            {product.image}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="secondary"
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  product.category === "Electronics"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "bg-pink-500/10 text-pink-400 border-pink-500/20"
                }`}
              >
                {product.category}
              </Badge>
              {score !== undefined && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  Score: {score}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {product.description}
            </p>
            <p className="text-lg font-bold text-primary mt-2">
              ${product.price.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Tags */}
        {showTags && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/30">
            <Tag className="w-3 h-3 text-muted-foreground" />
            {product.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] px-2 py-0 bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/60 transition-colors"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

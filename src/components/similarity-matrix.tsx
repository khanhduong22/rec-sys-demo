"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, Info, Loader2 } from "lucide-react";

interface MatrixData {
  products: Array<{ id: string; name: string; category: string }>;
  matrix: number[][];
}

function getCellColor(value: number): string {
  if (value >= 1) return "bg-emerald-500 text-white";
  if (value >= 0.8) return "bg-emerald-500/80 text-white";
  if (value >= 0.6) return "bg-emerald-500/60 text-white";
  if (value >= 0.4) return "bg-amber-500/50 text-black";
  if (value >= 0.2) return "bg-amber-500/30 text-foreground";
  if (value > 0) return "bg-rose-500/20 text-foreground";
  return "bg-muted/20 text-muted-foreground";
}

function getShortName(name: string): string {
  const words = name.split(" ");
  if (words.length <= 2) return name;
  return words.slice(0, 2).join(" ");
}

export function SimilarityMatrix() {
  const [data, setData] = useState<MatrixData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const fetchMatrix = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/similarity-matrix");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch similarity matrix:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
          <Grid3X3 className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Product Similarity Matrix
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  This heatmap shows how similar each product is to every other
                  product, calculated using Cosine Similarity on product tags.
                  Greener cells = more similar.
                </p>
              </TooltipContent>
            </Tooltip>
          </h2>
          <p className="text-sm text-muted-foreground">
            Cosine similarity scores between all product tag vectors
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
        <span>Similarity:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-rose-500/20 border border-border/30" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-amber-500/30 border border-border/30" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-emerald-500/60 border border-border/30" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-emerald-500 border border-border/30" />
          <span>Identical</span>
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm">
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-card/95 backdrop-blur-sm p-2 border-b border-r border-border/30 min-w-[120px]">
                <span className="text-muted-foreground">Product</span>
              </th>
              {data.products.map((p, idx) => (
                <th
                  key={p.id}
                  className={`p-1.5 border-b border-border/30 min-w-[44px] text-center transition-colors ${
                    hoveredCell?.col === idx
                      ? "bg-primary/10"
                      : ""
                  }`}
                >
                  <Tooltip>
                    <TooltipTrigger className="cursor-help">
                        <span className="text-lg block mb-0.5">
                          {data.products[idx]?.id.startsWith("e")
                            ? ["🎧", "💻", "⌚", "📷", "🔊", "⌨️", "🎵", "🔋", "🖱️", "📱"][
                                idx % 10
                              ]
                            : ["👟", "🧥", "👜", "🕶️", "👖", "🧶", "🛍️", "🏃", "👞", "🧥"][
                                idx % 10
                              ]}
                        </span>
                        <span className="text-[8px] text-muted-foreground font-mono">
                          {p.id}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.category}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((row, i) => (
              <tr key={data.products[i].id}>
                <td
                  className={`sticky left-0 z-10 bg-card/95 backdrop-blur-sm p-2 border-r border-border/30 font-medium whitespace-nowrap transition-colors ${
                    hoveredCell?.row === i ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[8px] px-1 ${
                        data.products[i].category === "Electronics"
                          ? "text-blue-400 border-blue-500/20"
                          : "text-pink-400 border-pink-500/20"
                      }`}
                    >
                      {data.products[i].category === "Electronics"
                        ? "E"
                        : "F"}
                    </Badge>
                    <span className="text-foreground/80 truncate max-w-[100px]">
                      {getShortName(data.products[i].name)}
                    </span>
                  </div>
                </td>
                {row.map((value, j) => (
                  <td
                    key={`${i}-${j}`}
                    className={`p-0 border border-border/10 transition-all duration-200 ${
                      hoveredCell?.row === i || hoveredCell?.col === j
                        ? "ring-1 ring-primary/30"
                        : ""
                    }`}
                    onMouseEnter={() => setHoveredCell({ row: i, col: j })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <Tooltip>
                      <TooltipTrigger
                        className={`w-full h-full p-1.5 text-center font-mono cursor-help ${getCellColor(
                          value
                        )} ${
                          i === j ? "font-bold" : ""
                        }`}
                      >
                        {value.toFixed(2)}
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-semibold">
                            {data.products[i].name}
                          </p>
                          <p className="text-muted-foreground">↕</p>
                          <p className="font-semibold">
                            {data.products[j].name}
                          </p>
                          <p className="mt-1">
                            Similarity:{" "}
                            <span className="font-bold text-primary">
                              {(value * 100).toFixed(0)}%
                            </span>
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

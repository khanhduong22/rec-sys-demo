"use client";

import { useEffect, useState } from "react";
import { getFingerprint, getFingerprintData } from "@thumbmarkjs/thumbmarkjs";
import { Copy, Check, Fingerprint, Monitor, Globe, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function BrowserFingerprint() {
  const [hash, setHash] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function identify() {
      try {
        const [fpHash, fpData] = await Promise.all([
          getFingerprint(),
          getFingerprintData(),
        ]);
        setHash(fpHash);
        setData(fpData);
      } catch (err) {
        console.error("Failed to generate fingerprint:", err);
      } finally {
        setIsLoading(false);
      }
    }
    identify();
  }, []);

  const copyToClipboard = () => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto border-border/30 bg-card/30 backdrop-blur-sm animate-pulse">
        <CardHeader>
          <div className="h-6 w-48 bg-muted/50 rounded-md mb-2" />
          <div className="h-4 w-64 bg-muted/50 rounded-md" />
        </CardHeader>
        <CardContent>
          <div className="h-20 w-full bg-muted/50 rounded-xl mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-muted/50 rounded-xl" />
            <div className="h-32 bg-muted/50 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pre-process some fields for prettier display
  const userAgent = data?.system?.userAgent || data?.userAgent || "Unknown";
  const language = data?.system?.language || typeof navigator !== 'undefined' ? navigator.language : "Unknown";
  const platform = data?.system?.platform || typeof navigator !== 'undefined' ? navigator.platform : "Unknown";
  const hardwareConcurrency = data?.hardware?.hardwareConcurrency || typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : "Unknown";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deviceMemory = data?.hardware?.deviceMemory || (typeof navigator !== "undefined" && (navigator as any).deviceMemory) || "Unknown";
  
  let screenRes = "Unknown";
  if (data?.screen) {
    screenRes = `${data.screen.width}x${data.screen.height} (${data.screen.colorDepth}-bit)`;
  } else if (typeof globalThis !== "undefined" && globalThis.window) {
    screenRes = `${globalThis.window.screen.width}x${globalThis.window.screen.height}`;
  }
  
  const timezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Unknown";

  return (
    <Card className="w-full max-w-4xl mx-auto border-border/50 bg-card/40 backdrop-blur-md shadow-xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
      
      <CardHeader className="text-center pb-8 border-b border-border/30 bg-muted/10">
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center border border-violet-500/30 mb-4">
          <Fingerprint className="w-8 h-8 text-violet-400" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
          Anonymous Identity
        </CardTitle>
        <CardDescription className="text-base mt-2">
          Your unique browser fingerprint generated using ThumbmarkJS
        </CardDescription>
        
        {hash && (
          <div className="mt-6 flex flex-col items-center">
            <p className="text-sm text-muted-foreground mb-2">Global Unique Identifier</p>
            <button 
              type="button"
              onClick={copyToClipboard}
              className="flex items-center gap-3 bg-background/80 border border-border/50 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all duration-300 px-6 py-3 rounded-xl cursor-pointer group shadow-inner"
            >
              <code className="text-lg font-mono text-foreground font-semibold tracking-wider">
                {hash}
              </code>
              <Separator orientation="vertical" className="h-6" />
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-muted-foreground group-hover:text-violet-400 transition-colors" />
              )}
            </button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hardware & Display */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
              <Monitor className="w-4 h-4" /> Hardware & Display
            </h3>
            <Card className="bg-background/40 border-border/40 shadow-sm">
              <CardContent className="p-4 space-y-3 font-mono text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">CPU Cores</span>
                  <Badge variant="outline" className="bg-muted/30">{hardwareConcurrency}</Badge>
                </div>
                <Separator className="opacity-50" />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Memory</span>
                  <Badge variant="outline" className="bg-muted/30">{deviceMemory} GB</Badge>
                </div>
                <Separator className="opacity-50" />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Screen</span>
                  <span className="text-right text-foreground truncate max-w-[180px]">{screenRes}</span>
                </div>
                <Separator className="opacity-50" />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Platform</span>
                  <span className="text-right text-foreground truncate max-w-[180px]">{platform}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Software & Network */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
              <Globe className="w-4 h-4" /> Environment
            </h3>
            <Card className="bg-background/40 border-border/40 shadow-sm">
              <CardContent className="p-4 space-y-3 font-mono text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Language</span>
                  <Badge variant="outline" className="bg-muted/30">{language}</Badge>
                </div>
                <Separator className="opacity-50" />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Timezone</span>
                  <span className="text-right text-foreground truncate max-w-[180px]">{timezone}</span>
                </div>
                <Separator className="opacity-50" />
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground">User Agent</span>
                  <div className="bg-muted/30 p-2 rounded-md text-xs text-foreground/80 break-words leading-relaxed border border-border/40">
                    {userAgent}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Entropy */}
          {data && (
            <div className="md:col-span-2 space-y-4 mt-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                <Database className="w-4 h-4" /> Entropy Explored
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['webgl', 'canvas', 'audio', 'fonts'].map((key) => {
                  // just checking if thumbmarkjs captured these
                  const hasData = data[key] !== undefined || data.webgl !== undefined;
                  return (
                    <div key={key} className="flex items-center gap-2 bg-background/50 border border-border/40 rounded-lg p-3">
                      <div className={`w-2 h-2 rounded-full ${hasData ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-muted'}`} />
                      <span className="text-sm capitalize font-medium text-foreground/80">{key} Hash</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

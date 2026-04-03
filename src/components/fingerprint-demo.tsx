"use client";

import { useEffect, useState } from "react";
import { getFingerprint, getFingerprintData } from "@thumbmarkjs/thumbmarkjs";
import { load } from "@fingerprintjs/fingerprintjs";
import { Fingerprint, Check, Copy, ArrowRight, Activity, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FingerprintDemo() {
  const [thumbmarkHash, setThumbmarkHash] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [thumbmarkData, setThumbmarkData] = useState<any>(null);
  const [fpjsHash, setFpjsHash] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fpjsData, setFpjsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedTM, setCopiedTM] = useState(false);
  const [copiedFP, setCopiedFP] = useState(false);
  const [executionTime, setExecutionTime] = useState<{ tm: number; fp: number }>({ tm: 0, fp: 0 });

  useEffect(() => {
    async function init() {
      try {
        const startTM = performance.now();
        const [tm, tmData] = await Promise.all([
          getFingerprint(),
          getFingerprintData()
        ]);
        const endTM = performance.now();
        
        const startFP = performance.now();
        const fpjsTracker = await load();
        const fpResult = await fpjsTracker.get();
        const endFP = performance.now();

        setThumbmarkHash(tm);
        setThumbmarkData(tmData);
        setExecutionTime(prev => ({ ...prev, tm: Math.round(endTM - startTM) }));
        
        setFpjsHash(fpResult.visitorId);
        setFpjsData({
          visitorId: fpResult.visitorId,
          confidence: fpResult.confidence,
          version: fpResult.version,
          components: fpResult.components
        });
        setExecutionTime(prev => ({ ...prev, fp: Math.round(endFP - startFP) }));
      } catch (err) {
        console.error("Fingerprint failed", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const copy = (hash: string, isTM: boolean) => {
    navigator.clipboard.writeText(hash);
    if (isTM) {
      setCopiedTM(true);
      setTimeout(() => setCopiedTM(false), 2000);
    } else {
      setCopiedFP(true);
      setTimeout(() => setCopiedFP(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
        <div className="h-48 bg-muted/40 rounded-xl" />
        <div className="h-48 bg-muted/40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* ThumbmarkJS */}
      <Card className="bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 border-border/40 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Fingerprint className="w-4 h-4 text-indigo-400" />
              </div>
              <h4 className="font-bold text-foreground">ThumbmarkJS</h4>
            </div>
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
              <Activity className="w-3 h-3 mr-1" />
              {executionTime.tm}ms
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground mb-4 h-8">
            Open-source library with customizable entropy features (WebGL, Canvas, Media Devices).
          </p>
          
          <div className="bg-background/80 p-3 rounded-lg border border-border/50 flex flex-col gap-2 mb-4">
            <span className="text-[10px] uppercase text-muted-foreground font-semibold">Visitor ID</span>
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-indigo-400 truncate w-3/4">{thumbmarkHash}</code>
              <button 
                type="button"
                onClick={() => thumbmarkHash && copy(thumbmarkHash, true)} 
                className="p-1.5 hover:bg-muted/50 rounded-md transition-colors"
                aria-label="Copy ThumbmarkJS Hash"
              >
                {copiedTM ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
            </div>
          </div>
          
          <div className="bg-[#1e1e1e] rounded-lg border border-border/50 overflow-hidden flex flex-col h-64">
            <div className="bg-black/40 px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Raw Components Data</span>
            </div>
            <div className="p-3 overflow-auto flex-1 custom-scrollbar">
              <pre className="text-[11px] font-mono leading-relaxed">
                {thumbmarkData ? (
                  <span dangerouslySetInnerHTML={{ 
                    __html: `{\n  <span class="text-[#ce9178]">"visitorId"</span>: <span class="text-[#ce9178]">"${thumbmarkHash}"</span>,\n  <span class="text-[#ce9178]">"components"</span>: ` + JSON.stringify(thumbmarkData, null, 4).split('\n').join('\n  ')
                      .replaceAll(/"([^"]+)":/g, '<span class="text-[#ce9178]">"$1"</span>:')
                      .replaceAll(/: "([^"]+)"/g, ': <span class="text-[#ce9178]">"$1"</span>')
                      .replaceAll(/: (-?\d+\.?\d*)/g, ': <span class="text-[#b5cea8]">$1</span>')
                      .replaceAll(/: (true|false|null)/g, ': <span class="text-[#569cd6]">$1</span>') + '\n}'
                  }} />
                ) : "{}"}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FingerprintJS */}
      <Card className="bg-gradient-to-br from-orange-500/5 to-rose-500/5 border-border/40 relative overflow-hidden group hover:border-orange-500/30 transition-colors">
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-orange-400" />
              </div>
              <h4 className="font-bold text-foreground">FingerprintJS</h4>
            </div>
            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
              <Activity className="w-3 h-3 mr-1" />
              {executionTime.fp}ms
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground mb-4 h-8">
            Industry standard, highly stable. Known for 99.5% accuracy in its pro version.
          </p>
          
          <div className="bg-background/80 p-3 rounded-lg border border-border/50 flex flex-col gap-2 mb-4">
            <span className="text-[10px] uppercase text-muted-foreground font-semibold">Visitor ID</span>
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-orange-400 truncate w-3/4">{fpjsHash}</code>
              <button 
                type="button"
                onClick={() => fpjsHash && copy(fpjsHash, false)} 
                className="p-1.5 hover:bg-muted/50 rounded-md transition-colors"
                aria-label="Copy FingerprintJS Hash"
              >
                {copiedFP ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
            </div>
          </div>
          
          <div className="bg-[#1e1e1e] rounded-lg border border-border/50 overflow-hidden flex flex-col h-64">
            <div className="bg-black/40 px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Raw Components Data</span>
            </div>
            <div className="p-3 overflow-auto flex-1 custom-scrollbar">
              <pre className="text-[11px] font-mono leading-relaxed">
                {fpjsData ? (
                  <span dangerouslySetInnerHTML={{ 
                    __html: JSON.stringify(fpjsData, null, 2)
                      .replaceAll(/"([^"]+)":/g, '<span class="text-[#ce9178]">"$1"</span>:')
                      .replaceAll(/: "([^"]+)"/g, ': <span class="text-[#ce9178]">"$1"</span>')
                      .replaceAll(/: (-?\d+\.?\d*)/g, ': <span class="text-[#b5cea8]">$1</span>')
                      .replaceAll(/: (true|false|null)/g, ': <span class="text-[#569cd6]">$1</span>')
                  }} />
                ) : "{}"}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

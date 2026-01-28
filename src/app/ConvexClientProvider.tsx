"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useState, useEffect } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [convex, setConvex] = useState<ConvexReactClient | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (url) {
      setConvex(new ConvexReactClient(url));
    }
  }, []);

  if (!convex) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-cyan animate-pulse text-xl">◈ Connecting...</div>
      </div>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

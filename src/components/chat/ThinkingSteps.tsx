"use client";

import { useEffect, useState } from "react";

export function ThinkingSteps({ steps }: { steps: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => Math.min(i + 1, steps.length - 1));
    }, 1400);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="flex items-center gap-2 font-mono text-sm text-[var(--color-muted)]">
      <span className="flex gap-1">
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]"
          style={{ animationDelay: "200ms" }}
        />
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]"
          style={{ animationDelay: "400ms" }}
        />
      </span>
      {steps[index]}
    </div>
  );
}

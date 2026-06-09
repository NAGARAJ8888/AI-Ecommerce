"use client";

import React from "react";

export function AdminLoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-xl px-4">
        <div className="animate-pulse rounded-lg border bg-card p-6">
          <div className="h-5 w-2/3 bg-muted-foreground/20 rounded mb-4" />
          <div className="h-4 w-full bg-muted-foreground/20 rounded mb-2" />
          <div className="h-4 w-5/6 bg-muted-foreground/20 rounded mb-2" />
          <div className="h-4 w-4/6 bg-muted-foreground/20 rounded mb-2" />
          <div className="mt-6 h-10 w-1/2 bg-muted-foreground/20 rounded" />
        </div>
      </div>
    </div>
  );
}


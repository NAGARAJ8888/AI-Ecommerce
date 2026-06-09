"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AdminErrorState({
  title = "Access denied",
  description = "You do not have permission to view this page.",
  actionLabel = "Go to store",
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardContent className="p-6">
          <div className="text-lg font-semibold">{title}</div>
          <div className="mt-2 text-sm text-muted-foreground">{description}</div>
          {onAction && (
            <div className="mt-6">
              <Button onClick={onAction}>{actionLabel}</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


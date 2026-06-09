"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatusHistoryItem = {
  status?: string;
  timestamp?: string;
};

function formatTs(ts?: string) {
  if (!ts) return "-";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

export function OrderStatusTimeline({
  statusHistory,
}: {
  statusHistory?: StatusHistoryItem[];
}) {
  const items = Array.isArray(statusHistory) ? statusHistory : [];

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          No status history
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {items.map((it, idx) => {
            const status = (it.status || "").toString();
            const lower = status.toLowerCase();
            const dot =
              lower === "completed"
                ? "bg-green-500"
                : lower === "processing"
                  ? "bg-blue-500"
                  : lower === "shipped"
                    ? "bg-purple-500"
                    : lower === "pending"
                      ? "bg-yellow-500"
                      : lower === "cancelled" || lower === "canceled"
                        ? "bg-red-500"
                        : "bg-muted-foreground";

            return (
              <div key={`${status}-${idx}`} className="flex gap-3">
                <div className={cn("mt-0.5 h-2.5 w-2.5 rounded-full", dot)} />
                <div className="flex-1">
                  <div className="text-sm font-medium capitalize">{status}</div>
                  <div className="text-xs text-muted-foreground">{formatTs(it.timestamp)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


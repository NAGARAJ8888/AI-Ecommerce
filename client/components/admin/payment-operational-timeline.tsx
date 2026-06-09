"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

type TimelineItem = {
  label: string;
  timestamp?: string;
};

function formatWhen(d?: string) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleString();
}

export function PaymentOperationalTimeline({
  verifiedAt,
  refundedAt,
  reconciledAt,
}: {
  verifiedAt?: string;
  refundedAt?: string;
  reconciledAt?: string;
}) {
  const items: TimelineItem[] = [];

  if (verifiedAt) items.push({ label: "Payment verified", timestamp: verifiedAt });
  if (refundedAt) items.push({ label: "Refund processed", timestamp: refundedAt });
  if (reconciledAt) items.push({ label: "Reconciliation repaired", timestamp: reconciledAt });

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          No operational events available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {items.map((it, idx) => (
            <div key={`${it.label}-${idx}`} className="flex gap-3">
              <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{it.label}</div>
                <div className="text-xs text-muted-foreground">{formatWhen(it.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


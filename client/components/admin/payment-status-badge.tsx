"use client";

import React from "react";

export function PaymentStatusBadge({ status }: { status?: string | null }) {
  const s = (status || "").toString().toLowerCase();

  const cls = (() => {
    if (!s) return "bg-secondary text-foreground";
    if (s === "completed" || s === "succeeded" || s === "paid") {
      return "bg-green-100 text-green-700";
    }
    if (s === "failed" || s === "error") {
      return "bg-red-100 text-red-700";
    }
    if (s === "refunded") {
      return "bg-purple-100 text-purple-700";
    }
    if (s === "pending" || s === "processing") {
      return "bg-yellow-100 text-yellow-700";
    }
    return "bg-secondary text-foreground";
  })();

  return (
    <span className={`inline-flex w-fit px-2 py-0.5 text-xs rounded-sm ${cls}`}>
      {status || "unknown"}
    </span>
  );
}


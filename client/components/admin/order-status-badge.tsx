"use client";

import React from "react";

export function OrderStatusBadge({ status }: { status: string }) {
  const s = (status || "").toString();
  const badge = (() => {
    const lower = s.toLowerCase();
    if (lower === "completed") return "bg-green-100 text-green-700";
    if (lower === "processing") return "bg-blue-100 text-blue-700";
    if (lower === "shipped") return "bg-purple-100 text-purple-700";
    if (lower === "pending") return "bg-yellow-100 text-yellow-700";
    if (lower === "cancelled" || lower === "canceled") return "bg-red-100 text-red-700";
    return "bg-secondary text-foreground";
  })();

  return (
    <span className={`inline-flex w-fit px-2 py-0.5 text-xs rounded-sm capitalize ${badge}`}>{s}</span>
  );
}


"use client";

import React from "react";

export type PaymentReconciliationHealth =
  | "healthy"
  | "repaired"
  | "pending"
  | "unknown";

export function PaymentReconciliationBadge({
  health,
}: {
  health?: PaymentReconciliationHealth | string;
}) {
  const h = (health || "unknown").toString().toLowerCase();

  const map = (() => {
    switch (h) {
      case "healthy":
        return { label: "Reconciliation: healthy", cls: "bg-green-100 text-green-700" };
      case "repaired":
        return { label: "Reconciliation: repaired", cls: "bg-blue-100 text-blue-700" };
      case "pending":
        return { label: "Reconciliation: pending", cls: "bg-yellow-100 text-yellow-700" };
      default:
        return { label: "Reconciliation: unknown", cls: "bg-secondary text-foreground" };
    }
  })();

  return (
    <span className={`inline-flex w-fit px-2 py-0.5 text-xs rounded-sm ${map.cls}`}>
      {map.label}
    </span>
  );
}


"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { MoreHorizontal, RefreshCcw, RotateCcw, CreditCard, ShieldCheck, ArrowDownRight } from "lucide-react";
import { adminGetPaymentsAll, adminGetPaymentStats, adminRefundPayment, AdminPaymentRefundReason } from "@/lib/api-admin-payments";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { PaymentReconciliationBadge, PaymentReconciliationHealth } from "@/components/admin/payment-reconciliation-badge";
import { PaymentRefundDialog } from "@/components/admin/payment-refund-dialog";
import { PaymentOperationalTimeline } from "@/components/admin/payment-operational-timeline";


type AdminPayment = {
  _id?: string;
  id?: string;
  provider?: string;
  status?: string;
  transactionId?: string;
  providerEventId?: string;
  idempotencyKey?: string;
  refundId?: string;
  refundedAt?: string | Date;
  amount?: number;
  order?: { totalPrice?: number; orderStatus?: string; id?: string };

  user?: { name?: string; email?: string };
  createdAt?: string;
};

function resolvePaymentId(p: AdminPayment) {
  return p._id || p.id || p.transactionId || "";
}

function resolveProvider(p: AdminPayment) {
  return (p.provider || "").toString().toLowerCase();
}

function formatWhen(d?: string | Date) {
  if (!d) return "-";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString();
}

function useBadgeForPresence(present: boolean) {
  return present
    ? "bg-green-100 text-green-700"
    : "bg-secondary text-foreground";
}

function useBadgeForStatus(status: string) {
  const s = (status || "").toString();
  const lower = s.toLowerCase();
  if (lower === "completed") return "bg-green-100 text-green-700";
  if (lower === "failed") return "bg-red-100 text-red-700";
  if (lower === "refunded") return "bg-purple-100 text-purple-700";
  return "bg-secondary text-foreground";
}

function computeReconciliationBadge(payment: AdminPayment) {
  // Backend reconciliation fields are not guaranteed in the inspected model/API responses.
  // This is visibility-as-operational-hint, labeled as such.
  const status = (payment.status || "").toString().toLowerCase();
  if (status === "completed") {
    return { label: "Reconciliation: expected", cls: "bg-blue-100 text-blue-700" };
  }
  if (status === "refunded") {
    return { label: "Reconciliation: expected (refund)", cls: "bg-purple-100 text-purple-700" };
  }
  if (status === "failed") {
    return { label: "Reconciliation: not applicable", cls: "bg-red-100 text-red-700" };
  }
  return { label: "Reconciliation: pending (est.)", cls: "bg-secondary text-foreground" };
}

export function AdminPaymentsPanel() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [stats, setStats] = useState<any>(null);

  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundPaymentId, setRefundPaymentId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState<AdminPaymentRefundReason>("");
  const [isRefunding, setIsRefunding] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        adminGetPaymentsAll({ page: 1, limit: 25 }),
        adminGetPaymentStats(),
      ]);

      if (!listRes.success) {
        setError(listRes.message || "Failed to fetch payments");
        return;
      }

      const list =
        (listRes.data as any)?.payments ||
        (listRes.data as any)?.data ||
        [];

      setPayments((list || []) as AdminPayment[]);
      if (statsRes?.success) setStats(statsRes.data);
    } catch (e) {
      console.error(e);
      setError("An error occurred while fetching payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const cards = useMemo(() => {
    if (!stats) return [];
    const totalPayments = stats?.totalPayments ?? "-";
    const completedPayments = stats?.completedPayments ?? "-";
    const failedPayments = stats?.failedPayments ?? "-";
    const totalRevenue = stats?.totalRevenue ?? "-";

    return [
      {
        title: "Total Payments",
        value: `${totalPayments}`,
        icon: CreditCard,
      },
      {
        title: "Completed",
        value: `${completedPayments}`,
        icon: ShieldCheck,
      },
      {
        title: "Failed",
        value: `${failedPayments}`,
        icon: ArrowDownRight,
      },
      {
        title: "Total Revenue",
        value: typeof totalRevenue === "number" ? `$${totalRevenue.toFixed(2)}` : `${totalRevenue}`,
        icon: RotateCcw,
      },
    ];
  }, [stats]);

  const openRefund = (paymentId: string) => {
    setRefundPaymentId(paymentId);
    setRefundReason("");
    setRefundDialogOpen(true);
  };

  const submitRefund = async () => {
    if (!refundPaymentId) return;
    setIsRefunding(true);
    setRefundDialogOpen(false);

    try {
      const res = await adminRefundPayment({ paymentId: refundPaymentId, reason: refundReason || undefined });
      if (!res.success) {
        toast({
          title: "Refund failed",
          description: res.message || "Could not process refund",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Refund processed",
        description: res.message || `Refund submitted for ${refundPaymentId}`,
      });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      toast({
        title: "Refund failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRefunding(false);
      setRefundPaymentId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading payments…</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">{error}</div>
          <div className="mt-3">
            <Button size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg font-medium">Payments</CardTitle>
          <div className="text-xs text-muted-foreground">
            Recruiter-visible operational correctness metadata (refund + reconciliation visibility)
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setRefreshKey((k) => k + 1)}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      {cards.length > 0 && (
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {cards.map((c) => (
              <div key={c.title} className="rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{c.title}</div>
                  {c.icon ? <c.icon className="h-4 w-4 text-muted-foreground" /> : null}
                </div>
                <div className="mt-2 text-2xl font-bold">{c.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Correctness metadata</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead>Reconciliation</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {payments.map((payment) => {
                const id = resolvePaymentId(payment);
                const provider = resolveProvider(payment);
                const correctnessBadges = [
                  { label: "transactionId", present: !!payment.transactionId },
                  { label: "providerEventId", present: !!payment.providerEventId },
                  { label: "idempotencyKey", present: !!payment.idempotencyKey },
                ];

                const refundPresent = !!payment.refundedAt || !!payment.refundId;
                const refundBadgeCls = refundPresent
                  ? "bg-purple-100 text-purple-700"
                  : "bg-secondary text-foreground";

                const recon = computeReconciliationBadge(payment);

                const amount = typeof payment.amount === "number" ? payment.amount : payment.order?.totalPrice;
                const amountDisplay = typeof amount === "number" ? `$${amount.toFixed(2)}` : "-";

                return (
                  <TableRow key={id || payment.createdAt || Math.random()}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex flex-col">
                        <span>{id || "-"}</span>
                        <span className="text-xs text-muted-foreground">{formatWhen(payment.createdAt)}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex w-fit px-2 py-0.5 text-xs rounded-sm bg-secondary text-foreground capitalize">
                        {provider || "-"}
                      </span>
                    </TableCell>

                    <TableCell>
                      {payment.status ? (
                        <span className={`inline-flex w-fit px-2 py-0.5 text-xs rounded-sm ${useBadgeForStatus(payment.status)}`}>
                          {payment.status}
                        </span>
                      ) : (
                        <OrderStatusBadge status={"unknown"} />
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          {correctnessBadges.map((b) => (
                            <span key={b.label} className={`inline-flex w-fit px-2 py-0.5 text-xs rounded-sm ${useBadgeForPresence(b.present)}`}>
                              {b.label}: {b.present ? "set" : "missing"}
                            </span>
                          ))}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex w-fit px-2 py-0.5 text-xs rounded-sm ${refundBadgeCls}`}>
                          {refundPresent ? "refunded" : "not refunded"}
                        </span>
                        {payment.refundId ? (
                          <span className="text-xs text-muted-foreground">refundId: {payment.refundId}</span>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className={`inline-flex w-fit px-2 py-0.5 text-xs rounded-sm ${recon.cls}`}>{recon.label}</span>
                    </TableCell>

                    <TableCell className="text-right font-medium">{amountDisplay}</TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openRefund(id)}
                            disabled={(payment.status || "").toLowerCase() !== "completed" || refundPresent}
                          >
                            Refund
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process refund</AlertDialogTitle>
            <AlertDialogDescription>
              {refundPaymentId ? (
                <>
                  Refund payment <span className="font-mono">{refundPaymentId}</span>
                  {" "}
                  (idempotent)
                </>
              ) : (
                "Refund payment?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Optional refund reason (visible to ops):</div>
            <Input
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Reason"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRefunding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitRefund}
              disabled={isRefunding || !refundPaymentId}
            >
              {isRefunding ? "Refunding…" : "Refund"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}


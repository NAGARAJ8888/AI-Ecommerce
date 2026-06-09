"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import { toast } from "@/components/ui/use-toast";
import { MoreHorizontal, RefreshCcw } from "lucide-react";
import { adminGetOrdersAll, adminGetOrderStats, adminUpdateOrderStatus } from "@/lib/api-admin-orders";


import { OrderStatusTimeline } from "@/components/admin/order-status-timeline";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";

type AdminOrder = {
  _id?: string;
  id?: string;
  orderStatus?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: string;
  paymentStatus?: string;
  paymentInfo?: { status?: string };
  shippingAddress?: { city?: string; state?: string; country?: string };
  orderItems?: Array<{ name?: string; quantity?: number }>;
  statusHistory?: Array<{ status?: string; timestamp?: string }>; // optional
};

function resolveOrderId(order: AdminOrder) {
  return order.id || order._id || "";
}

function resolveOrderStatus(order: AdminOrder) {
  // Backend uses `orderStatus` values like "Processing", "Shipped", "Delivered", "Cancelled".
  return order.orderStatus || order.status || "unknown";
}


function resolvePaymentStatus(order: AdminOrder) {
  return (
    order.paymentStatus || order.paymentInfo?.status || "unknown"
  ).toString();
}

function normalizeHistory(order: AdminOrder) {
  const history = order.statusHistory;
  if (!Array.isArray(history) || history.length === 0) return [];
  return history
    .map((h) => ({
      status: (h.status || "").toString(),
      // Backend uses `changedAt` not `timestamp`
      timestamp: ((h as any).timestamp || (h as any).changedAt || "").toString(),
    }))
    .filter((h) => h.status.length > 0);
}


function formatOrderWhen(order: AdminOrder) {
  return order.createdAt || order.updatedAt || "-";
}

function countItems(order: AdminOrder) {
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];
  return items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
}


export function AdminOrdersPanel() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminGetOrdersAll({ page: 1, limit: 25 });
      if (!result.success) {
        setError(result.message || "Failed to fetch orders");
        return;
      }
      const list = (result.data?.orders || result.data?.data || []) as AdminOrder[];
      setOrders(list);

      // stats endpoint exists; for now keep it minimal (cards handled elsewhere)
      await adminGetOrderStats();
    } catch (e) {
      console.error(e);
      setError("An error occurred while fetching orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const statusOptions = useMemo(() => {
    // Must match backend enum values.
    return ["Processing", "Shipped", "Delivered", "Cancelled"];
  }, []);


  const openUpdate = (orderId: string, nextStatus: string) => {
    setSelectedOrderId(orderId);
    setPendingStatus(nextStatus);
    setUpdateDialogOpen(true);
  };

  const submitUpdate = async () => {
    if (!selectedOrderId || !pendingStatus) return;
    setIsUpdating(true);
    setUpdateDialogOpen(false);
    try {
      const res = await adminUpdateOrderStatus({ orderId: selectedOrderId, status: pendingStatus });
      if (!res.success) {
        toast({
          title: "Update failed",
          description: res.message || "Could not update order status",
          variant: "destructive",
        });
        setIsUpdating(false);
        return;
      }

      // optimistic refresh: re-fetch
      toast({
        title: "Order updated",
        description: `Status set to ${pendingStatus}`,
      });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setSelectedOrderId(null);
      setPendingStatus(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading orders…</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Orders</CardTitle>
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
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle className="text-lg font-medium">Orders</CardTitle>
          <div className="text-xs text-muted-foreground">
            Admin operational workflow (status + history)
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setRefreshKey((k) => k + 1)}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {orders.map((order) => {
                const id = resolveOrderId(order);
                const status = resolveOrderStatus(order);
                const when = formatOrderWhen(order);
                const history = normalizeHistory(order);
                const paymentStatus = resolvePaymentStatus(order);

                return (
                  <TableRow key={id || when}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex flex-col">
                        <span>{id || "-"}</span>
                        <span className="text-xs text-muted-foreground">
                          {history.length > 0
                            ? `Last update: ${history[0]?.timestamp || "-"}`
                            : "Last update: -"}

                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm font-medium">{order.user || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.shippingAddress &&
                        (order.shippingAddress.city || order.shippingAddress.state)
                          ? `${order.shippingAddress.city || ""}${
                              order.shippingAddress.state
                                ? ", " + order.shippingAddress.state
                                : ""
                            }`
                          : "—"}
                      </div>

                    </TableCell>

                    <TableCell className="text-muted-foreground">{when}</TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <OrderStatusBadge status={status} />
                        <div className="w-full max-w-[420px]">
                          <OrderStatusTimeline statusHistory={history} />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <OrderStatusBadge status={paymentStatus} />
                    </TableCell>

                    <TableCell className="text-right">{countItems(order)}</TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {statusOptions.map((next) => (
                            <DropdownMenuItem
                              key={next}
                              onClick={() => openUpdate(id, next)}
                              disabled={isUpdating}
                            >
                              Set to {next}
                            </DropdownMenuItem>
                          ))}
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

      <AlertDialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update order status</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedOrderId ? (
                <>
                  Update <span className="font-mono">{selectedOrderId}</span> to{" "}
                  <span className="font-semibold">{pendingStatus}</span>?
                </>
              ) : (
                "Update order status?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUpdateDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={submitUpdate} disabled={isUpdating}>
              {isUpdating ? "Updating…" : "Update"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}


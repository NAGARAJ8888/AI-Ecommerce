"use client";

import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Package, Eye } from "lucide-react";

interface Order {
  _id: string;
  createdAt: string;
  totalPrice: number;
  orderStatus: string;
}

interface OrderHistoryProps {
  orders: Order[];
  isLoading: boolean;
}

export function OrderHistory({ orders, isLoading }: OrderHistoryProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return "bg-green-500/10 text-green-600 hover:bg-green-500/20";
      case "processing": return "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20";
      case "shipped": return "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20";
      case "cancelled": return "bg-red-500/10 text-red-600 hover:bg-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-card">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
        <p className="text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-card">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No orders found</h3>
        <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
        <Button asChild>
          <a href="/products">Start Shopping</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order._id}>
              <TableCell className="font-mono text-xs">
                #{order._id.slice(-8).toUpperCase()}
              </TableCell>
              <TableCell>
                {format(new Date(order.createdAt), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={getStatusColor(order.orderStatus)}>
                  {order.orderStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                ${order.totalPrice.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

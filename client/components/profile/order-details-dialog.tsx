"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getOrderById } from "@/lib/api";
import { format } from "date-fns";
import { Eye, Package, MapPin, CreditCard, Clock, Loader2 } from "lucide-react";

interface OrderDetailsDialogProps {
  orderId: string;
  orderStatus: string;
  statusColor: string;
}

export function OrderDetailsDialog({ orderId, orderStatus, statusColor }: OrderDetailsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !order) {
      fetchOrderDetails();
    }
  }, [isOpen]);

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    try {
      const response = await getOrderById(orderId);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-xl font-light tracking-tight">
              Order Details
            </DialogTitle>
            <Badge variant="secondary" className={statusColor}>
              {orderStatus}
            </Badge>
          </div>
          <DialogDescription>
            Order #{orderId.slice(-8).toUpperCase()} • Placed on {order ? format(new Date(order.createdAt), "MMMM dd, yyyy") : "..."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Retrieving order information...</p>
          </div>
        ) : order ? (
          <div className="space-y-6 py-4">
            {/* Order Items */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Items
              </h4>
              <div className="space-y-3">
                {order.orderItems.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="relative h-16 w-16 rounded bg-secondary overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image || "/placeholder.jpg"} 
                        alt={item.name} 
                        className="object-cover h-full w-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      ${(item.quantity * item.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Shipping & Payment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shipping Address
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Method: {order.paymentMethod}</p>
                  <p>Status: <span className="capitalize">{order.paymentInfo.status}</span></p>
                  {order.paymentInfo.id !== "pending" && (
                    <p className="text-xs">ID: {order.paymentInfo.id}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shippingCost > 0 ? `$${order.shippingCost.toFixed(2)}` : "Free"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>${(order.tax ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 text-lg">
                <span>Total</span>
                <span>${(order.totalPrice ?? 0).toFixed(2)}</span>
              </div>
            </div>

            {order.deliveredAt && (
              <div className="bg-green-500/5 border border-green-500/20 rounded-md p-3 flex items-center gap-3">
                <Clock className="h-4 w-4 text-green-600" />
                <p className="text-xs text-green-700">
                  Delivered on {format(new Date(order.deliveredAt), "PPP")}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Failed to load order details.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

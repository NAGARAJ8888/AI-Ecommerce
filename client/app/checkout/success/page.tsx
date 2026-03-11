"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, ArrowRight } from "lucide-react";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const orderNumber = orderId || `ORD-${Date.now().toString(36).toUpperCase()}`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-light tracking-wide">
            Thank You for Your Order
          </h1>

          <p className="mt-4 text-muted-foreground">
            Your order has been confirmed and will be shipped soon.
          </p>

          <div className="mt-8 p-6 bg-secondary/50 text-left">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-5 w-5" />
              <span className="font-medium">Order Confirmation</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-mono">{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Delivery</span>
                <span>5-7 Business Days</span>
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            A confirmation email has been sent to your email address with your
            order details and tracking information.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
            <Link href="/products">
              <Button className="min-w-[180px] tracking-wide">
                CONTINUE SHOPPING
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="min-w-[180px]">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

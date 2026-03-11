"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Lock, CreditCard, Truck } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Shipping information state
  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "us",
  });
  const [shippingMethod, setShippingMethod] = useState("standard");

  // Payment information state
  const [paymentInfo, setPaymentInfo] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const handleShippingChange = (field: string, value: string) => {
    setShippingInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handlePaymentChange = (field: string, value: string) => {
    setPaymentInfo((prev) => ({ ...prev, [field]: value }));
  };

  const getShippingCost = () => {
    if (shippingMethod === "express") return 25;
    return totalPrice > 200 ? 0 : 15;
  };

  const shipping = getShippingCost();
  const total = totalPrice + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsProcessing(true);
      // Simulate order processing
      await new Promise((resolve) => setTimeout(resolve, 2000));
      clearCart();
      router.push("/checkout/success");
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-light mb-4">Your cart is empty</h1>
            <Link href="/products">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/cart"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Cart
          </Link>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            {["Shipping", "Payment", "Review"].map((label, idx) => (
              <div key={label} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                    step > idx + 1
                      ? "bg-foreground text-background"
                      : step === idx + 1
                        ? "bg-foreground text-background"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step > idx + 1 ? "✓" : idx + 1}
                </div>
                <span
                  className={`ml-2 text-sm hidden sm:inline ${
                    step >= idx + 1 ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
                {idx < 2 && (
                  <div
                    className={`w-12 sm:w-24 h-px mx-4 ${
                      step > idx + 1 ? "bg-foreground" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <div>
              <form onSubmit={handleSubmit}>
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-medium flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Shipping Information
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={shippingInfo.firstName}
                          onChange={(e) => handleShippingChange("firstName", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={shippingInfo.lastName}
                          onChange={(e) => handleShippingChange("lastName", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) => handleShippingChange("email", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={(e) => handleShippingChange("phone", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={shippingInfo.address}
                        onChange={(e) => handleShippingChange("address", e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={shippingInfo.city}
                          onChange={(e) => handleShippingChange("city", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={shippingInfo.postalCode}
                          onChange={(e) => handleShippingChange("postalCode", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={shippingInfo.country}
                        onValueChange={(value) => handleShippingChange("country", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="au">Australia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4">
                      <h3 className="text-sm font-medium mb-3">Shipping Method</h3>
                      <RadioGroup
                        value={shippingMethod}
                        onValueChange={setShippingMethod}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between p-4 border border-border rounded-sm">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="standard" id="standard" />
                            <Label htmlFor="standard" className="cursor-pointer">
                              <p className="font-medium">Standard Shipping</p>
                              <p className="text-sm text-muted-foreground">
                                5-7 business days
                              </p>
                            </Label>
                          </div>
                          <span className="font-medium">
                            {totalPrice > 200 ? "Free" : "$15.00"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 border border-border rounded-sm">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="express" id="express" />
                            <Label htmlFor="express" className="cursor-pointer">
                              <p className="font-medium">Express Shipping</p>
                              <p className="text-sm text-muted-foreground">
                                2-3 business days
                              </p>
                            </Label>
                          </div>
                          <span className="font-medium">$25.00</span>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-medium flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Details
                    </h2>

                    <div className="space-y-2">
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input
                        id="cardName"
                        value={paymentInfo.cardName}
                        onChange={(e) => handlePaymentChange("cardName", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={paymentInfo.cardNumber}
                        onChange={(e) => handlePaymentChange("cardNumber", e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input
                          id="expiry"
                          placeholder="MM/YY"
                          value={paymentInfo.expiry}
                          onChange={(e) => handlePaymentChange("expiry", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input
                          id="cvc"
                          placeholder="123"
                          value={paymentInfo.cvc}
                          onChange={(e) => handlePaymentChange("cvc", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4">
                      <Lock className="h-4 w-4" />
                      Your payment information is encrypted and secure.
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-medium">Review Order</h2>

                    <div className="space-y-4">
                      <div className="p-4 bg-secondary/50 rounded-sm">
                        <h3 className="text-sm font-medium mb-2">
                          Shipping Address
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {shippingInfo.firstName} {shippingInfo.lastName}
                          <br />
                          {shippingInfo.address}
                          <br />
                          {shippingInfo.city}, {shippingInfo.postalCode}
                          <br />
                          {shippingInfo.country === "us" && "United States"}
                          {shippingInfo.country === "ca" && "Canada"}
                          {shippingInfo.country === "uk" && "United Kingdom"}
                          {shippingInfo.country === "au" && "Australia"}
                        </p>
                      </div>

                      <div className="p-4 bg-secondary/50 rounded-sm">
                        <h3 className="text-sm font-medium mb-2">
                          Shipping Method
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {shippingMethod === "standard" ? "Standard Shipping" : "Express Shipping"}
                          <br />
                          {shippingMethod === "standard" ? "5-7 business days" : "2-3 business days"}
                        </p>
                      </div>

                      <div className="p-4 bg-secondary/50 rounded-sm">
                        <h3 className="text-sm font-medium mb-2">
                          Payment Method
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {paymentInfo.cardName}
                          <br />
                          {paymentInfo.cardNumber ? `**** ${paymentInfo.cardNumber.slice(-4)}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 mt-8">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(step - 1)}
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    type="submit"
                    className="flex-1 tracking-wide"
                    disabled={isProcessing}
                  >
                    {isProcessing
                      ? "Processing..."
                      : step === 3
                        ? "PLACE ORDER"
                        : "CONTINUE"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-secondary/50 p-6 sticky top-24">
                <h2 className="text-lg font-medium mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  {items.map((item: { product: { id: string; name: string; image: string; price: number }; quantity: number; size?: string; color?: string }) => (
                    <div
                      key={`${item.product.id}-${item.size}-${item.color}`}
                      className="flex gap-4"
                    >
                      <div className="relative h-20 w-16 flex-shrink-0 bg-secondary overflow-hidden">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.color && item.color}
                          {item.color && item.size && " / "}
                          {item.size && `Size ${item.size}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        ${item.product.price * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium text-base pt-3 border-t border-border">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

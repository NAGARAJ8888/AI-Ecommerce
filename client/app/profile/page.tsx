"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/lib/auth-context";
import { getOrders } from "@/lib/api";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
import { PersonalDetails } from "@/components/profile/personal-details";
import { OrderHistory } from "@/components/profile/order-history";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("details");
  const [orders, setOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (activeTab === "orders" && user) {
      fetchOrders();
    }
  }, [activeTab, user]);

  const fetchOrders = async () => {
    setIsOrdersLoading(true);
    try {
      const response = await getOrders();
      if (response.success) {
        setOrders(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-light tracking-wide">My Account</h1>
            <p className="text-muted-foreground mt-2">Welcome back, {user.name}</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <ProfileSidebar 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              onLogout={logout} 
            />
            
            <div className="flex-1">
              {activeTab === "details" && <PersonalDetails user={user} />}
              {activeTab === "orders" && <OrderHistory orders={orders} isLoading={isOrdersLoading} />}
              {(activeTab === "addresses" || activeTab === "settings") && (
                <div className="p-12 text-center border rounded-lg bg-card text-muted-foreground">
                  Section coming soon.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

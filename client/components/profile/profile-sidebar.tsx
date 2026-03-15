"use client";

import React, { useState } from "react";
import { User, Package, MapPin, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProfileSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export function ProfileSidebar({ activeTab, setActiveTab, onLogout }: ProfileSidebarProps) {
  const menuItems = [
    { id: "details", label: "Personal Details", icon: User },
    { id: "orders", label: "Order History", icon: Package },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col w-full md:w-64 bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold tracking-tight">Account</h2>
        <p className="text-sm text-muted-foreground">Manage your profile</p>
      </div>
      <nav className="flex-1 p-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
              activeTab === item.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

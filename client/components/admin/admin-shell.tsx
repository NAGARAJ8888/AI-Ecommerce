"use client";

import React from "react";
import type { AdminNavItem } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";

export function AdminShell({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchTermChange,
  onAddProduct,
  navItems,
  children,
}: {
  navItems: AdminNavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onAddProduct: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader
        searchTerm={searchTerm}
        onSearchTermChange={onSearchTermChange}
        onAddProduct={onAddProduct}
      />

      <div className="flex">
        <AdminSidebar items={navItems} activeTab={activeTab} onTabChange={onTabChange} />

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}


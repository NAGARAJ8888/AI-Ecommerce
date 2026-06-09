"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export type AdminNavItem = {
  name: string;
  // Rendered icon component
  icon: React.ComponentType<{ className?: string }>;
};

export function AdminSidebar({
  items,
  activeTab,
  onTabChange,
}: {
  items: AdminNavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border min-h-[calc(100vh-4rem)]">
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;
          return (
            <Button
              key={item.name}
              variant="ghost"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors justify-start h-auto ${
                isActive
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
              onClick={() => onTabChange(item.name)}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}


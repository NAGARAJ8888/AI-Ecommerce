"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ChevronLeft } from "lucide-react";

export function AdminHeader({
  searchTerm,
  onSearchTermChange,
  onAddProduct,
}: {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onAddProduct: () => void;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Store
          </Link>
          <div className="h-6 w-px bg-border" />
          <span className="text-lg font-bold tracking-[0.1em]">NOIR</span>
          <span className="text-xs bg-secondary px-2 py-0.5 rounded">ADMIN</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 w-[200px] lg:w-[300px]"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
            />
          </div>

          <Button size="sm" onClick={onAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>
    </header>
  );
}


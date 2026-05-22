"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const LOGGED_OUT_KEY = "auth:loggedOut";

function isLoggedOut(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(LOGGED_OUT_KEY) === "1";
}

function setLoggedOut(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(LOGGED_OUT_KEY, "1");
}

function clearLoggedOut(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(LOGGED_OUT_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load auth state from server via cookie session
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      console.log("Auth hydration start");

      if (isLoggedOut()) {
        console.log("Auth hydration skipped: explicit logged-out marker is set");
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        console.log("Auth hydration user restore attempt");
        const data = await fetchWithAuth<any>("/users/me", {
          method: "GET",
          credentials: "include",
        });

        if (!data.success) {
          console.log("Auth hydration user restore failed:", data);
          return;
        }
        if (cancelled) return;

        const u = data?.data;
        if (u) {
          console.log("Auth hydration user restored:", u._id);
          setUser({
            id: u._id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            isAdmin: u.role === "admin",
          });
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [API_URL]);


  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    console.log("document.cookie:", document.cookie);
    console.log("document.cookie includes XSRF-TOKEN:", document.cookie.includes("XSRF-TOKEN"));

    clearLoggedOut();

    const userData = {
      id: data.data._id,
      name: data.data.name,
      email: data.data.email,
      phone: data.data.phone,
      isAdmin: data.data.role === "admin",
    };

    setUser(userData);
  }, [API_URL]);


  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    const response = await fetch(`${API_URL}/users/register`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    clearLoggedOut();

    const userData = {
      id: data.data._id,
      name: data.data.name,
      email: data.data.email,
      phone: data.data.phone,
      isAdmin: data.data.role === "admin",
    };

    setUser(userData);
  }, [API_URL]);


  const logout = useCallback(async () => {
    try {
      const response = await fetchWithAuth("/users/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Logout response:", response);

      if (!response.success) {
        console.log("Logout failed:", response);
        return;
      }

      console.log("Logout succeeded");
      setLoggedOut();
      setUser(null);
      setToken(null);

      const protectedRoutes = ["/profile", "/checkout", "/admin"];
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
      if (isProtectedRoute) {
        router.push("/");
      }
    } catch (error) {
      console.log("Logout failed:", error);
      console.error("Logout error:", error);
    }
  }, [API_URL, router, pathname]);


  const updateUserInfo = useCallback((userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, ...userData };
    });
  }, []);


  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser: updateUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


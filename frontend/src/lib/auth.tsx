"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi } from "@/lib/api";

export type UserRole = "admin" | "manager" | "tester" | "developer";

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  must_change_password: boolean;
  organization_id: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await authApi.me();
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setUser(res.data.user);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Role-based permission helpers
export const canManageUsers = (role: UserRole) => role === "admin";
export const canManageProjects = (role: UserRole) => ["admin", "manager"].includes(role);
export const canCreateTestCases = (role: UserRole) => ["admin", "manager", "tester"].includes(role);
export const canExecuteTests = (role: UserRole) => ["admin", "manager", "tester"].includes(role);
export const canUpdateDefects = (role: UserRole) => ["admin", "developer"].includes(role);
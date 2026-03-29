"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, canManageUsers, canManageProjects } from "@/lib/auth";
import {
  LayoutDashboard, FolderKanban, ClipboardList, TestTube2,
  Play, Bug, BarChart3, Users, LogOut, ChevronRight, Settings
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "tester", "developer"] },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban, roles: ["admin", "manager", "tester", "developer"] },
  { href: "/dashboard/test-plans", label: "Test Plans", icon: ClipboardList, roles: ["admin", "manager", "tester", "developer"] },
  { href: "/dashboard/test-cases", label: "Test Cases", icon: TestTube2, roles: ["admin", "manager", "tester", "developer"] },
  { href: "/dashboard/execution", label: "Execution", icon: Play, roles: ["admin", "manager", "tester"] },
  { href: "/dashboard/defects", label: "Defects", icon: Bug, roles: ["admin", "manager", "tester", "developer"] },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3, roles: ["admin", "manager"] },
  { href: "/dashboard/users", label: "User Management", icon: Users, roles: ["admin"] },
];

const roleColors: Record<string, string> = {
  admin: "bg-purple-500/15 text-purple-400",
  manager: "bg-blue-500/15 text-blue-400",
  tester: "bg-emerald-500/15 text-emerald-400",
  developer: "bg-amber-500/15 text-amber-400",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user?.must_change_password) router.push("/change-password");
  }, [user, loading]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const visibleNav = navItems.filter(item => item.roles.includes(user.role));

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[hsl(var(--border))]">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
            <TestTube2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight">TestLink</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <div className="space-y-0.5">
            {visibleNav.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all group
                    ${active
                      ? "bg-blue-600/15 text-blue-400 font-medium"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-raised))]"
                    }`}>
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-blue-400" : "text-current"}`} />
                    {item.label}
                    {active && <ChevronRight className="w-3 h-3 ml-auto text-blue-400" />}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-[hsl(var(--border))] p-3">
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[hsl(var(--surface-raised))] transition-colors">
            <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-blue-400">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.full_name}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleColors[user.role] || "bg-zinc-500/15 text-zinc-400"}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
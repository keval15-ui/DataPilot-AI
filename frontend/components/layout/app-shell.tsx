"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BellIcon, HistoryIcon, LayoutDashboardIcon, MessageSquareTextIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, SettingsIcon, SparklesIcon, UploadIcon } from "@/components/ui/icons";
import { useTheme } from "@/components/layout/theme-provider";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/upload", label: "Upload", icon: UploadIcon },
  { href: "/chat", label: "Chat", icon: MessageSquareTextIcon },
  { href: "/history", label: "History", icon: HistoryIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Notification states
  interface Notification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    time: string;
  }

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window === "undefined") return [];

    const stored = window.localStorage.getItem("notifications");
    if (stored) {
      return JSON.parse(stored);
    }

    const initial: Notification[] = [
      { id: "welcome", title: "Welcome to DataPilot AI", message: "Start by uploading a dataset in the Upload page.", read: false, time: "Just now" },
      { id: "cors-fix", title: "API Gateway Connected", message: "FastAPI endpoints configured and operational.", read: true, time: "1h ago" },
      { id: "sqlite-fix", title: "SQLite Support Active", message: "Direct database uploads are now fully enabled.", read: true, time: "2h ago" },
    ];

    window.localStorage.setItem("notifications", JSON.stringify(initial));
    return initial;
  });
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Notifications are initialized lazily from localStorage.
  }, []);

  useEffect(() => {
    // Set up a listener for storage updates in same/other tabs
    const handleStorageChange = () => {
      if (typeof window !== "undefined") {
        const updated = window.localStorage.getItem("notifications");
        if (updated) setNotifications(JSON.parse(updated));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 3000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("notifications", JSON.stringify(updated));
    }
  };

  return (
    <div className="min-h-screen app-bg">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-3 py-3 sm:px-4 lg:px-6">
        <header className="relative z-50 mb-3 flex items-center justify-between rounded-full border border-white/10 bg-slate-950/70 px-4 py-3 shadow-[0_20px_80px_-30px_rgba(2,132,199,0.55)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/20">
                <SparklesIcon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-white">DataPilot AI</p>
                <p className="text-xs text-slate-400">Premium workspace</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden md:inline-flex">
              Upgrade
            </Button>
            
            {/* Notification Dropdown Container */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-full border border-white/10 bg-white/10 p-2.5 text-slate-200 hover:bg-white/20"
                aria-label="Toggle notifications"
              >
                <BellIcon size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl z-50">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Notifications</p>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-[10px] text-sky-400 hover:underline bg-transparent border-none">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 italic text-center py-4">No notifications.</p>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={cn(
                            "p-2.5 rounded-xl border text-xs transition", 
                            n.read 
                              ? "border-white/5 bg-transparent" 
                              : "border-sky-500/20 bg-sky-500/5 shadow-inner"
                          )}
                        >
                          <div className="flex items-center justify-between font-semibold text-white">
                            <p>{n.title}</p>
                            <span className="text-[9px] text-slate-500 font-normal">{n.time}</span>
                          </div>
                          <p className="mt-1 text-slate-400 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/20"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="rounded-full border border-white/10 bg-white/10 p-2 text-slate-200 hover:bg-white/20"
              aria-label="Toggle sidebar"
            >
              {collapsed ? <PanelLeftOpenIcon size={18} /> : <PanelLeftCloseIcon size={18} />}
            </button>
          </div>
        </header>

        <div className="flex flex-1 gap-3">
          <aside
            className={cn(
              "hidden rounded-[28px] border border-white/10 bg-slate-950/70 p-2 shadow-[0_20px_80px_-30px_rgba(2,132,199,0.55)] backdrop-blur-xl transition-all duration-300 md:flex md:flex-col",
              collapsed ? "w-20" : "w-64",
            )}
          >
            <nav className="flex-1 space-y-1 pt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-all duration-200",
                      active
                        ? "bg-gradient-to-r from-sky-500/20 to-violet-500/20 text-white shadow-inner"
                        : "text-slate-400 hover:bg-white/10 hover:text-white",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <Icon size={18} />
                    {!collapsed ? <span>{item.label}</span> : null}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Workspace</p>
              <p className="mt-2 text-sm font-medium text-white">AI-ready for growth</p>
            </div>
          </aside>

          <main className="flex-1 rounded-[32px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_20px_80px_-30px_rgba(2,132,199,0.55)] backdrop-blur-xl sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

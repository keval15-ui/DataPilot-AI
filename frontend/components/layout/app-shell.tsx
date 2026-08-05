"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HistoryIcon, LayoutDashboardIcon, MessageSquareTextIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, SettingsIcon, SparklesIcon, UploadIcon } from "@/components/ui/icons";
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(167,139,250,0.2),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-3 py-3 sm:px-4 lg:px-6">
        <header className="mb-3 flex items-center justify-between rounded-full border border-white/10 bg-slate-950/70 px-4 py-3 shadow-[0_20px_80px_-30px_rgba(2,132,199,0.55)] backdrop-blur-xl">
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

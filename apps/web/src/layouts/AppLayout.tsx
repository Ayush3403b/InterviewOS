import type { ReactNode } from "react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Shield,
  User,
  User2,
  Zap,
} from "lucide-react";

import { useAuthStore } from "../features/auth/store";
import { authApi } from "../features/auth";

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  recruiter: "Recruiter",
  faculty: "Faculty",
  admin: "Admin",
  super_admin: "Super Admin",
};

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/app" },
  { label: "Interviews", icon: BookOpen, to: "/app" },
  { label: "Tests", icon: ClipboardList, to: "/app/tests" },
  { label: "Analytics", icon: BarChart3, to: "/app/analytics" },
  { label: "History", icon: History, to: "/app" },
  { label: "Resume", icon: User2, to: "/app/resume" },
];

export function AppLayout({
  children,
  noPadding = false,
}: {
  children: ReactNode;
  noPadding?: boolean;
}) {
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Sign the user out locally regardless of API outcome.
    } finally {
      clearSession();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* ── Top Header Navigation Bar ────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-line bg-panel/90 backdrop-blur">
        <div className="flex h-16 w-full items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/app"
              className="font-display text-base font-bold tracking-tight text-ink flex items-center gap-2"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-signal text-white font-bold text-sm shadow-sm">
                OS
              </span>
              <span>InterviewOS</span>
            </Link>
          </div>

          <nav className="hidden items-center gap-6 sm:flex">
            <Link
              to="/app/tests"
              className="text-sm font-medium text-ink-soft hover:text-ink transition"
            >
              Tests
            </Link>
            <Link
              to="/app/resume"
              className="text-sm font-medium text-ink-soft hover:text-ink transition"
            >
              Resume
            </Link>
            <Link
              to="/app/analytics"
              className="text-sm font-medium text-ink-soft hover:text-ink transition"
            >
              Analytics
            </Link>
            {user &&
              ["recruiter", "faculty", "admin", "super_admin"].includes(
                user.role
              ) && (
                <Link
                  to="/app/proctoring/flagged"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink transition"
                >
                  <Shield className="h-3.5 w-3.5 text-warn" />
                  <span>Flagged</span>
                </Link>
              )}
          </nav>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2.5 rounded-full border border-line bg-panel py-1 pr-3 pl-1 text-sm shadow-sm hover:border-signal/40 transition active:scale-95"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-signal/10 text-signal">
                <User className="h-3.5 w-3.5" />
              </span>
              <span className="font-semibold text-ink">
                {user ? `${user.firstName} ${user.lastName}` : "Profile"}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-panel py-1.5 shadow-xl z-50">
                <div className="border-b border-line px-3.5 py-2.5">
                  <p className="truncate text-sm font-semibold text-ink">
                    {user?.email}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {user ? ROLE_LABELS[user.role] : ""}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm font-medium text-danger hover:bg-danger/5 transition disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Layout Body ─────────────────────────────────── */}
      {noPadding ? (
        <main
          className="flex-1 flex flex-col overflow-y-auto"
          style={{ height: "calc(100dvh - 4rem)" }}
        >
          {children}
        </main>
      ) : (
        <div className="flex flex-1 w-full">
          {/* ══════════════════ CONSTANT LEFT SIDEBAR ══════════════════════ */}
          <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col border-r border-line bg-panel p-4 lg:flex justify-between z-20">
            <div className="space-y-1">
              <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-soft/70">
                Menu
              </p>
              {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
                <NavLink
                  key={to + label}
                  to={to}
                  end={to === "/app"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-signal/10 text-signal font-semibold"
                        : "text-ink-soft hover:bg-surface hover:text-ink"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-signal" : "text-ink-soft/70"
                        }`}
                      />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Quick Practice Card at Bottom of Sidebar */}
            <div className="rounded-2xl bg-gradient-to-br from-signal/15 to-signal/5 border border-signal/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal/20 text-signal">
                  <Zap className="h-4 w-4" />
                </span>
                <p className="text-xs font-bold text-ink">Quick Practice</p>
              </div>
              <p className="text-[11px] text-ink-soft mb-3 leading-relaxed">
                Start a fast 5-question AI session to test your knowledge.
              </p>
              <Link
                to="/app"
                className="w-full inline-flex items-center justify-center rounded-xl bg-signal py-2 text-xs font-bold text-white shadow-sm hover:bg-signal-strong transition"
              >
                Practice Now
              </Link>
            </div>
          </aside>

          {/* ══════════════════ CONSTANT MAIN CONTENT ══════════════════════ */}
          <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

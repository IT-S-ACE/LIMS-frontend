import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  TestTube2,
  FlaskConical,
  FileText,
  Bell,
  CreditCard,
  Shield,
  Boxes,
  ScrollText,
  Settings,
  LogOut,
  UserCircle,
  Stethoscope,
  Building2,
  Beaker,
  AlertTriangle,
  ChevronRight,
  Search,
  Menu,
  BarChart3,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logoutFromApi } from "@/services/auth";
import { canAccessPath, defaultRouteForRole } from "@/lib/route-access";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [
      {
        to: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "receptionist", "technician"],
      },
      { to: "/portal", label: "My Portal", icon: Stethoscope, roles: ["patient"] },
    ],
  },
  {
    section: "Patient Flow",
    items: [
      { to: "/patients", label: "Patients", icon: Users, roles: ["admin", "receptionist"] },
      {
        to: "/test-requests",
        label: "Test Requests",
        icon: ClipboardList,
        roles: ["admin", "receptionist"],
      },
      {
        to: "/samples",
        label: "Samples",
        icon: TestTube2,
        roles: ["admin", "receptionist", "technician"],
      },
      {
        to: "/samples/track",
        label: "Track Sample",
        icon: Search,
        roles: ["admin", "receptionist", "technician"],
      },
      {
        to: "/tests",
        label: "Tests",
        icon: Beaker,
        roles: ["admin", "receptionist", "technician"],
      },
    ],
  },
  {
    section: "Laboratory",
    items: [
      { to: "/results", label: "Results", icon: FlaskConical, roles: ["admin", "technician"] },
      {
        to: "/reports",
        label: "Medical Reports",
        icon: FileText,
        roles: ["admin", "technician", "receptionist"],
      },
    ],
  },
  {
    section: "Finance",
    items: [
      { to: "/finance", label: "Financial Dashboard", icon: BarChart3, roles: ["admin"] },
      {
        to: "/finance/payments",
        label: "Payments",
        icon: CreditCard,
        roles: ["admin", "receptionist"],
      },
      { to: "/finance/balances", label: "Patient Balances", icon: Users, roles: ["admin"] },
      { to: "/finance/reports", label: "Financial Reports", icon: FileText, roles: ["admin"] },
      { to: "/reports/inventory", label: "Inventory Reports", icon: FileText, roles: ["admin"] },
    ],
  },
  {
    section: "Insurance",
    items: [
      { to: "/insurance/companies", label: "Companies", icon: Building2, roles: ["admin"] },
      { to: "/insurance/coverage", label: "Coverage Rules", icon: Shield, roles: ["admin"] },
    ],
  },
  {
    section: "Operations",
    items: [
      { to: "/inventory", label: "Inventory", icon: Boxes, roles: ["admin", "technician"] },
      { to: "/inventory/reagents/new", label: "Add Reagent", icon: Beaker, roles: ["admin"] },
      { to: "/audit", label: "Audit Log", icon: ScrollText, roles: ["admin"] },
      {
        to: "/notifications",
        label: "Notifications",
        icon: Bell,
        roles: ["admin", "receptionist", "technician", "patient"],
      },
    ],
  },
  {
    section: "Settings",
    items: [
      {
        to: "/profile",
        label: "My Profile",
        icon: UserCircle,
        roles: ["admin", "receptionist", "technician", "patient"],
      },
      { to: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
    ],
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const roleLabel: Record<Role, string> = {
  admin: "Administrator",
  receptionist: "Receptionist",
  technician: "Lab Technician",
  patient: "Patient",
};

export function AppShell({
  children,
  title,
  breadcrumbs,
  actions,
}: {
  children: ReactNode;
  title?: string;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
}) {
  const navigate = useNavigate();
  const user = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);
  const notifications = useStore((s) => s.notifications);
  const otpVerified = useStore((s) => s.otpVerified);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const allowed = user ? canAccessPath(user.role, pathname) : false;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user) navigate({ to: "/login" });
    else if (!otpVerified) navigate({ to: "/verify-otp" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, otpVerified]);

  useEffect(() => {
    if (!user || !otpVerified || allowed) return;

    toast.error("You do not have permission to open that page.");
    navigate({ to: defaultRouteForRole(user.role) });
  }, [allowed, navigate, otpVerified, user]);

  useEffect(() => {
    const el = document.getElementById("app-main-scroll");
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 4);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (!user || !otpVerified || !allowed) return null;

  const unread = notifications.filter((n) => !n.read && (!n.userId || n.userId === user.id)).length;

  async function handleLogout() {
    try {
      await logoutFromApi();
    } finally {
      logout();
      toast.success("Signed out successfully");
      navigate({ to: "/login" });
    }
  }

  const SidebarInner = ({ isMobile = false }: { isMobile?: boolean }) => {
    const isCollapsed = collapsed && !isMobile;
    return (
      <>
        <div
          className={cn(
            "h-16 border-b border-sidebar-border flex items-center gap-2.5 shrink-0",
            isCollapsed ? "px-3 justify-center" : "px-5",
          )}
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 grid place-items-center shadow-sm shrink-0">
            <FlaskConical className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-sidebar-foreground font-semibold leading-tight tracking-tight">
                MedLab LIMS
              </div>
              <div className="text-[11px] text-sidebar-foreground/55">Enterprise Edition</div>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex-1 overflow-y-auto sidebar-scroll py-4",
            isCollapsed ? "px-2" : "px-3",
          )}
        >
          <div className="space-y-5">
            {NAV.map((section) => {
              const items = section.items.filter((i) => i.roles.includes(user.role));
              if (!items.length) return null;
              return (
                <div key={section.section}>
                  {!isCollapsed && (
                    <div className="px-2 pb-1.5 text-[10px] uppercase tracking-[0.09em] text-sidebar-foreground/45 font-semibold">
                      {section.section}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const active =
                        pathname === item.to ||
                        (item.to !== "/" && pathname.startsWith(item.to + "/"));
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          title={isCollapsed ? item.label : undefined}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-lg text-sm transition-all duration-200",
                            isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                            active
                              ? "bg-sidebar-accent/80 text-sidebar-primary-foreground font-medium"
                              : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                          )}
                        >
                          {active && (
                            <motion.span
                              layoutId="sidebar-active-bar"
                              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-sidebar-primary"
                              transition={{ type: "spring", stiffness: 380, damping: 32 }}
                            />
                          )}
                          <Icon
                            className={cn(
                              "w-4 h-4 shrink-0 transition-colors",
                              active
                                ? "text-sidebar-primary"
                                : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/90",
                            )}
                          />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={cn("border-t border-sidebar-border p-3 shrink-0", isCollapsed && "px-2")}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="w-9 h-9 ring-2 ring-sidebar-border">
                <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary-foreground text-xs">
                  {initials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-lg bg-sidebar-accent/40 p-2.5 flex items-center gap-2.5">
              <Avatar className="w-9 h-9 ring-2 ring-sidebar-border/50 shrink-0">
                <AvatarFallback className="bg-sidebar-primary/25 text-sidebar-primary-foreground text-xs font-medium">
                  {initials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.fullName}
                </div>
                <div className="text-[10.5px] text-sidebar-foreground/55 truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  {roleLabel[user.role]}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors shrink-0"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[100] rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only"
      >
        Skip to main content
      </a>
      {/* Sidebar - desktop */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 260 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="hidden lg:flex bg-sidebar text-sidebar-foreground flex-col sticky top-0 h-screen border-r border-sidebar-border overflow-hidden"
      >
        <SidebarInner />
      </motion.aside>

      {/* Sidebar - mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar flex flex-col shadow-2xl"
            >
              <SidebarInner isMobile />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <header
          className={cn(
            "h-16 bg-card/85 backdrop-blur-xl border-b flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 transition-all duration-200",
            scrolled
              ? "border-border shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
              : "border-transparent",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <button
              className="lg:hidden p-2 -ml-1 rounded-md hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              className="hidden lg:grid place-items-center p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
            <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground min-w-0 ml-1">
              {breadcrumbs?.map((b, i) => (
                <div key={i} className="flex items-center gap-1.5 min-w-0">
                  {i > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                  )}
                  {b.to ? (
                    <Link to={b.to} className="hover:text-foreground truncate transition-colors">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium truncate">{b.label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {(user.role === "admin" || user.role === "receptionist") && (
              <div className="hidden md:flex items-center gap-2 bg-muted/70 hover:bg-muted rounded-lg px-2.5 py-1.5 w-72 border border-transparent focus-within:bg-card focus-within:border-border focus-within:shadow-sm transition-all">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  className="border-0 bg-transparent h-6 px-0 focus-visible:ring-0 shadow-none text-sm placeholder:text-muted-foreground/70"
                  placeholder="Search patients, samples, requests..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = (e.target as HTMLInputElement).value.trim();
                      if (v) navigate({ to: "/patients", search: { q: v } as never });
                    }
                  }}
                />
                <kbd className="hidden xl:inline-flex text-[10px] font-medium text-muted-foreground/70 bg-background border border-border rounded px-1.5 py-0.5">
                  ⌘K
                </kbd>
              </div>
            )}
            <Link to="/notifications">
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-lg hover:bg-muted"
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unread > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground rounded-full text-[10px] font-semibold grid place-items-center ring-2 ring-card"
                  >
                    {unread > 9 ? "9+" : unread}
                  </motion.span>
                )}
              </Button>
            </Link>
            <div className="w-px h-6 bg-border mx-1 hidden md:block" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-muted transition-colors">
                  <Avatar className="w-8 h-8 ring-2 ring-background">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-medium">
                      {initials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left leading-tight">
                    <div className="text-sm font-medium">{user.fullName}</div>
                    <div className="text-[11px] text-muted-foreground">{roleLabel[user.role]}</div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <div className="px-2 py-2">
                  <div className="text-sm font-medium">{user.fullName}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                  <Badge variant="secondary" className="mt-1.5 text-[10px] font-medium">
                    {roleLabel[user.role]}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                  <UserCircle className="w-4 h-4 mr-2" /> My Profile
                </DropdownMenuItem>
                {user.role !== "patient" && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                    <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                  </DropdownMenuItem>
                )}
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                    <Settings className="w-4 h-4 mr-2" /> Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div id="app-main-scroll" className="flex-1 overflow-y-auto">
          <main
            id="main-content"
            tabIndex={-1}
            className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full"
          >
            {(title || actions) && (
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                {title && (
                  <div className="min-w-0">
                    <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-foreground">
                      {title}
                    </h1>
                  </div>
                )}
                {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
              </div>
            )}
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-warning/12 text-warning-foreground border-warning/25",
    processing: "bg-info/12 text-info border-info/25",
    "in-progress": "bg-info/12 text-info border-info/25",
    completed: "bg-success/12 text-success border-success/25",
    cancelled: "bg-muted text-muted-foreground border-border",
    registered: "bg-secondary text-secondary-foreground border-border",
    collected: "bg-info/12 text-info border-info/25",
    received: "bg-info/12 text-info border-info/25",
    "in-analysis": "bg-primary/12 text-primary border-primary/25",
    in_progress: "bg-primary/12 text-primary border-primary/25",
    rejected: "bg-destructive/12 text-destructive border-destructive/25",
    entered: "bg-info/12 text-info border-info/25",
    draft: "bg-muted text-muted-foreground border-border",
    pending_review: "bg-info/12 text-info border-info/25",
    reviewed: "bg-primary/12 text-primary border-primary/25",
    correction_required: "bg-destructive/12 text-destructive border-destructive/25",
    approved: "bg-success/12 text-success border-success/25",
    normal: "bg-success/12 text-success border-success/25",
    low: "bg-info/12 text-info border-info/25",
    high: "bg-warning/12 text-warning-foreground border-warning/25",
    critical: "bg-destructive/12 text-destructive border-destructive/25",
    submitted: "bg-info/12 text-info border-info/25",
    paid: "bg-success/12 text-success border-success/25",
    routine: "bg-muted text-muted-foreground border-border",
    urgent: "bg-warning/12 text-warning-foreground border-warning/25",
    stat: "bg-destructive/12 text-destructive border-destructive/25",
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize font-medium rounded-full px-2.5 py-0.5 text-[11px]",
        map[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status.replace(/[-_]/g, " ")}
    </Badge>
  );
}

export function EmptyState({
  icon: Icon = AlertTriangle,
  title,
  description,
  action,
}: {
  icon?: typeof AlertTriangle;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center py-20 px-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 grid place-items-center mx-auto mb-4 shadow-sm ring-1 ring-border/60">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

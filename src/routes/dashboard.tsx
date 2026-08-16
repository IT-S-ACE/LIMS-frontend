import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FlaskConical,
  Gauge,
  Loader2,
  PackageX,
  RefreshCw,
  TestTube2,
  Timer,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useOperationalDashboard } from "@/hooks/use-dashboard";
import { useStore } from "@/lib/store";
import type { DashboardData, DashboardPeriod } from "@/services/dashboard";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

const REQUEST_COLORS: Record<string, string> = {
  pending: "var(--color-warning)",
  processing: "var(--color-info)",
  completed: "var(--color-success)",
  cancelled: "var(--color-muted-foreground)",
};

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function dateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function DashboardPage() {
  const user = useStore((state) => state.currentUser);
  const [period, setPeriod] = useState<DashboardPeriod>(7);
  const query = useOperationalDashboard(period);
  const dashboard = query.data;

  const requestDistribution = useMemo(
    () =>
      Object.entries(dashboard?.requestStatus ?? {}).map(([status, value]) => ({
        status,
        label: status.replace(/_/g, " "),
        value,
        color: REQUEST_COLORS[status] ?? "var(--color-muted-foreground)",
      })),
    [dashboard],
  );

  const canCreateRequest = user?.role === "admin" || user?.role === "receptionist";

  return (
    <AppShell
      title={`Welcome back, ${user?.fullName.split(" ")[0] ?? ""}`}
      breadcrumbs={[{ label: "Operational Dashboard" }]}
      actions={
        <>
          <Select
            value={String(period)}
            onValueChange={(value) => setPeriod(Number(value) as DashboardPeriod)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            title="Refresh dashboard"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
          </Button>
          {canCreateRequest && (
            <Link to="/test-requests/new">
              <Button>
                <ClipboardList className="mr-2 h-4 w-4" /> New Test Request
              </Button>
            </Link>
          )}
        </>
      }
    >
      {query.isLoading && <DashboardSkeleton />}

      {query.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dashboard unavailable</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>
              {query.error instanceof Error
                ? query.error.message
                : "The operational statistics could not be loaded."}
            </span>
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {dashboard && (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Live laboratory snapshot · {dashboard.period.from} to {dashboard.period.to}
            </span>
            <span>
              Updated {dateTime(dashboard.generatedAt)}
              {query.isFetching && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
            </span>
          </div>

          <KpiGrid dashboard={dashboard} />

          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Laboratory Activity
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  New requests compared with approved results
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={290}>
                  <AreaChart data={dashboard.activityTrend}>
                    <defs>
                      <linearGradient id="requests-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="results-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-chart-5)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-chart-5)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={11} stroke="var(--color-muted-foreground)" />
                    <YAxis
                      allowDecimals={false}
                      fontSize={11}
                      stroke="var(--color-muted-foreground)"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      name="Requests"
                      stroke="var(--color-chart-1)"
                      fill="url(#requests-gradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="completedResults"
                      name="Approved results"
                      stroke="var(--color-chart-5)"
                      fill="url(#results-gradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Status</CardTitle>
                <p className="text-sm text-muted-foreground">Current workflow distribution</p>
              </CardHeader>
              <CardContent>
                {requestDistribution.some((item) => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={requestDistribution}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={52}
                        outerRadius={82}
                        paddingAngle={2}
                      >
                        {requestDistribution.map((item) => (
                          <Cell key={item.status} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <CompactEmpty message="No test requests have been recorded yet." />
                )}
              </CardContent>
            </Card>
          </div>

          <AttentionSection dashboard={dashboard} />

          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <InventoryCard dashboard={dashboard} />
            <TopTestsCard dashboard={dashboard} />
          </div>

          <RecentRequestsCard dashboard={dashboard} />
        </>
      )}
    </AppShell>
  );
}

function KpiGrid({ dashboard }: { dashboard: DashboardData }) {
  const statistics = dashboard.statistics;
  const finalMetric = dashboard.permissions.financial
    ? {
        label: "Revenue Today",
        value: money(statistics.revenueToday ?? 0),
        detail: "Collected payments",
        icon: BadgeDollarSign,
        tone: "bg-success/10 text-success",
      }
    : {
        label: "Approved Today",
        value: statistics.completedToday,
        detail: "Completed results",
        icon: CheckCircle2,
        tone: "bg-success/10 text-success",
      };

  const cards: KpiProps[] = [
    {
      label: "Patients",
      value: statistics.patientsTotal,
      detail: "Total registered",
      icon: Users,
      tone: "bg-primary/10 text-primary",
    },
    {
      label: "Requests Today",
      value: statistics.requestsToday,
      detail: `${statistics.requestsInPeriod} in selected period`,
      icon: ClipboardList,
      tone: "bg-info/10 text-info",
    },
    {
      label: "Samples in Lab",
      value: statistics.samplesInLab,
      detail: "Collected or in progress",
      icon: TestTube2,
      tone: "bg-warning/10 text-warning-foreground",
    },
    {
      label: "Pending Results",
      value: statistics.pendingResults,
      detail: `${statistics.completedToday} approved today`,
      icon: FlaskConical,
      tone: "bg-accent text-accent-foreground",
    },
    {
      label: "Critical Results",
      value: statistics.criticalResults,
      detail: statistics.criticalResults > 0 ? "Requires attention" : "No open alerts",
      icon: AlertTriangle,
      tone: "bg-destructive/10 text-destructive",
    },
    finalMetric,
  ];

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Gauge className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">Request completion rate</span>
                <span className="font-semibold">{statistics.completionRate}%</span>
              </div>
              <Progress className="mt-2" value={statistics.completionRate} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-info/10 text-info">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-medium">Average sample turnaround</div>
              <div className="text-xl font-semibold">
                {statistics.averageTurnaroundHours.toLocaleString()} hours
              </div>
              <div className="text-xs text-muted-foreground">Completed samples in this period</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

interface KpiProps {
  label: string;
  value: ReactNode;
  detail: string;
  icon: LucideIcon;
  tone: string;
}

function KpiCard({ label, value, detail, icon: Icon, tone }: KpiProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`grid h-9 w-9 place-items-center rounded-md ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="mt-3 text-2xl font-bold">{value}</div>
        <div className="text-xs font-medium">{label}</div>
        <div className="mt-1 truncate text-[11px] text-muted-foreground">{detail}</div>
      </CardContent>
    </Card>
  );
}

function AttentionSection({ dashboard }: { dashboard: DashboardData }) {
  const critical = dashboard.attention.criticalResults;
  const overdue = dashboard.attention.overdueSamples;

  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-2">
      <Card className={critical.length > 0 ? "border-destructive/40" : undefined}>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Critical Results
            </CardTitle>
            <p className="text-sm text-muted-foreground">Unapproved critical values</p>
          </div>
          <Link to="/results">
            <Button variant="ghost" size="sm">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {critical.length === 0 ? (
            <CompactEmpty success message="No unapproved critical results." />
          ) : (
            critical.map((result) => (
              <Link
                key={result.id}
                to="/results/$id"
                params={{ id: result.id }}
                className="flex items-center justify-between gap-3 rounded-md border border-destructive/20 p-3 hover:bg-destructive/5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {result.patient ?? "Unknown patient"} · {result.test ?? "Unknown test"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {result.resultNumber} · {result.sampleNumber ?? "No sample number"}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-semibold text-destructive">
                    {result.value} {result.unit}
                  </div>
                  <StatusBadge status={result.workflowStatus} />
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card className={overdue.length > 0 ? "border-warning/40" : undefined}>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-warning-foreground" /> Overdue Samples
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Waiting in the lab for more than 24 hours
            </p>
          </div>
          <Link to="/samples">
            <Button variant="ghost" size="sm">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {overdue.length === 0 ? (
            <CompactEmpty success message="No overdue laboratory samples." />
          ) : (
            overdue.map((sample) => (
              <Link
                key={sample.id}
                to="/samples/$id"
                params={{ id: sample.id }}
                className="flex items-center justify-between gap-3 rounded-md border p-3 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {sample.sampleNumber} · {sample.patient ?? "Unknown patient"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {sample.requestNumber ?? sample.barcode}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold">{sample.waitingHours}h</div>
                  <StatusBadge status={sample.status} />
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InventoryCard({ dashboard }: { dashboard: DashboardData }) {
  const inventory = dashboard.inventory;

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <PackageX className="h-4 w-4 text-warning-foreground" /> Inventory Attention
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {inventory.lowStockItems} low stock · {inventory.expiredLots} expired lots ·{" "}
            {inventory.expiringSoonLots} expiring soon
          </p>
        </div>
        <Link to="/inventory">
          <Button variant="ghost" size="sm">
            Inventory <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {inventory.items.length === 0 ? (
          <CompactEmpty success message="All reagents are above their minimum stock level." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {inventory.items.map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{item.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{item.code}</div>
                  </div>
                  <span className="text-sm font-semibold text-destructive">
                    {item.stock} / {item.minimum}
                  </span>
                </div>
                {item.nearestExpiry && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Nearest expiry: {item.nearestExpiry}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TopTestsCard({ dashboard }: { dashboard: DashboardData }) {
  const maximum = Math.max(...dashboard.topTests.map((test) => test.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Requested Tests</CardTitle>
        <p className="text-sm text-muted-foreground">Selected reporting period</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {dashboard.topTests.length === 0 ? (
          <CompactEmpty message="No test activity in this period." />
        ) : (
          dashboard.topTests.map((test) => (
            <div key={test.testId}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{test.testName}</span>
                <span className="font-semibold">{test.count}</span>
              </div>
              <Progress value={(test.count / maximum) * 100} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function RecentRequestsCard({ dashboard }: { dashboard: DashboardData }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Recent Test Requests</CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest registrations across the laboratory
          </p>
        </div>
        <Link to="/test-requests">
          <Button variant="ghost" size="sm">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {dashboard.recentRequests.length === 0 ? (
          <CompactEmpty message="No test requests have been registered." />
        ) : (
          dashboard.recentRequests.map((request) => (
            <Link
              key={request.id}
              to="/test-requests/$id"
              params={{ id: request.id }}
              className="flex items-center justify-between gap-3 rounded-md border p-3 hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded bg-primary/10 text-primary">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {request.requestNumber} · {request.patient ?? "Unknown patient"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {request.testsCount} {request.testsCount === 1 ? "test" : "tests"} ·{" "}
                    {dateTime(request.createdAt)}
                  </div>
                </div>
              </div>
              <StatusBadge status={request.status} />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CompactEmpty({ message, success = false }: { message: string; success?: boolean }) {
  const Icon = success ? CheckCircle2 : ClipboardList;

  return (
    <div className="flex min-h-24 items-center justify-center gap-2 rounded-md border border-dashed px-4 text-center text-sm text-muted-foreground">
      <Icon className={`h-4 w-4 ${success ? "text-success" : ""}`} />
      {message}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-2" />
        <Skeleton className="h-96" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

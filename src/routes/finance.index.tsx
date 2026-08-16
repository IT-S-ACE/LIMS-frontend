import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  ArrowRight,
  DollarSign,
  Loader2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFinancialReport } from "@/hooks/use-finance";

export const Route = createFileRoute("/finance/")({ component: FinanceDashboard });

type Range = "7" | "30" | "90";

const COLORS = ["var(--color-primary)", "var(--color-chart-2)"];

function dateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function reportRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - (days - 1));
  return { from: dateOnly(from), to: dateOnly(to) };
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function FinanceDashboard() {
  const [range, setRange] = useState<Range>("30");
  const dates = useMemo(() => reportRange(Number(range)), [range]);
  const reportQuery = useFinancialReport(dates);
  const report = reportQuery.data;

  const trend = useMemo(() => {
    if (!report) return [];
    const collections = new Map(report.collectionTrend.map((row) => [row.period, row.amount]));
    return report.billingTrend.map((row) => ({
      ...row,
      collected: collections.get(row.period) ?? 0,
    }));
  }, [report]);

  return (
    <AppShell
      title="Financial Dashboard"
      breadcrumbs={[{ label: "Finance" }, { label: "Dashboard" }]}
      actions={
        <div className="flex gap-2">
          <Select value={range} onValueChange={(value) => setRange(value as Range)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Link to="/finance/reports">
            <Button>
              Detailed Reports <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      }
    >
      {reportQuery.isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading financial dashboard...
          </CardContent>
        </Card>
      )}

      {reportQuery.isError && (
        <Card className="border-destructive">
          <CardContent className="py-6 text-destructive">
            {reportQuery.error instanceof Error
              ? reportQuery.error.message
              : "Unable to load financial data."}
          </CardContent>
        </Card>
      )}

      {report && (
        <>
          <div className="mb-2 text-xs text-muted-foreground">
            {dates.from} to {dates.to}
            {reportQuery.isFetching && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
          </div>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              label="Gross Billed"
              value={money(report.summary.grossBilled)}
              icon={<TrendingUp />}
            />
            <Kpi
              label="Collected"
              value={money(report.summary.patientCollected)}
              icon={<DollarSign />}
            />
            <Kpi
              label="Insurance Covered"
              value={money(report.summary.insuranceCovered)}
              icon={<ShieldCheck />}
            />
            <Kpi
              label="Current Outstanding"
              value={money(report.summary.currentOutstanding)}
              icon={<AlertCircle />}
              warn
            />
          </div>

          <div className="mb-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Billing vs Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trend}>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip formatter={(value) => money(Number(value))} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="grossBilled"
                      name="Gross billed"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="collected"
                      name="Collected"
                      stroke="var(--color-chart-4)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                {report.summary.patientCollected === 0 ? (
                  <div className="py-28 text-center text-sm text-muted-foreground">
                    No payments in this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={report.paymentMethods}
                        dataKey="amount"
                        nameKey="method"
                        innerRadius={52}
                        outerRadius={90}
                      >
                        {report.paymentMethods.map((row, index) => (
                          <Cell key={row.method} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => money(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Tests</CardTitle>
              </CardHeader>
              <CardContent>
                {report.topTests.length === 0 ? (
                  <div className="py-20 text-center text-sm text-muted-foreground">
                    No invoiced tests in this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={report.topTests.slice(0, 5)} layout="vertical">
                      <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={11} />
                      <YAxis type="category" dataKey="testName" width={120} fontSize={11} />
                      <Tooltip formatter={(value) => money(Number(value))} />
                      <Bar
                        dataKey="grossBilled"
                        name="Gross billed"
                        fill="var(--color-primary)"
                        radius={[0, 5, 5, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.recentPayments.slice(0, 6).map((payment) => (
                      <TableRow key={payment.paymentId}>
                        <TableCell className="text-xs">
                          {new Date(payment.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{payment.patientName ?? "—"}</TableCell>
                        <TableCell className="capitalize">{payment.method}</TableCell>
                        <TableCell className="text-right font-medium">
                          {money(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {report.recentPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                          No payments in this period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Kpi({
  label,
  value,
  icon,
  warn = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={`[&>svg]:h-4 [&>svg]:w-4 ${warn ? "text-amber-600" : "text-primary"}`}>
            {icon}
          </div>
        </div>
        <div className={`mt-1 text-2xl font-bold ${warn ? "text-amber-600" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

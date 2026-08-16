import { createFileRoute } from "@tanstack/react-router";
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
import { Download, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Field } from "@/components/form-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFinancialReport } from "@/hooks/use-finance";
import { exportFinancialReport } from "@/services/finance";

export const Route = createFileRoute("/finance/reports")({ component: FinancialReports });

type Preset = "today" | "month" | "year" | "custom";

const COLORS = ["var(--color-primary)", "var(--color-chart-2)"];

function dateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function presetRange(preset: Exclude<Preset, "custom">): { from: string; to: string } {
  const now = new Date();
  if (preset === "today") return { from: dateOnly(now), to: dateOnly(now) };
  if (preset === "month") {
    return { from: dateOnly(new Date(now.getFullYear(), now.getMonth(), 1)), to: dateOnly(now) };
  }
  return { from: dateOnly(new Date(now.getFullYear(), 0, 1)), to: dateOnly(now) };
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function FinancialReports() {
  const initial = presetRange("month");
  const [preset, setPreset] = useState<Preset>("month");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [exporting, setExporting] = useState(false);
  const validRange = Boolean(from && to && from <= to);
  const reportQuery = useFinancialReport({ from, to });
  const report = reportQuery.data;

  const trend = useMemo(() => {
    if (!report) return [];
    const collections = new Map(report.collectionTrend.map((row) => [row.period, row.amount]));
    return report.billingTrend.map((row) => ({
      ...row,
      collected: collections.get(row.period) ?? 0,
    }));
  }, [report]);

  function choosePreset(next: Preset) {
    setPreset(next);
    if (next !== "custom") {
      const range = presetRange(next);
      setFrom(range.from);
      setTo(range.to);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportFinancialReport({ from, to });
      toast.success("Financial report exported successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Financial report export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppShell
      title="Financial Reports"
      breadcrumbs={[{ label: "Finance", to: "/finance" }, { label: "Reports" }]}
      actions={
        <div className="flex gap-2 print:hidden">
          <Button
            variant="outline"
            onClick={() => window.print()}
            disabled={!report || !validRange}
          >
            <Printer className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!report || !validRange || exporting}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        </div>
      }
    >
      <div className="mb-4 space-y-3 print:hidden">
        <div className="flex flex-wrap gap-2">
          {(["today", "month", "year", "custom"] as Preset[]).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={preset === value ? "default" : "outline"}
              onClick={() => choosePreset(value)}
            >
              {value === "today"
                ? "Today"
                : value === "month"
                  ? "This Month"
                  : value === "year"
                    ? "This Year"
                    : "Custom Range"}
            </Button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
            <Field label="From">
              <Input
                type="date"
                value={from}
                max={to}
                onChange={(event) => setFrom(event.target.value)}
              />
            </Field>
            <Field label="To">
              <Input
                type="date"
                value={to}
                min={from}
                onChange={(event) => setTo(event.target.value)}
              />
            </Field>
          </div>
        )}
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        Billing uses invoice creation dates; collections use payment recording dates. Period: {from}{" "}
        to {to}.
      </div>

      {!validRange && (
        <Card className="mb-4 border-destructive">
          <CardContent className="py-4 text-sm text-destructive">
            Select a valid date range where the end date is not before the start date.
          </CardContent>
        </Card>
      )}

      {reportQuery.isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading financial report...
          </CardContent>
        </Card>
      )}

      {reportQuery.isError && (
        <Card className="border-destructive">
          <CardContent className="py-6 text-destructive">
            {reportQuery.error instanceof Error
              ? reportQuery.error.message
              : "Unable to load the financial report."}
          </CardContent>
        </Card>
      )}

      {report && (
        <>
          <div className="mb-2 text-xs text-muted-foreground">
            {report.period.days} day{report.period.days === 1 ? "" : "s"} · chart grouped by{" "}
            {report.period.granularity}
            {reportQuery.isFetching && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Gross Billed" value={money(report.summary.grossBilled)} />
            <Kpi label="Insurance Covered" value={money(report.summary.insuranceCovered)} />
            <Kpi label="Patient Billed" value={money(report.summary.patientBilled)} />
            <Kpi label="Collected in Period" value={money(report.summary.patientCollected)} />
            <Kpi
              label="Outstanding from Period"
              value={money(report.summary.periodOutstanding)}
              tone="warn"
            />
            <Kpi
              label="Current Outstanding (All Time)"
              value={money(report.summary.currentOutstanding)}
              tone="warn"
            />
            <Kpi label="Invoices" value={String(report.summary.invoicesCount)} />
            <Kpi label="Payments" value={String(report.summary.paymentsCount)} />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Paid Invoices" value={String(report.summary.paidInvoicesCount)} />
            <Kpi
              label="Unpaid Invoices"
              value={String(report.summary.unpaidInvoicesCount)}
              tone="warn"
            />
            <Kpi label="Coverage Rate" value={`${report.summary.coverageRate.toFixed(2)}%`} />
            <Kpi label="Collection Rate" value={`${report.summary.collectionRate.toFixed(2)}%`} />
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="print:hidden">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
              <TabsTrigger value="coverage">Insurance Coverage</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Billing and Collection Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
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
                        dataKey="insuranceCovered"
                        name="Insurance"
                        stroke="var(--color-chart-2)"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="patientDue"
                        name="Patient due"
                        stroke="var(--color-chart-3)"
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
            </TabsContent>

            <TabsContent value="tests">
              <Card>
                <CardHeader>
                  <CardTitle>Top Tests by Billed Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Test</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">Insurance</TableHead>
                        <TableHead className="text-right">Patient Due</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.topTests.map((row) => (
                        <TableRow key={row.testId ?? row.testName}>
                          <TableCell className="font-medium">{row.testName}</TableCell>
                          <TableCell className="text-right">{row.quantity}</TableCell>
                          <TableCell className="text-right">{money(row.grossBilled)}</TableCell>
                          <TableCell className="text-right">
                            {money(row.insuranceCovered)}
                          </TableCell>
                          <TableCell className="text-right">{money(row.patientDue)}</TableCell>
                        </TableRow>
                      ))}
                      {report.topTests.length === 0 && (
                        <EmptyRow columns={5} label="No invoiced tests in this period" />
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coverage">
              <Card>
                <CardHeader>
                  <CardTitle>Coverage by Insurance Company</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead className="text-right">Invoices</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">Covered</TableHead>
                        <TableHead className="text-right">Patient Due</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.coverageByCompany.map((row) => (
                        <TableRow key={row.companyId}>
                          <TableCell>
                            <div className="font-medium">{row.companyName}</div>
                            <div className="text-xs text-muted-foreground">{row.companyCode}</div>
                          </TableCell>
                          <TableCell className="text-right">{row.invoicesCount}</TableCell>
                          <TableCell className="text-right">{money(row.grossBilled)}</TableCell>
                          <TableCell className="text-right">
                            {money(row.insuranceCovered)}
                          </TableCell>
                          <TableCell className="text-right">{money(row.patientDue)}</TableCell>
                          <TableCell className="text-right">
                            {row.coverageRate.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                      {report.coverageByCompany.length === 0 && (
                        <EmptyRow columns={6} label="No insured invoices in this period" />
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {report.summary.patientCollected === 0 ? (
                      <div className="py-20 text-center text-sm text-muted-foreground">
                        No payments in this period
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={report.paymentMethods}
                            dataKey="amount"
                            nameKey="method"
                            innerRadius={48}
                            outerRadius={84}
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
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Collections by Period</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={report.collectionTrend}>
                        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                        <XAxis dataKey="label" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip formatter={(value) => money(Number(value))} />
                        <Bar
                          dataKey="amount"
                          name="Collected"
                          fill="var(--color-primary)"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Payments in Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Request</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Recorded By</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.recentPayments.map((row) => (
                        <TableRow key={row.paymentId}>
                          <TableCell className="text-xs">
                            {new Date(row.date).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{row.paymentNumber}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {row.requestNumber ?? "—"}
                          </TableCell>
                          <TableCell>{row.patientName ?? "—"}</TableCell>
                          <TableCell className="capitalize">{row.method}</TableCell>
                          <TableCell>{row.recordedBy ?? "—"}</TableCell>
                          <TableCell className="text-right font-medium">
                            {money(row.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {report.recentPayments.length === 0 && (
                        <EmptyRow columns={7} label="No payments in this period" />
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </AppShell>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`mt-1 text-2xl font-bold ${tone === "warn" ? "text-amber-600" : ""}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyRow({ columns, label }: { columns: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={columns} className="py-8 text-center text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  );
}

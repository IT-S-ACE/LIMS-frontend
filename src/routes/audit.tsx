import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  FileClock,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { useAuditLogs } from "@/hooks/use-audit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  exportAuditLogs,
  type AuditFilters,
  type AuditIntegrity,
  type AuditRecord,
  type AuditResult,
} from "@/services/audit";

export const Route = createFileRoute("/audit")({ component: AuditPage });

const ALL = "__all__";

function displayRole(role: string): string {
  return role === "lab_technician"
    ? "Lab Technician"
    : role.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayAction(action: string): string {
  return action.replaceAll("_", " ");
}

function shortId(id: string): string {
  if (id === "00000000-0000-0000-0000-000000000000") return "System";
  return id.length > 18 ? `${id.slice(0, 8)}…${id.slice(-6)}` : id;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function ResultBadge({ result }: { result: AuditResult }) {
  return result === "SUCCESS" ? (
    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
      SUCCESS
    </Badge>
  ) : (
    <Badge variant="destructive">DENIED</Badge>
  );
}

function IntegrityBadge({ status }: { status: AuditIntegrity }) {
  if (status === "VERIFIED") {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
        <ShieldCheck className="mr-1 h-3 w-3" /> Verified
      </Badge>
    );
  }

  if (status === "FAILED") {
    return (
      <Badge variant="destructive">
        <ShieldAlert className="mr-1 h-3 w-3" /> Failed
      </Badge>
    );
  }

  return <Badge variant="outline">Legacy</Badge>;
}

function AuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actorRole, setActorRole] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [result, setResult] = useState<AuditResult | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<AuditRecord | null>(null);
  const [exporting, setExporting] = useState(false);

  const filters: AuditFilters = {
    page,
    perPage: 20,
    search: search || undefined,
    actorRole: actorRole || undefined,
    action: action || undefined,
    entityType: entityType || undefined,
    result: result || undefined,
    from: from || undefined,
    to: to || undefined,
  };
  const query = useAuditLogs(filters);
  const data = query.data;

  function clearFilters() {
    setPage(1);
    setSearch("");
    setActorRole("");
    setAction("");
    setEntityType("");
    setResult("");
    setFrom("");
    setTo("");
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportAuditLogs(filters);
      toast.success("Audit trail exported successfully");
      void query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Audit export failed");
    } finally {
      setExporting(false);
    }
  }

  const columns: Column<AuditRecord>[] = [
    {
      key: "time",
      header: "Timestamp",
      cell: (record) => (
        <div className="whitespace-nowrap text-sm">
          {new Date(record.occurredAt).toLocaleString()}
        </div>
      ),
      sortValue: (record) => record.occurredAt,
    },
    {
      key: "actor",
      header: "Actor",
      cell: (record) => (
        <div>
          <div className="font-medium">{record.actor.name}</div>
          <div className="text-xs text-muted-foreground">{displayRole(record.actor.role)}</div>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (record) => <Badge variant="secondary">{displayAction(record.action)}</Badge>,
    },
    {
      key: "result",
      header: "Result",
      cell: (record) => <ResultBadge result={record.result} />,
    },
    {
      key: "entity",
      header: "Entity",
      cell: (record) => (
        <div>
          <div className="text-sm font-medium">{record.entity.type}</div>
          <div className="font-mono text-xs text-muted-foreground" title={record.entity.id}>
            {shortId(record.entity.id)}
          </div>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      cell: (record) => (
        <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">
          {record.reason ?? "—"}
        </span>
      ),
    },
    {
      key: "integrity",
      header: "Integrity",
      cell: (record) => <IntegrityBadge status={record.integrity.status} />,
    },
    {
      key: "view",
      header: "",
      className: "w-16",
      cell: (record) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            setSelected(record);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <AppShell
      title="Immutable Audit Trail"
      breadcrumbs={[{ label: "Operations" }, { label: "Audit Trail" }]}
      actions={
        <Button variant="outline" onClick={handleExport} disabled={exporting || !data}>
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export CSV
        </Button>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Matching Events"
          value={data?.summary.total ?? 0}
          icon={<FileClock className="h-4 w-4" />}
        />
        <SummaryCard
          label="Successful"
          value={data?.summary.success ?? 0}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        />
        <SummaryCard
          label="Denied"
          value={data?.summary.denied ?? 0}
          icon={<ShieldAlert className="h-4 w-4 text-destructive" />}
        />
        <SummaryCard
          label="Today"
          value={data?.summary.today ?? 0}
          icon={<ShieldCheck className="h-4 w-4 text-primary" />}
        />
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              label="Actor role"
              value={actorRole}
              options={data?.options.actorRoles ?? []}
              onChange={(value) => {
                setActorRole(value);
                setPage(1);
              }}
            />
            <FilterSelect
              label="Action"
              value={action}
              options={data?.options.actions ?? []}
              onChange={(value) => {
                setAction(value);
                setPage(1);
              }}
            />
            <FilterSelect
              label="Entity"
              value={entityType}
              options={data?.options.entityTypes ?? []}
              onChange={(value) => {
                setEntityType(value);
                setPage(1);
              }}
            />
            <FilterSelect
              label="Result"
              value={result}
              options={["SUCCESS", "DENIED"]}
              onChange={(value) => {
                setResult(value as AuditResult | "");
                setPage(1);
              }}
            />
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              From date
              <Input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              To date
              <Input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => {
                  setTo(event.target.value);
                  setPage(1);
                }}
              />
            </label>
            <div className="flex items-end sm:col-span-2">
              <Button variant="ghost" onClick={clearFilters}>
                Clear all filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {query.isError && (
        <Card className="mb-4 border-destructive">
          <CardContent className="py-4 text-sm text-destructive">
            {query.error instanceof Error ? query.error.message : "Unable to load audit logs."}
          </CardContent>
        </Card>
      )}

      <DataTable
        rows={data?.rows ?? []}
        columns={columns}
        emptyTitle={query.isLoading ? "Loading audit trail..." : "No audit events found"}
        emptyDescription="Try clearing one or more filters."
        rowAction={setSelected}
        onExport={() => void handleExport()}
        hideExport
        serverState={{
          search,
          onSearchChange: setSearch,
          page,
          totalPages: data?.pagination.last_page ?? 1,
          total: data?.pagination.total ?? 0,
          onPageChange: setPage,
          isFetching: query.isFetching,
        }}
      />

      <AuditDetails record={selected} onClose={() => setSelected(null)} />
    </AppShell>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</div>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-xs font-medium text-muted-foreground">
      {label}
      <Select value={value || ALL} onValueChange={(next) => onChange(next === ALL ? "" : next)}>
        <SelectTrigger>
          <SelectValue placeholder={`All ${label.toLowerCase()}s`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {displayAction(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function AuditDetails({ record, onClose }: { record: AuditRecord | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(record)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
        {record && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {displayAction(record.action)} {record.entity.type}
                <ResultBadge result={record.result} />
                <IntegrityBadge status={record.integrity.status} />
              </DialogTitle>
              <DialogDescription>
                {new Date(record.occurredAt).toLocaleString()} · {record.actor.name} (
                {displayRole(record.actor.role)})
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 text-sm sm:grid-cols-2">
              <Detail label="Event ID" value={record.id} mono />
              <Detail label="Entity" value={`${record.entity.type} · ${record.entity.id}`} mono />
              <Detail label="Reason" value={record.reason ?? "—"} />
              <Detail
                label="Request"
                value={
                  record.request.method || record.request.path
                    ? `${record.request.method ?? ""} ${record.request.path ?? ""}`.trim()
                    : "—"
                }
                mono
              />
              <Detail label="Request ID" value={record.request.id ?? "—"} mono />
              <Detail label="IP Address" value={record.request.ipAddress ?? "—"} mono />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Field changes</h3>
              {record.changes.length === 0 ? (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  No field-level difference was recorded for this event.
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="p-3">Field</th>
                        <th className="p-3">Before</th>
                        <th className="w-10 p-3" />
                        <th className="p-3">After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.changes.map((change) => (
                        <tr key={change.field} className="border-t align-top">
                          <td className="p-3 font-mono text-xs">{change.field}</td>
                          <td className="max-w-xs p-3">
                            <pre className="whitespace-pre-wrap break-all font-sans text-xs text-destructive">
                              {formatValue(change.before)}
                            </pre>
                          </td>
                          <td className="p-3">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </td>
                          <td className="max-w-xs p-3">
                            <pre className="whitespace-pre-wrap break-all font-sans text-xs text-emerald-700 dark:text-emerald-300">
                              {formatValue(change.after)}
                            </pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-lg border p-4 text-xs text-muted-foreground">
              <div className="mb-1 font-medium text-foreground">Integrity evidence</div>
              <div className="break-all font-mono">
                {record.integrity.hash ?? "Legacy event without hash"}
              </div>
              {record.integrity.status === "LEGACY" && (
                <p className="mt-2">
                  This event existed before immutable hashing was enabled. It remains protected by
                  the database mutation guards.
                </p>
              )}
            </div>

            {record.metadata && Object.keys(record.metadata).length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Metadata</h3>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs">
                  {JSON.stringify(record.metadata, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className={mono ? "break-all font-mono text-xs" : "break-words"}>{value}</div>
    </div>
  );
}

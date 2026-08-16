import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, FileText } from "lucide-react";
import { useState } from "react";
import { useResults } from "@/hooks/use-results";
import { exportResults, type ResultRecord, type ResultStatus } from "@/services/results";
import { toast } from "sonner";

export const Route = createFileRoute("/results/")({ component: ResultsList });

const STATUSES: ResultStatus[] = [
  "draft",
  "pending_review",
  "reviewed",
  "correction_required",
  "approved",
];

function ResultsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ResultStatus | "">("");
  const { data, isLoading, isFetching } = useResults({ page, search, status });

  const columns: Column<ResultRecord>[] = [
    {
      key: "number",
      header: "Result",
      cell: (result) => <span className="font-mono text-xs">{result.resultNumber}</span>,
      sortValue: (result) => result.resultNumber,
    },
    { key: "patient", header: "Patient", cell: (result) => result.patient?.name ?? "—" },
    { key: "test", header: "Test", cell: (result) => result.test?.name ?? "—" },
    {
      key: "value",
      header: "Value",
      cell: (result) => (
        <span className="font-medium">
          {result.value} {result.unit}
        </span>
      ),
    },
    {
      key: "flag",
      header: "Flag",
      cell: (result) => <StatusBadge status={result.flag} />,
    },
    {
      key: "status",
      header: "Workflow",
      cell: (result) => <StatusBadge status={result.status} />,
      sortValue: (result) => result.status,
    },
    {
      key: "date",
      header: "Entered",
      cell: (result) => (result.enteredAt ? new Date(result.enteredAt).toLocaleString() : "—"),
    },
    {
      key: "actions",
      header: "",
      className: "w-28",
      cell: (result) => (
        <div className="flex gap-1" onClick={(event) => event.stopPropagation()}>
          <Link to="/results/$id" params={{ id: result.id }}>
            <Button variant="ghost" size="sm" title="View result">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          {result.requestStatus === "completed" && result.requestId && (
            <Link to="/reports/$id" params={{ id: result.requestId }}>
              <Button variant="ghost" size="sm" title="Medical report">
                <FileText className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <AppShell title="Test Results">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Test Results"
      breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Results" }]}
    >
      <DataTable
        rows={data?.rows ?? []}
        columns={columns}
        onExport={() => exportResults().catch(() => toast.error("Result export failed"))}
        filters={
          <Select
            value={status || "all"}
            onValueChange={(value) => {
              setStatus(value === "all" ? "" : (value as ResultStatus));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All workflows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All workflows</SelectItem>
              {STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        serverState={{
          search,
          onSearchChange: setSearch,
          page,
          totalPages: data?.pagination.last_page ?? 1,
          total: data?.pagination.total ?? 0,
          onPageChange: setPage,
          isFetching,
        }}
        rowAction={(result) => navigate({ to: "/results/$id", params: { id: result.id } })}
        emptyTitle="No results found"
        emptyDescription="Enter results from an in-progress or completed sample."
      />
    </AppShell>
  );
}

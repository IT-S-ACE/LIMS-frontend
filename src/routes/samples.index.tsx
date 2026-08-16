import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Eye, FlaskConical, Plus } from "lucide-react";
import { useState } from "react";
import { useSamples } from "@/hooks/use-samples";
import { exportSamples, type SampleRecord, type SampleStatus } from "@/services/samples";
import { toast } from "sonner";

interface SamplesSearch {
  requestId?: string;
}

export const Route = createFileRoute("/samples/")({
  validateSearch: (search: Record<string, unknown>): SamplesSearch => ({
    requestId: typeof search.requestId === "string" ? search.requestId : undefined,
  }),
  component: SamplesList,
});

function SamplesList() {
  const { requestId } = Route.useSearch();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SampleStatus | "">("");
  const { data, isFetching } = useSamples({
    page,
    perPage: 10,
    search,
    status,
    testRequestId: requestId,
  });

  const rows = data?.rows ?? [];
  const pagination = data?.pagination ?? {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  };

  const columns: Column<SampleRecord>[] = [
    {
      key: "sampleNumber",
      header: "Sample ID",
      cell: (sample) => <span className="font-mono text-xs">{sample.sampleNumber}</span>,
      sortValue: (sample) => sample.sampleNumber,
    },
    {
      key: "barcode",
      header: "Barcode",
      cell: (sample) => <span className="font-mono text-xs">{sample.barcode}</span>,
    },
    {
      key: "patient",
      header: "Patient",
      cell: (sample) => sample.patient?.name ?? "—",
    },
    {
      key: "request",
      header: "Request",
      cell: (sample) =>
        sample.request ? (
          <Link
            to="/test-requests/$id"
            params={{ id: sample.request.id }}
            className="text-primary hover:underline font-mono text-xs"
          >
            {sample.request.requestNumber}
          </Link>
        ) : (
          "—"
        ),
    },
    {
      key: "tests",
      header: "Tests",
      cell: (sample) => sample.tests.map((test) => test.name).join(", ") || "—",
    },
    { key: "type", header: "Type", cell: (sample) => sample.sampleType },
    {
      key: "status",
      header: "Status",
      cell: (sample) => <StatusBadge status={sample.status} />,
      sortValue: (sample) => sample.status,
    },
    {
      key: "date",
      header: "Created",
      cell: (sample) => new Date(sample.createdAt).toLocaleDateString(),
      sortValue: (sample) => sample.createdAt,
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (sample) => (
        <Link to="/samples/$id" params={{ id: sample.id }}>
          <Button variant="ghost" size="sm" aria-label={`View ${sample.sampleNumber}`}>
            <Eye className="w-4 h-4" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <AppShell
      title="Samples"
      breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Samples" }]}
      actions={
        <>
          <Link to="/samples/track">
            <Button variant="outline">
              <FlaskConical className="w-4 h-4 mr-2" /> Track Sample
            </Button>
          </Link>
          <Link to="/samples/new" search={requestId ? { requestId } : {}}>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Register Sample
            </Button>
          </Link>
        </>
      }
    >
      <DataTable
        rows={rows}
        columns={columns}
        filters={
          <Select
            value={status || "all"}
            onValueChange={(value) => {
              setStatus(value === "all" ? "" : (value as SampleStatus));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="registered">Registered</SelectItem>
              <SelectItem value="collected">Collected</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        }
        onExport={() => exportSamples().catch(() => toast.error("Export failed"))}
        emptyTitle="No samples"
        emptyDescription={
          requestId ? "No samples have been registered for this request." : undefined
        }
        serverState={{
          search,
          onSearchChange: setSearch,
          page,
          totalPages: pagination.last_page,
          total: pagination.total,
          onPageChange: setPage,
          isFetching,
        }}
      />
    </AppShell>
  );
}

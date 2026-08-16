import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMedicalReports } from "@/hooks/use-results";
import { exportMedicalReports, type MedicalReportRecord } from "@/services/results";
import { FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports/")({ component: ReportsList });

function ReportsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading, isFetching } = useMedicalReports(page, search);

  const columns: Column<MedicalReportRecord>[] = [
    {
      key: "request",
      header: "Request",
      cell: (report) => <span className="font-mono text-xs">{report.request.requestNumber}</span>,
    },
    { key: "patient", header: "Patient", cell: (report) => report.patient.name },
    { key: "tests", header: "Approved Tests", cell: (report) => report.results.length },
    { key: "samples", header: "Samples", cell: (report) => report.samples.length },
    {
      key: "generated",
      header: "Generated",
      cell: (report) => new Date(report.generatedAt).toLocaleString(),
      sortValue: (report) => report.generatedAt,
    },
    {
      key: "actions",
      header: "",
      cell: (report) => (
        <Link
          to="/reports/$id"
          params={{ id: report.testRequestId }}
          onClick={(event) => event.stopPropagation()}
        >
          <Button variant="ghost" size="sm">
            <FileText className="w-4 h-4 mr-1" />
            Open
          </Button>
        </Link>
      ),
    },
  ];

  if (isLoading)
    return (
      <AppShell title="Medical Reports">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );

  return (
    <AppShell
      title="Medical Reports"
      breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Reports" }]}
    >
      <DataTable
        rows={data?.rows ?? []}
        columns={columns}
        onExport={() => exportMedicalReports().catch(() => toast.error("Report export failed"))}
        serverState={{
          search,
          onSearchChange: setSearch,
          page,
          totalPages: data?.pagination.last_page ?? 1,
          total: data?.pagination.total ?? 0,
          onPageChange: setPage,
          isFetching,
        }}
        rowAction={(report) =>
          navigate({ to: "/reports/$id", params: { id: report.testRequestId } })
        }
        emptyTitle="No approved medical reports"
        emptyDescription="A report is generated automatically after every result in a request is approved."
      />
    </AppShell>
  );
}

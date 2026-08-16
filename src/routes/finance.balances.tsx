import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { usePatientBalances } from "@/hooks/use-finance";
import type { PatientBalanceRecord } from "@/services/finance";

export const Route = createFileRoute("/finance/balances")({ component: BalancesPage });

function BalancesPage() {
  const { data = [] } = usePatientBalances();
  const columns: Column<PatientBalanceRecord>[] = [
    {
      key: "name",
      header: "Patient",
      cell: (row) => <span className="font-medium">{row.patientName}</span>,
      sortValue: (row) => row.patientName,
    },
    { key: "phone", header: "Phone", cell: (row) => row.phone },
    {
      key: "invoices",
      header: "Invoices",
      cell: (row) => row.invoicesCount,
      sortValue: (row) => row.invoicesCount,
    },
    {
      key: "total",
      header: "Patient Charges",
      cell: (row) => `$${row.total.toFixed(2)}`,
      sortValue: (row) => row.total,
    },
    {
      key: "paid",
      header: "Paid",
      cell: (row) => `$${row.paid.toFixed(2)}`,
      sortValue: (row) => row.paid,
    },
    {
      key: "remaining",
      header: "Balance Owed",
      cell: (row) => (
        <span className={row.remaining > 0 ? "font-semibold text-destructive" : "text-success"}>
          ${row.remaining.toFixed(2)}
        </span>
      ),
      sortValue: (row) => row.remaining,
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Link to="/patients/$id" params={{ id: row.patientId }}>
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4 mr-1" /> View
          </Button>
        </Link>
      ),
    },
  ];
  return (
    <AppShell title="Patient Balances" breadcrumbs={[{ label: "Finance" }, { label: "Balances" }]}>
      <DataTable
        rows={data}
        columns={columns}
        searchKeys={["patientName", "phone"]}
        emptyTitle="No patient invoices"
      />
    </AppShell>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { usePayments } from "@/hooks/use-finance";
import type { PaymentRecord } from "@/services/finance";

export const Route = createFileRoute("/finance/payments/")({ component: PaymentsList });

function PaymentsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isFetching } = usePayments({ page, search });
  const rows = data?.rows ?? [];

  const columns: Column<PaymentRecord>[] = [
    {
      key: "number",
      header: "Payment #",
      cell: (payment) => (
        <span className="font-mono text-xs font-medium">{payment.paymentNumber}</span>
      ),
      sortValue: (payment) => payment.paymentNumber,
    },
    {
      key: "date",
      header: "Date",
      cell: (payment) => new Date(payment.date).toLocaleString(),
      sortValue: (payment) => payment.date,
    },
    { key: "patient", header: "Patient", cell: (payment) => payment.patient.name },
    {
      key: "invoice",
      header: "Invoice",
      cell: (payment) => <span className="font-mono text-xs">{payment.invoiceNumber}</span>,
    },
    {
      key: "method",
      header: "Method",
      cell: (payment) => <span className="capitalize">{payment.method}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      cell: (payment) => (
        <span className="font-semibold text-success">${payment.amount.toFixed(2)}</span>
      ),
      sortValue: (payment) => payment.amount,
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      cell: (payment) => (
        <Link
          to="/finance/payments/$id"
          params={{ id: payment.id }}
          onClick={(event) => event.stopPropagation()}
        >
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4 mr-1" /> Receipt
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <AppShell
      title="Payments"
      breadcrumbs={[{ label: "Finance" }, { label: "Payments" }]}
      actions={
        <Link to="/finance/payments/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Record Payment
          </Button>
        </Link>
      }
    >
      <DataTable
        rows={rows}
        columns={columns}
        emptyTitle="No payments recorded"
        emptyDescription="A receipt will appear here after a full invoice payment is recorded."
        rowAction={(payment) =>
          navigate({ to: "/finance/payments/$id", params: { id: payment.id } })
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
      />
    </AppShell>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeferredValue, useState } from "react";
import { toast } from "sonner";
import { useTestRequests, useDeleteTestRequest } from "@/hooks/use-test-requests";
import { exportTestRequests, type TestRequestListItem } from "@/services/test-requests";
import { ApiError, ValidationError } from "@/lib/api-client";
import type { BackendTestRequestStatus } from "@/lib/api-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/test-requests/")({
  component: RequestsList,
});

function RequestsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BackendTestRequestStatus | "">("");
  const deferredSearch = useDeferredValue(search);
  const { data, isLoading, isFetching } = useTestRequests({
    page,
    perPage: 10,
    search: deferredSearch,
    status,
  });
  const deleteTestRequest = useDeleteTestRequest();
  const navigate = useNavigate();
  const [toDelete, setToDelete] = useState<TestRequestListItem | null>(null);

  const columns: Column<TestRequestListItem>[] = [
    {
      key: "id",
      header: "Request No.",
      cell: (r) => <span className="font-mono text-xs">{r.requestNumber}</span>,
      sortValue: (r) => r.requestNumber,
    },
    {
      key: "patient",
      header: "Patient",
      cell: (r) => r.patient.name,
      sortValue: (r) => r.patient.name,
    },
    {
      key: "tests",
      header: "Tests",
      cell: (r) => <span className="text-sm">{r.testsSummary}</span>,
    },
    {
      key: "total",
      header: "Total",
      cell: (r) => `$${r.totalPrice.toFixed(2)}`,
      sortValue: (r) => r.totalPrice,
    },
    {
      key: "due",
      header: "Patient Due",
      cell: (r) => (
        <span className={r.patientDue > 0 ? "text-destructive font-medium" : "text-success"}>
          ${r.patientDue.toFixed(2)}
        </span>
      ),
      sortValue: (r) => r.patientDue,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={r.status} />,
      sortValue: (r) => r.status,
    },
    {
      key: "date",
      header: "Created",
      cell: (r) => new Date(r.createdAt).toLocaleDateString(),
      sortValue: (r) => r.createdAt,
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
              •••
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate({ to: "/test-requests/$id", params: { id: r.id } });
              }}
            >
              <Eye className="w-4 h-4 mr-2" /> View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate({ to: "/test-requests/$id/edit", params: { id: r.id } });
              }}
            >
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setToDelete(r);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AppShell
      title="Test Requests"
      breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Test Requests" }]}
      actions={
        <Link to="/test-requests/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New Request
          </Button>
        </Link>
      }
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          rows={data?.rows ?? []}
          columns={columns}
          serverState={{
            search,
            onSearchChange: setSearch,
            page,
            totalPages: data?.pagination.last_page ?? 1,
            total: data?.pagination.total ?? 0,
            onPageChange: setPage,
            isFetching,
          }}
          filters={
            <Select
              value={status || "all"}
              onValueChange={(value) => {
                setStatus(value === "all" ? "" : (value as BackendTestRequestStatus));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          }
          onExport={() => {
            void exportTestRequests()
              .then(() => toast.success("Test requests exported"))
              .catch((error) =>
                toast.error(error instanceof Error ? error.message : "Export failed"),
              );
          }}
          rowAction={(r) => navigate({ to: "/test-requests/$id", params: { id: r.id } })}
          emptyTitle="No test requests"
        />
      )}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete request {toDelete?.requestNumber}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (toDelete) {
                  deleteTestRequest.mutate(toDelete.id, {
                    onSuccess: () => toast.success("Request deleted"),
                    onError: (err) => {
                      if (err instanceof ValidationError || err instanceof ApiError)
                        toast.error(err.message);
                    },
                  });
                }
                setToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

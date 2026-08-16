import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
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
import { useState } from "react";
import { toast } from "sonner";
import { useDeleteTest, useTestCatalog } from "@/hooks/use-tests";
import type { TestCatalogEntry } from "@/services/tests";
import { ApiError, ValidationError } from "@/lib/api-client";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/tests/")({
  head: () => ({
    meta: [
      { title: "Tests — MedLab LIMS" },
      {
        name: "description",
        content: "Manage the laboratory tests catalog: names, prices, reference ranges and units.",
      },
      { property: "og:title", content: "Tests — MedLab LIMS" },
      {
        property: "og:description",
        content: "Create, view, edit and delete laboratory tests in MedLab LIMS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TestsList,
});

type Row = TestCatalogEntry;

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function TestsList() {
  const currentUser = useStore((state) => state.currentUser);
  const canManage = currentUser?.role === "admin";
  const { data: tests, isLoading } = useTestCatalog();
  const deleteTest = useDeleteTest();
  const navigate = useNavigate();
  const [toDelete, setToDelete] = useState<Row | null>(null);

  const rows: Row[] = tests ?? [];

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Test Name",
      cell: (t) => <span className="font-medium">{t.name}</span>,
      sortValue: (t) => t.name,
    },
    {
      key: "price",
      header: "Price",
      cell: (t) => `$${t.price.toFixed(2)}`,
      sortValue: (t) => t.price,
    },
    {
      key: "ref",
      header: "Reference Range",
      cell: (t) => <span className="text-muted-foreground">{t.refRange || "—"}</span>,
      sortValue: (t) => t.refRange ?? "",
    },
    { key: "unit", header: "Unit", cell: (t) => t.unit || "—", sortValue: (t) => t.unit ?? "" },
    {
      key: "created",
      header: "Created Date",
      cell: (t) => <span className="text-muted-foreground">{formatDate(t.createdAt)}</span>,
      sortValue: (t) => t.createdAt ?? "",
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-36",
      cell: (t) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            title="View"
            onClick={() => navigate({ to: "/tests/$code", params: { code: t.code } })}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {canManage && (
            <>
              <Button
                variant="ghost"
                size="sm"
                title="Edit"
                onClick={() => navigate({ to: "/tests/$code/edit", params: { code: t.code } })}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="Delete"
                className="text-destructive"
                onClick={() => setToDelete(t)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title="Tests"
      breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Tests" }]}
      actions={
        canManage ? (
          <Link to="/tests/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Test
            </Button>
          </Link>
        ) : undefined
      }
    >
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          searchKeys={["name", "refRange", "unit", "code"]}
          emptyTitle="No tests in catalog"
          emptyDescription="Add your first laboratory test to get started."
        />
      )}

      <AlertDialog open={canManage && !!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete test?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.name} will be removed only if it is not linked to an existing test request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (toDelete) {
                  deleteTest.mutate(toDelete.id, {
                    onSuccess: () => toast.success(`${toDelete.name} deleted`),
                    onError: (error) => {
                      if (error instanceof ValidationError || error instanceof ApiError) {
                        toast.error(error.message);
                      }
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

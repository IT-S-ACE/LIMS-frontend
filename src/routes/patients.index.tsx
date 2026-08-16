import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Eye, Pencil, Trash2, UserPlus } from "lucide-react";
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
import { useState } from "react";
import { toast } from "sonner";
import { usePatients, useDeletePatient } from "@/hooks/use-patients";
import type { PatientListItem } from "@/services/patients";
import { ApiError, ValidationError } from "@/lib/api-client";

export const Route = createFileRoute("/patients/")({
  component: PatientsList,
});

function PatientsList() {
  const { data: patients, isLoading } = usePatients();
  const deletePatient = useDeletePatient();
  const navigate = useNavigate();
  const [toDelete, setToDelete] = useState<PatientListItem | null>(null);

  const columns: Column<PatientListItem>[] = [
    {
      key: "id",
      header: "Patient No.",
      cell: (p) => <span className="font-mono text-xs">{p.patientNumber}</span>,
      sortValue: (p) => p.patientNumber,
    },
    {
      key: "name",
      header: "Full Name",
      cell: (p) => <div className="font-medium">{p.fullName}</div>,
      sortValue: (p) => p.fullName,
    },
    {
      key: "gender",
      header: "Gender",
      cell: (p) => <span className="capitalize">{p.gender}</span>,
      sortValue: (p) => p.gender,
    },
    { key: "dob", header: "DOB", cell: (p) => p.dob, sortValue: (p) => p.dob },
    { key: "phone", header: "Phone", cell: (p) => p.phone, sortValue: (p) => p.phone },
    {
      key: "insurance",
      header: "Insurance",
      cell: (p) =>
        p.insurance.length > 0 ? (
          p.insurance.map((i) => i.name).join(", ")
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      key: "balance",
      header: "Balance",
      cell: (p) => (
        <span className={p.balance > 0 ? "text-destructive font-medium" : ""}>
          ${p.balance.toFixed(2)}
        </span>
      ),
      sortValue: (p) => p.balance,
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (p) => (
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
                navigate({ to: "/patients/$id", params: { id: p.id } });
              }}
            >
              <Eye className="w-4 h-4 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate({ to: "/patients/$id/edit", params: { id: p.id } });
              }}
            >
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setToDelete(p);
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
      title="Patients"
      breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Patients" }]}
      actions={
        <Link to="/patients/new">
          <Button>
            <UserPlus className="w-4 h-4 mr-2" /> Add Patient
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
          rows={patients ?? []}
          columns={columns}
          searchKeys={["fullName", "phone", "patientNumber"]}
          rowAction={(p) => navigate({ to: "/patients/$id", params: { id: p.id } })}
          emptyTitle="No patients yet"
          emptyDescription="Add your first patient to get started."
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete patient?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {toDelete?.fullName}. Patients with existing test
              requests cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (toDelete) {
                  deletePatient.mutate(toDelete.id, {
                    onSuccess: () => toast.success("Patient deleted"),
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

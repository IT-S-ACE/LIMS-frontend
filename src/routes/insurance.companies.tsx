import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Field, FormShell } from "@/components/form-shell";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  useCreateInsuranceCompany,
  useDeleteInsuranceCompany,
  useInsuranceManagement,
  useUpdateInsuranceCompany,
} from "@/hooks/use-insurance";
import type { CompanyInput, InsuranceCompanyRecord } from "@/services/insurance";

export const Route = createFileRoute("/insurance/companies")({ component: CompaniesPage });

const emptyForm = (): CompanyInput => ({
  code: "",
  name: "",
  email: "",
  phone: "",
  defaultCoverage: 0,
  active: true,
});

function CompaniesPage() {
  const { data: companies = [] } = useInsuranceManagement();
  const create = useCreateInsuranceCompany();
  const update = useUpdateInsuranceCompany();
  const remove = useDeleteInsuranceCompany();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InsuranceCompanyRecord | null>(null);
  const [toDelete, setToDelete] = useState<InsuranceCompanyRecord | null>(null);
  const [form, setForm] = useState<CompanyInput>(emptyForm());

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }
  function openEdit(company: InsuranceCompanyRecord) {
    setEditing(company);
    setForm({
      code: company.code,
      name: company.name,
      email: company.email,
      phone: company.phone,
      defaultCoverage: company.defaultCoverage,
      active: company.active,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim() || !form.code.trim()) return toast.error("Name and code are required");
    try {
      if (editing) await update.mutateAsync({ id: editing.id, input: form });
      else await create.mutateAsync(form);
      toast.success(editing ? "Insurance company updated" : "Insurance company created");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Company could not be saved");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success("Insurance company deleted");
      setToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Company could not be deleted");
    }
  }

  const columns: Column<InsuranceCompanyRecord>[] = [
    {
      key: "code",
      header: "Code",
      cell: (company) => <span className="font-mono text-xs">{company.code}</span>,
    },
    {
      key: "name",
      header: "Name",
      cell: (company) => <span className="font-medium">{company.name}</span>,
      sortValue: (company) => company.name,
    },
    {
      key: "contact",
      header: "Contact",
      cell: (company) => (
        <div>
          <div>{company.email || "—"}</div>
          <div className="text-xs text-muted-foreground">{company.phone || "—"}</div>
        </div>
      ),
    },
    {
      key: "coverage",
      header: "Default Coverage",
      cell: (company) => `${company.defaultCoverage}%`,
      sortValue: (company) => company.defaultCoverage,
    },
    {
      key: "status",
      header: "Status",
      cell: (company) => <StatusBadge status={company.active ? "approved" : "cancelled"} />,
    },
    {
      key: "actions",
      header: "",
      cell: (company) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(company)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => setToDelete(company)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title="Insurance Companies"
      breadcrumbs={[{ label: "Insurance" }, { label: "Companies" }]}
      actions={
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Add Company
        </Button>
      }
    >
      <DataTable
        rows={companies}
        columns={columns}
        searchKeys={["name", "code", "email", "phone"]}
        emptyTitle="No insurance companies"
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Insurance Company</DialogTitle>
          </DialogHeader>
          <FormShell title="">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Name" required>
                <Input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </Field>
              <Field label="Code" required>
                <Input
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
                />
              </Field>
              <Field label="Contact Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                />
              </Field>
              <Field label="Default Coverage %" hint="Used unless a test-specific override exists.">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.defaultCoverage}
                  onChange={(event) =>
                    setForm({ ...form, defaultCoverage: Number(event.target.value) })
                  }
                />
              </Field>
              <Field label="Active">
                <div className="flex items-center h-10">
                  <Switch
                    checked={form.active}
                    onCheckedChange={(active) => setForm({ ...form, active })}
                  />
                </div>
              </Field>
            </div>
          </FormShell>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={create.isPending || update.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={Boolean(toDelete)} onOpenChange={(value) => !value && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              A company used by a test request cannot be deleted. Mark it inactive instead to
              preserve historical records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Field, FormShell } from "@/components/form-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
  useCoverageRules,
  useCreateCoverageRule,
  useDeleteCoverageRule,
  useInsuranceManagement,
  useUpdateCoverageRule,
} from "@/hooks/use-insurance";
import { useTestCatalog } from "@/hooks/use-tests";
import type { CoverageRuleRecord } from "@/services/insurance";

export const Route = createFileRoute("/insurance/coverage")({ component: CoveragePage });

interface RuleForm {
  companyId: string;
  testId: string;
  coveragePercent: number;
  maxAmount: number;
}
const emptyForm = (): RuleForm => ({ companyId: "", testId: "", coveragePercent: 0, maxAmount: 0 });

function CoveragePage() {
  const { data: rules = [] } = useCoverageRules();
  const { data: companies = [] } = useInsuranceManagement();
  const { data: tests = [] } = useTestCatalog();
  const create = useCreateCoverageRule();
  const update = useUpdateCoverageRule();
  const remove = useDeleteCoverageRule();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CoverageRuleRecord | null>(null);
  const [form, setForm] = useState<RuleForm>(emptyForm());

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }
  function openEdit(rule: CoverageRuleRecord) {
    setEditing(rule);
    setForm({
      companyId: rule.company.id,
      testId: rule.test.id,
      coveragePercent: rule.coveragePercent,
      maxAmount: rule.maxAmount ?? 0,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.companyId || !form.testId) return toast.error("Company and test are required");
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          input: {
            testId: form.testId,
            coveragePercent: form.coveragePercent,
            maxAmount: form.maxAmount || null,
          },
        });
      } else {
        await create.mutateAsync({
          companyId: form.companyId,
          testId: form.testId,
          coveragePercent: form.coveragePercent,
          maxAmount: form.maxAmount || null,
        });
      }
      toast.success(editing ? "Coverage override updated" : "Coverage override created");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Coverage override could not be saved");
    }
  }

  async function deleteRule(rule: CoverageRuleRecord) {
    try {
      await remove.mutateAsync(rule.id);
      toast.success("Coverage override deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Coverage override could not be deleted",
      );
    }
  }

  const columns: Column<CoverageRuleRecord>[] = [
    {
      key: "company",
      header: "Company",
      cell: (rule) => rule.company.name,
      sortValue: (rule) => rule.company.name,
    },
    {
      key: "test",
      header: "Test",
      cell: (rule) => rule.test.name,
      sortValue: (rule) => rule.test.name,
    },
    {
      key: "coverage",
      header: "Coverage",
      cell: (rule) => `${rule.coveragePercent}%`,
      sortValue: (rule) => rule.coveragePercent,
    },
    {
      key: "max",
      header: "Maximum Covered",
      cell: (rule) => (rule.maxAmount === null ? "No cap" : `$${rule.maxAmount.toFixed(2)}`),
    },
    {
      key: "actions",
      header: "",
      cell: (rule) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" disabled={!rule.test.id} onClick={() => openEdit(rule)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => deleteRule(rule)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title="Coverage Rules"
      breadcrumbs={[{ label: "Insurance" }, { label: "Coverage Rules" }]}
      actions={
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Add Test Override
        </Button>
      }
    >
      <div className="mb-4 rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
        Each company uses its default coverage percentage. Add a rule here only when one specific
        test needs a different percentage or maximum covered amount. Existing invoice snapshots are
        never recalculated automatically.
      </div>
      <DataTable
        rows={rules}
        columns={columns}
        searchKeys={[(rule) => rule.company.name, (rule) => rule.test.name]}
        emptyTitle="No test-specific overrides"
        emptyDescription="Company default percentages will be used for all tests."
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Coverage Override</DialogTitle>
          </DialogHeader>
          <FormShell title="">
            <Field label="Insurance Company" required>
              <Select
                value={form.companyId}
                disabled={Boolean(editing)}
                onValueChange={(companyId) => setForm({ ...form, companyId })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name} ({company.defaultCoverage}% default)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Test" required>
              <Select value={form.testId} onValueChange={(testId) => setForm({ ...form, testId })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test" />
                </SelectTrigger>
                <SelectContent>
                  {tests.map((test) => (
                    <SelectItem key={test.id} value={test.id}>
                      {test.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Coverage %" required>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.coveragePercent}
                  onChange={(event) =>
                    setForm({ ...form, coveragePercent: Number(event.target.value) })
                  }
                />
              </Field>
              <Field label="Maximum Covered" hint="0 means no cap.">
                <Input
                  type="number"
                  min="0"
                  value={form.maxAmount}
                  onChange={(event) => setForm({ ...form, maxAmount: Number(event.target.value) })}
                />
              </Field>
            </div>
          </FormShell>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={create.isPending || update.isPending}>
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

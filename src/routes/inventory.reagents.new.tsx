import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { FormShell, Field } from "@/components/form-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { toast } from "sonner";
import { useTestCatalog } from "@/hooks/use-tests";
import { useCreateReagent } from "@/hooks/use-reagents";
import { ApiError, ValidationError } from "@/lib/api-client";

export const Route = createFileRoute("/inventory/reagents/new")({ component: NewReagent });

const today = new Date().toISOString().slice(0, 10);

function errorMessage(error: Error): string {
  if (error instanceof ValidationError) return Object.values(error.errors)[0]?.[0] ?? error.message;
  return error instanceof ApiError ? error.message : "The reagent could not be created.";
}

function NewReagent() {
  const navigate = useNavigate();
  const { data: tests = [], isLoading } = useTestCatalog();
  const createReagent = useCreateReagent();
  const [form, setForm] = useState({
    name: "",
    code: "",
    category: "",
    initialQuantity: 0,
    minStock: 10,
    lotNumber: "",
    receivedAt: today,
    expiryDate: "",
    unitPrice: 0,
    tests: {} as Record<string, number>,
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.code.trim() || !form.lotNumber.trim() || !form.expiryDate) {
      return toast.error("Name, code, lot number, and expiry date are required");
    }
    if (Object.keys(form.tests).length === 0)
      return toast.error("Select at least one test usage rule");

    createReagent.mutate(
      {
        code: form.code.trim(),
        name: form.name.trim(),
        category: form.category.trim(),
        initialQuantity: form.initialQuantity,
        minStock: form.minStock,
        lotNumber: form.lotNumber.trim(),
        receivedAt: form.receivedAt,
        expiryDate: form.expiryDate,
        unitPrice: form.unitPrice,
        tests: Object.entries(form.tests).map(([testId, quantityUsed]) => ({
          testId,
          quantityUsed,
        })),
      },
      {
        onSuccess: () => {
          toast.success("Reagent and initial lot created");
          navigate({ to: "/inventory" });
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  }

  return (
    <AppShell
      title="Add Reagent"
      breadcrumbs={[{ label: "Inventory", to: "/inventory" }, { label: "New Reagent" }]}
    >
      <form onSubmit={submit}>
        <FormShell
          title="Reagent and Initial Lot"
          description="Create the inventory item, its first lot, and the per-test consumption rules."
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/inventory" })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createReagent.isPending}>
                {createReagent.isPending ? "Saving..." : "Save Reagent"}
              </Button>
            </>
          }
        >
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
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </Field>
            <Field label="Category">
              <Input
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                placeholder="e.g. Hematology"
              />
            </Field>
            <Field label="Minimum Stock" required>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.minStock}
                onChange={(event) => setForm({ ...form, minStock: Number(event.target.value) })}
              />
            </Field>
            <Field label="Initial Quantity" required>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.initialQuantity}
                onChange={(event) =>
                  setForm({ ...form, initialQuantity: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Lot Number" required>
              <Input
                value={form.lotNumber}
                onChange={(event) => setForm({ ...form, lotNumber: event.target.value })}
              />
            </Field>
            <Field label="Received Date" required>
              <Input
                type="date"
                max={today}
                value={form.receivedAt}
                onChange={(event) => setForm({ ...form, receivedAt: event.target.value })}
              />
            </Field>
            <Field label="Expiry Date" required>
              <Input
                type="date"
                min={today}
                value={form.expiryDate}
                onChange={(event) => setForm({ ...form, expiryDate: event.target.value })}
              />
            </Field>
            <Field label="Cost / Unit">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={(event) => setForm({ ...form, unitPrice: Number(event.target.value) })}
              />
            </Field>
          </div>

          <Field
            label="Used by Tests"
            required
            hint="Enter how much of this reagent one ordered test consumes."
          >
            <div className="grid md:grid-cols-2 gap-2">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading tests...</p>
              ) : (
                tests.map((test) => {
                  const checked = form.tests[test.id] !== undefined;
                  return (
                    <div key={test.id} className="flex items-center gap-3 p-3 border rounded">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          const next = { ...form.tests };
                          if (value) next[test.id] = 1;
                          else delete next[test.id];
                          setForm({ ...form, tests: next });
                        }}
                      />
                      <span className="text-sm flex-1">{test.name}</span>
                      {checked && (
                        <Input
                          className="w-24"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={form.tests[test.id]}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              tests: { ...form.tests, [test.id]: Number(event.target.value) },
                            })
                          }
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Field>
        </FormShell>
      </form>
    </AppShell>
  );
}

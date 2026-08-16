import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { FormShell, Field } from "@/components/form-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, UserPlus } from "lucide-react";
import { PatientQuickAddDialog } from "@/components/patient-quick-add-dialog";
import { usePatients } from "@/hooks/use-patients";
import { useTestCatalog } from "@/hooks/use-tests";
import { useInsuranceCompanies } from "@/hooks/use-insurance-companies";
import { useCreateTestRequest } from "@/hooks/use-test-requests";
import { ValidationError, ApiError } from "@/lib/api-client";

interface NewSearch {
  patientId?: string;
}

export const Route = createFileRoute("/test-requests/new")({
  validateSearch: (s: Record<string, unknown>): NewSearch => ({
    patientId: typeof s.patientId === "string" ? s.patientId : undefined,
  }),
  component: NewRequestPage,
});

function NewRequestPage() {
  const { patientId: initialPatient } = Route.useSearch();
  const navigate = useNavigate();
  const { data: patients, isLoading: patientsLoading } = usePatients();
  const { data: testCatalog, isLoading: testsLoading } = useTestCatalog();
  const { data: insuranceCompanies } = useInsuranceCompanies();
  const createTestRequest = useCreateTestRequest();

  const [patientSearch, setPatientSearch] = useState("");
  const [patientId, setPatientId] = useState(initialPatient ?? "");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedTests, setSelectedTests] = useState<Record<string, number>>({});
  const [applyInsurance, setApplyInsurance] = useState(false);
  const [insuranceCompanyId, setInsuranceCompanyId] = useState("");

  const patient = patients?.find((p) => p.id === patientId);

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    const q = patientSearch.toLowerCase();
    if (!q) return patients.slice(0, 5);
    return patients
      .filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.patientNumber.toLowerCase().includes(q) ||
          p.phone.includes(q),
      )
      .slice(0, 5);
  }, [patientSearch, patients]);

  const selectedTestIds = Object.keys(selectedTests);
  const subtotal = selectedTestIds.reduce(
    (sum, id) =>
      sum + (testCatalog?.find((test) => test.id === id)?.price ?? 0) * selectedTests[id],
    0,
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) return toast.error("Please select a patient");
    if (selectedTestIds.length === 0) return toast.error("Select at least one test");
    if (applyInsurance && !insuranceCompanyId) {
      return toast.error("Please select an insurance provider");
    }
    createTestRequest.mutate(
      {
        patientId,
        insuranceCompanyId: applyInsurance ? insuranceCompanyId : undefined,
        tests: selectedTestIds.map((testId) => ({
          testId,
          quantity: selectedTests[testId],
        })),
      },
      {
        onSuccess: (req) => {
          toast.success(`Request ${req.requestNumber} created`);
          navigate({ to: "/test-requests/$id", params: { id: req.id } });
        },
        onError: (err) => {
          if (err instanceof ValidationError) {
            toast.error(Object.values(err.errors)[0]?.[0] ?? err.message);
          } else if (err instanceof ApiError) {
            toast.error(err.message);
          }
        },
      },
    );
  }

  if (patientsLoading || testsLoading) {
    return (
      <AppShell title="Create Test Request">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Create Test Request"
      breadcrumbs={[
        { label: "Dashboard", to: "/dashboard" },
        { label: "Test Requests", to: "/test-requests" },
        { label: "New" },
      ]}
    >
      <form onSubmit={submit} className="space-y-4 max-w-5xl">
        <FormShell
          title="1. Patient Selection"
          description="Search for an existing patient or add a new one without leaving this page."
        >
          {!patient ? (
            <>
              <div className="flex items-end gap-2">
                <Field label="Search Patient" hint="Search by name, patient number, or phone">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder="Type to search..."
                    />
                  </div>
                </Field>
                <Button type="button" variant="outline" onClick={() => setQuickAddOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" /> New Patient
                </Button>
              </div>
              <div className="space-y-1">
                {filteredPatients.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    className="w-full text-left p-3 border border-border rounded-md hover:bg-muted/50 flex items-center justify-between"
                    onClick={() => setPatientId(p.id)}
                  >
                    <div>
                      <div className="font-medium text-sm">{p.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.patientNumber} · {p.phone}
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm">
                      Select
                    </Button>
                  </button>
                ))}
                {filteredPatients.length === 0 && (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    No patients found.
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickAddOpen(true)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" /> Add New Patient
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{patient.fullName}</div>
                  <div className="text-xs text-muted-foreground">
                    {patient.patientNumber} · {patient.phone}
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setPatientId("")}>
                  Change
                </Button>
              </CardContent>
            </Card>
          )}
        </FormShell>
        <PatientQuickAddDialog
          open={quickAddOpen}
          onOpenChange={setQuickAddOpen}
          onCreated={(p) => setPatientId(p.id)}
        />

        <FormShell title="2. Select Tests" description="Choose laboratory tests for this request.">
          <div className="grid md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {testCatalog?.map((t) => {
              const checked = t.id in selectedTests;
              return (
                <label
                  key={t.id}
                  className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => {
                        setSelectedTests((current) => {
                          const next = { ...current };
                          if (c) next[t.id] = 1;
                          else delete next[t.id];
                          return next;
                        });
                      }}
                    />
                    <div>
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.unit}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {checked && (
                      <Input
                        aria-label={`Quantity for ${t.name}`}
                        className="h-8 w-20"
                        type="number"
                        min="1"
                        max="100"
                        value={selectedTests[t.id]}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          const quantity = Math.min(100, Math.max(1, Number(event.target.value)));
                          setSelectedTests((current) => ({ ...current, [t.id]: quantity }));
                        }}
                      />
                    )}
                    <div className="font-semibold text-sm">${t.price.toFixed(2)}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </FormShell>

        <FormShell
          title="3. Insurance (Optional)"
          description="Attaches the insurer to this request for reporting. Coverage discounts are not yet calculated by the system — the patient is billed the full amount regardless."
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Attach Insurance Provider</div>
              <div className="text-xs text-muted-foreground">
                Record which insurer is associated with this request.
              </div>
            </div>
            <Switch checked={applyInsurance} onCheckedChange={setApplyInsurance} />
          </div>
          {applyInsurance && (
            <Field label="Insurance Provider" required>
              <Select value={insuranceCompanyId} onValueChange={setInsuranceCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {insuranceCompanies?.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </FormShell>

        <FormShell title="4. Summary">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Tests selected</span>
              <span className="font-medium">{selectedTestIds.length}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-bold text-lg">
              <span>Total (patient pays)</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
          </div>
        </FormShell>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/test-requests" })}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createTestRequest.isPending}>
            {createTestRequest.isPending ? "Creating..." : "Create Request"}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}

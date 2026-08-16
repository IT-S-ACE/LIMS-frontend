import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { FormShell, Field } from "@/components/form-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { usePatient, useUpdatePatient } from "@/hooks/use-patients";
import { ValidationError, ApiError } from "@/lib/api-client";
import type { PatientDetail } from "@/services/patients";

export const Route = createFileRoute("/patients/$id/edit")({
  component: EditPatientPage,
});

function EditPatientPage() {
  const { id } = Route.useParams();
  const { data: patient, isLoading } = usePatient(id);

  if (isLoading) {
    return (
      <AppShell title="Loading...">
        <Skeleton className="h-64 w-full" />
      </AppShell>
    );
  }

  if (!patient) return <AppShell title="Not found">Patient not found</AppShell>;

  return <EditPatientForm patient={patient} />;
}

function EditPatientForm({ patient }: { patient: PatientDetail }) {
  const navigate = useNavigate();
  const updatePatient = useUpdatePatient();

  const [form, setForm] = useState({
    fullName: patient.fullName,
    dob: patient.dob,
    gender: patient.gender,
    phone: patient.phone,
    email: patient.email ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    updatePatient.mutate(
      { id: patient.id, input: { ...form, email: form.email || undefined } },
      {
        onSuccess: () => {
          toast.success("Patient updated");
          navigate({ to: "/patients/$id", params: { id: patient.id } });
        },
        onError: (err) => {
          if (err instanceof ValidationError) {
            const flat: Record<string, string> = {};
            for (const [field, msgs] of Object.entries(err.errors)) flat[field] = msgs[0];
            setErrors(flat);
            toast.error(err.message);
          } else if (err instanceof ApiError) {
            toast.error(err.message);
          }
        },
      },
    );
  }

  return (
    <AppShell
      title="Edit Patient"
      breadcrumbs={[
        { label: "Dashboard", to: "/dashboard" },
        { label: "Patients", to: "/patients" },
        { label: patient.fullName, to: "/patients/$id".replace("$id", patient.id) },
        { label: "Edit" },
      ]}
    >
      <form onSubmit={submit}>
        <FormShell
          title="Update Patient Information"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/patients/$id", params: { id: patient.id } })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatePatient.isPending}>
                {updatePatient.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          }
        >
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Full Name" required error={errors.name}>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </Field>
            <Field label="Date of Birth" required error={errors.dob}>
              <Input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
              />
            </Field>
            <Field label="Gender" required error={errors.gender}>
              <Select
                value={form.gender}
                onValueChange={(v) => setForm({ ...form, gender: v as "male" | "female" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Phone" required error={errors.phone}>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
        </FormShell>
      </form>
    </AppShell>
  );
}

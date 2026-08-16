import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { FormShell, Field } from "@/components/form-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { useCreatePatient } from "@/hooks/use-patients";
import { ValidationError, ApiError } from "@/lib/api-client";

export const Route = createFileRoute("/patients/new")({
  component: NewPatientPage,
});

const emptyForm = {
  fullName: "",
  dob: "",
  gender: "male" as "male" | "female",
  phone: "",
  email: "",
};

function NewPatientPage() {
  const navigate = useNavigate();
  const createPatient = useCreatePatient();

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    createPatient.mutate(
      { ...form, email: form.email || undefined },
      {
        onSuccess: (p) => {
          toast.success(`Patient ${p.fullName} added`);
          navigate({ to: "/patients/$id", params: { id: p.id } });
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
      title="Add New Patient"
      breadcrumbs={[
        { label: "Dashboard", to: "/dashboard" },
        { label: "Patients", to: "/patients" },
        { label: "New" },
      ]}
    >
      <form onSubmit={submit}>
        <FormShell
          title="Patient Information"
          description="Register a new patient in the laboratory system."
          footer={
            <>
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/patients" })}>
                Cancel
              </Button>
              <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>
                Reset
              </Button>
              <Button type="submit" disabled={createPatient.isPending}>
                {createPatient.isPending ? "Saving..." : "Save Patient"}
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
                placeholder="+966500000000"
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input
                type="email"
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

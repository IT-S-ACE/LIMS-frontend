import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Field } from "@/components/form-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCreatePatient } from "@/hooks/use-patients";
import { ValidationError, ApiError } from "@/lib/api-client";
import type { PatientListItem } from "@/services/patients";

const empty = {
  fullName: "",
  dob: "",
  gender: "male" as "male" | "female",
  phone: "",
  email: "",
};

export function PatientQuickAddDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (p: PatientListItem) => void;
}) {
  const createPatient = useCreatePatient();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    createPatient.mutate(
      { ...form, email: form.email || undefined },
      {
        onSuccess: (p) => {
          toast.success(`Patient ${p.fullName} created`);
          setForm(empty);
          onOpenChange(false);
          onCreated?.(p);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>
            Register a new patient without leaving this page. The patient will be auto-selected on
            save.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPatient.isPending}>
              {createPatient.isPending ? "Saving..." : "Save & Select Patient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

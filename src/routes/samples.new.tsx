import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Field, FormShell } from "@/components/form-shell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTestRequests } from "@/hooks/use-test-requests";
import { useRegisterSample } from "@/hooks/use-samples";
import { ApiError, ValidationError } from "@/lib/api-client";
import { useState } from "react";
import { toast } from "sonner";

interface NewSampleSearch {
  requestId?: string;
}

const SAMPLE_TYPES = [
  "blood",
  "serum",
  "plasma",
  "urine",
  "stool",
  "swab",
  "tissue",
  "other",
] as const;

export const Route = createFileRoute("/samples/new")({
  validateSearch: (search: Record<string, unknown>): NewSampleSearch => ({
    requestId: typeof search.requestId === "string" ? search.requestId : undefined,
  }),
  component: RegisterSamplePage,
});

function RegisterSamplePage() {
  const { requestId: initialRequestId } = Route.useSearch();
  const navigate = useNavigate();
  const { data, isLoading } = useTestRequests({ perPage: 100 });
  const register = useRegisterSample();
  const [testRequestId, setTestRequestId] = useState(initialRequestId ?? "");
  const [sampleType, setSampleType] = useState("");

  const eligibleRequests = (data?.rows ?? []).filter(
    (request) => request.status === "pending" || request.status === "processing",
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!testRequestId) return toast.error("Please select a test request");
    if (!sampleType) return toast.error("Please select a sample type");

    register.mutate(
      { testRequestId, sampleType },
      {
        onSuccess: (sample) => {
          toast.success(`Sample ${sample.sampleNumber} registered`);
          navigate({ to: "/samples/$id", params: { id: sample.id } });
        },
        onError: (error) => {
          if (error instanceof ValidationError) {
            toast.error(Object.values(error.errors)[0]?.[0] ?? error.message);
          } else if (error instanceof ApiError) {
            toast.error(error.message);
          }
        },
      },
    );
  }

  if (isLoading) {
    return (
      <AppShell title="Register Sample">
        <Skeleton className="h-80 w-full" />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Register Sample"
      breadcrumbs={[
        { label: "Dashboard", to: "/dashboard" },
        { label: "Samples", to: "/samples" },
        { label: "Register" },
      ]}
    >
      <form onSubmit={submit} className="max-w-2xl space-y-4">
        <FormShell
          title="Sample Registration"
          description="Link the specimen to an active test request. The Sample ID, barcode, and QR code are generated automatically."
        >
          <Field label="Test Request" required>
            <Select value={testRequestId} onValueChange={setTestRequestId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an active request" />
              </SelectTrigger>
              <SelectContent>
                {eligibleRequests.map((request) => (
                  <SelectItem key={request.id} value={request.id}>
                    {request.requestNumber} — {request.patient.name} — {request.testsSummary}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Sample Type" required>
            <Select value={sampleType} onValueChange={setSampleType}>
              <SelectTrigger>
                <SelectValue placeholder="Select specimen type" />
              </SelectTrigger>
              <SelectContent>
                {SAMPLE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {eligibleRequests.length === 0 && (
            <p className="text-sm text-muted-foreground">
              There are no pending or processing test requests available.
            </p>
          )}
        </FormShell>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={register.isPending || eligibleRequests.length === 0}>
            {register.isPending ? "Registering..." : "Register Sample"}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}

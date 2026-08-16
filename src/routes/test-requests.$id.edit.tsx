import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { FormShell, Field } from "@/components/form-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { useTestRequest, useUpdateTestRequest } from "@/hooks/use-test-requests";
import { useTestCatalog } from "@/hooks/use-tests";
import { ValidationError, ApiError } from "@/lib/api-client";
import type { TestRequestDetail } from "@/services/test-requests";
import type { BackendTestRequestStatus } from "@/lib/api-types";

export const Route = createFileRoute("/test-requests/$id/edit")({
  component: EditRequest,
});

function EditRequest() {
  const { id } = Route.useParams();
  const { data: request, isLoading } = useTestRequest(id);
  const { data: testCatalog, isLoading: testsLoading } = useTestCatalog();

  if (isLoading || testsLoading) {
    return (
      <AppShell title="Loading...">
        <Skeleton className="h-64 w-full" />
      </AppShell>
    );
  }

  if (!request) return <AppShell title="Not found">Request not found</AppShell>;

  return <EditRequestForm request={request} testCatalog={testCatalog ?? []} />;
}

function EditRequestForm({
  request,
  testCatalog,
}: {
  request: TestRequestDetail;
  testCatalog: { id: string; name: string; price: number }[];
}) {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const updateTestRequest = useUpdateTestRequest();
  const locked = request.status === "completed" || request.status === "cancelled";

  const [status, setStatus] = useState<BackendTestRequestStatus>(request.status);
  const [selectedTests, setSelectedTests] = useState<Record<string, number>>(
    Object.fromEntries(request.items.map((item) => [item.testId, item.quantity])),
  );
  const [reason, setReason] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(selectedTests).length === 0) return toast.error("Select at least one test");
    if (!reason.trim()) return toast.error("Reason for modification is required");
    updateTestRequest.mutate(
      {
        id,
        input: {
          status,
          tests: Object.entries(selectedTests).map(([testId, quantity]) => ({
            testId,
            quantity,
          })),
          reason: reason.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Request updated");
          navigate({ to: "/test-requests/$id", params: { id } });
        },
        onError: (err) => {
          if (err instanceof ValidationError || err instanceof ApiError) toast.error(err.message);
        },
      },
    );
  }

  return (
    <AppShell
      title="Edit Request"
      breadcrumbs={[
        { label: "Test Requests", to: "/test-requests" },
        { label: request.requestNumber, to: `/test-requests/${id}` },
        { label: "Edit" },
      ]}
    >
      {locked ? (
        <div className="rounded-md border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          This request is <span className="font-medium capitalize">{request.status}</span> and can
          no longer be edited.
        </div>
      ) : (
        <form onSubmit={submit}>
          <FormShell
            title={`Edit ${request.requestNumber}`}
            footer={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: "/test-requests/$id", params: { id } })}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateTestRequest.isPending}>
                  {updateTestRequest.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            }
          >
            <Field label="Status">
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as BackendTestRequestStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tests">
              <div className="grid md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {testCatalog.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center justify-between gap-2 p-2 border rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={t.id in selectedTests}
                        onCheckedChange={(checked) => {
                          setSelectedTests((current) => {
                            const next = { ...current };
                            if (checked) next[t.id] = 1;
                            else delete next[t.id];
                            return next;
                          });
                        }}
                      />
                      <span className="text-sm">
                        {t.name} — ${t.price.toFixed(2)}
                      </span>
                    </div>
                    {t.id in selectedTests && (
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
                  </label>
                ))}
              </div>
            </Field>
            <Field
              label="Reason for Modification"
              required
              hint="Saved to the audit trail with the old and new values."
            >
              <Textarea
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. Corrected the selected tests at the physician's request"
              />
            </Field>
          </FormShell>
        </form>
      )}
    </AppShell>
  );
}

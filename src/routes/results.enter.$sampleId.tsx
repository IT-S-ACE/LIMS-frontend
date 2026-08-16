import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Field, FormShell } from "@/components/form-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useResultWorkspace,
  useSaveResultDrafts,
  useSubmitSampleResults,
} from "@/hooks/use-results";
import { ApiError, ValidationError } from "@/lib/api-client";
import { Save, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/results/enter/$sampleId")({ component: EnterResult });

type FormValue = Record<string, { value: string; notes: string }>;

function errorMessage(error: Error): string {
  if (error instanceof ValidationError) return Object.values(error.errors)[0]?.[0] ?? error.message;
  return error instanceof ApiError ? error.message : "The operation could not be completed.";
}

function EnterResult() {
  const { sampleId } = Route.useParams();
  const navigate = useNavigate();
  const { data: workspace, isLoading } = useResultWorkspace(sampleId);
  const save = useSaveResultDrafts();
  const submit = useSubmitSampleResults();
  const [form, setForm] = useState<FormValue>({});

  useEffect(() => {
    if (!workspace) return;
    setForm(
      Object.fromEntries(
        workspace.tests.map((item) => [
          item.testRequestItemId,
          {
            value: item.result?.value ?? "",
            notes: item.result?.notes ?? "",
          },
        ]),
      ),
    );
  }, [workspace]);

  if (isLoading)
    return (
      <AppShell title="Enter Results">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  if (!workspace) return <AppShell title="Not found">Sample not found.</AppShell>;

  const editableItems = workspace.tests.filter(
    (item) => !item.result || ["draft", "correction_required"].includes(item.result.status),
  );
  const locked = editableItems.length === 0;
  const canEdit = ["in_progress", "completed"].includes(workspace.sampleStatus) && !locked;

  function payload() {
    return editableItems.map((item) => ({
      testRequestItemId: item.testRequestItemId,
      value: form[item.testRequestItemId]?.value.trim() ?? "",
      notes: form[item.testRequestItemId]?.notes.trim() || undefined,
    }));
  }

  function saveDraft(onSaved?: () => void) {
    if (payload().some((result) => !result.value))
      return toast.error("Enter a value for every test.");
    save.mutate(
      { sampleId, results: payload() },
      {
        onSuccess: () => {
          toast.success("Result draft saved");
          onSaved?.();
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  }

  function submitForReview() {
    if (workspace!.sampleStatus !== "completed") {
      return toast.error("Complete the sample analysis before submitting results for review.");
    }
    saveDraft(() =>
      submit.mutate(sampleId, {
        onSuccess: (results) => {
          toast.success("Results submitted for medical review");
          if (results[0]) navigate({ to: "/results/$id", params: { id: results[0].id } });
        },
        onError: (error) => toast.error(errorMessage(error)),
      }),
    );
  }

  return (
    <AppShell
      title={`Results — ${workspace.sampleNumber}`}
      breadcrumbs={[
        { label: "Samples", to: "/samples" },
        { label: workspace.sampleNumber, to: `/samples/${sampleId}` },
        { label: "Results" },
      ]}
    >
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>{workspace.patient?.name ?? "Unknown patient"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {workspace.request?.requestNumber} · {workspace.barcode}
            </p>
          </div>
          <StatusBadge status={workspace.sampleStatus} />
        </CardHeader>
      </Card>

      {locked && (
        <div className="mb-4 rounded border bg-muted p-3 text-sm">
          These results are already in review or approved and cannot be edited.
        </div>
      )}

      <FormShell
        title="Requested Test Results"
        description="Units and reference ranges are snapshotted from the test catalog. Flags are calculated by Laravel when saved."
        footer={
          canEdit ? (
            <>
              <Button
                variant="outline"
                onClick={() => saveDraft()}
                disabled={save.isPending || submit.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={submitForReview}
                disabled={
                  save.isPending || submit.isPending || workspace.sampleStatus !== "completed"
                }
              >
                <Send className="w-4 h-4 mr-2" />
                Submit for Review
              </Button>
            </>
          ) : undefined
        }
      >
        <div className="space-y-4">
          {workspace.tests.map((item) => {
            const state = form[item.testRequestItemId] ?? { value: "", notes: "" };
            const itemEditable =
              canEdit &&
              (!item.result || ["draft", "correction_required"].includes(item.result.status));
            return (
              <Card key={item.testRequestItemId}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{item.test.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Reference: {item.test.referenceRange} {item.test.unit}
                      </p>
                    </div>
                    {item.result && <StatusBadge status={item.result.status} />}
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <Field label="Result Value" required>
                    {item.test.resultType === "choice" ? (
                      <Select
                        disabled={!itemEditable}
                        value={state.value}
                        onValueChange={(value) =>
                          setForm({ ...form, [item.testRequestItemId]: { ...state, value } })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select result" />
                        </SelectTrigger>
                        <SelectContent>
                          {item.test.resultOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        disabled={!itemEditable}
                        type={item.test.resultType === "numeric" ? "number" : "text"}
                        step="any"
                        value={state.value}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            [item.testRequestItemId]: { ...state, value: event.target.value },
                          })
                        }
                      />
                    )}
                  </Field>
                  <Field label="Unit">
                    <Input value={item.test.unit ?? ""} disabled />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Technician Notes">
                      <Textarea
                        disabled={!itemEditable}
                        rows={2}
                        value={state.notes}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            [item.testRequestItemId]: { ...state, notes: event.target.value },
                          })
                        }
                      />
                    </Field>
                  </div>
                  {item.result?.correctionReason && (
                    <div className="md:col-span-2 rounded border border-destructive/30 bg-destructive/10 p-3 text-sm">
                      <strong>Correction requested:</strong> {item.result.correctionReason}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </FormShell>
    </AppShell>
  );
}

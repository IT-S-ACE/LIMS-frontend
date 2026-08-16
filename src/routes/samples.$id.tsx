import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Ban, Beaker, Check, FilePenLine, Printer, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import {
  useCancelSample,
  useDeleteSample,
  useRejectSample,
  useSample,
  useUpdateSampleStatus,
} from "@/hooks/use-samples";
import { ApiError, ValidationError } from "@/lib/api-client";
import type { SampleStatus } from "@/services/samples";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/samples/$id")({
  component: SampleDetail,
});

const FLOW: SampleStatus[] = ["registered", "collected", "in_progress", "completed"];

function statusLabel(status: SampleStatus): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function errorMessage(error: Error): string {
  if (error instanceof ValidationError) {
    return Object.values(error.errors)[0]?.[0] ?? error.message;
  }
  return error instanceof ApiError ? error.message : "The operation could not be completed.";
}

function SampleDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const currentUser = useStore((state) => state.currentUser);
  const { data: sample, isLoading } = useSample(id);
  const updateStatus = useUpdateSampleStatus();
  const reject = useRejectSample();
  const cancel = useCancelSample();
  const remove = useDeleteSample();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (isLoading) {
    return (
      <AppShell title="Loading sample...">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  }

  if (!sample) return <AppShell title="Not found">Sample not found</AppShell>;

  const stepIndex = FLOW.indexOf(sample.status);
  const canReject = ["registered", "collected", "in_progress"].includes(sample.status);
  const canCancel = ["registered", "collected"].includes(sample.status);
  const canDelete = sample.status === "registered" && sample.resultsCount === 0;

  function advance() {
    if (!sample?.nextStatus) return;
    updateStatus.mutate(
      { id, status: sample.nextStatus },
      {
        onSuccess: (updated) => toast.success(`Sample status: ${statusLabel(updated.status)}`),
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  }

  function submitDisposition(action: "reject" | "cancel") {
    if (!reason.trim()) return toast.error("Reason is required");
    const mutation = action === "reject" ? reject : cancel;
    mutation.mutate(
      { id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(action === "reject" ? "Sample rejected" : "Sample cancelled");
          setReason("");
          setRejectOpen(false);
          setCancelOpen(false);
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  }

  function deleteCurrentSample() {
    if (!window.confirm(`Delete ${sample.sampleNumber}? This action cannot be undone.`)) return;
    remove.mutate(id, {
      onSuccess: () => {
        toast.success("Sample deleted");
        navigate({ to: "/samples" });
      },
      onError: (error) => toast.error(errorMessage(error)),
    });
  }

  return (
    <AppShell
      title={`Sample ${sample.sampleNumber}`}
      breadcrumbs={[{ label: "Samples", to: "/samples" }, { label: sample.sampleNumber }]}
      actions={
        <>
          {currentUser &&
            ["admin", "technician"].includes(currentUser.role) &&
            ["in_progress", "completed"].includes(sample.status) && (
              <Button
                onClick={() =>
                  navigate({ to: "/results/enter/$sampleId", params: { sampleId: id } })
                }
              >
                <FilePenLine className="w-4 h-4 mr-2" /> Enter Results
              </Button>
            )}
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print Label
          </Button>
          {canDelete && (
            <Button variant="destructive" onClick={deleteCurrentSample} disabled={remove.isPending}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          )}
        </>
      }
    >
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle>Sample Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                Created {new Date(sample.createdAt).toLocaleString()}
              </p>
            </div>
            <StatusBadge status={sample.status} />
          </CardHeader>
          <CardContent>
            <dl className="grid md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Info
                label="Tests"
                value={
                  sample.tests.map((test) => `${test.name} × ${test.quantity}`).join(", ") || "—"
                }
              />
              <Info label="Sample Type" value={sample.sampleType} />
              <Info label="Barcode" value={<span className="font-mono">{sample.barcode}</span>} />
              <Info
                label="Patient"
                value={
                  sample.patient ? (
                    <Link
                      to="/patients/$id"
                      params={{ id: sample.patient.id }}
                      className="text-primary hover:underline"
                    >
                      {sample.patient.name}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              <Info
                label="Request"
                value={
                  sample.request ? (
                    <Link
                      to="/test-requests/$id"
                      params={{ id: sample.request.id }}
                      className="text-primary hover:underline"
                    >
                      {sample.request.requestNumber}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              <Info
                label="Collected"
                value={sample.collectedAt ? new Date(sample.collectedAt).toLocaleString() : "—"}
              />
            </dl>

            {sample.rejectedReason && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm">
                <div className="font-medium text-destructive">Rejection Reason</div>
                {sample.rejectedReason}
              </div>
            )}
            {sample.cancelledReason && (
              <div className="mt-4 p-3 bg-muted rounded text-sm">
                <div className="font-medium">Cancellation Reason</div>
                {sample.cancelledReason}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="sample-label">
          <CardHeader>
            <CardTitle>Sample Label</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <div className="bg-white p-3 inline-block rounded border border-border">
              <QRCodeSVG value={sample.qrCode} size={128} level="M" />
            </div>
            <div className="overflow-hidden bg-white p-2 rounded">
              <Barcode
                value={sample.barcode}
                format="CODE128"
                width={1.35}
                height={48}
                margin={0}
                fontSize={12}
                displayValue
              />
            </div>
            <div>
              <div className="font-mono font-semibold">{sample.sampleNumber}</div>
              <div className="text-sm">{sample.patient?.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{sample.sampleType}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {FLOW.map((step, index) => {
              const completed =
                stepIndex >= index && !["rejected", "cancelled"].includes(sample.status);
              return (
                <li key={step} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 shrink-0 rounded-full grid place-items-center text-sm font-bold ${completed ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {completed ? "✓" : index + 1}
                  </div>
                  <span className="text-sm font-medium">{statusLabel(step)}</span>
                </li>
              );
            })}
          </ol>

          <div className="flex flex-wrap gap-2 justify-center">
            {sample.nextStatus && (
              <Button onClick={advance} disabled={updateStatus.isPending}>
                <Check className="w-4 h-4 mr-2" />
                {updateStatus.isPending
                  ? "Updating..."
                  : `Advance to ${statusLabel(sample.nextStatus)}`}
              </Button>
            )}

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-destructive" disabled={!canReject}>
                  <XCircle className="w-4 h-4 mr-2" /> Reject Sample
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Sample</DialogTitle>
                  <DialogDescription>
                    Record why this specimen cannot be analyzed.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="e.g. Hemolyzed sample or insufficient volume"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRejectOpen(false)}>
                    Back
                  </Button>
                  <Button variant="destructive" onClick={() => submitDisposition("reject")}>
                    Confirm Reject
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={!canCancel}>
                  <Ban className="w-4 h-4 mr-2" /> Cancel Sample
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Sample</DialogTitle>
                  <DialogDescription>
                    Cancellation is allowed before laboratory analysis starts.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Cancellation reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCancelOpen(false)}>
                    Back
                  </Button>
                  <Button variant="destructive" onClick={() => submitDisposition("cancel")}>
                    Confirm Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="w-5 h-5" /> Reagent Consumption
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Stock is consumed once, using FEFO, when the sample enters In Progress.
          </p>
        </CardHeader>
        <CardContent>
          {!sample.reagentsConsumedAt ? (
            <p className="text-sm text-muted-foreground">No reagents consumed yet.</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                Consumed {new Date(sample.reagentsConsumedAt).toLocaleString()}
              </p>
              <div className="overflow-x-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left p-2">Test</th>
                      <th className="text-left p-2">Reagent</th>
                      <th className="text-left p-2">Lot</th>
                      <th className="text-right p-2">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sample.reagentConsumptions.map((consumption) => (
                      <tr key={consumption.id} className="border-t">
                        <td className="p-2">{consumption.testName ?? "—"}</td>
                        <td className="p-2">
                          <span className="font-medium">{consumption.reagentName ?? "—"}</span>
                          {consumption.reagentCode && (
                            <span className="ml-2 text-xs font-mono text-muted-foreground">
                              {consumption.reagentCode}
                            </span>
                          )}
                        </td>
                        <td className="p-2 font-mono">{consumption.lotNumber ?? "—"}</td>
                        <td className="p-2 text-right font-medium">{consumption.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {sample.timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lifecycle events recorded.</p>
          ) : (
            <ol className="space-y-4">
              {sample.timeline.map((entry) => (
                <li key={entry.id} className="flex gap-3">
                  <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                  <div>
                    <div className="text-sm font-medium">
                      {entry.fromStatus
                        ? `${statusLabel(entry.fromStatus)} → ${statusLabel(entry.toStatus)}`
                        : statusLabel(entry.toStatus)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                      {entry.changedBy ? ` · ${entry.changedBy.name}` : ""}
                    </div>
                    {entry.reason && <p className="text-sm mt-1">{entry.reason}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

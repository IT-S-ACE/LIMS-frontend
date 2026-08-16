import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useApproveResult, useResult, useReturnResult, useReviewResult } from "@/hooks/use-results";
import { ApiError, ValidationError } from "@/lib/api-client";
import { useStore } from "@/lib/store";
import { Check, FileText, Pencil, RotateCcw, Stethoscope } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/results/$id")({ component: ResultDetail });

function errorMessage(error: Error): string {
  if (error instanceof ValidationError) return Object.values(error.errors)[0]?.[0] ?? error.message;
  return error instanceof ApiError ? error.message : "The operation could not be completed.";
}

function ResultDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const currentUser = useStore((state) => state.currentUser);
  const { data: result, isLoading } = useResult(id);
  const review = useReviewResult();
  const returnForCorrection = useReturnResult();
  const approve = useApproveResult();
  const [dialog, setDialog] = useState<"review" | "return" | null>(null);
  const [text, setText] = useState("");

  if (isLoading)
    return (
      <AppShell title="Result">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  if (!result) return <AppShell title="Not found">Result not found.</AppShell>;

  const isAdmin = currentUser?.role === "admin";
  const canEdit = ["draft", "correction_required"].includes(result.status);

  function runDialogAction() {
    if (dialog === "return" && !text.trim()) return toast.error("Correction reason is required.");
    const mutation = dialog === "review" ? review : returnForCorrection;
    mutation.mutate(
      { id, text: text.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(
            dialog === "review" ? "Medical review completed" : "Result returned for correction",
          );
          setDialog(null);
          setText("");
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  }

  return (
    <AppShell
      title={`Result ${result.resultNumber}`}
      breadcrumbs={[{ label: "Results", to: "/results" }, { label: result.resultNumber }]}
      actions={
        <>
          {canEdit && (
            <Button
              variant="outline"
              onClick={() =>
                navigate({ to: "/results/enter/$sampleId", params: { sampleId: result.sampleId } })
              }
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Draft
            </Button>
          )}
          {isAdmin && result.status === "pending_review" && (
            <Button onClick={() => setDialog("review")}>
              <Stethoscope className="w-4 h-4 mr-2" />
              Review
            </Button>
          )}
          {isAdmin && ["pending_review", "reviewed"].includes(result.status) && (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => setDialog("return")}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Return
            </Button>
          )}
          {isAdmin && result.status === "reviewed" && (
            <Button
              onClick={() =>
                approve.mutate(
                  { id },
                  {
                    onSuccess: () => toast.success("Result approved and locked"),
                    onError: (error) => toast.error(errorMessage(error)),
                  },
                )
              }
              disabled={approve.isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              Approve
            </Button>
          )}
          {result.requestStatus === "completed" && result.requestId && (
            <Link to="/reports/$id" params={{ id: result.requestId }}>
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                Medical Report
              </Button>
            </Link>
          )}
        </>
      }
    >
      {result.correctionReason && (
        <div className="mb-4 rounded border border-destructive/30 bg-destructive/10 p-3 text-sm">
          <strong>Correction requested:</strong> {result.correctionReason}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>{result.test?.name ?? "Laboratory Test"}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {result.patient?.name} · {result.requestNumber}
              </p>
            </div>
            <StatusBadge status={result.status} />
          </CardHeader>
          <CardContent className="space-y-5">
            <dl className="grid gap-4 md:grid-cols-2">
              <Info
                label="Result"
                value={
                  <span className="text-2xl font-bold">
                    {result.value}{" "}
                    <span className="text-base font-normal text-muted-foreground">
                      {result.unit}
                    </span>
                  </span>
                }
              />
              <Info label="Flag" value={<StatusBadge status={result.flag} />} />
              <Info label="Reference Range" value={result.referenceRange ?? "—"} />
              <Info
                label="Sample"
                value={
                  <Link
                    to="/samples/$id"
                    params={{ id: result.sampleId }}
                    className="text-primary hover:underline"
                  >
                    {result.sampleNumber}
                  </Link>
                }
              />
              <Info label="Entered By" value={result.enteredBy?.name ?? "—"} />
              <Info
                label="Entered At"
                value={result.enteredAt ? new Date(result.enteredAt).toLocaleString() : "—"}
              />
              <Info label="Reviewed By" value={result.reviewedBy?.name ?? "—"} />
              <Info label="Approved By" value={result.approvedBy?.name ?? "—"} />
            </dl>
            {result.notes && (
              <div className="rounded bg-muted p-3 text-sm">
                <div className="mb-1 text-xs text-muted-foreground">Technician Notes</div>
                {result.notes}
              </div>
            )}
            {result.reviewNotes && (
              <div className="rounded bg-muted p-3 text-sm">
                <div className="mb-1 text-xs text-muted-foreground">Medical Review Notes</div>
                {result.reviewNotes}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {result.timeline.map((entry) => (
                <li key={entry.id} className="relative border-l pl-4">
                  <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary" />
                  <div className="font-medium capitalize">{entry.toStatus.replace(/_/g, " ")}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()} ·{" "}
                    {entry.changedBy?.name ?? "System"}
                  </div>
                  {entry.reason && <p className="mt-1 text-sm">{entry.reason}</p>}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "review" ? "Complete Medical Review" : "Return for Correction"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "review"
                ? "Confirm that the value, flag, unit and reference range are medically consistent."
                : "Explain exactly what the technician must correct."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={
              dialog === "review" ? "Optional review notes" : "Required correction reason"
            }
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={runDialogAction}
              disabled={review.isPending || returnForCorrection.isPending}
            >
              {dialog === "review" ? "Mark Reviewed" : "Return Result"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

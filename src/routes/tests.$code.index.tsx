import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteTest, useTest } from "@/hooks/use-tests";
import { ApiError, ValidationError } from "@/lib/api-client";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/tests/$code/")({
  head: () => ({
    meta: [
      { title: "Test Details — MedLab LIMS" },
      {
        name: "description",
        content:
          "View laboratory test details including price, reference range, unit and audit timestamps.",
      },
      { property: "og:title", content: "Test Details — MedLab LIMS" },
      {
        property: "og:description",
        content: "Laboratory test definition details in the MedLab LIMS catalog.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TestDetailsPage,
});

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function fmt(iso?: string) {
  return iso ? new Date(iso).toLocaleString() : "—";
}

function TestDetailsPage() {
  const currentUser = useStore((state) => state.currentUser);
  const canManage = currentUser?.role === "admin";
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const { data: test, isLoading } = useTest(code);
  const deleteTest = useDeleteTest();
  const [confirm, setConfirm] = useState(false);

  if (isLoading) {
    return (
      <AppShell title="Loading...">
        <Skeleton className="h-64 w-full" />
      </AppShell>
    );
  }

  if (!test) {
    return (
      <AppShell
        title="Test not found"
        breadcrumbs={[{ label: "Tests", to: "/tests" }, { label: "Not found" }]}
      >
        <p className="text-sm text-muted-foreground">
          This test is no longer in the catalog.{" "}
          <Link to="/tests" className="text-primary hover:underline">
            Back to Tests
          </Link>
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={test.name}
      breadcrumbs={[{ label: "Tests", to: "/tests" }, { label: test.name }]}
      actions={
        canManage ? (
          <>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/tests/$code/edit", params: { code } })}
            >
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button variant="outline" className="text-destructive" onClick={() => setConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </>
        ) : undefined
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Test Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            Catalog code <span className="font-mono">{test.code}</span>
          </p>
        </CardHeader>
        <CardContent>
          <dl className="grid md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Info label="Test Name" value={test.name} />
            <Info label="Price" value={`$${test.price.toFixed(2)}`} />
            <Info label="Reference Range" value={test.refRange || "—"} />
            <Info label="Unit" value={test.unit || "—"} />
            <Info
              label="Result Type"
              value={test.resultType.replace(/\b\w/g, (character) => character.toUpperCase())}
            />
            <Info
              label="Allowed Choices"
              value={test.resultType === "choice" ? test.resultOptions.join(", ") : "—"}
            />
            <Info label="Critical Low" value={test.criticalLow ?? "—"} />
            <Info label="Critical High" value={test.criticalHigh ?? "—"} />
            <Info label="Created Date" value={fmt(test.createdAt)} />
            <Info label="Last Updated" value={fmt(test.updatedAt ?? test.createdAt)} />
          </dl>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Reagent Consumption Rules</CardTitle>
          <p className="text-sm text-muted-foreground">
            Quantities automatically consumed for one ordered test when analysis starts.
          </p>
        </CardHeader>
        <CardContent>
          {test.reagents.length === 0 ? (
            <p className="text-sm text-destructive">
              No reagent rule is configured. Samples containing this test cannot enter In Progress.
            </p>
          ) : (
            <ul className="space-y-2">
              {test.reagents.map((reagent) => (
                <li key={reagent.id} className="border rounded p-3 flex justify-between text-sm">
                  <span className="font-medium">{reagent.name}</span>
                  <span>{reagent.quantityUsed} per test</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={canManage && confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete test?</AlertDialogTitle>
            <AlertDialogDescription>
              {test.name} will be removed only if it is not linked to an existing test request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteTest.mutate(test.id, {
                  onSuccess: () => {
                    toast.success(`${test.name} deleted`);
                    navigate({ to: "/tests" });
                  },
                  onError: (error) => {
                    if (error instanceof ValidationError || error instanceof ApiError) {
                      toast.error(error.message);
                    }
                  },
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

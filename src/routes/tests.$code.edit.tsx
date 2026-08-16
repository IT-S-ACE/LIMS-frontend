import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { FormShell, Field } from "@/components/form-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TestFields, validateTest, type TestFormErrors } from "@/components/test-fields";
import { useState } from "react";
import { toast } from "sonner";
import type { TestCatalogItem } from "@/lib/types";
import { useTest, useTestCatalog, useUpdateTest } from "@/hooks/use-tests";
import { ApiError, ValidationError } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/tests/$code/edit")({
  head: () => ({
    meta: [
      { title: "Edit Laboratory Test — MedLab LIMS" },
      {
        name: "description",
        content:
          "Update a laboratory test definition with a mandatory reason for modification recorded in the audit log.",
      },
      { property: "og:title", content: "Edit Laboratory Test — MedLab LIMS" },
      { property: "og:description", content: "Modify test name, price, reference range and unit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditTestPage,
});

function EditTestPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const { data: tests = [] } = useTestCatalog();
  const { data: test, isLoading } = useTest(code);
  const updateTest = useUpdateTest();

  if (isLoading) {
    return (
      <AppShell title="Loading...">
        <Skeleton className="h-64 w-full" />
      </AppShell>
    );
  }

  if (!test) return <AppShell title="Test not found">This test is not in the catalog.</AppShell>;

  return <EditTestForm test={test} tests={tests} updateTest={updateTest} />;
}

function EditTestForm({
  test,
  tests,
  updateTest,
}: {
  test: TestCatalogItem;
  tests: TestCatalogItem[];
  updateTest: ReturnType<typeof useUpdateTest>;
}) {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<TestCatalogItem>(test);
  const [errors, setErrors] = useState<TestFormErrors>({});
  const [reason, setReason] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateTest(form!, tests, code);
    setErrors(errs);
    if (Object.keys(errs).length) return toast.error("Please fix the highlighted fields");
    if (!reason.trim()) return toast.error("Reason for modification is required");
    const next: TestCatalogItem = {
      ...form!,
      name: form!.name.trim(),
      refRange: form!.refRange.trim(),
      unit: form!.unit.trim(),
    };
    updateTest.mutate(
      {
        id: code,
        input: {
          name: next.name,
          price: next.price,
          referenceRange: next.refRange,
          unit: next.unit,
          resultType: next.resultType ?? "text",
          resultOptions: (next.resultOptions ?? []).filter(Boolean),
          criticalLow: next.criticalLow ?? null,
          criticalHigh: next.criticalHigh ?? null,
          reason: reason.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Test updated with audit trail");
          navigate({ to: "/tests/$code", params: { code } });
        },
        onError: (error) => {
          if (error instanceof ValidationError || error instanceof ApiError) {
            toast.error(error.message);
          }
        },
      },
    );
  }

  return (
    <AppShell
      title={`Edit ${test.name}`}
      breadcrumbs={[{ label: "Tests", to: "/tests" }, { label: test.name }, { label: "Edit" }]}
    >
      <form onSubmit={submit}>
        <FormShell
          title="Test Definition"
          footer={
            <>
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/tests" })}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTest.isPending}>
                {updateTest.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          }
        >
          <TestFields value={form} onChange={setForm} errors={errors} />
          <div className="pt-2 border-t border-border">
            <Field
              label="Reason for Modification"
              required
              hint="Required — logged to Audit Trail with old and new values"
            >
              <Textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Annual price revision"
              />
            </Field>
          </div>
        </FormShell>
      </form>
    </AppShell>
  );
}

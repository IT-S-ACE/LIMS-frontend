import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { FormShell } from "@/components/form-shell";
import { Button } from "@/components/ui/button";
import { TestFields, validateTest, type TestFormErrors } from "@/components/test-fields";
import { useState } from "react";
import { toast } from "sonner";
import type { TestCatalogItem } from "@/lib/types";
import { useCreateTest, useTestCatalog } from "@/hooks/use-tests";
import { ApiError, ValidationError } from "@/lib/api-client";

export const Route = createFileRoute("/tests/new")({
  head: () => ({
    meta: [
      { title: "Add Laboratory Test — MedLab LIMS" },
      {
        name: "description",
        content:
          "Add a new laboratory test to the catalog with name, price, reference range and unit.",
      },
      { property: "og:title", content: "Add Laboratory Test — MedLab LIMS" },
      {
        property: "og:description",
        content: "Create a new test definition in the MedLab LIMS catalog.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewTestPage,
});

function NewTestPage() {
  const navigate = useNavigate();
  const { data: tests = [] } = useTestCatalog();
  const createTest = useCreateTest();
  const [errors, setErrors] = useState<TestFormErrors>({});
  const [form, setForm] = useState<TestCatalogItem>({
    code: "",
    name: "",
    price: 0,
    refRange: "",
    unit: "",
    resultType: "numeric",
    resultOptions: [],
    criticalLow: null,
    criticalHigh: null,
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateTest(form, tests);
    setErrors(errs);
    if (Object.keys(errs).length) return toast.error("Please fix the highlighted fields");
    createTest.mutate(
      {
        name: form.name.trim(),
        price: form.price,
        referenceRange: form.refRange.trim(),
        unit: form.unit.trim(),
        resultType: form.resultType ?? "text",
        resultOptions: (form.resultOptions ?? []).filter(Boolean),
        criticalLow: form.criticalLow ?? null,
        criticalHigh: form.criticalHigh ?? null,
      },
      {
        onSuccess: () => {
          toast.success(`${form.name.trim()} added to the tests catalog`);
          navigate({ to: "/tests" });
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
    <AppShell title="Add Test" breadcrumbs={[{ label: "Tests", to: "/tests" }, { label: "New" }]}>
      <form onSubmit={submit}>
        <FormShell
          title="Test Definition"
          description="Define a laboratory test available for ordering."
          footer={
            <>
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/tests" })}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTest.isPending}>
                {createTest.isPending ? "Saving..." : "Save Test"}
              </Button>
            </>
          }
        >
          <TestFields value={form} onChange={setForm} errors={errors} />
        </FormShell>
      </form>
    </AppShell>
  );
}

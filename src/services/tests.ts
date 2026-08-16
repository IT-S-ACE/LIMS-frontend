import { apiRequest } from "@/lib/api-client";
import type { BackendTest, Pagination } from "@/lib/api-types";

export interface TestCatalogEntry {
  id: string;
  code: string;
  name: string;
  price: number;
  unit: string;
  referenceRange: string;
  refRange: string;
  resultType: "numeric" | "text" | "choice";
  resultOptions: string[];
  criticalLow: number | null;
  criticalHigh: number | null;
  createdAt: string;
  updatedAt: string;
  reagents: { id: string; name: string; quantityUsed: number }[];
}

export interface TestFormInput {
  name: string;
  price: number;
  referenceRange: string;
  unit: string;
  resultType: "numeric" | "text" | "choice";
  resultOptions: string[];
  criticalLow: number | null;
  criticalHigh: number | null;
}

function adaptTest(test: BackendTest): TestCatalogEntry {
  return {
    id: test.id,
    code: test.id,
    name: test.name,
    price: Number(test.price),
    unit: test.unit ?? "",
    referenceRange: test.reference_range,
    refRange: test.reference_range,
    resultType: test.result_type,
    resultOptions: test.result_options ?? [],
    criticalLow: test.critical_low === null ? null : Number(test.critical_low),
    criticalHigh: test.critical_high === null ? null : Number(test.critical_high),
    createdAt: test.created_at,
    updatedAt: test.updated_at,
    reagents: (test.reagents ?? []).map((reagent) => ({
      id: reagent.id,
      name: reagent.name,
      quantityUsed: Number(reagent.quantity_used),
    })),
  };
}

export async function getTest(id: string): Promise<TestCatalogEntry> {
  return adaptTest(await apiRequest<BackendTest>(`/user/tests/${id}`));
}

export async function createTest(input: TestFormInput): Promise<TestCatalogEntry> {
  const test = await apiRequest<BackendTest>("/user/tests", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      price: input.price,
      reference_range: input.referenceRange,
      unit: input.unit || null,
      result_type: input.resultType,
      result_options: input.resultType === "choice" ? input.resultOptions : null,
      critical_low: input.resultType === "numeric" ? input.criticalLow : null,
      critical_high: input.resultType === "numeric" ? input.criticalHigh : null,
    }),
  });
  return adaptTest(test);
}

export async function updateTest(
  id: string,
  input: TestFormInput & { reason: string },
): Promise<TestCatalogEntry> {
  const test = await apiRequest<BackendTest>(`/user/tests/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: input.name,
      price: input.price,
      reference_range: input.referenceRange,
      unit: input.unit || null,
      result_type: input.resultType,
      result_options: input.resultType === "choice" ? input.resultOptions : null,
      critical_low: input.resultType === "numeric" ? input.criticalLow : null,
      critical_high: input.resultType === "numeric" ? input.criticalHigh : null,
      reason: input.reason,
    }),
  });
  return adaptTest(test);
}

export async function deleteTest(id: string): Promise<void> {
  await apiRequest<Record<string, never>>(`/user/tests/${id}`, { method: "DELETE" });
}

export async function listTests(): Promise<TestCatalogEntry[]> {
  const payload = await apiRequest<{ tests: BackendTest[]; pagination: Pagination }>(
    "/user/tests",
    { params: { per_page: 100 } },
  );
  return payload.tests.map(adaptTest);
}

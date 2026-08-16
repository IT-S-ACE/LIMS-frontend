import { apiRequest, downloadFromApi } from "@/lib/api-client";
import type { BackendTestRequest, BackendTestRequestStatus, Pagination } from "@/lib/api-types";

export interface TestRequestListItem {
  id: string;
  requestNumber: string;
  status: BackendTestRequestStatus;
  totalPrice: number;
  insuranceAmount: number;
  patientDue: number;
  paid: number;
  remaining: number;
  paymentStatus: "pending" | "partial" | "paid";
  invoice: { id: string; invoiceNumber: string } | null;
  patient: { id: string; name: string; phone: string; email: string | null };
  insuranceCompany: { id: string; name: string } | null;
  testsSummary: string;
  testCount: number;
  createdAt: string;
}

export interface TestRequestDetail extends TestRequestListItem {
  items: {
    id: string;
    testId: string;
    testName: string | null;
    referenceRange: string | null;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  samples: {
    id: string;
    sampleNumber: string;
    barcode: string;
    sampleType: string;
    status: string;
  }[];
}

export interface TestRequestListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: BackendTestRequestStatus | "";
}

export interface PaginatedTestRequests {
  rows: TestRequestListItem[];
  pagination: Pagination;
}

export interface TestRequestFormInput {
  patientId: string;
  insuranceCompanyId?: string;
  tests: { testId: string; quantity: number }[];
}

export interface TestRequestUpdateInput {
  patientId?: string;
  insuranceCompanyId?: string | null;
  status?: BackendTestRequestStatus;
  tests?: { testId: string; quantity: number }[];
  reason: string;
}

function adaptListItem(request: BackendTestRequest): TestRequestListItem {
  return {
    id: request.id,
    requestNumber: request.request_number,
    status: request.status,
    totalPrice: Number(request.total_price),
    insuranceAmount: Number(request.insurance_amount),
    patientDue: Number(request.patient_due),
    paid: Number(request.paid),
    remaining: Number(request.remaining),
    paymentStatus: request.payment_status,
    invoice: request.invoice
      ? { id: request.invoice.id, invoiceNumber: request.invoice.invoice_number }
      : null,
    patient: {
      id: request.patient.id,
      name: request.patient.name,
      phone: request.patient.phone,
      email: request.patient.email,
    },
    insuranceCompany: request.insurance_company,
    testsSummary: request.tests_summary,
    testCount: request.items.length,
    createdAt: request.created_at,
  };
}

function adaptDetail(request: BackendTestRequest): TestRequestDetail {
  return {
    ...adaptListItem(request),
    items: request.items.map((item) => ({
      id: item.id,
      testId: item.test_id,
      testName: item.test?.name ?? null,
      referenceRange: item.test?.reference_range ?? null,
      quantity: item.quantity,
      price: Number(item.price),
      subtotal: Number(item.subtotal),
    })),
    samples: (request.samples ?? []).map((sample) => ({
      id: sample.id,
      sampleNumber: sample.sample_number,
      barcode: sample.barcode,
      sampleType: sample.sample_type,
      status: sample.status,
    })),
  };
}

export async function listTestRequests(
  params: TestRequestListParams = {},
): Promise<PaginatedTestRequests> {
  const payload = await apiRequest<{
    test_requests: BackendTestRequest[];
    pagination: Pagination;
  }>("/user/test-requests", {
    params: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 10,
      search: params.search,
      status: params.status,
    },
  });

  return {
    rows: payload.test_requests.map(adaptListItem),
    pagination: payload.pagination,
  };
}

export async function getTestRequest(id: string): Promise<TestRequestDetail> {
  const payload = await apiRequest<BackendTestRequest>(`/user/test-requests/${id}`);
  return adaptDetail(payload);
}

export async function createTestRequest(input: TestRequestFormInput): Promise<TestRequestDetail> {
  const payload = await apiRequest<BackendTestRequest>("/user/test-requests", {
    method: "POST",
    body: JSON.stringify({
      patient_id: input.patientId,
      insurance_company_id: input.insuranceCompanyId || null,
      tests: input.tests.map((test) => ({
        test_id: test.testId,
        quantity: test.quantity,
      })),
    }),
  });
  return adaptDetail(payload);
}

export async function updateTestRequest(
  id: string,
  input: TestRequestUpdateInput,
): Promise<TestRequestDetail> {
  const payload = await apiRequest<BackendTestRequest>(`/user/test-requests/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...(input.patientId !== undefined ? { patient_id: input.patientId } : {}),
      ...(input.insuranceCompanyId !== undefined
        ? { insurance_company_id: input.insuranceCompanyId }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.tests !== undefined
        ? {
            tests: input.tests.map((test) => ({
              test_id: test.testId,
              quantity: test.quantity,
            })),
          }
        : {}),
      reason: input.reason,
    }),
  });
  return adaptDetail(payload);
}

export async function deleteTestRequest(id: string): Promise<void> {
  await apiRequest<Record<string, never>>(`/user/test-requests/${id}`, { method: "DELETE" });
}

export async function exportTestRequests(): Promise<void> {
  await downloadFromApi("/user/test-requests/export", "test-requests.csv");
}

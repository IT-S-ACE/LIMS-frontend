import { apiRequest, downloadFromApi } from "@/lib/api-client";
import type { BackendSample, BackendSampleStatus, Pagination } from "@/lib/api-types";

export type SampleStatus = BackendSampleStatus;

export interface SampleTimelineEntry {
  id: string;
  fromStatus: SampleStatus | null;
  toStatus: SampleStatus;
  reason: string | null;
  changedBy: { id: string; name: string } | null;
  createdAt: string;
}

export interface SampleRecord {
  id: string;
  sampleNumber: string;
  barcode: string;
  qrCode: string;
  sampleType: string;
  status: SampleStatus;
  nextStatus: SampleStatus | null;
  collectedAt: string | null;
  rejectedReason: string | null;
  cancelledReason: string | null;
  reagentsConsumedAt: string | null;
  reagentConsumptions: {
    id: string;
    reagentId: string;
    reagentName: string | null;
    reagentCode: string | null;
    lotNumber: string | null;
    testName: string | null;
    quantity: number;
    createdAt: string;
  }[];
  resultsCount: number | null;
  tests: { id: string; name: string; quantity: number }[];
  patient: { id: string; name: string; patientNumber: string } | null;
  request: { id: string; requestNumber: string; status: string } | null;
  timeline: SampleTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface SampleListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: SampleStatus | "";
  testRequestId?: string;
}

export interface PaginatedSamples {
  rows: SampleRecord[];
  pagination: Pagination;
}

function adaptSample(sample: BackendSample): SampleRecord {
  return {
    id: sample.id,
    sampleNumber: sample.sample_number,
    barcode: sample.barcode,
    qrCode: sample.qr_code,
    sampleType: sample.sample_type,
    status: sample.status,
    nextStatus: sample.next_status,
    collectedAt: sample.collected_at,
    rejectedReason: sample.rejected_reason,
    cancelledReason: sample.cancelled_reason,
    reagentsConsumedAt: sample.reagents_consumed_at,
    reagentConsumptions: (sample.reagent_consumptions ?? []).map((consumption) => ({
      id: consumption.id,
      reagentId: consumption.reagent_id,
      reagentName: consumption.reagent_name,
      reagentCode: consumption.reagent_code,
      lotNumber: consumption.lot_number,
      testName: consumption.test_name,
      quantity: Number(consumption.quantity),
      createdAt: consumption.created_at,
    })),
    resultsCount: sample.results_count,
    tests: sample.tests.map((test) => ({
      id: test.id,
      name: test.name,
      quantity: test.quantity,
    })),
    patient: sample.patient
      ? {
          id: sample.patient.id,
          name: sample.patient.name,
          patientNumber: sample.patient.patient_number,
        }
      : null,
    request: sample.request
      ? {
          id: sample.request.id,
          requestNumber: sample.request.request_number,
          status: sample.request.status,
        }
      : null,
    timeline: (sample.timeline ?? []).map((entry) => ({
      id: entry.id,
      fromStatus: entry.from_status,
      toStatus: entry.to_status,
      reason: entry.reason,
      changedBy: entry.changed_by,
      createdAt: entry.created_at,
    })),
    createdAt: sample.created_at,
    updatedAt: sample.updated_at,
  };
}

export async function listSamples(params: SampleListParams = {}): Promise<PaginatedSamples> {
  const payload = await apiRequest<{
    samples: BackendSample[];
    pagination: Pagination;
  }>("/user/samples", {
    params: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 10,
      search: params.search,
      status: params.status,
      test_request_id: params.testRequestId,
    },
  });

  return {
    rows: payload.samples.map(adaptSample),
    pagination: payload.pagination,
  };
}

export async function getSample(id: string): Promise<SampleRecord> {
  return adaptSample(await apiRequest<BackendSample>(`/user/samples/${id}`));
}

export async function trackSample(code: string): Promise<SampleRecord> {
  return adaptSample(
    await apiRequest<BackendSample>(`/user/samples/track/${encodeURIComponent(code.trim())}`),
  );
}

export async function registerSample(input: {
  testRequestId: string;
  sampleType: string;
}): Promise<SampleRecord> {
  return adaptSample(
    await apiRequest<BackendSample>("/user/samples", {
      method: "POST",
      body: JSON.stringify({
        test_request_id: input.testRequestId,
        sample_type: input.sampleType,
      }),
    }),
  );
}

export async function updateSampleStatus(id: string, status: SampleStatus): Promise<SampleRecord> {
  return adaptSample(
    await apiRequest<BackendSample>(`/user/samples/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  );
}

async function setSampleDisposition(
  id: string,
  action: "reject" | "cancel",
  reason: string,
): Promise<SampleRecord> {
  return adaptSample(
    await apiRequest<BackendSample>(`/user/samples/${id}/${action}`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  );
}

export function rejectSample(id: string, reason: string): Promise<SampleRecord> {
  return setSampleDisposition(id, "reject", reason);
}

export function cancelSample(id: string, reason: string): Promise<SampleRecord> {
  return setSampleDisposition(id, "cancel", reason);
}

export async function deleteSample(id: string): Promise<void> {
  await apiRequest<Record<string, never>>(`/user/samples/${id}`, { method: "DELETE" });
}

export async function exportSamples(): Promise<void> {
  await downloadFromApi("/user/samples/export", "samples.csv");
}

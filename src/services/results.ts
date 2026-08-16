import { apiRequest, downloadFromApi } from "@/lib/api-client";
import type {
  BackendResultActor,
  BackendResultStatus,
  BackendSampleStatus,
  BackendTestRequestStatus,
  BackendTestResult,
  Pagination,
} from "@/lib/api-types";

export type ResultStatus = BackendResultStatus;
export type ResultFlag = "normal" | "low" | "high" | "critical";

export interface ResultActor {
  id: string;
  name: string;
  role: string;
}

export interface ResultRecord {
  id: string;
  resultNumber: string;
  sampleId: string;
  sampleNumber: string | null;
  barcode: string | null;
  sampleStatus: BackendSampleStatus | null;
  requestId: string | null;
  requestNumber: string | null;
  requestStatus: BackendTestRequestStatus | null;
  medicalReportId: string | null;
  patient: { id: string; name: string; patientNumber: string } | null;
  testRequestItemId: string;
  test: {
    id: string;
    name: string;
    resultType: "numeric" | "text" | "choice";
    resultOptions: string[];
  } | null;
  value: string;
  unit: string | null;
  referenceRange: string | null;
  flag: ResultFlag;
  status: ResultStatus;
  notes: string | null;
  correctionReason: string | null;
  reviewNotes: string | null;
  enteredBy: ResultActor | null;
  enteredAt: string | null;
  submittedAt: string | null;
  reviewedBy: ResultActor | null;
  reviewedAt: string | null;
  approvedBy: ResultActor | null;
  approvedAt: string | null;
  timeline: {
    id: string;
    fromStatus: ResultStatus | null;
    toStatus: ResultStatus;
    reason: string | null;
    changedBy: ResultActor | null;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ResultWorkspace {
  sampleId: string;
  sampleNumber: string;
  barcode: string;
  sampleStatus: BackendSampleStatus;
  patient: { id: string; name: string } | null;
  request: { id: string; requestNumber: string; status: BackendTestRequestStatus } | null;
  tests: {
    testRequestItemId: string;
    quantity: number;
    test: {
      id: string;
      name: string;
      unit: string | null;
      referenceRange: string;
      resultType: "numeric" | "text" | "choice";
      resultOptions: string[];
      criticalLow: number | null;
      criticalHigh: number | null;
    };
    result: ResultRecord | null;
  }[];
}

interface BackendWorkspace {
  sample_id: string;
  sample_number: string;
  barcode: string;
  sample_status: BackendSampleStatus;
  patient: { id: string; name: string } | null;
  request: {
    id: string;
    request_number: string;
    status: BackendTestRequestStatus;
  } | null;
  tests: {
    test_request_item_id: string;
    quantity: number;
    test: {
      id: string;
      name: string;
      unit: string | null;
      reference_range: string;
      result_type: "numeric" | "text" | "choice";
      result_options: string[];
      critical_low: number | string | null;
      critical_high: number | string | null;
    };
    result: BackendTestResult | null;
  }[];
}

export interface MedicalReportRecord {
  id: string;
  testRequestId: string;
  generatedAt: string;
  pdfDownloadUrl: string;
  request: { id: string; requestNumber: string; status: string; createdAt: string };
  patient: {
    id: string;
    patientNumber: string;
    name: string;
    gender: string;
    dob: string;
    phone: string;
    email: string | null;
  };
  samples: {
    id: string;
    sampleNumber: string;
    barcode: string;
    sampleType: string;
    collectedAt: string | null;
  }[];
  results: {
    id: string;
    resultNumber: string;
    testName: string;
    value: string;
    unit: string | null;
    referenceRange: string | null;
    flag: ResultFlag;
    notes: string | null;
    enteredBy: string | null;
    reviewedBy: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
  }[];
}

function actor(value: BackendResultActor | null): ResultActor | null {
  return value ? { id: value.id, name: value.name, role: value.role } : null;
}

function adaptResult(result: BackendTestResult): ResultRecord {
  return {
    id: result.id,
    resultNumber: result.result_number,
    sampleId: result.sample_id,
    sampleNumber: result.sample_number,
    barcode: result.barcode,
    sampleStatus: result.sample_status,
    requestId: result.test_request_id,
    requestNumber: result.request_number,
    requestStatus: result.request_status,
    medicalReportId: result.medical_report_id,
    patient: result.patient
      ? {
          id: result.patient.id,
          name: result.patient.name,
          patientNumber: result.patient.patient_number,
        }
      : null,
    testRequestItemId: result.test_request_item_id,
    test: result.test
      ? {
          id: result.test.id,
          name: result.test.name,
          resultType: result.test.result_type,
          resultOptions: result.test.result_options ?? [],
        }
      : null,
    value: result.value,
    unit: result.value_unit,
    referenceRange: result.reference_range,
    flag: result.flag,
    status: result.status,
    notes: result.notes,
    correctionReason: result.correction_reason,
    reviewNotes: result.review_notes,
    enteredBy: actor(result.entered_by),
    enteredAt: result.entered_at,
    submittedAt: result.submitted_at,
    reviewedBy: actor(result.reviewed_by),
    reviewedAt: result.reviewed_at,
    approvedBy: actor(result.approved_by),
    approvedAt: result.approved_at,
    timeline: (result.timeline ?? []).map((entry) => ({
      id: entry.id,
      fromStatus: entry.from_status,
      toStatus: entry.to_status,
      reason: entry.reason,
      changedBy: actor(entry.changed_by),
      createdAt: entry.created_at,
    })),
    createdAt: result.created_at,
    updatedAt: result.updated_at,
  };
}

export async function listResults(
  params: {
    page?: number;
    perPage?: number;
    search?: string;
    status?: ResultStatus | "";
  } = {},
): Promise<{ rows: ResultRecord[]; pagination: Pagination }> {
  const payload = await apiRequest<{ results: BackendTestResult[]; pagination: Pagination }>(
    "/user/test-results",
    {
      params: {
        page: params.page ?? 1,
        per_page: params.perPage ?? 10,
        search: params.search,
        status: params.status,
      },
    },
  );
  return { rows: payload.results.map(adaptResult), pagination: payload.pagination };
}

export async function getResult(id: string): Promise<ResultRecord> {
  return adaptResult(await apiRequest<BackendTestResult>(`/user/test-results/${id}`));
}

export async function getResultWorkspace(sampleId: string): Promise<ResultWorkspace> {
  const workspace = await apiRequest<BackendWorkspace>(
    `/user/test-results/sample/${sampleId}/workspace`,
  );
  return {
    sampleId: workspace.sample_id,
    sampleNumber: workspace.sample_number,
    barcode: workspace.barcode,
    sampleStatus: workspace.sample_status,
    patient: workspace.patient,
    request: workspace.request
      ? {
          id: workspace.request.id,
          requestNumber: workspace.request.request_number,
          status: workspace.request.status,
        }
      : null,
    tests: workspace.tests.map((item) => ({
      testRequestItemId: item.test_request_item_id,
      quantity: item.quantity,
      test: {
        id: item.test.id,
        name: item.test.name,
        unit: item.test.unit,
        referenceRange: item.test.reference_range,
        resultType: item.test.result_type,
        resultOptions: item.test.result_options ?? [],
        criticalLow: item.test.critical_low === null ? null : Number(item.test.critical_low),
        criticalHigh: item.test.critical_high === null ? null : Number(item.test.critical_high),
      },
      result: item.result ? adaptResult(item.result) : null,
    })),
  };
}

export async function saveResultDrafts(
  sampleId: string,
  results: { testRequestItemId: string; value: string; notes?: string }[],
): Promise<ResultRecord[]> {
  const payload = await apiRequest<BackendTestResult[]>(`/user/test-results/sample/${sampleId}`, {
    method: "PUT",
    body: JSON.stringify({
      results: results.map((result) => ({
        test_request_item_id: result.testRequestItemId,
        value: result.value,
        notes: result.notes || null,
      })),
    }),
  });
  return payload.map(adaptResult);
}

export async function submitSampleResults(sampleId: string): Promise<ResultRecord[]> {
  const payload = await apiRequest<BackendTestResult[]>(
    `/user/test-results/sample/${sampleId}/submit`,
    { method: "POST" },
  );
  return payload.map(adaptResult);
}

async function resultAction(
  id: string,
  action: "review" | "return" | "approve",
  body?: object,
): Promise<ResultRecord> {
  return adaptResult(
    await apiRequest<BackendTestResult>(`/user/test-results/${id}/${action}`, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
}

export const reviewResult = (id: string, notes?: string) => resultAction(id, "review", { notes });
export const returnResult = (id: string, reason: string) => resultAction(id, "return", { reason });
export const approveResult = (id: string) => resultAction(id, "approve");

export async function exportResults(): Promise<void> {
  await downloadFromApi("/user/test-results/export", "test-results.csv");
}

export async function getMedicalReport(testRequestId: string): Promise<MedicalReportRecord> {
  const report = await apiRequest<{
    id: string;
    test_request_id: string;
    generated_at: string;
    pdf_download_url: string;
    request: { id: string; request_number: string; status: string; created_at: string };
    patient: {
      id: string;
      patient_number: string;
      name: string;
      gender: string;
      dob: string;
      phone: string;
      email: string | null;
    };
    samples: {
      id: string;
      sample_number: string;
      barcode: string;
      sample_type: string;
      collected_at: string | null;
    }[];
    results: {
      id: string;
      result_number: string;
      test_name: string;
      value: string;
      unit: string | null;
      reference_range: string | null;
      flag: ResultFlag;
      notes: string | null;
      entered_by: string | null;
      reviewed_by: string | null;
      approved_by: string | null;
      approved_at: string | null;
    }[];
  }>(`/user/medical-reports/test-requests/${testRequestId}`);

  return {
    id: report.id,
    testRequestId: report.test_request_id,
    generatedAt: report.generated_at,
    pdfDownloadUrl: report.pdf_download_url,
    request: {
      id: report.request.id,
      requestNumber: report.request.request_number,
      status: report.request.status,
      createdAt: report.request.created_at,
    },
    patient: {
      id: report.patient.id,
      patientNumber: report.patient.patient_number,
      name: report.patient.name,
      gender: report.patient.gender,
      dob: report.patient.dob,
      phone: report.patient.phone,
      email: report.patient.email,
    },
    samples: report.samples.map((sample) => ({
      id: sample.id,
      sampleNumber: sample.sample_number,
      barcode: sample.barcode,
      sampleType: sample.sample_type,
      collectedAt: sample.collected_at,
    })),
    results: report.results.map((result) => ({
      id: result.id,
      resultNumber: result.result_number,
      testName: result.test_name,
      value: result.value,
      unit: result.unit,
      referenceRange: result.reference_range,
      flag: result.flag,
      notes: result.notes,
      enteredBy: result.entered_by,
      reviewedBy: result.reviewed_by,
      approvedBy: result.approved_by,
      approvedAt: result.approved_at,
    })),
  };
}

export async function listMedicalReports(
  page = 1,
  search = "",
): Promise<{
  rows: MedicalReportRecord[];
  pagination: Pagination;
}> {
  const payload = await apiRequest<{
    reports: Array<{
      id: string;
      test_request_id: string;
      generated_at: string;
      pdf_download_url: string;
      request: { id: string; request_number: string; status: string; created_at: string };
      patient: {
        id: string;
        patient_number: string;
        name: string;
        gender: string;
        dob: string;
        phone: string;
        email: string | null;
      };
      samples: {
        id: string;
        sample_number: string;
        barcode: string;
        sample_type: string;
        collected_at: string | null;
      }[];
      results: {
        id: string;
        result_number: string;
        test_name: string;
        value: string;
        unit: string | null;
        reference_range: string | null;
        flag: ResultFlag;
        notes: string | null;
        entered_by: string | null;
        reviewed_by: string | null;
        approved_by: string | null;
        approved_at: string | null;
      }[];
    }>;
    pagination: Pagination;
  }>("/user/medical-reports", { params: { page, per_page: 10, search } });

  return {
    rows: payload.reports.map((report) => ({
      id: report.id,
      testRequestId: report.test_request_id,
      generatedAt: report.generated_at,
      pdfDownloadUrl: report.pdf_download_url,
      request: {
        id: report.request.id,
        requestNumber: report.request.request_number,
        status: report.request.status,
        createdAt: report.request.created_at,
      },
      patient: {
        id: report.patient.id,
        patientNumber: report.patient.patient_number,
        name: report.patient.name,
        gender: report.patient.gender,
        dob: report.patient.dob,
        phone: report.patient.phone,
        email: report.patient.email,
      },
      samples: report.samples.map((sample) => ({
        id: sample.id,
        sampleNumber: sample.sample_number,
        barcode: sample.barcode,
        sampleType: sample.sample_type,
        collectedAt: sample.collected_at,
      })),
      results: report.results.map((result) => ({
        id: result.id,
        resultNumber: result.result_number,
        testName: result.test_name,
        value: result.value,
        unit: result.unit,
        referenceRange: result.reference_range,
        flag: result.flag,
        notes: result.notes,
        enteredBy: result.entered_by,
        reviewedBy: result.reviewed_by,
        approvedBy: result.approved_by,
        approvedAt: result.approved_at,
      })),
    })),
    pagination: payload.pagination,
  };
}

export async function exportMedicalReports(): Promise<void> {
  await downloadFromApi("/user/medical-reports/export", "medical-reports.csv");
}

export async function downloadMedicalReport(reportId: string): Promise<void> {
  await downloadFromApi(`/user/medical-reports/${reportId}/pdf`, `medical-report-${reportId}.pdf`);
}

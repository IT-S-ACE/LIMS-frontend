import { apiRequest, downloadFromApi } from "@/lib/api-client";
import type { BackendPatient, Pagination } from "@/lib/api-types";

export interface PatientListItem {
  id: string;
  patientNumber: string;
  fullName: string;
  gender: "male" | "female";
  phone: string;
  email: string | null;
  dob: string;
  insurance: { id: string; name: string }[];
  balance: number;
  testRequestsCount: number;
}

export interface PatientFormInput {
  fullName: string;
  gender: "male" | "female";
  phone: string;
  email?: string;
  dob: string;
}

export interface PatientDetail extends PatientListItem {
  testRequests: {
    id: string;
    status: string;
    totalPrice: number;
    insuranceCompany: { id: string; name: string } | null;
    tests: { id: string; quantity: number; price: number; testName: string | null }[];
    samples: {
      id: string;
      qrCode: string;
      status: string;
      receivedAt: string | null;
      results: { id: string; value: string; status: string; approved: boolean }[];
    }[];
    invoice: {
      total: number;
      paid: number;
      remaining: number;
      status: string;
      paymentsCount: number;
    } | null;
    createdAt: string;
  }[];
}

function adaptPatient(patient: BackendPatient): PatientListItem {
  return {
    id: patient.id,
    patientNumber: patient.patient_number,
    fullName: patient.name,
    gender: patient.gender,
    phone: patient.phone,
    email: patient.email,
    dob: patient.dob,
    insurance: patient.insurance,
    balance: Number(patient.balance),
    testRequestsCount: patient.statistics.test_requests_count,
  };
}

function adaptPatientDetail(patient: BackendPatient): PatientDetail {
  return {
    ...adaptPatient(patient),
    testRequests: (patient.test_requests ?? []).map((request) => ({
      id: request.id,
      status: request.status,
      totalPrice: Number(request.total_price),
      insuranceCompany: request.insurance_company,
      tests: request.tests.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        testName: item.test?.name ?? null,
      })),
      samples: request.samples.map((sample) => ({
        id: sample.id,
        qrCode: sample.qr_code,
        status: sample.status,
        receivedAt: sample.received_at,
        results: sample.results,
      })),
      invoice: request.invoice
        ? {
            total: Number(request.invoice.total),
            paid: Number(request.invoice.paid),
            remaining: Number(request.invoice.remaining),
            status: request.invoice.status,
            paymentsCount: request.invoice.payments_count,
          }
        : null,
      createdAt: request.created_at,
    })),
  };
}

export async function listPatients(search = ""): Promise<PatientListItem[]> {
  const payload = await apiRequest<{ patients: BackendPatient[]; pagination: Pagination }>(
    "/user/patients",
    { params: { search, per_page: 100 } },
  );
  return payload.patients.map(adaptPatient);
}

export async function createPatient(input: PatientFormInput): Promise<PatientListItem> {
  const patient = await apiRequest<BackendPatient>("/user/patients", {
    method: "POST",
    body: JSON.stringify({
      name: input.fullName,
      gender: input.gender,
      phone: input.phone,
      email: input.email || null,
      dob: input.dob,
    }),
  });
  return adaptPatient(patient);
}

export async function getPatient(id: string): Promise<PatientDetail> {
  const patient = await apiRequest<BackendPatient>(`/user/patients/${id}`);
  return adaptPatientDetail(patient);
}

export async function updatePatient(id: string, input: PatientFormInput): Promise<PatientListItem> {
  const patient = await apiRequest<BackendPatient>(`/user/patients/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: input.fullName,
      gender: input.gender,
      phone: input.phone,
      email: input.email || null,
      dob: input.dob,
    }),
  });
  return adaptPatient(patient);
}

export async function deletePatient(id: string): Promise<void> {
  await apiRequest<Record<string, never>>(`/user/patients/${id}`, { method: "DELETE" });
}

export async function exportPatients(): Promise<void> {
  await downloadFromApi("/user/patients/export", "patients.csv");
}

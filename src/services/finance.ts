import { apiRequest, downloadFromApi } from "@/lib/api-client";
import type { Pagination } from "@/lib/api-types";

export type InvoiceStatus = "pending" | "partial" | "paid";
export type PaymentMethod = "cash" | "card";

interface BackendInvoice {
  id: string;
  invoice_number: string;
  test_request_id: string;
  request_number: string;
  patient: { id: string; patient_number: string; name: string; phone: string };
  insurance_company: { id: string; name: string } | null;
  gross_total: string | number;
  insurance_amount: string | number;
  patient_due: string | number;
  paid: string | number;
  remaining: string | number;
  status: InvoiceStatus;
  items?: BackendInvoiceItem[];
  payments?: BackendPayment[];
  created_at: string;
  updated_at: string;
}

interface BackendInvoiceItem {
  id: string;
  test_name: string | null;
  unit_price: string | number;
  quantity: number;
  line_total: string | number;
  coverage_percent: string | number;
  insurance_amount: string | number;
  patient_amount: string | number;
}

interface BackendPayment {
  id: string;
  payment_number: string;
  invoice_id: string;
  invoice_number: string;
  test_request_id: string;
  request_number: string;
  patient: { id: string; patient_number: string; name: string; phone: string };
  insurance_company: { id: string; name: string } | null;
  amount: string | number;
  method: PaymentMethod;
  notes: string | null;
  recorded_by: { id: string; name: string } | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItemRecord {
  id: string;
  testName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  coveragePercent: number;
  insuranceAmount: number;
  patientAmount: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  testRequestId: string;
  requestNumber: string;
  patient: { id: string; patientNumber: string; name: string; phone: string };
  insuranceCompany: { id: string; name: string } | null;
  grossTotal: number;
  insuranceAmount: number;
  patientDue: number;
  paid: number;
  remaining: number;
  status: InvoiceStatus;
  items: InvoiceItemRecord[];
  payments: PaymentRecord[];
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  testRequestId: string;
  requestNumber: string;
  patient: { id: string; patientNumber: string; name: string; phone: string };
  insuranceCompany: { id: string; name: string } | null;
  amount: number;
  method: PaymentMethod;
  notes: string | null;
  recordedBy: { id: string; name: string } | null;
  date: string;
}

export interface PatientBalanceRecord {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  total: number;
  paid: number;
  remaining: number;
  invoicesCount: number;
}

export interface FinancialReport {
  period: {
    from: string;
    to: string;
    days: number;
    granularity: "day" | "month";
  };
  summary: {
    grossBilled: number;
    insuranceCovered: number;
    patientBilled: number;
    patientCollected: number;
    periodOutstanding: number;
    currentOutstanding: number;
    invoicesCount: number;
    paidInvoicesCount: number;
    unpaidInvoicesCount: number;
    paymentsCount: number;
    insuredInvoicesCount: number;
    coverageRate: number;
    collectionRate: number;
  };
  billingTrend: {
    period: string;
    label: string;
    grossBilled: number;
    insuranceCovered: number;
    patientDue: number;
    invoicesCount: number;
  }[];
  collectionTrend: {
    period: string;
    label: string;
    amount: number;
    transactions: number;
  }[];
  paymentMethods: {
    method: PaymentMethod;
    amount: number;
    transactions: number;
    percentage: number;
  }[];
  topTests: {
    testId: string | null;
    testName: string;
    quantity: number;
    grossBilled: number;
    insuranceCovered: number;
    patientDue: number;
  }[];
  coverageByCompany: {
    companyId: string;
    companyCode: string;
    companyName: string;
    invoicesCount: number;
    grossBilled: number;
    insuranceCovered: number;
    patientDue: number;
    coverageRate: number;
  }[];
  recentPayments: {
    paymentId: string;
    paymentNumber: string;
    invoiceNumber: string | null;
    requestNumber: string | null;
    patientName: string | null;
    method: PaymentMethod;
    amount: number;
    recordedBy: string | null;
    date: string;
  }[];
}

interface BackendFinancialReport {
  period: FinancialReport["period"];
  summary: {
    gross_billed: number | string;
    insurance_covered: number | string;
    patient_billed: number | string;
    patient_collected: number | string;
    period_outstanding: number | string;
    current_outstanding: number | string;
    invoices_count: number;
    paid_invoices_count: number;
    unpaid_invoices_count: number;
    payments_count: number;
    insured_invoices_count: number;
    coverage_rate: number | string;
    collection_rate: number | string;
  };
  billing_trend: {
    period: string;
    label: string;
    gross_billed: number | string;
    insurance_covered: number | string;
    patient_due: number | string;
    invoices_count: number;
  }[];
  collection_trend: {
    period: string;
    label: string;
    amount: number | string;
    transactions: number;
  }[];
  payment_methods: {
    method: PaymentMethod;
    amount: number | string;
    transactions: number;
    percentage: number | string;
  }[];
  top_tests: {
    test_id: string | null;
    test_name: string;
    quantity: number;
    gross_billed: number | string;
    insurance_covered: number | string;
    patient_due: number | string;
  }[];
  coverage_by_company: {
    company_id: string;
    company_code: string;
    company_name: string;
    invoices_count: number;
    gross_billed: number | string;
    insurance_covered: number | string;
    patient_due: number | string;
    coverage_rate: number | string;
  }[];
  recent_payments: {
    payment_id: string;
    payment_number: string;
    invoice_number: string | null;
    request_number: string | null;
    patient_name: string | null;
    method: PaymentMethod;
    amount: number | string;
    recorded_by: string | null;
    date: string;
  }[];
}

function adaptPayment(payment: BackendPayment): PaymentRecord {
  return {
    id: payment.id,
    paymentNumber: payment.payment_number,
    invoiceId: payment.invoice_id,
    invoiceNumber: payment.invoice_number,
    testRequestId: payment.test_request_id,
    requestNumber: payment.request_number,
    patient: payment.patient,
    insuranceCompany: payment.insurance_company,
    amount: Number(payment.amount),
    method: payment.method,
    notes: payment.notes,
    recordedBy: payment.recorded_by,
    date: payment.date,
  };
}

function adaptInvoice(invoice: BackendInvoice): InvoiceRecord {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    testRequestId: invoice.test_request_id,
    requestNumber: invoice.request_number,
    patient: invoice.patient,
    insuranceCompany: invoice.insurance_company,
    grossTotal: Number(invoice.gross_total),
    insuranceAmount: Number(invoice.insurance_amount),
    patientDue: Number(invoice.patient_due),
    paid: Number(invoice.paid),
    remaining: Number(invoice.remaining),
    status: invoice.status,
    items: (invoice.items ?? []).map((item) => ({
      id: item.id,
      testName: item.test_name ?? "Unknown test",
      unitPrice: Number(item.unit_price),
      quantity: item.quantity,
      lineTotal: Number(item.line_total),
      coveragePercent: Number(item.coverage_percent),
      insuranceAmount: Number(item.insurance_amount),
      patientAmount: Number(item.patient_amount),
    })),
    payments: (invoice.payments ?? []).map(adaptPayment),
    createdAt: invoice.created_at,
  };
}

export async function listInvoices(
  params: {
    page?: number;
    search?: string;
    status?: "pending" | "paid" | "all";
  } = {},
): Promise<{ rows: InvoiceRecord[]; pagination: Pagination }> {
  const payload = await apiRequest<{ invoices: BackendInvoice[]; pagination: Pagination }>(
    "/user/payments/invoices",
    {
      params: {
        page: params.page ?? 1,
        per_page: 10,
        search: params.search,
        status: params.status,
      },
    },
  );
  return { rows: payload.invoices.map(adaptInvoice), pagination: payload.pagination };
}

export async function getInvoice(id: string): Promise<InvoiceRecord> {
  return adaptInvoice(await apiRequest<BackendInvoice>(`/user/payments/invoices/${id}`));
}

export async function listPayments(params: { page?: number; search?: string } = {}): Promise<{
  rows: PaymentRecord[];
  pagination: Pagination;
}> {
  const payload = await apiRequest<{ payments: BackendPayment[]; pagination: Pagination }>(
    "/user/payments",
    { params: { page: params.page ?? 1, per_page: 10, search: params.search } },
  );
  return { rows: payload.payments.map(adaptPayment), pagination: payload.pagination };
}

export async function getPayment(id: string): Promise<PaymentRecord> {
  return adaptPayment(await apiRequest<BackendPayment>(`/user/payments/${id}`));
}

export async function recordFullPayment(input: {
  testRequestId: string;
  method: PaymentMethod;
  notes?: string;
}): Promise<PaymentRecord> {
  const payment = await apiRequest<BackendPayment>("/user/payments", {
    method: "POST",
    body: JSON.stringify({
      test_request_id: input.testRequestId,
      method: input.method,
      notes: input.notes || null,
    }),
  });
  return adaptPayment(payment);
}

export async function listPatientBalances(): Promise<PatientBalanceRecord[]> {
  const rows = await apiRequest<
    {
      patient_id: string;
      patient_name: string;
      phone: string;
      total: string | number;
      paid: string | number;
      remaining: string | number;
      invoices_count: number;
    }[]
  >("/user/payments/balances");

  return rows.map((row) => ({
    id: row.patient_id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    phone: row.phone,
    total: Number(row.total),
    paid: Number(row.paid),
    remaining: Number(row.remaining),
    invoicesCount: row.invoices_count,
  }));
}

export async function getFinancialReport(params: {
  from: string;
  to: string;
}): Promise<FinancialReport> {
  const report = await apiRequest<BackendFinancialReport>("/user/financial-reports", {
    params,
  });

  return {
    period: report.period,
    summary: {
      grossBilled: Number(report.summary.gross_billed),
      insuranceCovered: Number(report.summary.insurance_covered),
      patientBilled: Number(report.summary.patient_billed),
      patientCollected: Number(report.summary.patient_collected),
      periodOutstanding: Number(report.summary.period_outstanding),
      currentOutstanding: Number(report.summary.current_outstanding),
      invoicesCount: report.summary.invoices_count,
      paidInvoicesCount: report.summary.paid_invoices_count,
      unpaidInvoicesCount: report.summary.unpaid_invoices_count,
      paymentsCount: report.summary.payments_count,
      insuredInvoicesCount: report.summary.insured_invoices_count,
      coverageRate: Number(report.summary.coverage_rate),
      collectionRate: Number(report.summary.collection_rate),
    },
    billingTrend: report.billing_trend.map((row) => ({
      period: row.period,
      label: row.label,
      grossBilled: Number(row.gross_billed),
      insuranceCovered: Number(row.insurance_covered),
      patientDue: Number(row.patient_due),
      invoicesCount: row.invoices_count,
    })),
    collectionTrend: report.collection_trend.map((row) => ({
      period: row.period,
      label: row.label,
      amount: Number(row.amount),
      transactions: row.transactions,
    })),
    paymentMethods: report.payment_methods.map((row) => ({
      method: row.method,
      amount: Number(row.amount),
      transactions: row.transactions,
      percentage: Number(row.percentage),
    })),
    topTests: report.top_tests.map((row) => ({
      testId: row.test_id,
      testName: row.test_name,
      quantity: row.quantity,
      grossBilled: Number(row.gross_billed),
      insuranceCovered: Number(row.insurance_covered),
      patientDue: Number(row.patient_due),
    })),
    coverageByCompany: report.coverage_by_company.map((row) => ({
      companyId: row.company_id,
      companyCode: row.company_code,
      companyName: row.company_name,
      invoicesCount: row.invoices_count,
      grossBilled: Number(row.gross_billed),
      insuranceCovered: Number(row.insurance_covered),
      patientDue: Number(row.patient_due),
      coverageRate: Number(row.coverage_rate),
    })),
    recentPayments: report.recent_payments.map((row) => ({
      paymentId: row.payment_id,
      paymentNumber: row.payment_number,
      invoiceNumber: row.invoice_number,
      requestNumber: row.request_number,
      patientName: row.patient_name,
      method: row.method,
      amount: Number(row.amount),
      recordedBy: row.recorded_by,
      date: row.date,
    })),
  };
}

export async function exportFinancialReport(params: { from: string; to: string }): Promise<void> {
  const query = new URLSearchParams(params).toString();
  await downloadFromApi(
    `/user/financial-reports/export?${query}`,
    `financial-report-${params.from}-to-${params.to}.csv`,
  );
}

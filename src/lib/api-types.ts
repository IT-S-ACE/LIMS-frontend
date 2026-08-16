export type BackendRole = "admin" | "lab_technician" | "receptionist" | "patient";

export interface BackendUser {
  id: string;
  username: string;
  email: string;
  role: BackendRole;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthPayload {
  token: string;
  user: BackendUser;
}

export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface BackendPatient {
  id: string;
  patient_number: string;
  user_id: string | null;
  name: string;
  gender: "male" | "female";
  phone: string;
  email: string | null;
  dob: string;
  insurance: { id: string; name: string }[];
  balance: number | string;
  statistics: {
    test_requests_count: number;
    samples_count: number;
    results_count: number;
    approved_results_count: number;
    pending_results_count: number;
    notifications_count: number;
  };
  test_requests?: {
    id: string;
    status: string;
    total_price: string | number;
    insurance_company: { id: string; name: string } | null;
    tests: {
      id: string;
      quantity: number;
      price: string | number;
      test: { id: string; name: string; price: string | number } | null;
    }[];
    samples: {
      id: string;
      qr_code: string;
      status: string;
      received_at: string | null;
      results: { id: string; value: string; status: string; approved: boolean }[];
    }[];
    invoice: {
      total: string | number;
      paid: string | number;
      remaining: string | number;
      status: string;
      payments_count: number;
      refunds_count: number;
    } | null;
    created_at: string;
    updated_at: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface BackendTest {
  id: string;
  name: string;
  price: string | number;
  unit: string | null;
  reference_range: string;
  result_type: "numeric" | "text" | "choice";
  result_options: string[];
  critical_low: string | number | null;
  critical_high: string | number | null;
  reagents_count?: number;
  reagents?: { id: string; name: string; quantity_used: number | string }[];
  created_at: string;
  updated_at: string;
}

export type BackendResultStatus =
  "draft" | "pending_review" | "reviewed" | "correction_required" | "approved";

export interface BackendTestResult {
  id: string;
  result_number: string;
  sample_id: string;
  sample_number: string | null;
  barcode: string | null;
  sample_status: BackendSampleStatus | null;
  test_request_id: string | null;
  request_number: string | null;
  request_status: BackendTestRequestStatus | null;
  medical_report_id: string | null;
  patient: { id: string; name: string; patient_number: string } | null;
  test_request_item_id: string;
  test: {
    id: string;
    name: string;
    result_type: "numeric" | "text" | "choice";
    result_options: string[];
  } | null;
  value: string;
  value_unit: string | null;
  reference_range: string | null;
  flag: "normal" | "low" | "high" | "critical";
  status: BackendResultStatus;
  notes: string | null;
  correction_reason: string | null;
  review_notes: string | null;
  approved: boolean;
  entered_by: BackendResultActor | null;
  entered_at: string | null;
  submitted_at: string | null;
  reviewed_by: BackendResultActor | null;
  reviewed_at: string | null;
  approved_by: BackendResultActor | null;
  approved_at: string | null;
  timeline?: {
    id: string;
    from_status: BackendResultStatus | null;
    to_status: BackendResultStatus;
    reason: string | null;
    changed_by: BackendResultActor | null;
    created_at: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface BackendResultActor {
  id: string;
  name: string;
  role: BackendRole;
}

export type BackendTestRequestStatus = "pending" | "processing" | "completed" | "cancelled";

export interface BackendTestRequest {
  id: string;
  request_number: string;
  status: BackendTestRequestStatus;
  total_price: string | number;
  insurance_amount: string | number;
  patient_due: string | number;
  paid: string | number;
  remaining: string | number;
  payment_status: "pending" | "partial" | "paid";
  invoice: { id: string; invoice_number: string } | null;
  patient: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    dob: string;
  };
  insurance_company: { id: string; name: string } | null;
  items: {
    id: string;
    test_id: string;
    test: {
      id: string;
      name: string;
      price: string | number;
      reference_range: string;
    } | null;
    quantity: number;
    price: string | number;
    subtotal: string | number;
    created_at: string;
    updated_at: string;
  }[];
  samples?: {
    id: string;
    sample_number: string;
    barcode: string;
    sample_type: string;
    status: BackendSampleStatus;
  }[];
  tests_summary: string;
  created_at: string;
  updated_at: string;
}

export type BackendSampleStatus =
  "registered" | "collected" | "in_progress" | "completed" | "rejected" | "cancelled";

export interface BackendSample {
  id: string;
  sample_number: string;
  barcode: string;
  qr_code: string;
  sample_type: string;
  status: BackendSampleStatus;
  next_status: BackendSampleStatus | null;
  collected_at: string | null;
  rejected_reason: string | null;
  cancelled_reason: string | null;
  reagents_consumed_at: string | null;
  results_count: number | null;
  tests: {
    id: string;
    code?: string | null;
    name: string;
    quantity: number;
  }[];
  patient: {
    id: string;
    name: string;
    patient_number: string;
  } | null;
  request: {
    id: string;
    request_number: string;
    status: BackendTestRequestStatus;
  } | null;
  timeline?: {
    id: string;
    from_status: BackendSampleStatus | null;
    to_status: BackendSampleStatus;
    reason: string | null;
    changed_by: { id: string; name: string } | null;
    created_at: string;
  }[];
  reagent_consumptions?: {
    id: string;
    reagent_id: string;
    reagent_name: string | null;
    reagent_code: string | null;
    lot_number: string | null;
    test_name: string | null;
    quantity: number;
    created_at: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface BackendReagent {
  id: string;
  code: string;
  name: string;
  category: string | null;
  stock_qty: number | string;
  min_stock: number | string;
  is_low_stock: boolean;
  nearest_expiry_date: string | null;
  unit_price: number | string;
  tests: {
    id: string;
    name: string;
    quantity_used: number | string;
  }[];
  lots: {
    id: string;
    lot_number: string;
    initial_quantity: number | string;
    remaining_quantity: number | string;
    expiry_date: string;
    received_at: string;
    unit_price: number | string;
    status: "available" | "depleted" | "expired";
  }[];
  movements?: {
    id: string;
    type: "in" | "out";
    quantity: number | string;
    reason: string | null;
    reference: string | null;
    lot_number: string | null;
    sample_id: string | null;
    date: string;
  }[];
  created_at: string;
  updated_at: string;
}

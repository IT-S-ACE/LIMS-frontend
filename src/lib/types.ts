export type Role = "admin" | "receptionist" | "technician" | "patient";

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string;
  active: boolean;
  createdAt: string;
}

export interface Patient {
  id: string; // PAT-xxxx
  nationalId: string;
  fullName: string;
  dob: string;
  gender: "male" | "female";
  phone: string;
  email?: string;
  address?: string;
  bloodType?: string;
  allergies?: string;
  insuranceId?: string; // insurance company id
  policyNumber?: string;
  balance: number; // owed amount
  createdAt: string;
}

export interface TestCatalogItem {
  code: string;
  name: string;
  price: number;
  refRange: string;
  unit: string;
  resultType?: "numeric" | "text" | "choice";
  resultOptions?: string[];
  criticalLow?: number | null;
  criticalHigh?: number | null;
  category?: string;
  sampleType?: "Blood" | "Urine" | "Stool" | "Swab" | "Tissue";
  turnaroundHours?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type RequestStatus = "pending" | "in-progress" | "completed" | "cancelled";

export interface TestRequest {
  id: string; // REQ-xxxx
  patientId: string;
  doctor: string;
  priority: "routine" | "urgent" | "stat";
  tests: string[]; // test codes
  notes?: string;
  status: RequestStatus;
  insuranceApplied: boolean;
  insuranceId?: string;
  coveragePercent?: number;
  subtotal: number;
  insuranceCovered: number;
  patientDue: number;
  paid: number;
  createdBy: string;
  createdAt: string;
}

export type SampleStatus =
  "registered" | "collected" | "received" | "in-analysis" | "completed" | "rejected" | "cancelled";

export interface Sample {
  id: string; // SMP-xxxx
  requestId: string;
  patientId: string;
  testCode: string;
  type: string;
  barcode: string;
  status: SampleStatus;
  collectedAt?: string;
  collectedBy?: string;
  rejectedReason?: string;
  cancelledReason?: string;
  notes?: string;
  createdAt: string;
}

export type ResultStatus = "pending" | "entered" | "approved";

export interface TestResult {
  id: string; // RES-xxxx
  sampleId: string;
  requestId: string;
  patientId: string;
  testCode: string;
  value: string;
  unit?: string;
  refRange?: string;
  flag?: "normal" | "low" | "high" | "critical";
  notes?: string;
  status: ResultStatus;
  enteredBy?: string;
  enteredAt?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export type PaymentMethod = "cash" | "card" | "transfer" | "insurance";
export type PaymentType = "full" | "partial" | "refund";

export interface Payment {
  id: string; // PAY-xxxx
  requestId: string;
  patientId: string;
  amount: number;
  method: PaymentMethod;
  type: PaymentType;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface InsuranceCompany {
  id: string;
  name: string;
  code: string;
  contactEmail: string;
  phone: string;
  active: boolean;
  defaultCoverage: number; // percentage
  createdAt: string;
}

export interface CoverageRule {
  id: string;
  companyId: string;
  testCode?: string; // null = all
  category?: string;
  coveragePercent: number;
  maxAmount?: number;
  notes?: string;
}

export interface InsuranceClaim {
  id: string;
  requestId: string;
  companyId: string;
  patientId: string;
  amountClaimed: number;
  amountApproved?: number;
  status: "submitted" | "approved" | "rejected" | "paid";
  submittedAt: string;
  resolvedAt?: string;
  notes?: string;
}

export interface Reagent {
  id: string;
  name: string;
  code: string;
  category: string;
  supplier: string;
  stock: number;
  unit: string;
  minStock: number;
  expiryDate: string;
  costPerUnit: number;
  testCodes: string[]; // tests that consume this
  consumePerTest: number;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  reagentId: string;
  type: "in" | "out" | "adjust" | "expired";
  quantity: number;
  reason: string;
  reference?: string; // sample id, etc.
  createdBy: string;
  createdAt: string;
}

export interface FieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  entity: string;
  entityId: string;
  details?: string;
  reason?: string;
  changes?: FieldChange[];
  ip?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId?: string; // target user (patient or staff)
  channel: "in-app" | "sms" | "email";
  title: string;
  body: string;
  read: boolean;
  relatedEntity?: string;
  relatedId?: string;
  createdAt: string;
}

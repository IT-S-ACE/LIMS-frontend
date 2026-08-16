import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearToken } from "./api-client";
import type {
  Patient,
  TestRequest,
  Sample,
  TestResult,
  Payment,
  InsuranceCompany,
  CoverageRule,
  Reagent,
  StockMovement,
  AuditEntry,
  AppNotification,
  User,
  Role,
  TestCatalogItem,
  FieldChange,
} from "./types";

export function diffFields<T extends object>(before: T, after: Partial<T>): FieldChange[] {
  const out: FieldChange[] = [];
  for (const k of Object.keys(after) as (keyof T)[]) {
    const b = before[k];
    const a = (after as T)[k];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      out.push({ field: k as string, from: b, to: a });
    }
  }
  return out;
}

export type AuditOpts = { reason?: string; changes?: FieldChange[]; details?: string };

const seededAt = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

function mkTest(
  code: string,
  name: string,
  price: number,
  refRange: string,
  unit: string,
  category: string,
  sampleType: TestCatalogItem["sampleType"],
  turnaroundHours: number,
  ageDays: number,
): TestCatalogItem {
  return {
    code,
    name,
    price,
    refRange,
    unit,
    category,
    sampleType,
    turnaroundHours,
    createdAt: seededAt(ageDays),
    updatedAt: seededAt(ageDays),
  };
}

export const TEST_CATALOG: TestCatalogItem[] = [
  mkTest(
    "CBC",
    "Complete Blood Count (CBC)",
    80,
    "WBC 4.5-11.0",
    "10^9/L",
    "Hematology",
    "Blood",
    4,
    180,
  ),
  mkTest("FERR", "Ferritin", 85, "20-250", "ng/mL", "Hematology", "Blood", 6, 178),
  mkTest("B12", "Vitamin B12", 95, "200-900", "pg/mL", "Chemistry", "Blood", 12, 176),
  mkTest("VITD", "Vitamin D, 25-OH", 130, "30-100", "ng/mL", "Endocrinology", "Blood", 24, 175),
  mkTest("FOL", "Folate", 90, "3.1-17.5", "ng/mL", "Chemistry", "Blood", 12, 174),
  mkTest("HBA1C", "Hemoglobin A1c (HbA1c)", 90, "4.0-5.6", "%", "Endocrinology", "Blood", 6, 172),
  mkTest("GLU", "Blood Glucose", 40, "70-140", "mg/dL", "Chemistry", "Blood", 2, 170),
  mkTest("FBS", "Fasting Blood Sugar (FBS)", 35, "70-99", "mg/dL", "Chemistry", "Blood", 2, 169),
  mkTest("RBS", "Random Blood Sugar (RBS)", 35, "< 140", "mg/dL", "Chemistry", "Blood", 2, 168),
  mkTest("LIP", "Lipid Profile", 100, "See components", "mg/dL", "Chemistry", "Blood", 5, 166),
  mkTest("CHOL", "Total Cholesterol", 45, "< 200", "mg/dL", "Chemistry", "Blood", 4, 165),
  mkTest("TRIG", "Triglycerides", 45, "< 150", "mg/dL", "Chemistry", "Blood", 4, 164),
  mkTest("HDL", "HDL Cholesterol", 45, "> 40", "mg/dL", "Chemistry", "Blood", 4, 163),
  mkTest("LDL", "LDL Cholesterol", 45, "< 100", "mg/dL", "Chemistry", "Blood", 4, 162),
  mkTest("CREA", "Creatinine", 40, "0.6-1.3", "mg/dL", "Chemistry", "Blood", 4, 160),
  mkTest("UREA", "Urea", 40, "15-45", "mg/dL", "Chemistry", "Blood", 4, 159),
  mkTest("URIC", "Uric Acid", 45, "3.5-7.2", "mg/dL", "Chemistry", "Blood", 4, 158),
  mkTest("NA", "Sodium", 35, "135-145", "mmol/L", "Chemistry", "Blood", 3, 156),
  mkTest("K", "Potassium", 35, "3.5-5.1", "mmol/L", "Chemistry", "Blood", 3, 155),
  mkTest("CA", "Calcium", 40, "8.6-10.3", "mg/dL", "Chemistry", "Blood", 3, 154),
  mkTest("MG", "Magnesium", 45, "1.7-2.2", "mg/dL", "Chemistry", "Blood", 4, 153),
  mkTest("IRON", "Serum Iron", 60, "60-170", "µg/dL", "Chemistry", "Blood", 6, 152),
  mkTest(
    "TIBC",
    "Total Iron Binding Capacity (TIBC)",
    70,
    "240-450",
    "µg/dL",
    "Chemistry",
    "Blood",
    6,
    151,
  ),
  mkTest("ALT", "ALT (SGPT)", 40, "7-56", "U/L", "Chemistry", "Blood", 4, 150),
  mkTest("AST", "AST (SGOT)", 40, "10-40", "U/L", "Chemistry", "Blood", 4, 149),
  mkTest("ALP", "Alkaline Phosphatase (ALP)", 45, "44-147", "U/L", "Chemistry", "Blood", 4, 148),
  mkTest("BILI", "Total Bilirubin", 40, "0.1-1.2", "mg/dL", "Chemistry", "Blood", 4, 147),
  mkTest("ALB", "Albumin", 40, "3.5-5.2", "g/dL", "Chemistry", "Blood", 4, 146),
  mkTest("TP", "Total Protein", 40, "6.4-8.3", "g/dL", "Chemistry", "Blood", 4, 145),
  mkTest("CRP", "C-Reactive Protein (CRP)", 95, "< 5", "mg/L", "Immunology", "Blood", 5, 143),
  mkTest(
    "ESR",
    "Erythrocyte Sedimentation Rate (ESR)",
    35,
    "0-20",
    "mm/hr",
    "Hematology",
    "Blood",
    3,
    142,
  ),
  mkTest(
    "TSH",
    "Thyroid Stimulating Hormone (TSH)",
    110,
    "0.4-4.0",
    "mIU/L",
    "Endocrinology",
    "Blood",
    8,
    140,
  ),
  mkTest("FT3", "Free T3", 100, "2.3-4.2", "pg/mL", "Endocrinology", "Blood", 8, 139),
  mkTest("FT4", "Free T4", 100, "0.8-1.8", "ng/dL", "Endocrinology", "Blood", 8, 138),
  mkTest(
    "PSA",
    "Prostate Specific Antigen (PSA)",
    140,
    "< 4.0",
    "ng/mL",
    "Immunology",
    "Blood",
    12,
    136,
  ),
  mkTest(
    "CEA",
    "Carcinoembryonic Antigen (CEA)",
    150,
    "< 3.0",
    "ng/mL",
    "Immunology",
    "Blood",
    12,
    135,
  ),
  mkTest("CA125", "CA-125", 165, "< 35", "U/mL", "Immunology", "Blood", 12, 134),
  mkTest("CA199", "CA 19-9", 175, "< 37", "U/mL", "Immunology", "Blood", 12, 133),
  mkTest("TROP", "Troponin I", 190, "< 0.04", "ng/mL", "Chemistry", "Blood", 1, 130),
  mkTest("DDIM", "D-Dimer", 160, "< 0.50", "µg/mL FEU", "Hematology", "Blood", 3, 129),
  mkTest("PT", "Prothrombin Time (PT)", 55, "11-13.5", "seconds", "Hematology", "Blood", 3, 128),
  mkTest("INR", "INR", 45, "0.8-1.2", "ratio", "Hematology", "Blood", 3, 127),
  mkTest(
    "APTT",
    "Activated Partial Thromboplastin Time (aPTT)",
    60,
    "25-35",
    "seconds",
    "Hematology",
    "Blood",
    3,
    126,
  ),
  mkTest(
    "ABO",
    "Blood Group & Rh",
    50,
    "A / B / AB / O ± Rh",
    "type",
    "Hematology",
    "Blood",
    2,
    125,
  ),
  mkTest(
    "HIV",
    "HIV 1/2 Antibody & Antigen",
    180,
    "Non-reactive",
    "index",
    "Immunology",
    "Blood",
    24,
    122,
  ),
  mkTest(
    "HBSAG",
    "Hepatitis B Surface Antigen (HBsAg)",
    150,
    "Non-reactive",
    "index",
    "Immunology",
    "Blood",
    24,
    121,
  ),
  mkTest(
    "HCV",
    "Hepatitis C Antibody (HCV)",
    160,
    "Non-reactive",
    "index",
    "Immunology",
    "Blood",
    24,
    120,
  ),
  mkTest("UA", "Urinalysis", 50, "Normal", "descriptive", "Urinalysis", "Urine", 3, 118),
  mkTest("STOOL", "Stool Analysis", 55, "Normal", "descriptive", "Microbiology", "Stool", 6, 117),
  mkTest("COVID", "COVID-19 PCR", 200, "Negative", "result", "Microbiology", "Swab", 12, 115),
];

const now = () => new Date().toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
const daysAhead = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

interface State {
  // auth
  currentUser: User | null;
  users: User[];
  otpCode: string | null;
  otpVerified: boolean;
  pendingLoginEmail: string | null;
  // data
  patients: Patient[];
  requests: TestRequest[];
  samples: Sample[];
  results: TestResult[];
  payments: Payment[];
  insuranceCompanies: InsuranceCompany[];
  coverageRules: CoverageRule[];
  tests: TestCatalogItem[];
  reagents: Reagent[];
  stockMovements: StockMovement[];
  audit: AuditEntry[];
  notifications: AppNotification[];

  // actions
  login: (username: string, password: string) => User | null;
  logout: () => void;
  verifyOtp: (code: string) => boolean;
  resendOtp: () => string;
  beginLoginVerification: (email: string) => void;
  completeLogin: (user: User) => void;
  refreshAuthenticatedUser: (user: User) => void;
  updateProfile: (patch: Partial<User>) => void;

  addPatient: (p: Omit<Patient, "id" | "createdAt" | "balance">) => Patient;
  updatePatient: (id: string, patch: Partial<Patient>, opts?: AuditOpts) => void;
  deletePatient: (id: string) => void;

  addRequest: (
    r: Omit<
      TestRequest,
      | "id"
      | "createdAt"
      | "status"
      | "paid"
      | "createdBy"
      | "subtotal"
      | "insuranceCovered"
      | "patientDue"
    >,
  ) => TestRequest;
  updateRequest: (id: string, patch: Partial<TestRequest>, opts?: AuditOpts) => void;
  deleteRequest: (id: string) => void;

  registerSample: (requestId: string, testCode: string) => Sample;
  updateSampleStatus: (id: string, status: Sample["status"], extra?: Partial<Sample>) => void;
  rejectSample: (id: string, reason: string) => void;
  cancelSample: (id: string, reason: string) => void;

  enterResult: (sampleId: string, patch: Partial<TestResult>) => TestResult;
  updateResult: (id: string, patch: Partial<TestResult>, opts?: AuditOpts) => void;
  approveResult: (id: string) => void;

  recordPayment: (p: Omit<Payment, "id" | "createdAt" | "createdBy">) => Payment;

  addInsuranceCompany: (c: Omit<InsuranceCompany, "id" | "createdAt">) => InsuranceCompany;
  updateInsuranceCompany: (id: string, patch: Partial<InsuranceCompany>, opts?: AuditOpts) => void;
  deleteInsuranceCompany: (id: string) => void;

  addCoverageRule: (r: Omit<CoverageRule, "id">) => CoverageRule;
  updateCoverageRule: (id: string, patch: Partial<CoverageRule>, opts?: AuditOpts) => void;
  deleteCoverageRule: (id: string) => void;

  addTest: (t: TestCatalogItem) => TestCatalogItem;
  updateTest: (code: string, patch: Partial<TestCatalogItem>, opts?: AuditOpts) => void;
  deleteTest: (code: string) => void;

  addReagent: (r: Omit<Reagent, "id" | "createdAt">) => Reagent;
  updateReagent: (id: string, patch: Partial<Reagent>, opts?: AuditOpts) => void;
  deleteReagent: (id: string) => void;
  adjustStock: (
    reagentId: string,
    delta: number,
    reason: string,
    ref?: string,
    type?: StockMovement["type"],
  ) => void;

  markNotificationRead: (id: string) => void;
  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;

  logAudit: (
    action: string,
    entity: string,
    entityId: string,
    details?: string,
    opts?: AuditOpts,
  ) => void;

  resetDemo: () => void;
}

const defaultUsers: User[] = [
  {
    id: "U1",
    username: "admin",
    email: "admin@medlab.io",
    fullName: "Dr. Sarah Mansour",
    role: "admin",
    phone: "+966500000001",
    active: true,
    createdAt: daysAgo(120),
  },
  {
    id: "U2",
    username: "reception",
    email: "reception@medlab.io",
    fullName: "Layla Al-Harbi",
    role: "receptionist",
    phone: "+966500000002",
    active: true,
    createdAt: daysAgo(90),
  },
  {
    id: "U3",
    username: "tech",
    email: "tech@medlab.io",
    fullName: "Omar Khaled",
    role: "technician",
    phone: "+966500000003",
    active: true,
    createdAt: daysAgo(60),
  },
  {
    id: "U4",
    username: "patient",
    email: "patient@medlab.io",
    fullName: "Yousef Ahmad",
    role: "patient",
    phone: "+966500000004",
    active: true,
    createdAt: daysAgo(30),
  },
];

function seed() {
  const patients: Patient[] = [
    {
      id: "PAT-1001",
      nationalId: "1098765432",
      fullName: "Yousef Ahmad",
      dob: "1988-03-12",
      gender: "male",
      phone: "+966500000004",
      email: "patient@medlab.io",
      address: "Riyadh, KSA",
      bloodType: "O+",
      allergies: "Penicillin",
      insuranceId: "INS-1",
      policyNumber: "TAW-554321",
      balance: 0,
      createdAt: daysAgo(30),
    },
    {
      id: "PAT-1002",
      nationalId: "1087654321",
      fullName: "Fatimah Al-Saleh",
      dob: "1992-07-04",
      gender: "female",
      phone: "+966512345678",
      email: "fatimah@example.com",
      address: "Jeddah, KSA",
      bloodType: "A-",
      insuranceId: "INS-2",
      policyNumber: "BUP-9912",
      balance: 120,
      createdAt: daysAgo(15),
    },
    {
      id: "PAT-1003",
      nationalId: "1076543210",
      fullName: "Khalid Al-Otaibi",
      dob: "1975-11-22",
      gender: "male",
      phone: "+966533456789",
      address: "Dammam, KSA",
      bloodType: "B+",
      balance: 0,
      createdAt: daysAgo(7),
    },
    {
      id: "PAT-1004",
      nationalId: "1065432109",
      fullName: "Noura Bin Salem",
      dob: "2001-01-30",
      gender: "female",
      phone: "+966544567890",
      insuranceId: "INS-1",
      policyNumber: "TAW-117788",
      balance: 45,
      createdAt: daysAgo(3),
    },
  ];
  const insuranceCompanies: InsuranceCompany[] = [
    {
      id: "INS-1",
      name: "Tawuniya",
      code: "TAW",
      contactEmail: "claims@tawuniya.com",
      phone: "+966112000000",
      active: true,
      defaultCoverage: 80,
      createdAt: daysAgo(200),
    },
    {
      id: "INS-2",
      name: "Bupa Arabia",
      code: "BUP",
      contactEmail: "claims@bupa.com",
      phone: "+966113000000",
      active: true,
      defaultCoverage: 70,
      createdAt: daysAgo(200),
    },
    {
      id: "INS-3",
      name: "MedGulf",
      code: "MED",
      contactEmail: "claims@medgulf.com",
      phone: "+966114000000",
      active: true,
      defaultCoverage: 60,
      createdAt: daysAgo(150),
    },
  ];
  const coverageRules: CoverageRule[] = [
    { id: "CR-1", companyId: "INS-1", category: "Hematology", coveragePercent: 90 },
    { id: "CR-2", companyId: "INS-1", testCode: "COVID", coveragePercent: 100 },
    { id: "CR-3", companyId: "INS-2", category: "Chemistry", coveragePercent: 75 },
  ];
  const reagents: Reagent[] = [
    {
      id: "RG-1",
      name: "CBC Reagent Kit",
      code: "RG-CBC",
      category: "Hematology",
      supplier: "Roche",
      stock: 240,
      unit: "tests",
      minStock: 50,
      expiryDate: daysAhead(120),
      costPerUnit: 1.2,
      testCodes: ["CBC"],
      consumePerTest: 1,
      createdAt: daysAgo(60),
    },
    {
      id: "RG-2",
      name: "Glucose Reagent",
      code: "RG-GLU",
      category: "Chemistry",
      supplier: "Abbott",
      stock: 32,
      unit: "tests",
      minStock: 40,
      expiryDate: daysAhead(20),
      costPerUnit: 0.5,
      testCodes: ["GLU"],
      consumePerTest: 1,
      createdAt: daysAgo(45),
    },
    {
      id: "RG-3",
      name: "HbA1c Cartridge",
      code: "RG-HBA",
      category: "Endocrinology",
      supplier: "Siemens",
      stock: 90,
      unit: "tests",
      minStock: 30,
      expiryDate: daysAhead(200),
      costPerUnit: 2.5,
      testCodes: ["HBA1C"],
      consumePerTest: 1,
      createdAt: daysAgo(30),
    },
    {
      id: "RG-4",
      name: "COVID-19 PCR Kit",
      code: "RG-COV",
      category: "Microbiology",
      supplier: "BioRad",
      stock: 14,
      unit: "tests",
      minStock: 25,
      expiryDate: daysAhead(8),
      costPerUnit: 6,
      testCodes: ["COVID"],
      consumePerTest: 1,
      createdAt: daysAgo(20),
    },
    {
      id: "RG-5",
      name: "Urinalysis Strips",
      code: "RG-UA",
      category: "Urinalysis",
      supplier: "Roche",
      stock: 180,
      unit: "strips",
      minStock: 60,
      expiryDate: daysAhead(300),
      costPerUnit: 0.3,
      testCodes: ["UA"],
      consumePerTest: 1,
      createdAt: daysAgo(40),
    },
  ];

  // Build sample request + samples + results
  const reqId = "REQ-2001";
  const requests: TestRequest[] = [
    {
      id: reqId,
      patientId: "PAT-1001",
      doctor: "Dr. Hassan",
      priority: "routine",
      tests: ["CBC", "GLU", "LIP"],
      notes: "Annual checkup",
      status: "in-progress",
      insuranceApplied: true,
      insuranceId: "INS-1",
      coveragePercent: 80,
      subtotal: 220,
      insuranceCovered: 176,
      patientDue: 44,
      paid: 44,
      createdBy: "U2",
      createdAt: daysAgo(2),
    },
    {
      id: "REQ-2002",
      patientId: "PAT-1002",
      doctor: "Dr. Mona",
      priority: "urgent",
      tests: ["HBA1C", "TSH"],
      status: "pending",
      insuranceApplied: true,
      insuranceId: "INS-2",
      coveragePercent: 70,
      subtotal: 200,
      insuranceCovered: 140,
      patientDue: 60,
      paid: 0,
      createdBy: "U2",
      createdAt: daysAgo(1),
    },
    {
      id: "REQ-2003",
      patientId: "PAT-1003",
      doctor: "Dr. Faisal",
      priority: "stat",
      tests: ["COVID"],
      status: "completed",
      insuranceApplied: false,
      subtotal: 200,
      insuranceCovered: 0,
      patientDue: 200,
      paid: 200,
      createdBy: "U2",
      createdAt: daysAgo(5),
    },
  ];
  const samples: Sample[] = [
    {
      id: "SMP-3001",
      requestId: reqId,
      patientId: "PAT-1001",
      testCode: "CBC",
      type: "Blood",
      barcode: "BC-30001",
      status: "in-analysis",
      collectedAt: daysAgo(2),
      collectedBy: "U3",
      createdAt: daysAgo(2),
    },
    {
      id: "SMP-3002",
      requestId: reqId,
      patientId: "PAT-1001",
      testCode: "GLU",
      type: "Blood",
      barcode: "BC-30002",
      status: "completed",
      collectedAt: daysAgo(2),
      collectedBy: "U3",
      createdAt: daysAgo(2),
    },
    {
      id: "SMP-3003",
      requestId: reqId,
      patientId: "PAT-1001",
      testCode: "LIP",
      type: "Blood",
      barcode: "BC-30003",
      status: "collected",
      collectedAt: daysAgo(2),
      collectedBy: "U3",
      createdAt: daysAgo(2),
    },
    {
      id: "SMP-3004",
      requestId: "REQ-2003",
      patientId: "PAT-1003",
      testCode: "COVID",
      type: "Swab",
      barcode: "BC-30004",
      status: "completed",
      collectedAt: daysAgo(5),
      collectedBy: "U3",
      createdAt: daysAgo(5),
    },
  ];
  const results: TestResult[] = [
    {
      id: "RES-4001",
      sampleId: "SMP-3002",
      requestId: reqId,
      patientId: "PAT-1001",
      testCode: "GLU",
      value: "92",
      unit: "mg/dL",
      refRange: "70-99",
      flag: "normal",
      status: "approved",
      enteredBy: "U3",
      enteredAt: daysAgo(1),
      approvedBy: "U3",
      approvedAt: daysAgo(1),
    },
    {
      id: "RES-4002",
      sampleId: "SMP-3004",
      requestId: "REQ-2003",
      patientId: "PAT-1003",
      testCode: "COVID",
      value: "Negative",
      refRange: "Negative",
      flag: "normal",
      status: "approved",
      enteredBy: "U3",
      enteredAt: daysAgo(4),
      approvedBy: "U3",
      approvedAt: daysAgo(4),
    },
  ];
  const payments: Payment[] = [
    {
      id: "PAY-5001",
      requestId: reqId,
      patientId: "PAT-1001",
      amount: 44,
      method: "card",
      type: "full",
      createdBy: "U2",
      createdAt: daysAgo(2),
    },
    {
      id: "PAY-5002",
      requestId: "REQ-2003",
      patientId: "PAT-1003",
      amount: 200,
      method: "cash",
      type: "full",
      createdBy: "U2",
      createdAt: daysAgo(5),
    },
  ];
  const audit: AuditEntry[] = [
    {
      id: "AUD-1",
      actorId: "U2",
      actorName: "Layla Al-Harbi",
      actorRole: "receptionist",
      action: "CREATE",
      entity: "TestRequest",
      entityId: reqId,
      details: "Created request with 3 tests",
      createdAt: daysAgo(2),
    },
    {
      id: "AUD-2",
      actorId: "U3",
      actorName: "Omar Khaled",
      actorRole: "technician",
      action: "APPROVE",
      entity: "TestResult",
      entityId: "RES-4001",
      details: "Approved glucose result",
      createdAt: daysAgo(1),
    },
  ];
  const notifications: AppNotification[] = [
    {
      id: "N-1",
      userId: "U4",
      channel: "in-app",
      title: "Result Ready",
      body: "Your COVID-19 PCR result is ready.",
      read: false,
      relatedEntity: "TestResult",
      relatedId: "RES-4002",
      createdAt: daysAgo(4),
    },
    {
      id: "N-2",
      userId: "U3",
      channel: "in-app",
      title: "Low Stock",
      body: "COVID-19 PCR Kit is below minimum.",
      read: false,
      createdAt: daysAgo(1),
    },
  ];
  const stockMovements: StockMovement[] = [
    {
      id: "SM-1",
      reagentId: "RG-1",
      type: "in",
      quantity: 200,
      reason: "Initial stock",
      createdBy: "U1",
      createdAt: daysAgo(60),
    },
    {
      id: "SM-2",
      reagentId: "RG-4",
      type: "out",
      quantity: 1,
      reason: "Consumed by COVID test",
      reference: "SMP-3004",
      createdBy: "U3",
      createdAt: daysAgo(4),
    },
  ];

  return {
    patients,
    requests,
    samples,
    results,
    payments,
    insuranceCompanies,
    coverageRules,
    tests: TEST_CATALOG.map((t) => ({ ...t })),
    reagents,
    stockMovements,
    audit,
    notifications,
  };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: defaultUsers,
      otpCode: null,
      otpVerified: false,
      pendingLoginEmail: null,
      ...seed(),

      login: (username, password) => {
        const u = get().users.find((x) => x.username === username && x.active);
        if (!u || password !== "password") return null;
        const code = String(Math.floor(100000 + Math.random() * 900000));
        set({ currentUser: u, otpVerified: false, otpCode: code });
        get().logAudit(
          "LOGIN",
          "User",
          u.id,
          `User ${u.username} logged in — OTP challenge issued`,
        );
        return u;
      },
      logout: () => {
        const u = get().currentUser;
        if (u) get().logAudit("LOGOUT", "User", u.id, `User ${u.username} logged out`);
        clearToken();
        set({
          currentUser: null,
          otpVerified: false,
          otpCode: null,
          pendingLoginEmail: null,
        });
      },
      verifyOtp: (code) => {
        const expected = get().otpCode;
        if (!expected || code !== expected) return false;
        set({ otpVerified: true, otpCode: null });
        const u = get().currentUser;
        if (u) get().logAudit("VERIFY_OTP", "User", u.id, "Two-factor verification succeeded");
        return true;
      },
      resendOtp: () => {
        const code = String(Math.floor(100000 + Math.random() * 900000));
        set({ otpCode: code });
        return code;
      },
      beginLoginVerification: (email) => {
        set({
          currentUser: null,
          otpVerified: false,
          otpCode: null,
          pendingLoginEmail: email,
        });
      },
      completeLogin: (user) => {
        set({
          currentUser: user,
          otpVerified: true,
          otpCode: null,
          pendingLoginEmail: null,
        });
        get().logAudit("LOGIN", "User", user.id, `User ${user.username} logged in`);
      },
      refreshAuthenticatedUser: (user) => {
        set({ currentUser: user, otpVerified: true });
      },
      updateProfile: (patch) => {
        const u = get().currentUser;
        if (!u) return;
        const updated = { ...u, ...patch };
        set({
          currentUser: updated,
          users: get().users.map((x) => (x.id === u.id ? updated : x)),
        });
      },

      addPatient: (p) => {
        const patient: Patient = { ...p, id: uid("PAT"), balance: 0, createdAt: now() };
        set({ patients: [patient, ...get().patients] });
        get().logAudit("CREATE", "Patient", patient.id, `Added patient ${patient.fullName}`);
        return patient;
      },
      updatePatient: (id, patch, opts) => {
        set({ patients: get().patients.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
        get().logAudit("UPDATE", "Patient", id, opts?.details ?? "Updated patient info", opts);
      },
      deletePatient: (id) => {
        set({ patients: get().patients.filter((p) => p.id !== id) });
        get().logAudit("DELETE", "Patient", id, "Deleted patient");
      },

      addRequest: (r) => {
        const catalog = get().tests;
        const subtotal = r.tests.reduce(
          (s, c) => s + (catalog.find((t) => t.code === c)?.price ?? 0),
          0,
        );
        const coverage = r.insuranceApplied ? (r.coveragePercent ?? 0) : 0;
        const insuranceCovered = Math.round((subtotal * coverage) / 100);
        const patientDue = subtotal - insuranceCovered;
        const req: TestRequest = {
          ...r,
          id: uid("REQ"),
          status: "pending",
          paid: 0,
          subtotal,
          insuranceCovered,
          patientDue,
          createdBy: get().currentUser?.id ?? "system",
          createdAt: now(),
        };
        set({ requests: [req, ...get().requests] });
        // update patient balance
        set({
          patients: get().patients.map((p) =>
            p.id === req.patientId ? { ...p, balance: p.balance + patientDue } : p,
          ),
        });
        get().logAudit(
          "CREATE",
          "TestRequest",
          req.id,
          `Created test request with ${req.tests.length} tests`,
        );
        return req;
      },
      updateRequest: (id, patch, opts) => {
        set({ requests: get().requests.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
        get().logAudit("UPDATE", "TestRequest", id, opts?.details ?? "Updated request", opts);
      },
      deleteRequest: (id) => {
        set({ requests: get().requests.filter((r) => r.id !== id) });
        get().logAudit("DELETE", "TestRequest", id, "Deleted request");
      },

      registerSample: (requestId, testCode) => {
        const req = get().requests.find((r) => r.id === requestId);
        if (!req) throw new Error("Request not found");
        const tc = get().tests.find((t) => t.code === testCode);
        const sample: Sample = {
          id: uid("SMP"),
          requestId,
          patientId: req.patientId,
          testCode,
          type: tc?.sampleType ?? "Blood",
          barcode: `BC-${Math.floor(Math.random() * 90000) + 10000}`,
          status: "registered",
          createdAt: now(),
        };
        set({ samples: [sample, ...get().samples] });
        get().logAudit("CREATE", "Sample", sample.id, `Registered sample for ${testCode}`);
        return sample;
      },
      updateSampleStatus: (id, status, extra) => {
        set({ samples: get().samples.map((s) => (s.id === id ? { ...s, status, ...extra } : s)) });
        get().logAudit("UPDATE", "Sample", id, `Status -> ${status}`);
        // auto-consume reagent when in-analysis
        if (status === "in-analysis") {
          const s = get().samples.find((x) => x.id === id);
          if (s) {
            const r = get().reagents.find((rg) => rg.testCodes.includes(s.testCode));
            if (r)
              get().adjustStock(r.id, -r.consumePerTest, `Consumed by sample ${s.id}`, s.id, "out");
          }
        }
      },
      rejectSample: (id, reason) => {
        set({
          samples: get().samples.map((s) =>
            s.id === id ? { ...s, status: "rejected", rejectedReason: reason } : s,
          ),
        });
        get().logAudit("REJECT", "Sample", id, reason);
      },
      cancelSample: (id, reason) => {
        set({
          samples: get().samples.map((s) =>
            s.id === id ? { ...s, status: "cancelled", cancelledReason: reason } : s,
          ),
        });
        get().logAudit("CANCEL", "Sample", id, reason);
      },

      enterResult: (sampleId, patch) => {
        const s = get().samples.find((x) => x.id === sampleId);
        if (!s) throw new Error("Sample not found");
        const tc = get().tests.find((t) => t.code === s.testCode);
        const existing = get().results.find((r) => r.sampleId === sampleId);
        if (existing) {
          const updated = {
            ...existing,
            ...patch,
            status: "entered" as const,
            enteredAt: now(),
            enteredBy: get().currentUser?.id,
          };
          set({ results: get().results.map((r) => (r.id === existing.id ? updated : r)) });
          get().logAudit("UPDATE", "TestResult", existing.id, "Edited result before approval");
          return updated;
        }
        const result: TestResult = {
          id: uid("RES"),
          sampleId,
          requestId: s.requestId,
          patientId: s.patientId,
          testCode: s.testCode,
          value: patch.value ?? "",
          unit: patch.unit ?? tc?.unit,
          refRange: patch.refRange ?? tc?.refRange,
          flag: patch.flag ?? "normal",
          notes: patch.notes,
          status: "entered",
          enteredBy: get().currentUser?.id,
          enteredAt: now(),
        };
        set({ results: [result, ...get().results] });
        get().updateSampleStatus(sampleId, "completed");
        get().logAudit("CREATE", "TestResult", result.id, `Entered result for ${s.testCode}`);
        return result;
      },
      updateResult: (id, patch, opts) => {
        set({ results: get().results.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
        get().logAudit("UPDATE", "TestResult", id, opts?.details ?? "Updated result", opts);
      },
      approveResult: (id) => {
        const u = get().currentUser;
        set({
          results: get().results.map((r) =>
            r.id === id ? { ...r, status: "approved", approvedBy: u?.id, approvedAt: now() } : r,
          ),
        });
        get().logAudit("APPROVE", "TestResult", id, "Result approved & signed");

        const result = get().results.find((r) => r.id === id);
        if (result) {
          // check if all results for request are approved -> mark complete & notify
          const req = get().requests.find((r) => r.id === result.requestId);
          if (req) {
            const allApproved = req.tests.every((tc) =>
              get().results.some(
                (rr) => rr.requestId === req.id && rr.testCode === tc && rr.status === "approved",
              ),
            );
            if (allApproved) {
              get().updateRequest(req.id, { status: "completed" });
              const patient = get().patients.find((p) => p.id === req.patientId);
              const patientUser = get().users.find((u) => u.email === patient?.email);
              get().addNotification({
                userId: patientUser?.id,
                channel: "sms",
                title: "Results Ready",
                body: `Your lab results for request ${req.id} are ready. Please log in to view.`,
                relatedEntity: "TestRequest",
                relatedId: req.id,
              });
            }
          }
        }
      },

      recordPayment: (p) => {
        const payment: Payment = {
          ...p,
          id: uid("PAY"),
          createdBy: get().currentUser?.id ?? "system",
          createdAt: now(),
        };
        set({ payments: [payment, ...get().payments] });
        // update request paid + patient balance
        if (p.type !== "refund") {
          set({
            requests: get().requests.map((r) =>
              r.id === p.requestId ? { ...r, paid: r.paid + p.amount } : r,
            ),
            patients: get().patients.map((pt) =>
              pt.id === p.patientId ? { ...pt, balance: Math.max(0, pt.balance - p.amount) } : pt,
            ),
          });
        } else {
          set({
            patients: get().patients.map((pt) =>
              pt.id === p.patientId ? { ...pt, balance: pt.balance + p.amount } : pt,
            ),
          });
        }
        get().logAudit(
          p.type === "refund" ? "REFUND" : "PAYMENT",
          "Payment",
          payment.id,
          `${p.type} ${p.amount} via ${p.method}`,
        );
        return payment;
      },

      addInsuranceCompany: (c) => {
        const company: InsuranceCompany = { ...c, id: uid("INS"), createdAt: now() };
        set({ insuranceCompanies: [company, ...get().insuranceCompanies] });
        get().logAudit("CREATE", "InsuranceCompany", company.id, `Added ${company.name}`);
        return company;
      },
      updateInsuranceCompany: (id, patch, opts) => {
        set({
          insuranceCompanies: get().insuranceCompanies.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        });
        get().logAudit("UPDATE", "InsuranceCompany", id, opts?.details, opts);
      },
      deleteInsuranceCompany: (id) => {
        set({ insuranceCompanies: get().insuranceCompanies.filter((c) => c.id !== id) });
        get().logAudit("DELETE", "InsuranceCompany", id);
      },

      addCoverageRule: (r) => {
        const rule: CoverageRule = { ...r, id: uid("CR") };
        set({ coverageRules: [rule, ...get().coverageRules] });
        get().logAudit("CREATE", "CoverageRule", rule.id);
        return rule;
      },
      updateCoverageRule: (id, patch, opts) => {
        set({
          coverageRules: get().coverageRules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        });
        get().logAudit("UPDATE", "CoverageRule", id, opts?.details, opts);
      },
      deleteCoverageRule: (id) => {
        set({ coverageRules: get().coverageRules.filter((r) => r.id !== id) });
        get().logAudit("DELETE", "CoverageRule", id);
      },

      addTest: (t) => {
        set({ tests: [t, ...get().tests] });
        get().logAudit("CREATE", "Test", t.code, `Added test ${t.name}`);
        return t;
      },
      updateTest: (code, patch, opts) => {
        set({ tests: get().tests.map((t) => (t.code === code ? { ...t, ...patch } : t)) });
        get().logAudit("UPDATE", "Test", code, opts?.details ?? "Updated test", opts);
      },
      deleteTest: (code) => {
        set({ tests: get().tests.filter((t) => t.code !== code) });
        get().logAudit("DELETE", "Test", code, "Deleted test from catalog");
      },

      addReagent: (r) => {
        const reagent: Reagent = { ...r, id: uid("RG"), createdAt: now() };
        set({ reagents: [reagent, ...get().reagents] });
        get().logAudit("CREATE", "Reagent", reagent.id, `Added ${reagent.name}`);
        return reagent;
      },
      updateReagent: (id, patch, opts) => {
        set({ reagents: get().reagents.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
        get().logAudit("UPDATE", "Reagent", id, opts?.details, opts);
      },
      deleteReagent: (id) => {
        set({ reagents: get().reagents.filter((r) => r.id !== id) });
        get().logAudit("DELETE", "Reagent", id);
      },
      adjustStock: (reagentId, delta, reason, ref, type = "adjust") => {
        const rg = get().reagents.find((r) => r.id === reagentId);
        if (!rg) return;
        const newStock = Math.max(0, rg.stock + delta);
        set({
          reagents: get().reagents.map((r) => (r.id === reagentId ? { ...r, stock: newStock } : r)),
          stockMovements: [
            {
              id: uid("SM"),
              reagentId,
              type,
              quantity: Math.abs(delta),
              reason,
              reference: ref,
              createdBy: get().currentUser?.id ?? "system",
              createdAt: now(),
            },
            ...get().stockMovements,
          ],
        });
        if (newStock <= rg.minStock) {
          get().addNotification({
            channel: "in-app",
            title: "Low Stock Alert",
            body: `${rg.name} is at ${newStock} (min ${rg.minStock}).`,
            relatedEntity: "Reagent",
            relatedId: rg.id,
          });
        }
      },

      markNotificationRead: (id) => {
        set({
          notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        });
      },
      addNotification: (n) => {
        const notif: AppNotification = { ...n, id: uid("N"), read: false, createdAt: now() };
        set({ notifications: [notif, ...get().notifications] });
      },

      logAudit: (action, entity, entityId, details, opts) => {
        const u = get().currentUser;
        const entry: AuditEntry = {
          id: uid("AUD"),
          actorId: u?.id ?? "system",
          actorName: u?.fullName ?? "System",
          actorRole: u?.role ?? "admin",
          action,
          entity,
          entityId,
          details,
          reason: opts?.reason,
          changes: opts?.changes,
          ip: "127.0.0.1",
          createdAt: now(),
        };
        set({ audit: [entry, ...get().audit].slice(0, 1000) });
      },

      resetDemo: () => {
        clearToken();
        set({
          currentUser: null,
          otpCode: null,
          otpVerified: false,
          pendingLoginEmail: null,
          users: defaultUsers,
          ...seed(),
        });
      },
    }),
    { name: "lims-store-v2" },
  ),
);

export function getPatient(id: string) {
  return useStore.getState().patients.find((p) => p.id === id);
}
export function getInsurance(id?: string) {
  if (!id) return undefined;
  return useStore.getState().insuranceCompanies.find((c) => c.id === id);
}
export function getTest(code: string) {
  return (
    useStore.getState().tests.find((t) => t.code === code) ??
    TEST_CATALOG.find((t) => t.code === code)
  );
}

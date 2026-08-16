import { apiRequest } from "@/lib/api-client";
import type { Pagination } from "@/lib/api-types";

interface BackendCompany {
  id: string;
  code: string;
  name: string;
  contact: { email: string | null; phone: string | null };
  default_coverage: string | number;
  status: "approved" | "inactive";
  created_at: string;
}

interface BackendCoverageRule {
  id: string;
  company: { id: string; name: string };
  test: { id: string; name: string } | null;
  coverage_percent: string | number;
  max_amount: string | number | null;
  created_at: string;
}

export interface InsuranceCompanyRecord {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  defaultCoverage: number;
  active: boolean;
  createdAt: string;
}

export interface CoverageRuleRecord {
  id: string;
  company: { id: string; name: string };
  test: { id: string; name: string };
  coveragePercent: number;
  maxAmount: number | null;
  createdAt: string;
}

export interface CompanyInput {
  code: string;
  name: string;
  email?: string;
  phone?: string;
  defaultCoverage: number;
  active: boolean;
}

function adaptCompany(company: BackendCompany): InsuranceCompanyRecord {
  return {
    id: company.id,
    code: company.code,
    name: company.name,
    email: company.contact.email ?? "",
    phone: company.contact.phone ?? "",
    defaultCoverage: Number(company.default_coverage),
    active: company.status === "approved",
    createdAt: company.created_at,
  };
}

function adaptRule(rule: BackendCoverageRule): CoverageRuleRecord {
  return {
    id: rule.id,
    company: rule.company,
    test: rule.test ?? { id: "", name: "Legacy rule" },
    coveragePercent: Number(rule.coverage_percent),
    maxAmount: rule.max_amount === null ? null : Number(rule.max_amount),
    createdAt: rule.created_at,
  };
}

export async function listInsuranceCompanies(): Promise<InsuranceCompanyRecord[]> {
  const payload = await apiRequest<{
    companies: BackendCompany[];
    pagination: Pagination;
  }>("/user/insurance-companies");
  return payload.companies.map(adaptCompany);
}

export async function createInsuranceCompany(input: CompanyInput): Promise<InsuranceCompanyRecord> {
  return adaptCompany(
    await apiRequest<BackendCompany>("/user/insurance-companies", {
      method: "POST",
      body: JSON.stringify({
        code: input.code,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        default_coverage: input.defaultCoverage,
        status: input.active ? "approved" : "inactive",
      }),
    }),
  );
}

export async function updateInsuranceCompany(
  id: string,
  input: CompanyInput,
): Promise<InsuranceCompanyRecord> {
  return adaptCompany(
    await apiRequest<BackendCompany>(`/user/insurance-companies/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        code: input.code,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        default_coverage: input.defaultCoverage,
        status: input.active ? "approved" : "inactive",
      }),
    }),
  );
}

export async function deleteInsuranceCompany(id: string): Promise<void> {
  await apiRequest(`/user/insurance-companies/${id}`, { method: "DELETE" });
}

export async function listCoverageRules(): Promise<CoverageRuleRecord[]> {
  const payload = await apiRequest<{ rules: BackendCoverageRule[] }>("/user/coverage-rules");
  return payload.rules.map(adaptRule);
}

export async function createCoverageRule(input: {
  companyId: string;
  testId: string;
  coveragePercent: number;
  maxAmount?: number | null;
}): Promise<CoverageRuleRecord> {
  return adaptRule(
    await apiRequest<BackendCoverageRule>("/user/coverage-rules", {
      method: "POST",
      body: JSON.stringify({
        insurance_company_id: input.companyId,
        test_id: input.testId,
        coverage_percent: input.coveragePercent,
        max_amount: input.maxAmount || null,
      }),
    }),
  );
}

export async function updateCoverageRule(
  id: string,
  input: {
    testId: string;
    coveragePercent: number;
    maxAmount?: number | null;
  },
): Promise<CoverageRuleRecord> {
  return adaptRule(
    await apiRequest<BackendCoverageRule>(`/user/coverage-rules/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        test_id: input.testId,
        coverage_percent: input.coveragePercent,
        max_amount: input.maxAmount || null,
      }),
    }),
  );
}

export async function deleteCoverageRule(id: string): Promise<void> {
  await apiRequest(`/user/coverage-rules/${id}`, { method: "DELETE" });
}

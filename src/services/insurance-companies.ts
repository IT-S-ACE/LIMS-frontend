import { apiRequest } from "@/lib/api-client";

export interface InsuranceCompanyListItem {
  id: string;
  name: string;
}

interface BackendInsuranceCompany {
  id: string;
  name: string;
}

export async function listInsuranceCompanies(): Promise<InsuranceCompanyListItem[]> {
  const payload = await apiRequest<{ companies: BackendInsuranceCompany[] }>(
    "/user/insurance-companies",
  );
  return payload.companies.map(({ id, name }) => ({ id, name }));
}

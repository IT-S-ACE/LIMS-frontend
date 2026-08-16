import { useQuery } from "@tanstack/react-query";
import { listInsuranceCompanies } from "@/services/insurance-companies";

export function useInsuranceCompanies() {
  return useQuery({ queryKey: ["insurance-companies"], queryFn: listInsuranceCompanies });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCoverageRule,
  createInsuranceCompany,
  deleteCoverageRule,
  deleteInsuranceCompany,
  listCoverageRules,
  listInsuranceCompanies,
  updateCoverageRule,
  updateInsuranceCompany,
} from "@/services/insurance";

export function useInsuranceManagement() {
  return useQuery({
    queryKey: ["insurance-companies", "management"],
    queryFn: listInsuranceCompanies,
  });
}

export function useCreateInsuranceCompany() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createInsuranceCompany,
    onSuccess: () => client.invalidateQueries({ queryKey: ["insurance-companies"] }),
  });
}

export function useUpdateInsuranceCompany() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof updateInsuranceCompany>[1];
    }) => updateInsuranceCompany(id, input),
    onSuccess: () => client.invalidateQueries({ queryKey: ["insurance-companies"] }),
  });
}

export function useDeleteInsuranceCompany() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteInsuranceCompany,
    onSuccess: () => client.invalidateQueries({ queryKey: ["insurance-companies"] }),
  });
}

export function useCoverageRules() {
  return useQuery({ queryKey: ["coverage-rules"], queryFn: listCoverageRules });
}

export function useCreateCoverageRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createCoverageRule,
    onSuccess: () => client.invalidateQueries({ queryKey: ["coverage-rules"] }),
  });
}

export function useUpdateCoverageRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateCoverageRule>[1] }) =>
      updateCoverageRule(id, input),
    onSuccess: () => client.invalidateQueries({ queryKey: ["coverage-rules"] }),
  });
}

export function useDeleteCoverageRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteCoverageRule,
    onSuccess: () => client.invalidateQueries({ queryKey: ["coverage-rules"] }),
  });
}

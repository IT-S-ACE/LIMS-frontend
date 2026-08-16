import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getInvoice,
  getFinancialReport,
  getPayment,
  listInvoices,
  listPatientBalances,
  listPayments,
  recordFullPayment,
} from "@/services/finance";

export function useInvoices(
  params: { page?: number; search?: string; status?: "pending" | "paid" | "all" } = {},
) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => listInvoices(params),
    placeholderData: (previous) => previous,
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => getInvoice(id!),
    enabled: Boolean(id),
  });
}

export function usePayments(params: { page?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ["payments", params],
    queryFn: () => listPayments(params),
    placeholderData: (previous) => previous,
  });
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: ["payments", id],
    queryFn: () => getPayment(id!),
    enabled: Boolean(id),
  });
}

export function useRecordFullPayment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: recordFullPayment,
    onSuccess: (payment) => {
      client.invalidateQueries({ queryKey: ["payments"] });
      client.invalidateQueries({ queryKey: ["invoices"] });
      client.invalidateQueries({ queryKey: ["patient-balances"] });
      client.invalidateQueries({ queryKey: ["test-requests"] });
      client.setQueryData(["payments", payment.id], payment);
    },
  });
}

export function usePatientBalances() {
  return useQuery({ queryKey: ["patient-balances"], queryFn: listPatientBalances });
}

export function useFinancialReport(params: { from: string; to: string }) {
  return useQuery({
    queryKey: ["financial-report", params],
    queryFn: () => getFinancialReport(params),
    enabled: Boolean(params.from && params.to && params.from <= params.to),
    staleTime: 30_000,
  });
}

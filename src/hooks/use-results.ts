import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveResult,
  getMedicalReport,
  getResult,
  getResultWorkspace,
  listResults,
  listMedicalReports,
  returnResult,
  reviewResult,
  saveResultDrafts,
  submitSampleResults,
  type ResultStatus,
} from "@/services/results";

export function useResults(params: { page: number; search: string; status: ResultStatus | "" }) {
  return useQuery({ queryKey: ["results", params], queryFn: () => listResults(params) });
}

export function useResult(id: string | undefined) {
  return useQuery({
    queryKey: ["results", id],
    queryFn: () => getResult(id!),
    enabled: Boolean(id),
  });
}

export function useResultWorkspace(sampleId: string | undefined) {
  return useQuery({
    queryKey: ["results", "workspace", sampleId],
    queryFn: () => getResultWorkspace(sampleId!),
    enabled: Boolean(sampleId),
  });
}

export function useSaveResultDrafts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sampleId,
      results,
    }: {
      sampleId: string;
      results: { testRequestItemId: string; value: string; notes?: string }[];
    }) => saveResultDrafts(sampleId, results),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      queryClient.invalidateQueries({ queryKey: ["results", "workspace", variables.sampleId] });
      queryClient.invalidateQueries({ queryKey: ["samples", variables.sampleId] });
    },
  });
}

export function useSubmitSampleResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitSampleResults,
    onSuccess: (_, sampleId) => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      queryClient.invalidateQueries({ queryKey: ["results", "workspace", sampleId] });
    },
  });
}

function useResultAction(action: typeof reviewResult | typeof returnResult | typeof approveResult) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; text?: string }) => {
      if (action === reviewResult) return reviewResult(args.id, args.text);
      if (action === returnResult) return returnResult(args.id, args.text ?? "");
      return approveResult(args.id);
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["results", result.id], result);
      queryClient.invalidateQueries({ queryKey: ["results"] });
      if (result.requestId)
        queryClient.invalidateQueries({ queryKey: ["test-requests", result.requestId] });
    },
  });
}

export const useReviewResult = () => useResultAction(reviewResult);
export const useReturnResult = () => useResultAction(returnResult);
export const useApproveResult = () => useResultAction(approveResult);

export function useMedicalReport(testRequestId: string | undefined) {
  return useQuery({
    queryKey: ["medical-report", testRequestId],
    queryFn: () => getMedicalReport(testRequestId!),
    enabled: Boolean(testRequestId),
  });
}

export function useMedicalReports(page: number, search: string) {
  return useQuery({
    queryKey: ["medical-reports", page, search],
    queryFn: () => listMedicalReports(page, search),
  });
}

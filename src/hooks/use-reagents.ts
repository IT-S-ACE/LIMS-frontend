import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adjustReagentStock,
  createReagent,
  deleteReagent,
  getReagent,
  listReagents,
  updateReagentRules,
  type CreateReagentInput,
  type ReagentListParams,
  type StockAdjustmentInput,
  type UpdateReagentRulesInput,
} from "@/services/reagents";

export function useReagents(params: ReagentListParams = {}) {
  return useQuery({
    queryKey: ["reagents", params],
    queryFn: () => listReagents(params),
    placeholderData: (previous) => previous,
  });
}

export function useReagent(id: string | undefined) {
  return useQuery({
    queryKey: ["reagents", id],
    queryFn: () => getReagent(id!),
    enabled: Boolean(id),
  });
}

export function useCreateReagent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReagentInput) => createReagent(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reagents"] }),
  });
}

export function useAdjustReagentStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StockAdjustmentInput) => adjustReagentStock(input),
    onSuccess: (reagent) => {
      queryClient.setQueryData(["reagents", reagent.id], reagent);
      queryClient.invalidateQueries({ queryKey: ["reagents"] });
      queryClient.invalidateQueries({ queryKey: ["samples"] });
    },
  });
}

export function useUpdateReagentRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateReagentRulesInput) => updateReagentRules(input),
    onSuccess: (reagent) => {
      queryClient.setQueryData(["reagents", reagent.id], reagent);
      queryClient.invalidateQueries({ queryKey: ["reagents"] });
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
  });
}

export function useDeleteReagent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteReagent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reagents"] }),
  });
}

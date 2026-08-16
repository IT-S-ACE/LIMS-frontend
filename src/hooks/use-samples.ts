import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelSample,
  deleteSample,
  getSample,
  listSamples,
  registerSample,
  rejectSample,
  trackSample,
  updateSampleStatus,
  type SampleListParams,
  type SampleStatus,
} from "@/services/samples";

export function useSamples(params: SampleListParams = {}) {
  return useQuery({
    queryKey: ["samples", params],
    queryFn: () => listSamples(params),
    placeholderData: (previous) => previous,
  });
}

export function useSample(id: string | undefined) {
  return useQuery({
    queryKey: ["samples", id],
    queryFn: () => getSample(id!),
    enabled: Boolean(id),
  });
}

function useRefreshSample() {
  const queryClient = useQueryClient();

  return (sample: Awaited<ReturnType<typeof getSample>>) => {
    queryClient.setQueryData(["samples", sample.id], sample);
    queryClient.invalidateQueries({ queryKey: ["samples"] });
    queryClient.invalidateQueries({ queryKey: ["test-requests"] });
  };
}

export function useRegisterSample() {
  const refresh = useRefreshSample();
  return useMutation({ mutationFn: registerSample, onSuccess: refresh });
}

export function useUpdateSampleStatus() {
  const refresh = useRefreshSample();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SampleStatus }) =>
      updateSampleStatus(id, status),
    onSuccess: refresh,
  });
}

export function useRejectSample() {
  const refresh = useRefreshSample();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectSample(id, reason),
    onSuccess: refresh,
  });
}

export function useCancelSample() {
  const refresh = useRefreshSample();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelSample(id, reason),
    onSuccess: refresh,
  });
}

export function useDeleteSample() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSample,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["samples"] }),
  });
}

export function useTrackSample() {
  return useMutation({ mutationFn: trackSample });
}

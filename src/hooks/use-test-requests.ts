import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTestRequest,
  deleteTestRequest,
  getTestRequest,
  listTestRequests,
  updateTestRequest,
  type TestRequestFormInput,
  type TestRequestListParams,
  type TestRequestUpdateInput,
} from "@/services/test-requests";

export function useTestRequests(params: TestRequestListParams = {}) {
  return useQuery({
    queryKey: ["test-requests", params],
    queryFn: () => listTestRequests(params),
    placeholderData: (previous) => previous,
  });
}

export function useTestRequest(id: string | undefined) {
  return useQuery({
    queryKey: ["test-requests", id],
    queryFn: () => getTestRequest(id!),
    enabled: Boolean(id),
  });
}

export function useCreateTestRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TestRequestFormInput) => createTestRequest(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["test-requests"] }),
  });
}

export function useUpdateTestRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TestRequestUpdateInput }) =>
      updateTestRequest(id, input),
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ["test-requests"] });
      queryClient.setQueryData(["test-requests", request.id], request);
    },
  });
}

export function useDeleteTestRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTestRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["test-requests"] }),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTest,
  deleteTest,
  getTest,
  listTests,
  updateTest,
  type TestFormInput,
} from "@/services/tests";

export function useTestCatalog() {
  return useQuery({ queryKey: ["tests", "catalog"], queryFn: listTests });
}

export function useTest(id: string | undefined) {
  return useQuery({
    queryKey: ["tests", id],
    queryFn: () => getTest(id!),
    enabled: Boolean(id),
  });
}

export function useCreateTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TestFormInput) => createTest(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tests"] }),
  });
}

export function useUpdateTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TestFormInput & { reason: string } }) =>
      updateTest(id, input),
    onSuccess: (test) => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      queryClient.setQueryData(["tests", test.id], test);
    },
  });
}

export function useDeleteTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tests"] }),
  });
}

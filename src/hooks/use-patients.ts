import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPatient,
  deletePatient,
  getPatient,
  listPatients,
  updatePatient,
  type PatientFormInput,
} from "@/services/patients";

export function usePatients(search = "") {
  return useQuery({
    queryKey: ["patients", { search }],
    queryFn: () => listPatients(search),
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ["patients", id],
    queryFn: () => getPatient(id!),
    enabled: Boolean(id),
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientFormInput) => createPatient(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"] }),
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PatientFormInput }) =>
      updatePatient(id, input),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patients", patient.id] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePatient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"] }),
  });
}

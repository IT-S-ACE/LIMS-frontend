import { useQuery } from "@tanstack/react-query";
import { listAuditLogs, type AuditFilters } from "@/services/audit";

export function useAuditLogs(filters: AuditFilters) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => listAuditLogs(filters),
    placeholderData: (previous) => previous,
    staleTime: 15_000,
  });
}

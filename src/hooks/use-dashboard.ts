import { useQuery } from "@tanstack/react-query";
import { getOperationalDashboard, type DashboardPeriod } from "@/services/dashboard";

export function useOperationalDashboard(days: DashboardPeriod) {
  return useQuery({
    queryKey: ["operational-dashboard", days],
    queryFn: () => getOperationalDashboard(days),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

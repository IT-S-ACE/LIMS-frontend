import { apiRequest } from "@/lib/api-client";

export type DashboardPeriod = 7 | 14 | 30;

interface BackendDashboard {
  generated_at: string;
  period: { days: DashboardPeriod; from: string; to: string };
  permissions: { financial: boolean };
  statistics: {
    patients_total: number;
    requests_today: number;
    requests_in_period: number;
    samples_in_lab: number;
    pending_results: number;
    critical_results: number;
    completed_today: number;
    completion_rate: number;
    average_turnaround_hours: number;
    revenue_today: number | null;
  };
  activity_trend: {
    date: string;
    label: string;
    requests: number;
    completed_results: number;
  }[];
  request_status: Record<string, number>;
  sample_status: Record<string, number>;
  result_status: Record<string, number>;
  attention: {
    overdue_samples: {
      id: string;
      sample_number: string;
      barcode: string;
      status: string;
      request_number: string | null;
      patient: string | null;
      waiting_hours: number;
    }[];
    critical_results: {
      id: string;
      result_number: string;
      sample_number: string | null;
      patient: string | null;
      test: string | null;
      value: string;
      unit: string | null;
      workflow_status: string;
      created_at: string;
    }[];
  };
  inventory: {
    low_stock_items: number;
    expired_lots: number;
    expiring_soon_lots: number;
    items: {
      id: string;
      code: string;
      name: string;
      stock: number;
      minimum: number;
      nearest_expiry: string | null;
    }[];
  };
  recent_requests: {
    id: string;
    request_number: string;
    patient: string | null;
    patient_number: string | null;
    tests_count: number;
    status: string;
    created_at: string;
  }[];
  top_tests: {
    test_id: string;
    test_name: string;
    count: number;
  }[];
}

export interface DashboardData {
  generatedAt: string;
  period: BackendDashboard["period"];
  permissions: BackendDashboard["permissions"];
  statistics: {
    patientsTotal: number;
    requestsToday: number;
    requestsInPeriod: number;
    samplesInLab: number;
    pendingResults: number;
    criticalResults: number;
    completedToday: number;
    completionRate: number;
    averageTurnaroundHours: number;
    revenueToday: number | null;
  };
  activityTrend: {
    date: string;
    label: string;
    requests: number;
    completedResults: number;
  }[];
  requestStatus: Record<string, number>;
  sampleStatus: Record<string, number>;
  resultStatus: Record<string, number>;
  attention: {
    overdueSamples: {
      id: string;
      sampleNumber: string;
      barcode: string;
      status: string;
      requestNumber: string | null;
      patient: string | null;
      waitingHours: number;
    }[];
    criticalResults: {
      id: string;
      resultNumber: string;
      sampleNumber: string | null;
      patient: string | null;
      test: string | null;
      value: string;
      unit: string | null;
      workflowStatus: string;
      createdAt: string;
    }[];
  };
  inventory: {
    lowStockItems: number;
    expiredLots: number;
    expiringSoonLots: number;
    items: {
      id: string;
      code: string;
      name: string;
      stock: number;
      minimum: number;
      nearestExpiry: string | null;
    }[];
  };
  recentRequests: {
    id: string;
    requestNumber: string;
    patient: string | null;
    patientNumber: string | null;
    testsCount: number;
    status: string;
    createdAt: string;
  }[];
  topTests: { testId: string; testName: string; count: number }[];
}

function adaptDashboard(data: BackendDashboard): DashboardData {
  return {
    generatedAt: data.generated_at,
    period: data.period,
    permissions: data.permissions,
    statistics: {
      patientsTotal: data.statistics.patients_total,
      requestsToday: data.statistics.requests_today,
      requestsInPeriod: data.statistics.requests_in_period,
      samplesInLab: data.statistics.samples_in_lab,
      pendingResults: data.statistics.pending_results,
      criticalResults: data.statistics.critical_results,
      completedToday: data.statistics.completed_today,
      completionRate: data.statistics.completion_rate,
      averageTurnaroundHours: data.statistics.average_turnaround_hours,
      revenueToday: data.statistics.revenue_today,
    },
    activityTrend: data.activity_trend.map((row) => ({
      date: row.date,
      label: row.label,
      requests: row.requests,
      completedResults: row.completed_results,
    })),
    requestStatus: data.request_status,
    sampleStatus: data.sample_status,
    resultStatus: data.result_status,
    attention: {
      overdueSamples: data.attention.overdue_samples.map((sample) => ({
        id: sample.id,
        sampleNumber: sample.sample_number,
        barcode: sample.barcode,
        status: sample.status,
        requestNumber: sample.request_number,
        patient: sample.patient,
        waitingHours: sample.waiting_hours,
      })),
      criticalResults: data.attention.critical_results.map((result) => ({
        id: result.id,
        resultNumber: result.result_number,
        sampleNumber: result.sample_number,
        patient: result.patient,
        test: result.test,
        value: result.value,
        unit: result.unit,
        workflowStatus: result.workflow_status,
        createdAt: result.created_at,
      })),
    },
    inventory: {
      lowStockItems: data.inventory.low_stock_items,
      expiredLots: data.inventory.expired_lots,
      expiringSoonLots: data.inventory.expiring_soon_lots,
      items: data.inventory.items.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        stock: Number(item.stock),
        minimum: Number(item.minimum),
        nearestExpiry: item.nearest_expiry,
      })),
    },
    recentRequests: data.recent_requests.map((request) => ({
      id: request.id,
      requestNumber: request.request_number,
      patient: request.patient,
      patientNumber: request.patient_number,
      testsCount: request.tests_count,
      status: request.status,
      createdAt: request.created_at,
    })),
    topTests: data.top_tests.map((test) => ({
      testId: test.test_id,
      testName: test.test_name,
      count: test.count,
    })),
  };
}

export async function getOperationalDashboard(days: DashboardPeriod): Promise<DashboardData> {
  const data = await apiRequest<BackendDashboard>("/dashboard", { params: { days } });

  return adaptDashboard(data);
}

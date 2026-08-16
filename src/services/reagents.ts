import { apiRequest } from "@/lib/api-client";
import type { BackendReagent, Pagination } from "@/lib/api-types";

export interface ReagentLotRecord {
  id: string;
  lotNumber: string;
  initialQuantity: number;
  remainingQuantity: number;
  expiryDate: string;
  receivedAt: string;
  unitPrice: number;
  status: "available" | "depleted" | "expired";
}

export interface StockMovementRecord {
  id: string;
  type: "in" | "out";
  quantity: number;
  reason: string | null;
  reference: string | null;
  lotNumber: string | null;
  sampleId: string | null;
  date: string;
}

export interface ReagentRecord {
  id: string;
  code: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  isLowStock: boolean;
  nearestExpiryDate: string | null;
  unitPrice: number;
  tests: { id: string; name: string; quantityUsed: number }[];
  lots: ReagentLotRecord[];
  movements: StockMovementRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface ReagentListParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export interface PaginatedReagents {
  rows: ReagentRecord[];
  pagination: Pagination;
}

export interface ReagentTestUsageInput {
  testId: string;
  quantityUsed: number;
}

export interface CreateReagentInput {
  code: string;
  name: string;
  category: string;
  initialQuantity: number;
  minStock: number;
  lotNumber: string;
  expiryDate: string;
  receivedAt: string;
  unitPrice: number;
  tests: ReagentTestUsageInput[];
}

export interface UpdateReagentRulesInput {
  reagentId: string;
  reason: string;
  tests: ReagentTestUsageInput[];
}

export type StockAdjustmentInput =
  | {
      reagentId: string;
      type: "add";
      quantity: number;
      reason: string;
      lotNumber: string;
      expiryDate: string;
      receivedAt: string;
      unitPrice?: number;
    }
  | {
      reagentId: string;
      type: "consume";
      quantity: number;
      reason: string;
      reference?: string;
    };

function adaptReagent(reagent: BackendReagent): ReagentRecord {
  return {
    id: reagent.id,
    code: reagent.code,
    name: reagent.name,
    category: reagent.category ?? "",
    stock: Number(reagent.stock_qty),
    minStock: Number(reagent.min_stock),
    isLowStock: reagent.is_low_stock,
    nearestExpiryDate: reagent.nearest_expiry_date,
    unitPrice: Number(reagent.unit_price),
    tests: (reagent.tests ?? []).map((test) => ({
      id: test.id,
      name: test.name,
      quantityUsed: Number(test.quantity_used),
    })),
    lots: (reagent.lots ?? []).map((lot) => ({
      id: lot.id,
      lotNumber: lot.lot_number,
      initialQuantity: Number(lot.initial_quantity),
      remainingQuantity: Number(lot.remaining_quantity),
      expiryDate: lot.expiry_date,
      receivedAt: lot.received_at,
      unitPrice: Number(lot.unit_price),
      status: lot.status,
    })),
    movements: (reagent.movements ?? []).map((movement) => ({
      id: movement.id,
      type: movement.type,
      quantity: Number(movement.quantity),
      reason: movement.reason,
      reference: movement.reference,
      lotNumber: movement.lot_number,
      sampleId: movement.sample_id,
      date: movement.date,
    })),
    createdAt: reagent.created_at,
    updatedAt: reagent.updated_at,
  };
}

export async function listReagents(params: ReagentListParams = {}): Promise<PaginatedReagents> {
  const payload = await apiRequest<{ reagents: BackendReagent[]; pagination: Pagination }>(
    "/user/reagents",
    {
      params: {
        page: params.page ?? 1,
        per_page: params.perPage ?? 10,
        search: params.search,
      },
    },
  );

  return { rows: payload.reagents.map(adaptReagent), pagination: payload.pagination };
}

export async function getReagent(id: string): Promise<ReagentRecord> {
  return adaptReagent(await apiRequest<BackendReagent>(`/user/reagents/${id}`));
}

export async function createReagent(input: CreateReagentInput): Promise<ReagentRecord> {
  return adaptReagent(
    await apiRequest<BackendReagent>("/user/reagents", {
      method: "POST",
      body: JSON.stringify({
        code: input.code,
        name: input.name,
        category: input.category || null,
        initial_quantity: input.initialQuantity,
        min_stock: input.minStock,
        lot_number: input.lotNumber,
        expiry_date: input.expiryDate,
        received_at: input.receivedAt,
        unit_price: input.unitPrice,
        tests: input.tests.map((test) => ({
          test_id: test.testId,
          quantity_used: test.quantityUsed,
        })),
      }),
    }),
  );
}

export async function adjustReagentStock(input: StockAdjustmentInput): Promise<ReagentRecord> {
  const { reagentId, ...payload } = input;
  return adaptReagent(
    await apiRequest<BackendReagent>(`/user/reagents/${reagentId}/stock`, {
      method: "PATCH",
      body: JSON.stringify(
        input.type === "add"
          ? {
              type: payload.type,
              quantity: payload.quantity,
              reason: payload.reason,
              lot_number: input.lotNumber,
              expiry_date: input.expiryDate,
              received_at: input.receivedAt,
              unit_price: input.unitPrice,
            }
          : payload,
      ),
    }),
  );
}

export async function updateReagentRules(input: UpdateReagentRulesInput): Promise<ReagentRecord> {
  return adaptReagent(
    await apiRequest<BackendReagent>(`/user/reagents/${input.reagentId}`, {
      method: "PUT",
      body: JSON.stringify({
        reason: input.reason,
        tests: input.tests.map((test) => ({
          test_id: test.testId,
          quantity_used: test.quantityUsed,
        })),
      }),
    }),
  );
}

export async function deleteReagent(id: string): Promise<void> {
  await apiRequest<Record<string, never>>(`/user/reagents/${id}`, { method: "DELETE" });
}

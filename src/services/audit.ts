import { apiRequest, downloadFromApi } from "@/lib/api-client";
import type { Pagination } from "@/lib/api-types";

export type AuditResult = "SUCCESS" | "DENIED";
export type AuditIntegrity = "VERIFIED" | "LEGACY" | "FAILED";

interface BackendAuditLog {
  id: string;
  actor: { id: string; name: string; role: string };
  entity: { type: string; id: string };
  action: string;
  result: AuditResult;
  reason: string | null;
  changes: {
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
  };
  request: {
    id: string | null;
    method: string | null;
    path: string | null;
    ip_address: string | null;
    user_agent: string | null;
  };
  metadata: Record<string, unknown> | null;
  integrity: { status: AuditIntegrity; hash: string | null };
  occurred_at: string;
}

interface BackendAuditResponse {
  items: BackendAuditLog[];
  pagination: Pagination;
  summary: { total: number; success: number; denied: number; today: number };
  filter_options: {
    actions: string[];
    entity_types: string[];
    actor_roles: string[];
    results: AuditResult[];
  };
}

export interface AuditFieldChange {
  field: string;
  before: unknown;
  after: unknown;
}

export interface AuditRecord {
  id: string;
  actor: { id: string; name: string; role: string };
  entity: { type: string; id: string };
  action: string;
  result: AuditResult;
  reason: string | null;
  changes: AuditFieldChange[];
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  request: {
    id: string | null;
    method: string | null;
    path: string | null;
    ipAddress: string | null;
    userAgent: string | null;
  };
  metadata: Record<string, unknown> | null;
  integrity: { status: AuditIntegrity; hash: string | null };
  occurredAt: string;
}

export interface AuditFilters {
  page?: number;
  perPage?: number;
  search?: string;
  actorRole?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  result?: AuditResult;
  from?: string;
  to?: string;
}

export interface AuditListResult {
  rows: AuditRecord[];
  pagination: Pagination;
  summary: BackendAuditResponse["summary"];
  options: {
    actions: string[];
    entityTypes: string[];
    actorRoles: string[];
    results: AuditResult[];
  };
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function toChanges(log: BackendAuditLog): AuditFieldChange[] {
  const before = log.changes.before ?? {};
  const after = log.changes.after ?? {};

  return Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
    .filter((field) => !valuesEqual(before[field], after[field]))
    .sort()
    .map((field) => ({ field, before: before[field], after: after[field] }));
}

function mapAudit(log: BackendAuditLog): AuditRecord {
  return {
    id: log.id,
    actor: log.actor,
    entity: log.entity,
    action: log.action,
    result: log.result,
    reason: log.reason,
    changes: toChanges(log),
    before: log.changes.before,
    after: log.changes.after,
    request: {
      id: log.request.id,
      method: log.request.method,
      path: log.request.path,
      ipAddress: log.request.ip_address,
      userAgent: log.request.user_agent,
    },
    metadata: log.metadata,
    integrity: log.integrity,
    occurredAt: log.occurred_at,
  };
}

function queryParams(filters: AuditFilters): Record<string, string | number | undefined> {
  return {
    page: filters.page,
    per_page: filters.perPage,
    search: filters.search,
    actor_role: filters.actorRole,
    action: filters.action,
    entity_type: filters.entityType,
    entity_id: filters.entityId,
    result: filters.result,
    from: filters.from,
    to: filters.to,
  };
}

export async function listAuditLogs(filters: AuditFilters): Promise<AuditListResult> {
  const response = await apiRequest<BackendAuditResponse>("/user/audit-logs", {
    params: queryParams(filters),
  });

  return {
    rows: response.items.map(mapAudit),
    pagination: response.pagination,
    summary: response.summary,
    options: {
      actions: response.filter_options.actions,
      entityTypes: response.filter_options.entity_types,
      actorRoles: response.filter_options.actor_roles,
      results: response.filter_options.results,
    },
  };
}

export async function exportAuditLogs(filters: AuditFilters): Promise<void> {
  const params = new URLSearchParams();
  Object.entries(queryParams(filters)).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  params.delete("page");
  params.delete("per_page");

  await downloadFromApi(
    `/user/audit-logs/export?${params.toString()}`,
    `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}

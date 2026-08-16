import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/form-shell";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Boxes, Eye, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAdjustReagentStock,
  useDeleteReagent,
  useReagent,
  useReagents,
  useUpdateReagentRules,
} from "@/hooks/use-reagents";
import { useTestCatalog } from "@/hooks/use-tests";
import type { ReagentRecord } from "@/services/reagents";
import { ApiError, ValidationError } from "@/lib/api-client";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/inventory/")({ component: InventoryPage });

const today = new Date().toISOString().slice(0, 10);

function message(error: Error): string {
  if (error instanceof ValidationError) {
    return Object.values(error.errors)[0]?.[0] ?? error.message;
  }
  return error instanceof ApiError ? error.message : "The operation could not be completed.";
}

function InventoryPage() {
  const currentUser = useStore((state) => state.currentUser);
  const canManage = currentUser?.role === "admin";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [stockOpen, setStockOpen] = useState<ReagentRecord | null>(null);
  const [stockType, setStockType] = useState<"add" | "consume">("add");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [receivedAt, setReceivedAt] = useState(today);
  const [unitPrice, setUnitPrice] = useState(0);
  const [rulesReagent, setRulesReagent] = useState<ReagentRecord | null>(null);
  const [rules, setRules] = useState<Record<string, number>>({});
  const [rulesReason, setRulesReason] = useState("");
  const { data, isLoading, isFetching } = useReagents({ page, perPage: 10, search });
  const { data: details } = useReagent(selectedId);
  const { data: tests = [] } = useTestCatalog();
  const adjustStock = useAdjustReagentStock();
  const updateRules = useUpdateReagentRules();
  const remove = useDeleteReagent();

  const rows = data?.rows ?? [];
  const lowStock = rows.filter((reagent) => reagent.isLowStock).length;
  const expiringSoon = rows.filter((reagent) => {
    if (!reagent.nearestExpiryDate) return false;
    const days = (new Date(reagent.nearestExpiryDate).getTime() - Date.now()) / 86_400_000;
    return days >= 0 && days <= 30;
  }).length;

  function openStock(reagent: ReagentRecord) {
    setStockOpen(reagent);
    setStockType("add");
    setQuantity(0);
    setReason("");
    setReference("");
    setLotNumber("");
    setExpiryDate("");
    setReceivedAt(today);
    setUnitPrice(reagent.unitPrice);
  }

  function submitStock() {
    if (!stockOpen || quantity <= 0 || reason.trim().length < 3) {
      return toast.error("A positive quantity and reason are required");
    }
    if (stockType === "add" && (!lotNumber.trim() || !expiryDate || !receivedAt)) {
      return toast.error("Lot number, received date, and expiry date are required");
    }

    const input =
      stockType === "add"
        ? {
            reagentId: stockOpen.id,
            type: "add" as const,
            quantity,
            reason: reason.trim(),
            lotNumber: lotNumber.trim(),
            expiryDate,
            receivedAt,
            unitPrice,
          }
        : {
            reagentId: stockOpen.id,
            type: "consume" as const,
            quantity,
            reason: reason.trim(),
            reference: reference.trim() || undefined,
          };

    adjustStock.mutate(input, {
      onSuccess: () => {
        toast.success(stockType === "add" ? "Reagent lot received" : "Stock removed using FEFO");
        setStockOpen(null);
      },
      onError: (error) => toast.error(message(error)),
    });
  }

  function deleteCurrent(reagent: ReagentRecord) {
    if (!window.confirm(`Delete ${reagent.name}?`)) return;
    remove.mutate(reagent.id, {
      onSuccess: () => toast.success("Reagent deleted"),
      onError: (error) => toast.error(message(error)),
    });
  }

  function openRules(reagent: ReagentRecord) {
    setRulesReagent(reagent);
    setRules(Object.fromEntries(reagent.tests.map((test) => [test.id, test.quantityUsed])));
    setRulesReason("");
    setSelectedId(undefined);
  }

  function saveRules() {
    if (!rulesReagent || rulesReason.trim().length < 3) {
      return toast.error("A reason for changing consumption rules is required");
    }
    if (Object.keys(rules).length === 0 || Object.values(rules).some((value) => value <= 0)) {
      return toast.error("Select at least one test and use positive quantities");
    }

    updateRules.mutate(
      {
        reagentId: rulesReagent.id,
        reason: rulesReason.trim(),
        tests: Object.entries(rules).map(([testId, quantityUsed]) => ({
          testId,
          quantityUsed,
        })),
      },
      {
        onSuccess: () => {
          toast.success("Consumption rules updated");
          setRulesReagent(null);
        },
        onError: (error) => toast.error(message(error)),
      },
    );
  }

  const columns: Column<ReagentRecord>[] = [
    {
      key: "code",
      header: "Code",
      cell: (row) => <span className="font-mono text-xs">{row.code}</span>,
    },
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-xs text-muted-foreground">{row.category || "—"}</div>
        </div>
      ),
    },
    {
      key: "stock",
      header: "Available",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className={row.isLowStock ? "text-destructive font-semibold" : "font-medium"}>
            {row.stock}
          </span>
          {row.isLowStock && <AlertTriangle className="w-4 h-4 text-destructive" />}
        </div>
      ),
    },
    { key: "min", header: "Minimum", cell: (row) => row.minStock },
    {
      key: "expiry",
      header: "Nearest Expiry",
      cell: (row) => row.nearestExpiryDate ?? "No available lot",
    },
    {
      key: "rules",
      header: "Test Rules",
      cell: (row) => row.tests.length,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => openStock(row)}>
            Adjust Stock
          </Button>
          <Button size="sm" variant="ghost" title="View lots" onClick={() => setSelectedId(row.id)}>
            <Eye className="w-4 h-4" />
          </Button>
          {canManage && (
            <Button
              size="sm"
              variant="ghost"
              title="Delete"
              className="text-destructive"
              onClick={() => deleteCurrent(row)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title="Reagent Inventory"
      breadcrumbs={[{ label: "Operations" }, { label: "Inventory" }]}
      actions={
        canManage ? (
          <Link to="/inventory/reagents/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Reagent
            </Button>
          </Link>
        ) : undefined
      }
    >
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Summary
          label="Items on this page"
          value={rows.length}
          icon={<Boxes className="w-5 h-5" />}
        />
        <Summary label="Low stock on this page" value={lowStock} danger />
        <Summary label="Expiring within 30 days" value={expiringSoon} />
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        emptyTitle={isLoading ? "Loading inventory..." : "No reagents found"}
        serverState={{
          search,
          onSearchChange: setSearch,
          page,
          totalPages: data?.pagination.last_page ?? 1,
          total: data?.pagination.total ?? 0,
          onPageChange: setPage,
          isFetching,
        }}
      />

      <Dialog open={Boolean(stockOpen)} onOpenChange={(open) => !open && setStockOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock — {stockOpen?.name}</DialogTitle>
            <DialogDescription>
              Available non-expired stock: {stockOpen?.stock ?? 0}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Operation" required>
              <Select
                value={stockType}
                onValueChange={(value) => setStockType(value as "add" | "consume")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Receive New Lot</SelectItem>
                  <SelectItem value="consume">Manual Removal</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Quantity" required>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </Field>
            {stockType === "add" ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Lot Number" required>
                  <Input value={lotNumber} onChange={(event) => setLotNumber(event.target.value)} />
                </Field>
                <Field label="Unit Price">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitPrice}
                    onChange={(event) => setUnitPrice(Number(event.target.value))}
                  />
                </Field>
                <Field label="Received Date" required>
                  <Input
                    type="date"
                    max={today}
                    value={receivedAt}
                    onChange={(event) => setReceivedAt(event.target.value)}
                  />
                </Field>
                <Field label="Expiry Date" required>
                  <Input
                    type="date"
                    min={today}
                    value={expiryDate}
                    onChange={(event) => setExpiryDate(event.target.value)}
                  />
                </Field>
              </div>
            ) : (
              <Field label="Reference">
                <Input
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="Optional document or incident number"
                />
              </Field>
            )}
            <Field label="Reason" required>
              <Input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={
                  stockType === "add"
                    ? "New shipment received"
                    : "Damage, calibration, or correction"
                }
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockOpen(null)}>
              Cancel
            </Button>
            <Button onClick={submitStock} disabled={adjustStock.isPending}>
              {adjustStock.isPending ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(undefined)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{details?.name ?? "Reagent Details"}</DialogTitle>
            <DialogDescription>
              Lots, test usage rules, and recent stock movements.
            </DialogDescription>
          </DialogHeader>
          {details && (
            <div className="space-y-5">
              <section>
                <h3 className="font-semibold mb-2">Lots</h3>
                <div className="space-y-2">
                  {details.lots.map((lot) => (
                    <div
                      key={lot.id}
                      className="border rounded p-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm"
                    >
                      <span className="font-mono">{lot.lotNumber}</span>
                      <span>
                        {lot.remainingQuantity} / {lot.initialQuantity}
                      </span>
                      <span>Exp: {lot.expiryDate}</span>
                      <span>Received: {lot.receivedAt}</span>
                      <Badge variant={lot.status === "expired" ? "destructive" : "outline"}>
                        {lot.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Consumption Rules</h3>
                  {canManage && (
                    <Button size="sm" variant="outline" onClick={() => openRules(details)}>
                      Edit Rules
                    </Button>
                  )}
                </div>
                {details.tests.length ? (
                  <ul className="space-y-1 text-sm">
                    {details.tests.map((test) => (
                      <li key={test.id}>
                        {test.name}: <strong>{test.quantityUsed}</strong> per ordered test
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-destructive">No test rule configured.</p>
                )}
              </section>
              <section>
                <h3 className="font-semibold mb-2">Recent Movements</h3>
                {details.movements.length ? (
                  <div className="space-y-2">
                    {details.movements.map((movement) => (
                      <div
                        key={movement.id}
                        className="border rounded p-3 text-sm flex flex-wrap justify-between gap-2"
                      >
                        <span
                          className={movement.type === "out" ? "text-destructive" : "text-success"}
                        >
                          {movement.type === "out" ? "−" : "+"}
                          {movement.quantity}
                        </span>
                        <span>{movement.lotNumber ?? "—"}</span>
                        <span>{movement.reason ?? "—"}</span>
                        <span>{new Date(movement.date).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No movements recorded.</p>
                )}
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={canManage && Boolean(rulesReagent)}
        onOpenChange={(open) => !open && setRulesReagent(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Consumption Rules — {rulesReagent?.name}</DialogTitle>
            <DialogDescription>
              Choose every test that consumes this reagent and enter the amount used for one ordered
              test.
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-2">
            {tests.map((test) => {
              const checked = rules[test.id] !== undefined;
              return (
                <div key={test.id} className="flex items-center gap-3 p-3 border rounded">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => {
                      const next = { ...rules };
                      if (value) next[test.id] = 1;
                      else delete next[test.id];
                      setRules(next);
                    }}
                  />
                  <span className="text-sm flex-1">{test.name}</span>
                  {checked && (
                    <Input
                      className="w-24"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={rules[test.id]}
                      onChange={(event) =>
                        setRules({ ...rules, [test.id]: Number(event.target.value) })
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
          <Field label="Reason for Change" required>
            <Input
              value={rulesReason}
              onChange={(event) => setRulesReason(event.target.value)}
              placeholder="e.g. Updated manufacturer protocol"
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRulesReagent(null)}>
              Cancel
            </Button>
            <Button onClick={saveRules} disabled={updateRules.isPending}>
              {updateRules.isPending ? "Saving..." : "Save Rules"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Summary({
  label,
  value,
  danger,
  icon,
}: {
  label: string;
  value: number;
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold ${danger ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}

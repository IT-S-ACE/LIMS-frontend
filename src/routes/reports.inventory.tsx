import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo, useState } from "react";
import { Printer, Download } from "lucide-react";

export const Route = createFileRoute("/reports/inventory")({ component: InventoryReports });

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function InventoryReports() {
  const reagents = useStore((s) => s.reagents);
  const movements = useStore((s) => s.stockMovements);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(
    () =>
      reagents.filter(
        (r) =>
          !search ||
          [r.name, r.code, r.category].some((v) => v.toLowerCase().includes(search.toLowerCase())),
      ),
    [reagents, search],
  );
  const lowStock = filtered.filter((r) => r.stock <= r.minStock);
  const expiring = filtered
    .map((r) => ({ ...r, dtl: daysUntil(r.expiryDate) }))
    .filter((r) => r.dtl <= 90)
    .sort((a, b) => a.dtl - b.dtl);

  const filteredMovements = movements.filter((m) => {
    if (search) {
      const r = reagents.find((x) => x.id === m.reagentId);
      const hay = `${r?.name ?? ""} ${r?.code ?? ""} ${m.reason} ${m.type}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    if (from && new Date(m.createdAt) < new Date(from)) return false;
    if (to) {
      const t = new Date(to);
      t.setHours(23, 59, 59, 999);
      if (new Date(m.createdAt) > t) return false;
    }
    return true;
  });

  const totalValue = filtered.reduce((s, r) => s + r.stock * r.costPerUnit, 0);

  return (
    <AppShell
      title="Inventory Reports"
      breadcrumbs={[{ label: "Reports" }, { label: "Inventory" }]}
      actions={
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Items</div>
            <div className="text-2xl font-bold">{filtered.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Low Stock</div>
            <div className="text-2xl font-bold text-amber-600">{lowStock.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Expiring ≤90d</div>
            <div className="text-2xl font-bold text-destructive">{expiring.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Inventory Value</div>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-3 print:hidden">
        <Field label="Search">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, code, category..."
          />
        </Field>
        <Field label="From (movements)">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="To (movements)">
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </div>

      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Current Inventory</TabsTrigger>
          <TabsTrigger value="low">Low Stock</TabsTrigger>
          <TabsTrigger value="expiry">Expiry</TabsTrigger>
          <TabsTrigger value="movement">Stock Movement</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle>Current Inventory ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.code}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="text-xs">{r.category}</TableCell>
                      <TableCell className="text-right">{r.stock}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {r.minStock}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(r.stock * r.costPerUnit).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.stock <= r.minStock ? "low-stock" : "in-stock"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock ({lowStock.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                    <TableHead className="text-right">Reorder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.code}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="text-right text-destructive font-medium">
                        {r.stock}
                      </TableCell>
                      <TableCell className="text-right">{r.minStock}</TableCell>
                      <TableCell className="text-right">
                        {Math.max(0, r.minStock * 2 - r.stock)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {lowStock.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No items below minimum
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiry">
          <Card>
            <CardHeader>
              <CardTitle>Expiring Soon ({expiring.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-right">Days Left</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiring.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.code}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{new Date(r.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${r.dtl <= 30 ? "text-destructive" : "text-amber-600"}`}
                      >
                        {r.dtl}
                      </TableCell>
                      <TableCell className="text-right">{r.stock}</TableCell>
                    </TableRow>
                  ))}
                  {expiring.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nothing expiring in the next 90 days
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movement">
          <Card>
            <CardHeader>
              <CardTitle>Stock Movements ({filteredMovements.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reagent</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((m) => {
                    const r = reagents.find((x) => x.id === m.reagentId);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs">
                          {new Date(m.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{r?.name ?? m.reagentId}</TableCell>
                        <TableCell>
                          <StatusBadge status={m.type} />
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${m.type === "out" || m.type === "expired" ? "text-destructive" : ""}`}
                        >
                          {m.type === "out" || m.type === "expired" ? "-" : "+"}
                          {m.quantity}
                        </TableCell>
                        <TableCell className="text-sm">{m.reason}</TableCell>
                        <TableCell className="font-mono text-xs">{m.reference ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredMovements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No movements in range
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

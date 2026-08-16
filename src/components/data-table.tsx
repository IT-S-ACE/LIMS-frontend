import { useState, useMemo, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "./app-shell";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
}

export interface ServerTableState {
  search: string;
  onSearchChange: (value: string) => void;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  searchKeys,
  pageSize = 10,
  filters,
  onExport,
  emptyTitle = "No records found",
  emptyDescription,
  rowAction,
  serverState,
  hideExport = false,
}: {
  rows: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T | ((row: T) => string))[];
  pageSize?: number;
  filters?: ReactNode;
  onExport?: (rows: T[]) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  rowAction?: (row: T) => void;
  serverState?: ServerTableState;
  hideExport?: boolean;
}) {
  const [localQuery, setLocalQuery] = useState("");
  const [localPage, setLocalPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const q = serverState?.search ?? localQuery;
  const page = serverState?.page ?? localPage;

  const filtered = useMemo(() => {
    if (serverState) return rows;
    if (!q.trim()) return rows;
    const ql = q.toLowerCase();
    return rows.filter((r) => {
      if (searchKeys) {
        return searchKeys.some((k) => {
          const v = typeof k === "function" ? k(r) : (r as Record<string, unknown>)[k as string];
          return String(v ?? "")
            .toLowerCase()
            .includes(ql);
        });
      }
      return JSON.stringify(r).toLowerCase().includes(ql);
    });
  }, [rows, q, searchKeys, serverState]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const arr = [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = serverState?.totalPages ?? Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = serverState ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);

  function changePage(nextPage: number) {
    if (serverState) serverState.onPageChange(nextPage);
    else setLocalPage(nextPage);
  }

  function exportCsv() {
    if (onExport) return onExport(sorted);
    const headers = columns.map((c) => c.header).join(",");
    const body = sorted
      .map((r) =>
        columns
          .map((c) => {
            const v = c.sortValue ? c.sortValue(r) : "";
            return `"${String(v).replace(/"/g, '""')}"`;
          })
          .join(","),
      )
      .join("\n");
    const blob = new Blob([headers + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    a.click();
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border flex flex-wrap items-center gap-3 justify-between">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9"
            value={q}
            onChange={(e) => {
              if (serverState) {
                serverState.onSearchChange(e.target.value);
                serverState.onPageChange(1);
              } else {
                setLocalQuery(e.target.value);
                setLocalPage(1);
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          {filters}
          {!hideExport && (
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          )}
        </div>
      </div>

      {pageRows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                {columns.map((c) => (
                  <TableHead
                    key={c.key}
                    className={c.className}
                    onClick={() => {
                      if (!c.sortValue) return;
                      if (sortKey === c.key) setSortDir(sortDir === "asc" ? "desc" : "asc");
                      else {
                        setSortKey(c.key);
                        setSortDir("asc");
                      }
                    }}
                    style={{ cursor: c.sortValue ? "pointer" : undefined }}
                  >
                    {c.header}
                    {sortKey === c.key && (sortDir === "asc" ? " ▲" : " ▼")}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((row) => (
                <TableRow
                  key={row.id}
                  className={rowAction ? "cursor-pointer hover:bg-muted/40" : undefined}
                  onClick={rowAction ? () => rowAction(row) : undefined}
                >
                  {columns.map((c) => (
                    <TableCell key={c.key} className={c.className}>
                      {c.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="p-3 border-t border-border flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          Showing {pageRows.length} of {serverState?.total ?? sorted.length}{" "}
          {(serverState?.total ?? sorted.length) === 1 ? "record" : "records"}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || serverState?.isFetching}
            onClick={() => changePage(page - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages || serverState?.isFetching}
            onClick={() => changePage(page + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

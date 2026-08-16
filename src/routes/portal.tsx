import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatusBadge, EmptyState } from "@/components/app-shell";
import { useStore, TEST_CATALOG } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileText, Stethoscope } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal")({ component: PortalPage });

function PortalPage() {
  const user = useStore((s) => s.currentUser);
  const allPatients = useStore((s) => s.patients);
  const allRequests = useStore((s) => s.requests);
  const allResults = useStore((s) => s.results);
  const patient = allPatients.find((p) => p.email === user?.email);
  const requests = patient ? allRequests.filter((r) => r.patientId === patient.id) : [];
  const results = patient
    ? allResults.filter((r) => r.patientId === patient.id && r.status === "approved")
    : [];

  if (!patient)
    return (
      <AppShell title="Patient Portal">
        <EmptyState
          icon={Stethoscope}
          title="No patient record"
          description="Your account is not linked to a patient record yet."
        />
      </AppShell>
    );

  return (
    <AppShell title={`Welcome, ${patient.fullName}`} breadcrumbs={[{ label: "My Portal" }]}>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Total Tests</div>
            <div className="text-3xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Approved Results</div>
            <div className="text-3xl font-bold">{results.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Outstanding Balance</div>
            <div
              className={`text-3xl font-bold ${patient.balance > 0 ? "text-destructive" : "text-success"}`}
            >
              ${patient.balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>My Test Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {results.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No results yet"
              description="Your approved lab results will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Flag</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => {
                  const t = TEST_CATALOG.find((x) => x.code === r.testCode);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{t?.name}</div>
                        <div className="text-xs text-muted-foreground">{r.testCode}</div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {r.value} {r.unit}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.refRange}</TableCell>
                      <TableCell>
                        <StatusBadge status={r.flag ?? "normal"} />
                      </TableCell>
                      <TableCell>
                        {r.approvedAt ? new Date(r.approvedAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <Link to="/reports/$id" params={{ id: r.requestId }}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.success("Opening report...")}
                          >
                            <Download className="w-4 h-4 mr-1" /> PDF
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Test Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{r.tests.join(", ")}</TableCell>
                  <TableCell>${r.subtotal.toFixed(2)}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

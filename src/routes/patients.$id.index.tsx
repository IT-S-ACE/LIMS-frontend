import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Plus, Phone, Mail, CreditCard } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePatient } from "@/hooks/use-patients";

export const Route = createFileRoute("/patients/$id/")({
  component: PatientDetail,
});

function PatientDetail() {
  const { id } = Route.useParams();
  const { data: patient, isLoading } = usePatient(id);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <AppShell title="Loading...">
        <div className="space-y-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!patient) {
    return (
      <AppShell title="Patient not found">
        <div>The requested patient does not exist.</div>
      </AppShell>
    );
  }

  const samples = patient.testRequests.flatMap((r) => r.samples);
  const results = patient.testRequests.flatMap((r) => r.samples.flatMap((s) => s.results));

  return (
    <AppShell
      title={patient.fullName}
      breadcrumbs={[
        { label: "Dashboard", to: "/dashboard" },
        { label: "Patients", to: "/patients" },
        { label: patient.fullName },
      ]}
      actions={
        <>
          <Link to="/patients/$id/edit" params={{ id }}>
            <Button variant="outline">
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </Button>
          </Link>
          <Button
            onClick={() =>
              navigate({ to: "/test-requests/new", search: { patientId: id } as never })
            }
          >
            <Plus className="w-4 h-4 mr-2" /> New Test Request
          </Button>
        </>
      }
    >
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Info
                label="Patient No."
                value={<span className="font-mono">{patient.patientNumber}</span>}
              />
              <Info label="Gender" value={<span className="capitalize">{patient.gender}</span>} />
              <Info label="Date of Birth" value={patient.dob} />
              <Info label="Phone" icon={Phone} value={patient.phone} />
              <Info label="Email" icon={Mail} value={patient.email ?? "—"} />
            </dl>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${patient.balance.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Outstanding balance</div>
              <Button
                className="w-full mt-3"
                variant="outline"
                onClick={() =>
                  navigate({ to: "/finance/payments/new", search: { patientId: id } as never })
                }
              >
                Collect Payment
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Insurance</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.insurance.length > 0 ? (
                <div className="space-y-1">
                  {patient.insurance.map((i) => (
                    <div key={i.id} className="font-medium">
                      {i.name}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No insurance on file</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Test Requests ({patient.testRequests.length})</TabsTrigger>
          <TabsTrigger value="samples">Samples ({samples.length})</TabsTrigger>
          <TabsTrigger value="results">Results ({results.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="requests">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Tests</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patient.testRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No requests yet
                      </TableCell>
                    </TableRow>
                  )}
                  {patient.testRequests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}</TableCell>
                      <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{r.tests.length}</TableCell>
                      <TableCell>${r.totalPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell>
                        <Link to="/test-requests/$id" params={{ id: r.id }}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="samples">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {samples.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No samples
                      </TableCell>
                    </TableRow>
                  )}
                  {samples.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-mono text-xs">{s.qrCode}</TableCell>
                      <TableCell>
                        <StatusBadge status={s.status} />
                      </TableCell>
                      <TableCell>
                        <Link to="/samples/$id" params={{ id: s.id }}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="results">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No results
                      </TableCell>
                    </TableRow>
                  )}
                  {results.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-semibold">{r.value}</TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Info({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: typeof Phone;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

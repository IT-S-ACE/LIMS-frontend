import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMedicalReport } from "@/hooks/use-results";
import { downloadMedicalReport } from "@/services/results";
import { ArrowLeft, Download, FlaskConical, Printer } from "lucide-react";
import Barcode from "react-barcode";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports/$id")({ component: ReportView });

function ReportView() {
  const { id } = Route.useParams();
  const { data: report, isLoading, error } = useMedicalReport(id);

  if (isLoading)
    return (
      <AppShell title="Medical Report">
        <Skeleton className="h-[700px] w-full" />
      </AppShell>
    );
  if (!report) {
    return (
      <AppShell title="Report Unavailable">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p>
              {error?.message ?? "The report is available after every result has been approved."}
            </p>
            <Link to="/results">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Results
              </Button>
            </Link>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Medical Report — ${report.request.requestNumber}`}
      breadcrumbs={[{ label: "Reports", to: "/reports" }, { label: report.request.requestNumber }]}
      actions={
        <div className="print:hidden flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button
            onClick={() =>
              downloadMedicalReport(report.id).catch(() => toast.error("PDF download failed"))
            }
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      }
    >
      <Card className="mx-auto max-w-5xl print:max-w-none print:border-0 print:shadow-none">
        <CardContent className="space-y-6 p-8 print:p-4">
          <header className="flex items-start justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-lg bg-primary">
                <FlaskConical className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">MedLab Diagnostics</div>
                <div className="text-xs text-muted-foreground">
                  Medical Laboratory Management System
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">MEDICAL LABORATORY REPORT</div>
              <div className="mt-1 text-xs text-muted-foreground">Report: {report.id}</div>
              <div className="text-xs text-muted-foreground">
                Generated: {new Date(report.generatedAt).toLocaleString()}
              </div>
              <div className="mt-2 flex justify-end">
                <QRCodeSVG size={72} value={`LIMS:REPORT:${report.id}`} />
              </div>
            </div>
          </header>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-primary">Patient Information</h2>
            <dl className="grid gap-3 text-sm md:grid-cols-3">
              <Info label="Patient" value={report.patient.name} />
              <Info label="Patient Number" value={report.patient.patientNumber} />
              <Info label="Date of Birth" value={report.patient.dob} />
              <Info label="Gender" value={report.patient.gender} />
              <Info label="Phone" value={report.patient.phone} />
              <Info label="Request" value={report.request.requestNumber} />
            </dl>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-primary">Sample Information</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {report.samples.map((sample) => (
                <div key={sample.id} className="rounded border p-3 text-sm">
                  <div className="font-mono font-medium">{sample.sampleNumber}</div>
                  <div className="text-muted-foreground">
                    {sample.sampleType} · Collected{" "}
                    {sample.collectedAt ? new Date(sample.collectedAt).toLocaleString() : "—"}
                  </div>
                  <div className="mt-2 overflow-hidden bg-white">
                    <Barcode
                      value={sample.barcode}
                      format="CODE128"
                      width={1.1}
                      height={35}
                      margin={0}
                      fontSize={10}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-primary">Approved Results</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Flag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div className="font-medium">{result.testName}</div>
                      <div className="text-xs text-muted-foreground">{result.resultNumber}</div>
                    </TableCell>
                    <TableCell className="font-bold">{result.value}</TableCell>
                    <TableCell>{result.unit ?? "—"}</TableCell>
                    <TableCell>{result.referenceRange ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={result.flag} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {report.results.some((result) => result.notes) && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-primary">Clinical Notes</h2>
              <div className="space-y-2">
                {report.results
                  .filter((result) => result.notes)
                  .map((result) => (
                    <div key={result.id} className="rounded bg-muted p-3 text-sm">
                      <strong>{result.testName}:</strong> {result.notes}
                    </div>
                  ))}
              </div>
            </section>
          )}

          <footer className="grid gap-6 border-t pt-4 text-sm md:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">Performed by</div>
              <div className="font-medium">
                {Array.from(
                  new Set(report.results.map((result) => result.enteredBy).filter(Boolean)),
                ).join(", ") || "—"}
              </div>
              <div className="mt-3 text-xs text-muted-foreground">Medically reviewed by</div>
              <div className="font-medium">
                {Array.from(
                  new Set(report.results.map((result) => result.reviewedBy).filter(Boolean)),
                ).join(", ") || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Approved and digitally signed by</div>
              <div className="font-medium">
                {Array.from(
                  new Set(report.results.map((result) => result.approvedBy).filter(Boolean)),
                ).join(", ") || "—"}
              </div>
              <div className="mt-8 w-64 border-b border-foreground/40 font-serif text-lg italic text-primary">
                Electronically signed
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                This report contains only approved, locked results.
              </div>
            </div>
          </footer>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInvoice, usePayment } from "@/hooks/use-finance";

export const Route = createFileRoute("/finance/payments/$id")({ component: PaymentReceipt });

function PaymentReceipt() {
  const { id } = Route.useParams();
  const { data: payment, isLoading } = usePayment(id);
  const { data: invoice } = useInvoice(payment?.invoiceId);

  if (isLoading)
    return (
      <AppShell title="Payment Receipt">
        <Skeleton className="h-80 w-full" />
      </AppShell>
    );
  if (!payment) return <AppShell title="Not found">Payment not found.</AppShell>;

  return (
    <AppShell
      title={`Receipt ${payment.paymentNumber}`}
      breadcrumbs={[
        { label: "Finance" },
        { label: "Payments", to: "/finance/payments" },
        { label: payment.paymentNumber },
      ]}
      actions={
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" /> Print Receipt
        </Button>
      }
    >
      <div className="mx-auto max-w-4xl space-y-5 print:max-w-none">
        <Card>
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle>Payment Receipt</CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(payment.date).toLocaleString()}
              </p>
            </div>
            <StatusBadge status="paid" />
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
            <Info label="Payment Number" value={payment.paymentNumber} mono />
            <Info label="Invoice Number" value={payment.invoiceNumber} mono />
            <Info label="Patient" value={payment.patient.name} />
            <Info label="Patient Number" value={payment.patient.patientNumber} mono />
            <Info label="Test Request" value={payment.requestNumber} mono />
            <Info label="Insurance" value={payment.insuranceCompany?.name ?? "None"} />
            <Info
              label="Method"
              value={payment.method === "cash" ? "Cash" : "Card (manually recorded)"}
            />
            <Info label="Recorded By" value={payment.recordedBy?.name ?? "—"} />
          </CardContent>
        </Card>

        {invoice && (
          <Card>
            <CardHeader>
              <CardTitle>Invoice Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Insurance</TableHead>
                    <TableHead className="text-right">Patient Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.testName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        {item.coveragePercent}% (${item.insuranceAmount.toFixed(2)})
                      </TableCell>
                      <TableCell className="text-right">${item.patientAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t p-4 ml-auto max-w-sm space-y-2 text-sm">
                <Line label="Gross total" value={invoice.grossTotal} />
                <Line label="Insurance coverage" value={-invoice.insuranceAmount} />
                <Line label="Amount paid" value={payment.amount} strong />
                <Line label="Remaining" value={invoice.remaining} />
              </div>
            </CardContent>
          </Card>
        )}

        {payment.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Internal Note</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{payment.notes}</CardContent>
          </Card>
        )}

        <div className="text-center text-xs text-muted-foreground print:mt-8">
          This receipt records an internal payment status change. No external payment gateway was
          used.
        </div>
        <div className="text-center print:hidden">
          <Link
            to="/test-requests/$id"
            params={{ id: payment.testRequestId }}
            className="text-sm text-primary hover:underline"
          >
            Open test request
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-medium ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function Line({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between ${strong ? "border-t pt-2 text-base font-bold" : ""}`}>
      <span>{label}</span>
      <span>
        {value < 0 ? "−" : ""}${Math.abs(value).toFixed(2)}
      </span>
    </div>
  );
}

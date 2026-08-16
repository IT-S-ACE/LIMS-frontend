import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Field, FormShell } from "@/components/form-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useInvoices, useRecordFullPayment } from "@/hooks/use-finance";
import type { PaymentMethod } from "@/services/finance";

interface Search {
  requestId?: string;
}

export const Route = createFileRoute("/finance/payments/new")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    requestId: typeof search.requestId === "string" ? search.requestId : undefined,
  }),
  component: NewPaymentPage,
});

function NewPaymentPage() {
  const { requestId } = Route.useSearch();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const { data, isLoading } = useInvoices({ status: "pending", search: requestId });
  const mutation = useRecordFullPayment();
  const invoices = useMemo(() => data?.rows ?? [], [data?.rows]);

  useEffect(() => {
    if (requestId) {
      const match = invoices.find((invoice) => invoice.testRequestId === requestId);
      if (match) setSelectedId(match.id);
    }
  }, [requestId, invoices]);

  const invoice = useMemo(
    () => invoices.find((row) => row.id === selectedId),
    [invoices, selectedId],
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!invoice) return toast.error("Select an unpaid invoice");

    try {
      const payment = await mutation.mutateAsync({
        testRequestId: invoice.testRequestId,
        method,
        notes,
      });
      toast.success(`Payment ${payment.paymentNumber} recorded successfully`);
      navigate({ to: "/finance/payments/$id", params: { id: payment.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment could not be recorded");
    }
  }

  return (
    <AppShell
      title="Record Full Payment"
      breadcrumbs={[
        { label: "Finance" },
        { label: "Payments", to: "/finance/payments" },
        { label: "New" },
      ]}
    >
      <form onSubmit={submit} className="space-y-6">
        <FormShell title="Invoice">
          <Field label="Unpaid Invoice" required>
            <Select value={selectedId} onValueChange={setSelectedId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select an invoice" />
              </SelectTrigger>
              <SelectContent>
                {invoices.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.invoiceNumber} · {row.patient.name} · ${row.remaining.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FormShell>

        {invoice && (
          <>
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{invoice.invoiceNumber}</CardTitle>
                  <StatusBadge status={invoice.status} />
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-3 text-sm">
                  <Info label="Patient" value={invoice.patient.name} />
                  <Info label="Test Request" value={invoice.requestNumber} />
                  <Info label="Insurance" value={invoice.insuranceCompany?.name ?? "None"} />
                  <Info label="Patient ID" value={invoice.patient.patientNumber} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Amount Due</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Money label="Gross total" value={invoice.grossTotal} />
                  <Money label="Insurance coverage" value={-invoice.insuranceAmount} />
                  <Money label="Full payment" value={invoice.remaining} strong />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Coverage Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead className="text-right">Patient Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.testName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {item.coveragePercent}% (${item.insuranceAmount.toFixed(2)})
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.patientAmount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <FormShell title="Payment Record">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Method" required>
                  <Select
                    value={method}
                    onValueChange={(value) => setMethod(value as PaymentMethod)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card (manual record)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Amount">
                  <Input value={`$${invoice.remaining.toFixed(2)}`} readOnly />
                </Field>
              </div>
              <Field label="Notes" hint="Optional internal note; no card data should be entered.">
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={500}
                />
              </Field>
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm flex gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 text-primary" />
                The server records the invoice's complete outstanding balance. Partial payments and
                overpayments are not accepted.
              </div>
            </FormShell>

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                <CreditCard className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? "Recording..."
                  : `Record $${invoice.remaining.toFixed(2)} Payment`}
              </Button>
            </div>
          </>
        )}
      </form>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Money({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between ${strong ? "border-t pt-2 text-lg font-bold" : ""}`}>
      <span>{label}</span>
      <span>
        {value < 0 ? "−" : ""}${Math.abs(value).toFixed(2)}
      </span>
    </div>
  );
}

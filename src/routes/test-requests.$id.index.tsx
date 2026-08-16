import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, FlaskConical, Pencil, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTestRequest } from "@/hooks/use-test-requests";

export const Route = createFileRoute("/test-requests/$id/")({
  component: RequestDetail,
});

function RequestDetail() {
  const { id } = Route.useParams();
  const { data: request, isLoading } = useTestRequest(id);

  if (isLoading) {
    return (
      <AppShell title="Loading...">
        <Skeleton className="h-64 w-full" />
      </AppShell>
    );
  }

  if (!request) return <AppShell title="Not found">Request not found</AppShell>;

  return (
    <AppShell
      title={`Request ${request.requestNumber}`}
      breadcrumbs={[
        { label: "Dashboard", to: "/dashboard" },
        { label: "Test Requests", to: "/test-requests" },
        { label: request.requestNumber },
      ]}
      actions={
        <>
          <Link to="/samples" search={{ requestId: id }}>
            <Button variant="outline">
              <FlaskConical className="w-4 h-4 mr-2" /> Samples ({request.samples.length})
            </Button>
          </Link>
          {(request.status === "pending" || request.status === "processing") && (
            <Link to="/samples/new" search={{ requestId: id }}>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Register Sample
              </Button>
            </Link>
          )}
          {request.samples.length === 0 && (
            <Link to="/test-requests/$id/edit" params={{ id }}>
              <Button variant="outline">
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </Button>
            </Link>
          )}
          {request.remaining > 0 && (
            <Link to="/finance/payments/new" search={{ requestId: request.id }}>
              <Button variant="outline">
                <CreditCard className="w-4 h-4 mr-2" /> Record Payment
              </Button>
            </Link>
          )}
        </>
      }
    >
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle>Request Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                Created {new Date(request.createdAt).toLocaleString()}
              </p>
            </div>
            <StatusBadge status={request.status} />
          </CardHeader>
          <CardContent>
            <dl className="grid md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Info
                label="Patient"
                value={
                  <Link
                    to="/patients/$id"
                    params={{ id: request.patient.id }}
                    className="text-primary hover:underline"
                  >
                    {request.patient.name}
                  </Link>
                }
              />
              <Info label="Phone" value={request.patient.phone} />
              <Info label="Insurance" value={request.insuranceCompany?.name ?? "—"} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Billing Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Gross Total</span>
              <span className="font-medium">${request.totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-primary">
              <span>Insurance</span>
              <span>−${request.insuranceAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Patient Due</span>
              <span>${request.patientDue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid</span>
              <span>${request.paid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Remaining</span>
              <span className={request.remaining > 0 ? "text-destructive" : "text-success"}>
                ${request.remaining.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span>Payment Status</span>
              <StatusBadge status={request.paymentStatus} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>Reference Range</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.testName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.referenceRange ?? "—"}
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>${item.price.toFixed(2)}</TableCell>
                  <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

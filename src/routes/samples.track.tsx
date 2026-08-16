import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FlaskConical, Search } from "lucide-react";
import { useState } from "react";
import { useTrackSample } from "@/hooks/use-samples";
import { ApiError } from "@/lib/api-client";

export const Route = createFileRoute("/samples/track")({
  component: TrackSample,
});

function TrackSample() {
  const [code, setCode] = useState("");
  const track = useTrackSample();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    track.mutate(code.trim());
  }

  return (
    <AppShell
      title="Track Sample"
      breadcrumbs={[{ label: "Samples", to: "/samples" }, { label: "Track" }]}
    >
      <Card className="max-w-2xl">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Track by Sample ID, barcode, or QR value</h2>
            <p className="text-sm text-muted-foreground">
              Scan the label or enter its value exactly to retrieve the current lifecycle state.
            </p>
          </div>

          <form onSubmit={submit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-10 h-12 text-lg font-mono"
                placeholder="SMP-..., BC-..., or LIMS:SAMPLE:..."
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  track.reset();
                }}
                autoFocus
              />
            </div>
            <Button type="submit" className="h-12" disabled={!code.trim() || track.isPending}>
              {track.isPending ? "Searching..." : "Track"}
            </Button>
          </form>

          {track.isError && (
            <div className="text-center py-8 text-muted-foreground">
              <FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-50" />
              {track.error instanceof ApiError ? track.error.message : "Sample not found."}
            </div>
          )}

          {track.data && (
            <Link
              to="/samples/$id"
              params={{ id: track.data.id }}
              className="block p-4 border border-border rounded-lg hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-sm">
                    {track.data.sampleNumber} · {track.data.barcode}
                  </div>
                  <div className="text-sm font-medium mt-1">
                    {track.data.patient?.name ?? "Unknown patient"} — {track.data.sampleType}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {track.data.tests.map((test) => test.name).join(", ") || "No tests"}
                  </div>
                </div>
                <StatusBadge status={track.data.status} />
              </div>
            </Link>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

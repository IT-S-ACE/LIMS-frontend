import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const reset = useStore((s) => s.resetDemo);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  return (
    <AppShell title="System Settings" breadcrumbs={[{ label: "Settings" }]}>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Laboratory Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Lab Name</label>
              <Input defaultValue="MedLab Diagnostics" />
            </div>
            <div>
              <label className="text-sm font-medium">License Number</label>
              <Input defaultValue="LIC-2024-887" />
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input defaultValue="Riyadh, KSA" />
            </div>
            <Button onClick={() => toast.success("Settings saved")}>Save</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notification Channels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">SMS Notifications</div>
                <div className="text-xs text-muted-foreground">
                  Send result alerts via SMS gateway
                </div>
              </div>
              <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-xs text-muted-foreground">Send result alerts via email</div>
              </div>
              <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>System Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Reset all demo data?")) {
                  reset();
                  toast.success("Demo data reset");
                }
              }}
            >
              Reset Demo Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

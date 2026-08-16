import { createFileRoute } from "@tanstack/react-router";
import { AppShell, EmptyState } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";

export const Route = createFileRoute("/notifications")({ component: NotificationsList });

function NotificationsList() {
  const user = useStore((s) => s.currentUser);
  const notifications = useStore((s) => s.notifications).filter(
    (n) => !n.userId || n.userId === user?.id,
  );
  const markRead = useStore((s) => s.markNotificationRead);

  return (
    <AppShell
      title="Notifications"
      breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Notifications" }]}
    >
      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 flex items-start gap-3 ${!n.read ? "bg-primary/5" : ""}`}
                >
                  <div
                    className={`w-9 h-9 rounded-full grid place-items-center ${!n.read ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{n.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{n.body}</div>
                    <div className="text-xs text-muted-foreground mt-1 uppercase">{n.channel}</div>
                  </div>
                  {!n.read && (
                    <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

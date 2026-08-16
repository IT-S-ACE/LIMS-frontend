import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { FormShell, Field } from "@/components/form-shell";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const user = useStore((s) => s.currentUser);
  const updateProfile = useStore((s) => s.updateProfile);
  const navigate = useNavigate();
  const [form, setForm] = useState(user);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  if (!user || !form) {
    navigate({ to: "/login" });
    return null;
  }

  return (
    <AppShell title="My Profile" breadcrumbs={[{ label: "Profile" }]}>
      <div className="grid lg:grid-cols-2 gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile(form);
            toast.success("Profile updated");
          }}
        >
          <FormShell
            title="Account Information"
            footer={
              <>
                <Button type="button" variant="outline" onClick={() => setForm(user)}>
                  Reset
                </Button>
                <Button type="submit">Save</Button>
              </>
            }
          >
            <Field label="Full Name">
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </Field>
            <Field label="Username">
              <Input value={form.username} disabled />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Role">
              <Input value={form.role} disabled className="capitalize" />
            </Field>
          </FormShell>
        </form>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pw.next !== pw.confirm) return toast.error("Passwords don't match");
            toast.success("Password changed (demo)");
            setPw({ current: "", next: "", confirm: "" });
          }}
        >
          <FormShell
            title="Change Password"
            footer={<Button type="submit">Update Password</Button>}
          >
            <Field label="Current Password">
              <Input
                type="password"
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
              />
            </Field>
            <Field label="New Password">
              <Input
                type="password"
                value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })}
              />
            </Field>
            <Field label="Confirm New Password">
              <Input
                type="password"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              />
            </Field>
          </FormShell>
        </form>
      </div>
    </AppShell>
  );
}

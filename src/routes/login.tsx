import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { FlaskConical, Shield, Users, TestTube2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { ApiError, ValidationError } from "@/lib/api-client";
import { startLogin } from "@/services/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const DEMO_ACCOUNTS = [
  { email: "admin@medlab.test", role: "Admin", icon: Shield, color: "bg-primary/10 text-primary" },
  {
    email: "reception@medlab.test",
    role: "Receptionist",
    icon: Users,
    color: "bg-info/10 text-info",
  },
  {
    email: "technician@medlab.test",
    role: "Lab Technician",
    icon: TestTube2,
    color: "bg-success/10 text-success",
  },
  {
    email: "ahmad.patient@medlab.test",
    role: "Patient",
    icon: Stethoscope,
    color: "bg-warning/10 text-warning-foreground",
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const beginLoginVerification = useStore((s) => s.beginLoginVerification);
  const currentUser = useStore((s) => s.currentUser);
  const otpVerified = useStore((s) => s.otpVerified);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const showDemoAccounts = import.meta.env.DEV;

  useEffect(() => {
    if (currentUser && otpVerified) {
      navigate({ to: currentUser.role === "patient" ? "/portal" : "/dashboard" });
    }
  }, [currentUser, otpVerified, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await startLogin(email, password);
      beginLoginVerification(email);
      toast.success("A verification code has been sent to your email.");
      navigate({ to: "/verify-otp" });
    } catch (error) {
      if (error instanceof ValidationError) {
        toast.error(Object.values(error.errors)[0]?.[0] ?? error.message);
      } else if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function quickLogin(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("password");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex bg-sidebar text-sidebar-foreground p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_30%,white,transparent_50%)]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sidebar-primary grid place-items-center">
              <FlaskConical className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <div className="text-xl font-bold">MedLab LIMS</div>
              <div className="text-sm text-sidebar-foreground/60">Enterprise Edition</div>
            </div>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            The operating system for modern clinical laboratories.
          </h1>
          <p className="text-sidebar-foreground/70 text-lg">
            End-to-end workflow management — from patient intake and sample tracking to result
            approval, insurance claims, and inventory.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-6">
            {[
              { label: "Access", value: "Role-based" },
              { label: "Activity", value: "Auditable" },
              { label: "Workflow", value: "End-to-end" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-base font-bold">{s.value}</div>
                <div className="text-xs text-sidebar-foreground/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} MedLab Systems · Secure workflow · Auditable operations
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-2 justify-center">
            <FlaskConical className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">MedLab LIMS</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Sign in to your workspace</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your credentials to access the laboratory system.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {showDemoAccounts && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted-foreground">
                    Quick demo access
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <Card
                      key={a.email}
                      className="p-3 cursor-pointer hover:border-primary transition-colors"
                      onClick={() => quickLogin(a.email)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-md grid place-items-center ${a.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{a.role}</div>
                          <div className="text-xs text-muted-foreground truncate">{a.email}</div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Password for local demo accounts:{" "}
                <code className="bg-muted px-1 rounded">password</code>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

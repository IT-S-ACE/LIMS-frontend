import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FlaskConical, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { ApiError, ValidationError } from "@/lib/api-client";
import { resendLoginOtp, verifyLoginOtp } from "@/services/auth";

export const Route = createFileRoute("/verify-otp")({
  head: () => ({
    meta: [
      { title: "Two-Factor Verification — MedLab LIMS" },
      {
        name: "description",
        content:
          "Enter the 6-digit verification code sent to your registered device to access the laboratory workspace.",
      },
      { property: "og:title", content: "Two-Factor Verification — MedLab LIMS" },
      {
        property: "og:description",
        content: "Secure OTP verification for MedLab LIMS staff and patient accounts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.currentUser);
  const pendingLoginEmail = useStore((s) => s.pendingLoginEmail);
  const otpVerified = useStore((s) => s.otpVerified);
  const completeLogin = useStore((s) => s.completeLogin);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(60);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && otpVerified) {
      navigate({ to: user.role === "patient" ? "/portal" : "/dashboard" });
    } else if (!pendingLoginEmail) {
      navigate({ to: "/login" });
    }
  }, [user, otpVerified, pendingLoginEmail, navigate]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  function setDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, "");
    if (clean.length > 1) {
      const arr = clean.slice(0, 6).split("");
      const next = ["", "", "", "", "", ""].map((_, idx) => arr[idx] ?? "");
      setDigits(next);
      document.getElementById(`otp-${Math.min(5, arr.length - 1)}`)?.focus();
      return;
    }
    setDigits((d) => d.map((x, idx) => (idx === i ? clean : x)));
    if (clean && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) return toast.error("Enter all 6 digits");
    if (!pendingLoginEmail) return;

    setLoading(true);
    try {
      const authenticatedUser = await verifyLoginOtp(pendingLoginEmail, code);
      completeLogin(authenticatedUser);
      toast.success("Identity verified");
      navigate({
        to: authenticatedUser.role === "patient" ? "/portal" : "/dashboard",
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        toast.error(Object.values(error.errors)[0]?.[0] ?? error.message);
      } else if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Unable to verify the code.");
      }
      setDigits(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function resend(): Promise<void> {
    if (!pendingLoginEmail) return;
    try {
      await resendLoginOtp(pendingLoginEmail);
      setSeconds(60);
      toast.success("A new code has been sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to resend the code.");
    }
  }

  if (!pendingLoginEmail || (user && otpVerified)) return null;

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-2 justify-center">
          <FlaskConical className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">MedLab LIMS</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Two-Factor Verification
            </CardTitle>
            <CardDescription>
              A 6-digit code was sent to {pendingLoginEmail}. Enter it below to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5">
              <div className="flex gap-2 justify-between">
                {digits.map((d, i) => (
                  <Input
                    key={i}
                    id={`otp-${i}`}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus={i === 0}
                    className="h-14 text-center text-xl font-semibold tracking-widest"
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digits[i] && i > 0)
                        document.getElementById(`otp-${i - 1}`)?.focus();
                    }}
                  />
                ))}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                  disabled={seconds > 0}
                  onClick={() => void resend()}
                >
                  {seconds > 0 ? `Resend code in ${seconds}s` : "Resend code"}
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:underline"
                  onClick={() => {
                    useStore.getState().logout();
                    navigate({ to: "/login" });
                  }}
                >
                  Use a different account
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

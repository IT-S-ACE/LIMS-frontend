import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, FlaskConical, KeyRound, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, ValidationError } from "@/lib/api-client";
import {
  completePasswordReset,
  requestPasswordReset,
  verifyPasswordResetOtp,
} from "@/services/auth";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

type Step = "email" | "otp" | "password" | "success";

function errorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return Object.values(error.errors)[0]?.[0] ?? error.message;
  }
  if (error instanceof ApiError) return error.message;
  return "The request could not be completed. Please try again.";
}

function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setStep("otp");
      toast.success("If this account exists, a verification code has been sent.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      toast.error("Enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      await verifyPasswordResetOtp(email.trim(), otp);
      setStep("password");
      toast.success("Code verified.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmation) {
      toast.error("Password confirmation does not match.");
      return;
    }

    setLoading(true);
    try {
      await completePasswordReset(email.trim(), password, confirmation);
      setStep("success");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-2 justify-center">
          <FlaskConical className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">MedLab LIMS</span>
        </div>

        <Card>
          {step === "email" && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-primary" /> Reset your password
                </CardTitle>
                <CardDescription>
                  Enter your account email. For privacy, the response is the same whether the
                  account exists or not.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={sendCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send verification code"}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {step === "otp" && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MailCheck className="w-5 h-5 text-primary" /> Check your inbox
                </CardTitle>
                <CardDescription>
                  If an active account exists for {email}, enter the 6-digit code sent to it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={verifyCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-otp">Verification code</Label>
                    <Input
                      id="reset-otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      autoFocus
                      maxLength={6}
                      pattern="[0-9]{6}"
                      className="text-center text-xl tracking-[0.4em]"
                      value={otp}
                      onChange={(event) =>
                        setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Verifying..." : "Verify code"}
                  </Button>
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => {
                      setOtp("");
                      setStep("email");
                    }}
                  >
                    Use a different email
                  </button>
                </form>
              </CardContent>
            </>
          )}

          {step === "password" && (
            <>
              <CardHeader>
                <CardTitle>Choose a new password</CardTitle>
                <CardDescription>
                  Use at least 8 characters containing both letters and numbers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={resetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      autoFocus
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm new password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Updating..." : "Update password"}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {step === "success" && (
            <CardContent className="pt-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-success/15 grid place-items-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Password updated</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your existing sessions were closed. Sign in again with your new password.
                </p>
              </div>
              <Link to="/login">
                <Button className="w-full">Return to sign in</Button>
              </Link>
            </CardContent>
          )}
        </Card>

        {step !== "success" && (
          <Link
            to="/login"
            className="text-sm text-primary hover:underline flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        )}
      </div>
    </main>
  );
}

import { apiRequest, clearToken, setToken } from "@/lib/api-client";
import type { AuthPayload, BackendUser } from "@/lib/api-types";
import type { Role, User } from "@/lib/types";

const ROLE_MAP: Record<BackendUser["role"], Role> = {
  admin: "admin",
  receptionist: "receptionist",
  lab_technician: "technician",
  patient: "patient",
};

export function adaptUser(user: BackendUser): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.username,
    role: ROLE_MAP[user.role],
    active: user.status === "active",
    createdAt: user.created_at,
  };
}

export async function startLogin(email: string, password: string): Promise<void> {
  await apiRequest<Record<string, never>>("/user/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function verifyLoginOtp(email: string, otp: string): Promise<User> {
  const payload = await apiRequest<AuthPayload>("/user/verifyOTP", {
    method: "POST",
    body: JSON.stringify({ email, otp, type: "login" }),
  });
  setToken(payload.token);
  return adaptUser(payload.user);
}

export async function resendLoginOtp(email: string): Promise<void> {
  await apiRequest<Record<string, never>>("/user/resendOTP", {
    method: "POST",
    body: JSON.stringify({ email, type: "login" }),
  });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest<Record<string, never>>("/user/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyPasswordResetOtp(email: string, otp: string): Promise<void> {
  await apiRequest<Record<string, never>>("/user/verify-reset-password-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}

export async function completePasswordReset(
  email: string,
  password: string,
  passwordConfirmation: string,
): Promise<void> {
  await apiRequest<Record<string, never>>("/user/reset-password", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      password_confirmation: passwordConfirmation,
    }),
  });
}

export async function getProfile(): Promise<User> {
  const user = await apiRequest<BackendUser>("/user/profile");
  return adaptUser(user);
}

export async function logoutFromApi(): Promise<void> {
  try {
    await apiRequest<Record<string, never>>("/user/logout", { method: "POST" });
  } finally {
    clearToken();
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/people";
}

async function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

async function sendPasswordReset(email: string) {
  const supabase = await createClient();
  const origin = await siteUrl();

  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin,
  });
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    redirect(`/login?error=missing_fields&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=invalid_credentials&next=${encodeURIComponent(next)}`);
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 8) {
    redirect("/signup?error=invalid_signup");
  }

  const supabase = await createClient();
  const origin = await siteUrl();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: origin,
    },
  });

  const alreadyRegistered =
    error?.code === "user_already_exists" ||
    error?.message === "User already registered" ||
    (data.user?.identities !== undefined && data.user.identities.length === 0);

  if (alreadyRegistered) {
    await sendPasswordReset(email);
    redirect("/check-email");
  }

  if (error) {
    redirect("/signup?error=signup_failed");
  }

  revalidatePath("/", "layout");

  if (data.session) {
    redirect("/onboarding");
  }

  redirect("/check-email");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/forgot-password?error=missing_email");
  }

  await sendPasswordReset(email);
  redirect("/check-email");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8 || password !== confirmPassword) {
    redirect("/reset-password?error=invalid_password");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/reset-password?error=invalid_session");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/reset-password?error=update_failed");
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?message=password_updated");
}

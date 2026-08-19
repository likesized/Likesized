import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(rawNext: string | null, origin: string) {
  if (!rawNext) return "/onboarding";

  try {
    const nextUrl = new URL(rawNext, origin);
    if (nextUrl.origin !== origin) return "/onboarding";
    return `${nextUrl.pathname}${nextUrl.search}`;
  } catch {
    return "/onboarding";
  }
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const nextPath = safeNextPath(
    request.nextUrl.searchParams.get("next"),
    request.nextUrl.origin,
  );

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, request.url));
    }
  }

  return NextResponse.redirect(new URL("/auth/auth-code-error", request.url));
}

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not available in production", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || "admin";
  const redirectUrl = searchParams.get("redirect") || "/admin";

  const targetUrl = new URL(redirectUrl, request.url);
  const response = NextResponse.redirect(targetUrl);
  response.cookies.set("e2e_test_role", role, { path: "/", httpOnly: true, sameSite: "lax" });
  return response;
}

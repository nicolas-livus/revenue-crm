import { NextResponse } from "next/server";
import { token } from "./lib/auth";
export async function middleware(req) {
  const ok = req.cookies.get("crm_auth")?.value === (await token(process.env.CRM_PASSWORD || ""));
  if (ok || req.nextUrl.pathname === "/login") return NextResponse.next();
  return NextResponse.redirect(new URL("/login", req.url));
}
export const config = { matcher: ["/((?!_next|favicon).*)"] };

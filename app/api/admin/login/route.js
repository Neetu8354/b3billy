import { NextResponse } from "next/server";
import { ADMIN_USER, ADMIN_PASS, newAdminSession } from "@/lib/db";
import { agentLogin } from "@/lib/agents";

export const dynamic = "force-dynamic";

export async function POST(req) {
  let b = {};
  try { b = await req.json(); } catch {}
  const username = String(b.username || "");
  const password = String(b.password || "");

  let token = null;
  let role = null;
  let credsOk = false;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    credsOk = true;
    token = await newAdminSession(null); // main admin
    role = "main";
  } else {
    const agent = await agentLogin(username, password);
    if (agent) {
      credsOk = true;
      token = await newAdminSession(agent.id);
      role = "agent";
    }
  }
  if (!token) {
    if (credsOk) return Response.json({ success: false, error: "Session store unavailable — check server logs" }, { status: 500 });
    return Response.json({ success: false, error: "Invalid credentials" }, { status: 401 });
  }
  const res = NextResponse.json({ success: true, role });
  res.cookies.set("sg_admin", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}

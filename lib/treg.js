"use server";
import { redirect } from "next/navigation";
import { sql } from "./db";

// Busca e-mail pelo endpoint roteado do treg (provedor mais barato primeiro; teto de custo por chamada).
export async function enrichEmail(fd) {
  const id = Number(fd.get("id"));
  const [p] = await sql`select name, linkedin, email from prospects where id=${id}`;
  const domain = p.email?.split("@")[1];
  const body = p.linkedin ? { linkedin_url: p.linkedin.startsWith("http") ? p.linkedin : "https://" + p.linkedin }
    : domain ? { full_name: p.name, domain } : null;
  let msg;
  if (!body) msg = "Precisa de LinkedIn (ou um e-mail com o domínio da empresa)";
  else {
    const r = await fetch("https://treg.to/call/treg.people.email.find", {
      method: "POST",
      headers: { "X-Treg-Token": process.env.TREG_TOKEN, "Content-Type": "application/json", "X-Treg-Route-Max-Cost": "0.30" },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    const email = j?.output?.email || j?.output?.emails?.[0]?.email || j?.output?.emails?.[0];
    const cost = (Number(r.headers.get("x-treg-cost-micro") || 0) / 1e6).toFixed(3);
    if (email && typeof email === "string") {
      await sql`update prospects set email=${email}, updated_at=now() where id=${id}`;
      msg = `E-mail encontrado: ${email} (custo US$ ${cost})`;
    } else msg = `Não encontrado (HTTP ${r.status}, custo US$ ${cost})`;
  }
  redirect(`/prospects/${id}?enr=${encodeURIComponent(msg)}`);
}

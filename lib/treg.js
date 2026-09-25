"use server";
import { redirect } from "next/navigation";
import { sql } from "./db";

// Busca e-mail pelo endpoint roteado do treg (escolhe o provedor mais barato; teto de custo por chamada).
export async function enrichEmail(fd) {
  const id = Number(fd.get("id"));
  const [c] = await sql`select c.name, c.linkedin, a.domain from contacts c left join accounts a on a.id=c.account_id where c.id=${id}`;
  const body = c.linkedin ? { linkedin_url: c.linkedin } : { full_name: c.name, domain: c.domain };
  let msg;
  if (!c.linkedin && !c.domain) msg = "Precisa de LinkedIn ou domínio da empresa";
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
      await sql`update contacts set email=${email}, updated_at=now() where id=${id}`;
      msg = `E-mail encontrado: ${email} (custo US$ ${cost})`;
    } else msg = `Não encontrado (HTTP ${r.status}, custo US$ ${cost})`;
  }
  redirect(`/contatos/${id}?enr=${encodeURIComponent(msg)}`);
}

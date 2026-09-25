"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "./db";

const v = (fd, k) => (fd.get(k) || "").toString().trim() || null;
const normDomain = d => d?.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "") || null;

async function upsertAccount(name, domain, round) {
  domain = normDomain(domain);
  if (domain) {
    const [a] = await sql`insert into accounts (name, domain, round) values (${name}, ${domain}, ${round})
      on conflict (domain) do update set round = coalesce(excluded.round, accounts.round) returning id`;
    return a.id;
  }
  const [ex] = await sql`select id from accounts where lower(name) = lower(${name}) limit 1`;
  if (ex) return ex.id;
  const [a] = await sql`insert into accounts (name, round) values (${name}, ${round}) returning id`;
  return a.id;
}

export async function addContact(fd) {
  const accountId = await upsertAccount(v(fd, "empresa") || "(sem empresa)", v(fd, "dominio"), v(fd, "rodada"));
  await sql`insert into contacts (account_id, name, title, email, phone, linkedin)
    values (${accountId}, ${v(fd, "nome")}, ${v(fd, "cargo")}, ${v(fd, "email")}, ${v(fd, "telefone")}, ${v(fd, "linkedin")})`;
  revalidatePath("/");
}

export async function setStage(fd) {
  await sql`update contacts set stage = ${v(fd, "stage")}, updated_at = now() where id = ${Number(fd.get("id"))}`;
  revalidatePath("/"); revalidatePath(`/contatos/${fd.get("id")}`);
}

export async function updateContact(fd) {
  const id = Number(fd.get("id"));
  await sql`update contacts set name=${v(fd,"nome")}, title=${v(fd,"cargo")}, email=${v(fd,"email")},
    phone=${v(fd,"telefone")}, linkedin=${v(fd,"linkedin")}, notes=${v(fd,"notas")}, updated_at=now() where id=${id}`;
  revalidatePath(`/contatos/${id}`);
}

export async function deleteContact(fd) {
  await sql`delete from contacts where id = ${Number(fd.get("id"))}`;
  redirect("/");
}

export async function addTouch(fd) {
  const id = Number(fd.get("contact_id"));
  const n = Number(fd.get("touch_no")) || null;
  await sql`insert into touches (contact_id, touch_no, channel, message, reply)
    values (${id}, ${n}, ${v(fd, "canal")}, ${v(fd, "mensagem")}, ${v(fd, "resposta")})`;
  // avança estágio automaticamente
  const next = v(fd, "resposta") ? "respondeu" : n === 1 ? "t1_enviado" : "cadencia";
  await sql`update contacts set stage = ${next}, updated_at = now()
    where id = ${id} and stage in ('novo','t1_enviado','cadencia')`;
  revalidatePath(`/contatos/${id}`); revalidatePath("/");
}

export async function setReply(fd) {
  const tid = Number(fd.get("touch_id")), cid = Number(fd.get("contact_id"));
  await sql`update touches set reply = ${v(fd, "resposta")} where id = ${tid}`;
  await sql`update contacts set stage='respondeu', updated_at=now() where id=${cid} and stage in ('novo','t1_enviado','cadencia')`;
  revalidatePath(`/contatos/${cid}`); revalidatePath("/");
}

export async function updateAccount(fd) {
  await sql`update accounts set thesis=${v(fd,"tese")}, radar_notes=${v(fd,"radar")}, status=${v(fd,"status") || "ativa"}
    where id=${Number(fd.get("account_id"))}`;
  revalidatePath(`/contatos/${fd.get("contact_id")}`); revalidatePath("/");
}

function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  const sep = (text.split("\n")[0].match(/;/g) || []).length > (text.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}

export async function importCsv(fd) {
  const [head, ...rows] = parseCsv((fd.get("csv") || "").toString());
  const h = head.map(x => x.trim().toLowerCase());
  const g = (r, ...ks) => { for (const k of ks) { const i = h.indexOf(k); if (i >= 0 && r[i]?.trim()) return r[i].trim(); } return null; };
  let n = 0;
  for (const r of rows) {
    const nome = g(r, "nome", "name", "contato");
    const empresa = g(r, "empresa", "company", "conta");
    if (!nome && !empresa) continue;
    const accountId = await upsertAccount(empresa || "(sem empresa)", g(r, "dominio", "domínio", "domain", "site"), g(r, "rodada", "round"));
    if (nome) {
      await sql`insert into contacts (account_id, name, title, email, phone, linkedin, stage)
        values (${accountId}, ${nome}, ${g(r,"cargo","title")}, ${g(r,"email","e-mail")}, ${g(r,"telefone","phone","whatsapp")},
        ${g(r,"linkedin")}, ${g(r,"estagio","estágio","stage") || "novo"})`;
    }
    n++;
  }
  redirect(`/?importados=${n}`);
}

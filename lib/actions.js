"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as XLSX from "xlsx";
import { sql } from "./db";
import { rowToRecord } from "./sheet";

const v = (fd, k) => (fd.get(k) ?? "").toString().trim() || null;
const refresh = () => ["/", "/database", "/estrategias", "/recuperacao"].forEach(p => revalidatePath(p));

async function nextCode(strategy) {
  const prefix = `${strategy || "SEM"}-A-`;
  const [r] = await sql`select coalesce(max(nullif(regexp_replace(code, '^.*-', ''), '')::int), 0) + 1 as n
    from prospects where code like ${prefix + "%"} and code ~ '-[0-9]+$'`;
  return prefix + String(r.n).padStart(3, "0");
}

export async function createProspect(fd) {
  const strategy = v(fd, "strategy");
  const [p] = await sql`insert into prospects (code, strategy, name, company, linkedin, email, phone, has_whatsapp, owner, created_on)
    values (${await nextCode(strategy)}, ${strategy}, ${v(fd, "name")}, ${v(fd, "company")}, ${v(fd, "linkedin")}, ${v(fd, "email")},
      ${v(fd, "phone")}, ${v(fd, "has_whatsapp")}, ${v(fd, "owner") || "Nícolas"}, ${v(fd, "created_on") || new Date().toISOString().slice(0, 10)})
    returning id`;
  refresh(); redirect(`/prospects/${p.id}`);
}

export async function quickUpdate(fd) {
  const id = Number(fd.get("id"));
  await sql`update prospects set stage = ${v(fd, "stage")}, pipeline = ${v(fd, "pipeline")}, updated_at = now() where id = ${id}`;
  refresh();
}

export async function saveProspect(fd) {
  const id = Number(fd.get("id"));
  const val = v(fd, "proposal_value");
  await sql`update prospects set strategy=${v(fd, "strategy")}, name=${v(fd, "name")}, company=${v(fd, "company")}, linkedin=${v(fd, "linkedin")},
    email=${v(fd, "email")}, phone=${v(fd, "phone")}, has_whatsapp=${v(fd, "has_whatsapp")}, stage=${v(fd, "stage")}, pipeline=${v(fd, "pipeline")},
    created_on=${v(fd, "created_on")}, meeting_scheduled=${fd.get("meeting_scheduled") === "on"}, no_show=${fd.get("no_show") === "on"},
    owner=${v(fd, "owner")}, hook=${v(fd, "hook")}, notes=${v(fd, "notes")},
    proposal_value=${val == null ? null : Number(val.replace(/\./g, "").replace(",", "."))}, proposal_date=${v(fd, "proposal_date")}, updated_at=now()
    where id=${id}`;
  for (let n = 1; n <= 6; n++) {
    const [content, channel, status] = [v(fd, `t${n}_content`), v(fd, `t${n}_channel`), v(fd, `t${n}_status`)];
    if (content || channel || status)
      await sql`insert into prospect_touches (prospect_id, touch_no, content, channel, status) values (${id}, ${n}, ${content}, ${channel}, ${status})
        on conflict (prospect_id, touch_no) do update set content=excluded.content, channel=excluded.channel, status=excluded.status`;
    else await sql`delete from prospect_touches where prospect_id=${id} and touch_no=${n}`;
  }
  refresh(); revalidatePath(`/prospects/${id}`);
  redirect(`/prospects/${id}?salvo=1`);
}

export async function deleteProspect(fd) {
  await sql`delete from prospects where id = ${Number(fd.get("id"))}`;
  refresh(); redirect("/");
}

export async function saveStrategy(fd) {
  await sql`insert into strategies (code, csv_link, notes) values (${v(fd, "code")}, ${v(fd, "csv_link")}, ${v(fd, "notes")})
    on conflict (code) do update set csv_link = excluded.csv_link, notes = excluded.notes`;
  revalidatePath("/estrategias");
}

// Importa .xlsx/.csv com as colunas da aba "Outbound Database" (ou as abas novos/atualizar da skill 99).
// Upsert pelo ID: campos vazios no arquivo não apagam o que já existe.
export async function importSheet(fd) {
  const file = fd.get("file");
  if (!file || !file.size) redirect("/importar?msg=" + encodeURIComponent("Escolha um arquivo"));
  const wb = XLSX.read(Buffer.from(await file.arrayBuffer()), { cellDates: true });
  const records = [];
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null, raw: true });
    if (!rows.length || !("ID" in rows[0]) || !("Nome" in rows[0])) continue;
    for (const r of rows) { const rec = rowToRecord(r); if (rec.code) records.push(rec); }
  }
  if (!records.length) redirect("/importar?msg=" + encodeURIComponent("Nenhuma aba com colunas ID e Nome encontrada"));
  const seen = new Map(); for (const r of records) seen.set(r.code, r); // última ocorrência vence
  const list = [...seen.values()];
  const payload = JSON.stringify(list.map(({ touches, ...p }) => p));
  await sql.query(`
    insert into prospects (code, strategy, name, company, linkedin, email, phone, has_whatsapp, stage, pipeline, created_on,
      meeting_scheduled, no_show, owner, hook, notes, proposal_value, proposal_date)
    select code, strategy, name, company, linkedin, email, phone, has_whatsapp, coalesce(stage,'Prospect'), coalesce(pipeline,'fora de pipe'),
      coalesce(created_on, current_date), coalesce(meeting_scheduled,false), coalesce(no_show,false), owner, hook, notes, proposal_value, proposal_date
    from json_populate_recordset(null::prospects, $1::json)
    on conflict (code) do update set
      strategy=coalesce(excluded.strategy, prospects.strategy), name=coalesce(excluded.name, prospects.name),
      company=coalesce(excluded.company, prospects.company), linkedin=coalesce(excluded.linkedin, prospects.linkedin),
      email=coalesce(excluded.email, prospects.email), phone=coalesce(excluded.phone, prospects.phone),
      has_whatsapp=coalesce(excluded.has_whatsapp, prospects.has_whatsapp), stage=excluded.stage, pipeline=excluded.pipeline,
      created_on=excluded.created_on, meeting_scheduled=excluded.meeting_scheduled or prospects.meeting_scheduled,
      no_show=excluded.no_show or prospects.no_show, owner=coalesce(excluded.owner, prospects.owner),
      hook=coalesce(excluded.hook, prospects.hook), notes=coalesce(excluded.notes, prospects.notes),
      proposal_value=coalesce(excluded.proposal_value, prospects.proposal_value),
      proposal_date=coalesce(excluded.proposal_date, prospects.proposal_date), updated_at=now()`, [payload]);
  const touches = JSON.stringify(list.flatMap(r => r.touches.map(t => ({ ...t, code: r.code }))));
  await sql.query(`
    insert into prospect_touches (prospect_id, touch_no, content, channel, status)
    select p.id, t.touch_no, t.content, t.channel, t.status
    from json_to_recordset($1::json) as t(code text, touch_no int, content text, channel text, status text)
    join prospects p on p.code = t.code
    on conflict (prospect_id, touch_no) do update set content=coalesce(excluded.content, prospect_touches.content),
      channel=coalesce(excluded.channel, prospect_touches.channel), status=coalesce(excluded.status, prospect_touches.status)`, [touches]);
  refresh();
  redirect("/importar?msg=" + encodeURIComponent(`${list.length} prospects importados/atualizados`));
}

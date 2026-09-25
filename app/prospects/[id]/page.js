import { sql, loadProspects, STAGES, PIPELINES, CHANNELS, TOUCH_STATUS, fmtDate, daysSince } from "@/lib/db";
import { saveProspect, deleteProspect } from "@/lib/actions";
import { enrichEmail } from "@/lib/treg";
export const dynamic = "force-dynamic";

export default async function Ficha({ params, searchParams }) {
  const { id } = await params; const { salvo, enr } = await searchParams;
  const p = (await loadProspects()).find(x => x.id === Number(id));
  if (!p) return <p>Prospect não encontrado. <a href="/">voltar</a></p>;
  const siblings = await sql`select id, name, code, stage, pipeline from prospects where company = ${p.company} and id <> ${p.id} order by code`;
  const f = (n, label, val, type = "text") => <label>{label}<br /><input name={n} type={type} defaultValue={val ?? ""} style={{ width: "100%" }} /></label>;
  const s = (n, label, val, opts) => <label>{label}<br /><select name={n} defaultValue={val ?? ""} style={{ width: "100%" }}><option value=""></option>{opts.map(o => <option key={o}>{o}</option>)}</select></label>;
  const iso = d => d ? new Date(d).toISOString().slice(0, 10) : "";

  return (<form action={saveProspect}>
    <input type="hidden" name="id" value={p.id} />
    <p><a href="/">← Revenue BI</a></p>
    <div className="row" style={{ justifyContent: "space-between" }}>
      <h1>{p.name} <span className="mut">· {p.company} · {p.code}</span></h1>
      <div className="row">{salvo && <span className="ok">Salvo ✓</span>}<button>Salvar ficha</button></div>
    </div>

    <div className="card"><h3>Identificação</h3>
      <div className="grid">
        {f("name", "Nome", p.name)}{f("company", "Empresa", p.company)}{f("title", "Cargo", p.title)}{f("strategy", "Estratégia", p.strategy)}
        {f("email", "E-mail", p.email)}{f("phone", "Telefone", p.phone)}{s("has_whatsapp", "Tem WhatsApp?", p.has_whatsapp, ["Sim", "Não"])}
        {f("linkedin", "LinkedIn", p.linkedin)}{f("owner", "Responsável", p.owner)}
        {f("created_on", "Data de criação", iso(p.created_on), "date")}
        <label>Semana<br /><input disabled value={fmtDate(p.week)} style={{ width: "100%" }} /></label>
        {s("stage", "Estágio", p.stage, STAGES)}{s("pipeline", "Pipeline", p.pipeline, PIPELINES)}
        <label><input type="checkbox" name="meeting_scheduled" defaultChecked={p.meeting_scheduled} /> Reunião agendada</label>
        <label><input type="checkbox" name="no_show" defaultChecked={p.no_show} /> No show</label>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        {p.linkedin && <a href={p.linkedin.startsWith("http") ? p.linkedin : "https://" + p.linkedin} target="_blank">Abrir LinkedIn</a>}
        {p.phone && <a href={`https://wa.me/${p.phone.replace(/\D/g, "").replace(/^(?!55)/, "55")}`} target="_blank">Abrir WhatsApp</a>}
        <button formAction={enrichEmail} className="sec">Buscar e-mail via treg</button>{enr && <span className="mut">{enr}</span>}
      </div>
    </div>

    <div className="card"><h3>Histórico de touches</h3>
      {p.t.map((t, i) => (
        <div className="touch" key={i}><b>T{i + 1}</b>
          <select name={`t${i + 1}_channel`} defaultValue={t.channel || ""}><option value="">canal</option>{CHANNELS.map(c => <option key={c}>{c}</option>)}</select>
          <select name={`t${i + 1}_status`} defaultValue={t.status || ""}><option value="">status</option>{TOUCH_STATUS.map(c => <option key={c}>{c}</option>)}</select>
          <textarea name={`t${i + 1}_content`} rows={t.content ? 5 : 1} defaultValue={t.content || ""} placeholder="Mensagem exatamente como enviada" />
        </div>))}
    </div>

    <div className="card"><h3>Notas, gancho e proposta</h3>
      <p><label>Notas<br /><textarea name="notes" rows={3} style={{ width: "100%" }} defaultValue={p.notes || ""} /></label></p>
      <p><label>Gancho de recuperação<br /><textarea name="hook" rows={2} style={{ width: "100%" }} defaultValue={p.hook || ""} /></label></p>
      <div className="grid">
        {f("proposal_value", "Valor da proposta (R$)", p.proposal_value)}
        {f("proposal_date", "Data da proposta", iso(p.proposal_date), "date")}
        <label>Dias desde a proposta<br /><input disabled value={daysSince(p.proposal_date) ?? ""} style={{ width: "100%" }} /></label>
      </div>
    </div>

    {siblings.length > 0 && <div className="card"><h3>Outros contatos da {p.company}</h3>
      {siblings.map(x => <div key={x.id}><a href={`/prospects/${x.id}`}>{x.name}</a> <span className="mut">{x.code} · {x.stage} · {x.pipeline}</span></div>)}</div>}

    <div className="row" style={{ justifyContent: "space-between" }}>
      <button>Salvar ficha</button>
      <button formAction={deleteProspect} className="sec">Excluir prospect</button>
    </div>
  </form>);
}

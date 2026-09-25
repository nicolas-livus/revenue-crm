import { loadProspects, KANBAN, fmtDate, daysSince, brl } from "@/lib/db";
import { metrics, consolidate, fmt } from "@/lib/metrics";
export const dynamic = "force-dynamic";

function Consolidated({ title, data, keyLabel, keyFmt = x => x }) {
  const cols = r => [r.prospects, r.linkedin, r.email, r.phone, ...r.t, r.scheduled, r.sales, fmt(r.prospects ? r.t[0] / r.prospects : null, "%")];
  return (<div className="card scroll"><h3>{title}</h3>
    <table><thead><tr><th>{keyLabel}</th>{["Prospects", "LinkedIn", "E-mail", "Telefone", "T1", "T2", "T3", "T4", "T5", "T6", "Agendadas", "Vendas", "Cob. T1"].map(h => <th key={h} className="num">{h}</th>)}</tr></thead>
      <tbody>{[...data.rows, data.total].map(r => <tr key={r.key} style={r.key === "TOTAL" ? { fontWeight: 600 } : null}>
        <td>{r.key === "TOTAL" ? r.key : keyFmt(r.key)}</td>{cols(r).map((c, i) => <td key={i} className="num">{c}</td>)}</tr>)}</tbody></table></div>);
}

export default async function BI({ searchParams }) {
  const { estrategia = "Todas", empresa = "" } = await searchParams;
  const all = await loadProspects();
  const strategies = [...new Set(all.map(p => p.strategy).filter(Boolean))].sort();
  const scoped = estrategia === "Todas" ? all : all.filter(p => p.strategy === estrategia);
  const m = metrics(scoped);
  const kanbanCompanies = [...new Set(scoped.filter(p => KANBAN.includes(p.pipeline)).map(p => p.company?.trim()).filter(Boolean))].sort();
  const lookup = empresa ? scoped.filter(p => p.company?.trim() === empresa) : [];

  return (<>
    <div className="row" style={{ justifyContent: "space-between" }}>
      <h1>Revenue BI & Pipeline</h1><span className="mut">{new Date().toLocaleDateString("pt-BR")}</span></div>
    <form className="card row">Estratégia:
      <select name="estrategia" defaultValue={estrategia}><option>Todas</option>{strategies.map(s => <option key={s}>{s}</option>)}</select>
      <button>Aplicar</button><span className="mut">filtra todos os blocos · base exclui Estágio = Redirecionado · “fora de pipe” não aparece no kanban</span>
    </form>

    <div className="stats card">{m.funnel.slice(0, 6).map(f => <div className="stat" key={f.label}><b>{f.n}</b>{f.label}</div>)}</div>

    <div className="card"><h3>Pipeline ativo → saídas do funil</h3>
      <div className="kanban">{KANBAN.map((k, i) => {
        const cards = scoped.filter(p => p.pipeline === k);
        return (<div className="col" key={k}><h4>{i + 1} · {k} ({cards.length})</h4>
          {cards.map(p => <a key={p.id} href={`/prospects/${p.id}`} className="kcard" style={{ display: "block" }}>
            <b>{p.company}</b><div className="mut">{p.name}</div>
            {p.proposal_value != null && <div>{brl(p.proposal_value)}</div>}</a>)}
        </div>);
      })}</div>
    </div>

    <form className="card"><input type="hidden" name="estrategia" value={estrategia} />
      <div className="row"><h3 style={{ margin: 0 }}>Consulta de empresa</h3>
        <select name="empresa" defaultValue={empresa}><option value="">escolha uma empresa do kanban</option>{kanbanCompanies.map(c => <option key={c}>{c}</option>)}</select>
        <button className="sec">Consultar</button></div>
      {lookup.length > 0 && <div className="scroll"><table><thead><tr><th>Prospect</th><th>Código</th><th>Etapa</th><th className="num">Dias desde a criação</th>
        <th className="num">Valor da proposta</th><th>Data da proposta</th><th className="num">Dias desde a proposta</th></tr></thead>
        <tbody>{lookup.map(p => <tr key={p.id}><td><a href={`/prospects/${p.id}`}>{p.name}</a></td><td>{p.code}</td><td>{p.pipeline}</td>
          <td className="num">{daysSince(p.created_on)}</td><td className="num">{brl(p.proposal_value)}</td><td>{fmtDate(p.proposal_date)}</td>
          <td className="num">{daysSince(p.proposal_date) ?? "—"}</td></tr>)}</tbody></table></div>}
    </form>

    <div className="card scroll"><h3>Funil de conversão</h3>
      <table><thead><tr><th>Etapa</th><th className="num">Volume</th><th className="num">Conv. etapa</th><th className="num">Conv. contatados</th><th>Definição</th></tr></thead>
        <tbody>{m.funnel.map(f => <tr key={f.label}><td>{f.label}</td><td className="num">{f.n}</td><td className="num">{fmt(f.convStep, "%")}</td>
          <td className="num">{fmt(f.convContacted, "%")}</td><td className="mut">{f.def}</td></tr>)}</tbody></table></div>

    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(420px,1fr))" }}>
      {[["Eficiência e qualidade", m.efficiency], ["Propostas", m.proposals]].map(([t, list]) => (
        <div className="card scroll" key={t}><h3>{t}</h3><table><thead><tr><th>Indicador</th><th className="num">Valor</th><th>Leitura</th></tr></thead>
          <tbody>{list.map(([l, v, k, d]) => <tr key={l}><td>{l}</td><td className="num">{fmt(v, k)}</td><td className="mut">{d}</td></tr>)}</tbody></table></div>))}
    </div>

    <Consolidated title="Consolidado por estratégia" data={consolidate(scoped, p => p.strategy)} keyLabel="Estratégia" />
    <Consolidated title="Por semana" data={consolidate(scoped, p => p.week)} keyLabel="Semana" keyFmt={fmtDate} />
  </>);
}

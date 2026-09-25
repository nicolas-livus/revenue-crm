import { loadProspects, STAGES, PIPELINES, fmtDate } from "@/lib/db";
import { quickUpdate, createProspect } from "@/lib/actions";
import { filled } from "@/lib/metrics";
export const dynamic = "force-dynamic";

export default async function Database({ searchParams }) {
  const sp = await searchParams;
  const { estrategia = "", estagio = "", pipeline = "", semana = "", q = "" } = sp;
  const all = await loadProspects();
  const strategies = [...new Set(all.map(p => p.strategy).filter(Boolean))].sort();
  const weeks = [...new Set(all.map(p => p.week).filter(Boolean))].sort().reverse();
  const ql = q.toLowerCase();
  const rows = all.filter(p => (!estrategia || p.strategy === estrategia) && (!estagio || p.stage === estagio) &&
    (!pipeline || p.pipeline === pipeline) && (!semana || p.week === semana) &&
    (!q || [p.name, p.company, p.code, p.email, p.phone].some(x => x?.toLowerCase().includes(ql))));
  const sel = (name, val, opts, all) => <select name={name} defaultValue={val}><option value="">{all}</option>{opts.map(o => <option key={o} value={o}>{o}</option>)}</select>;

  return (<>
    <h1>Outbound Database <span className="mut">· {rows.length} de {all.length}</span></h1>
    <form className="card row">
      <input name="q" defaultValue={q} placeholder="Buscar nome, empresa, ID, e-mail, telefone" style={{ minWidth: 260 }} />
      {sel("estrategia", estrategia, strategies, "Todas as estratégias")}
      {sel("estagio", estagio, STAGES, "Todos os estágios")}
      {sel("pipeline", pipeline, PIPELINES, "Todo o pipeline")}
      <select name="semana" defaultValue={semana}><option value="">Todas as semanas</option>{weeks.map(w => <option key={w} value={w}>{fmtDate(w)}</option>)}</select>
      <button>Filtrar</button><a href="/">limpar</a>
    </form>

    <div className="card scroll">
      <table><thead><tr><th>ID</th><th>Nome · Empresa</th><th>Contato</th><th>Touches</th><th>Criação</th><th>Estágio · Pipeline</th></tr></thead>
        <tbody>{rows.map(p => {
          const last = [...p.t].reverse().find(t => t.content || t.status);
          return (<tr key={p.id}>
            <td className="mut">{p.code}</td>
            <td><a href={`/prospects/${p.id}`}>{p.name || "(sem nome)"}</a><div className="mut">{p.company}</div></td>
            <td className="mut">{p.phone}{p.has_whatsapp === "Sim" && " · WA"}<br />{p.email}{p.linkedin && <> · <a href={p.linkedin.startsWith("http") ? p.linkedin : "https://" + p.linkedin} target="_blank">in</a></>}</td>
            <td>{filled(p)}/6{last && <div className="mut">T{last.n} {last.channel} · {last.status}</div>}</td>
            <td className="mut">{fmtDate(p.created_on)}</td>
            <td><form action={quickUpdate} className="row"><input type="hidden" name="id" value={p.id} />
              <select name="stage" defaultValue={p.stage}>{STAGES.map(s => <option key={s}>{s}</option>)}</select>
              <select name="pipeline" defaultValue={p.pipeline}>{PIPELINES.map(s => <option key={s}>{s}</option>)}</select>
              <button className="sec">ok</button></form></td>
          </tr>);
        })}
          {!rows.length && <tr><td colSpan={6} className="mut">Nenhum prospect — importe a planilha em “Importar / Exportar”.</td></tr>}
        </tbody></table>
    </div>

    <form action={createProspect} className="card">
      <h3>Novo prospect <span className="mut">(ID gerado automaticamente: ESTRATÉGIA-A-###)</span></h3>
      <div className="grid">
        <input name="strategy" placeholder="Estratégia (ex: ECOM-SIZ)" list="strats" required />
        <datalist id="strats">{strategies.map(s => <option key={s} value={s} />)}</datalist>
        <input name="name" placeholder="Nome" required /><input name="company" placeholder="Empresa" />
        <input name="linkedin" placeholder="LinkedIn" /><input name="email" placeholder="Email" /><input name="phone" placeholder="Telefone" />
        <select name="has_whatsapp" defaultValue=""><option value="">Tem WhatsApp?</option><option>Sim</option><option>Não</option></select>
      </div><p><button>Criar e abrir ficha</button></p>
    </form>
  </>);
}

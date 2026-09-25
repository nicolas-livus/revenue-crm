import { sql, loadProspects } from "@/lib/db";
import { filled } from "@/lib/metrics";
export const dynamic = "force-dynamic";

const METRICS = [["Prospects", () => true], ["Abordados", p => p.t[0].content], ["Reuniões", p => p.meeting_scheduled],
  ["Vendas", p => p.pipeline === "venda"], ["Desqualificados", p => p.stage === "Desqualificado" || p.pipeline === "desqualificada"]];

export default async function Cadencias() {
  const all = await loadProspects();
  const meta = Object.fromEntries((await sql`select * from strategies`).map(s => [s.code, s]));
  const codes = [...new Set([...all.map(p => p.strategy).filter(Boolean), ...Object.keys(meta)])].sort();

  return (<>
    <h1>Cadências</h1>
    <p className="mut">Abra uma estratégia para ver os contatos abordados; abra um contato para ler a cadência que ele recebeu.</p>
    {codes.map(code => {
      const ps = all.filter(p => p.strategy === code);
      const reached = ps.filter(p => filled(p) > 0).sort((a, b) => (a.company || "").localeCompare(b.company || ""));
      return (<details className="card strat" key={code}>
        <summary>
          <span className="strat-code">{code}</span>
          <span className="strat-metrics">{METRICS.map(([l, fn]) => <span key={l}><b>{ps.filter(fn).length}</b>{l}</span>)}</span>
        </summary>

        {meta[code]?.summary && <p className="strat-summary">{meta[code].summary}</p>}

        <h3>Contatos abordados · {reached.length}</h3>
        {!reached.length && <p className="mut">Nenhum contato abordado ainda.</p>}
        {reached.map(p => {
          const last = [...p.t].reverse().find(t => t.content);
          return (<details className="contact" key={p.id}>
            <summary>
              <span><b>{p.name}</b> <span className="mut">· {p.company}</span></span>
              <span className="mut mono">{filled(p)}/6 · T{last?.n} {last?.channel} · {p.stage} · {p.pipeline}</span>
            </summary>
            <div className="cadence">
              {p.t.map((t, i) => t.content || t.status ? (
                <div className="msg" key={i}>
                  <div className="msg-head mono"><b>T{i + 1}</b> · {t.channel || "—"} · {t.status || "—"}</div>
                  <pre>{t.content || "(sem conteúdo registrado)"}</pre>
                </div>) : null)}
              <a href={`/prospects/${p.id}`} className="mono">Abrir ficha →</a>
            </div>
          </details>);
        })}
      </details>);
    })}
  </>);
}

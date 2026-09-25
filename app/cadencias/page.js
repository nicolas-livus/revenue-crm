import { sql, loadProspects } from "@/lib/db";
import { filled } from "@/lib/metrics";
import { markInvalidWhatsapp } from "@/lib/actions";
import CopyButton from "./CopyButton";
import AutoSubmit from "./AutoSubmit";
const variationOf = code => code?.match(/-([A-Z])-\d+$/)?.[1] || null;
export const dynamic = "force-dynamic";

const METRICS = [["Prospects", () => true], ["Abordados", p => p.t[0].content], ["Reuniões", p => p.meeting_scheduled],
  ["Vendas", p => p.pipeline === "venda"], ["Desqualificados", p => p.stage === "Desqualificado" || p.pipeline === "desqualificada"]];

export default async function Cadencias({ searchParams }) {
  const sp = await searchParams;
  const all = await loadProspects();
  const meta = Object.fromEntries((await sql`select * from strategies`).map(s => [s.code, s]));
  const codes = [...new Set([...all.map(p => p.strategy).filter(Boolean), ...Object.keys(meta)])].sort();

  return (<>
    <h1>Cadências</h1>
    <Operacional all={all} codes={codes} sp={sp} />
    <h2 className="section">Estratégias</h2>
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

// Parte operacional: cards de WhatsApp prontos para copiar e colar
function Operacional({ all, codes, sp }) {
  const estrategia = sp.estrategia ?? codes[0] ?? "";
  const touch = sp.touch ?? "Todos", variacao = sp.variacao ?? "Todos";
  const variations = [...new Set(["A", "B", "C", ...all.map(p => variationOf(p.code)).filter(Boolean)])].sort();
  const cards = all
    .filter(p => p.strategy === estrategia && p.has_whatsapp !== "Não" && (variacao === "Todos" || variationOf(p.code) === variacao))
    .flatMap(p => p.t.map((t, i) => ({ p, t, n: i + 1 })))
    .filter(({ t, n }) => t.channel === "WHATSAPP" && t.content && (touch === "Todos" || `T${n}` === touch))
    .sort((a, b) => a.n - b.n || (a.p.company || "").localeCompare(b.p.company || ""));
  // lista de contatos coerente com os filtros: um por contato, na ordem dos cards
  const seen = new Set();
  const contactList = cards.filter(({ p }) => !seen.has(p.id) && seen.add(p.id))
    .map(({ p }) => `[${p.company || ""}] [${p.name || ""}][${(p.phone || "").replace(/\D/g, "")}]`).join("\n");
  const sel = (name, val, opts) => <select name={name} defaultValue={val}>{opts.map(o => <option key={o}>{o}</option>)}</select>;
  return (<section>
    <h2 className="section">Envios de WhatsApp</h2>
    <AutoSubmit>
      <label>Estratégia{sel("estrategia", estrategia, codes)}</label>
      <label>Touch{sel("touch", touch, ["Todos", "T1", "T2", "T3", "T4", "T5", "T6"])}</label>
      <label>Variação{sel("variacao", variacao, ["Todos", ...variations])}</label>
      <span className="mut mono">{cards.length} {cards.length === 1 ? "mensagem" : "mensagens"}</span>
    </AutoSubmit>
    {cards.length > 0 && <div className="op-copyall"><CopyButton text={contactList} className="link" label={`Copiar lista de contatos (${seen.size})`} /></div>}
    <div className="op-cards">
      {cards.map(({ p, t, n }) => (
        <div className="op-card" key={`${p.id}-${n}`}>
          <div className="op-who">
            <span className="mono op-touch">T{n} · {variationOf(p.code)}{t.status ? ` · ${t.status}` : ""}</span>
            <b>{p.company || "—"}</b>
            <span>{p.name}{p.title && <span className="mut"> · {p.title}</span>}</span>
            <span className="mut mono">{p.phone || "sem telefone"}</span>
          </div>
          <div className="op-actions">
            <CopyButton text={t.content} />
            <form action={markInvalidWhatsapp}><input type="hidden" name="id" value={p.id} /><button className="sec">WhatsApp inválido</button></form>
          </div>
        </div>))}
      {!cards.length && <p className="mut">Nenhuma mensagem de WhatsApp para esse filtro.</p>}
    </div>
  </section>);
}

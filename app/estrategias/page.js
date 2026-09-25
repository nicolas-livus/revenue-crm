import { sql, loadProspects } from "@/lib/db";
import { saveStrategy } from "@/lib/actions";
export const dynamic = "force-dynamic";

export default async function Estrategias() {
  const all = await loadProspects();
  const meta = Object.fromEntries((await sql`select * from strategies`).map(s => [s.code, s]));
  const codes = [...new Set([...all.map(p => p.strategy).filter(Boolean), ...Object.keys(meta)])].sort();
  const count = (code, fn) => all.filter(p => p.strategy === code && fn(p)).length;
  return (<>
    <h1>Estratégias e Cadências</h1>
    <p className="mut">Uma linha por estratégia, reconhecida automaticamente na Database. As métricas se calculam sozinhas; link do CSV da cadência e observações são manuais.</p>
    <div className="card scroll"><table>
      <thead><tr><th>Estratégia</th>{["Prospects", "Reuniões agendadas", "Vendas", "LinkedIn", "Telefones", "E-mails", "Desqualificados"].map(h => <th key={h} className="num">{h}</th>)}
        <th>Link do CSV da cadência</th><th>Observações</th><th></th></tr></thead>
      <tbody>{codes.map(c => (<tr key={c}>
        <td><a href={`/database?estrategia=${encodeURIComponent(c)}`}>{c}</a></td>
        {[() => true, p => p.meeting_scheduled, p => p.pipeline === "venda", p => p.linkedin, p => p.phone, p => p.email,
          p => p.stage === "Desqualificado" || p.pipeline === "desqualificada"].map((fn, i) => <td key={i} className="num">{count(c, fn)}</td>)}
        <td colSpan={3}><form action={saveStrategy} className="row"><input type="hidden" name="code" value={c} />
          <input name="csv_link" defaultValue={meta[c]?.csv_link || ""} placeholder="https://..." />
          {meta[c]?.csv_link && <a href={meta[c].csv_link} target="_blank">abrir</a>}
          <input name="notes" defaultValue={meta[c]?.notes || ""} placeholder="observações" style={{ minWidth: 220 }} />
          <button className="sec">salvar</button></form></td>
      </tr>))}</tbody></table></div>
  </>);
}

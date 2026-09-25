import { sql, STAGES } from "@/lib/db";
import { addContact, setStage, importCsv } from "@/lib/actions";
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }) {
  const { etapa = "", rodada = "", q = "", importados } = await searchParams;
  const like = `%${q}%`;
  const contacts = await sql`
    select c.*, a.name as empresa, a.domain, a.round,
      (select max(sent_at) from touches t where t.contact_id = c.id) as last_touch,
      (select max(touch_no) from touches t where t.contact_id = c.id) as last_no
    from contacts c left join accounts a on a.id = c.account_id
    where (${etapa} = '' or c.stage = ${etapa}) and (${rodada} = '' or a.round = ${rodada})
      and (${q} = '' or c.name ilike ${like} or a.name ilike ${like} or a.domain ilike ${like})
    order by c.updated_at desc limit 500`;
  const counts = Object.fromEntries((await sql`select stage, count(*)::int n from contacts group by stage`).map(r => [r.stage, r.n]));
  const rounds = (await sql`select distinct round from accounts where round is not null order by round`).map(r => r.round);

  return (<>
    <div className="row" style={{ justifyContent: "space-between" }}>
      <h1>Livus · CRM de prospecção</h1>
      {importados && <span className="mut">{importados} linhas importadas</span>}
    </div>

    <div className="stats card">
      {STAGES.map(([k, l]) => <a key={k} href={`/?etapa=${k}`} className="stat"><b>{counts[k] || 0}</b>{l}</a>)}
    </div>

    <form className="card row">
      <input name="q" defaultValue={q} placeholder="Buscar nome, empresa, domínio" />
      <select name="etapa" defaultValue={etapa}><option value="">Todas as etapas</option>
        {STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <select name="rodada" defaultValue={rodada}><option value="">Todas as rodadas</option>
        {rounds.map(r => <option key={r}>{r}</option>)}</select>
      <button>Filtrar</button><a href="/">limpar</a>
    </form>

    <div className="card scroll">
      <table><thead><tr><th>Contato</th><th>Empresa</th><th>Rodada</th><th>Contato</th><th>Último toque</th><th>Etapa</th></tr></thead>
        <tbody>{contacts.map(c => (
          <tr key={c.id}>
            <td><a href={`/contatos/${c.id}`}>{c.name}</a><div className="mut">{c.title}</div></td>
            <td>{c.empresa}<div className="mut">{c.domain}</div></td>
            <td>{c.round}</td>
            <td className="mut">{c.phone}<br />{c.email}</td>
            <td className="mut">{c.last_touch ? `T${c.last_no ?? "?"} · ${new Date(c.last_touch).toLocaleDateString("pt-BR")}` : "—"}</td>
            <td><form action={setStage} className="row"><input type="hidden" name="id" value={c.id} />
              <select name="stage" defaultValue={c.stage}>{STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              <button className="sec">ok</button></form></td>
          </tr>))}
          {!contacts.length && <tr><td colSpan={6} className="mut">Nenhum contato ainda — adicione abaixo ou importe um CSV.</td></tr>}
        </tbody></table>
    </div>

    <form action={addContact} className="card">
      <h3>Novo contato</h3>
      <div className="grid">
        {["empresa", "dominio", "rodada", "nome", "cargo", "email", "telefone", "linkedin"].map(f =>
          <input key={f} name={f} placeholder={f} required={f === "nome"} />)}
      </div><p><button>Adicionar</button></p>
    </form>

    <form action={importCsv} className="card">
      <h3>Importar CSV (planilha atual do CRM)</h3>
      <p className="mut">Cole o CSV com cabeçalho. Colunas reconhecidas: empresa, dominio, rodada, nome, cargo, email, telefone, linkedin, estagio. Separador , ou ;</p>
      <textarea name="csv" rows={6} style={{ width: "100%" }} placeholder="empresa,dominio,rodada,nome,cargo,email,telefone" />
      <p><button>Importar</button></p>
    </form>
  </>);
}

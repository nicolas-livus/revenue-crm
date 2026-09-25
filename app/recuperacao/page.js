import { loadProspects } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function Recuperacao() {
  const rows = (await loadProspects()).filter(p => p.stage === "Recuperação" || p.pipeline === "perdida");
  return (<>
    <h1>Banco de Recuperação <span className="mut">· {rows.length} prospects recuperáveis</span></h1>
    <p className="mut">Puxa sozinho todo prospect com Estágio = Recuperação ou Pipeline = perdida. Para tirar alguém daqui, mude o estágio ou o pipeline.</p>
    <div className="card scroll"><table>
      <thead><tr><th>ID</th><th>Nome</th><th>Empresa</th><th>LinkedIn</th><th>E-mail</th><th>Telefone</th><th>Origem</th><th>Gancho de recuperação</th></tr></thead>
      <tbody>{rows.map(p => <tr key={p.id}><td className="mut">{p.code}</td><td><a href={`/prospects/${p.id}`}>{p.name}</a></td><td>{p.company}</td>
        <td>{p.linkedin && <a href={p.linkedin.startsWith("http") ? p.linkedin : "https://" + p.linkedin} target="_blank">perfil</a>}</td>
        <td>{p.email}</td><td>{p.phone}</td><td>{p.stage === "Recuperação" ? "Estágio" : "Pipeline perdida"}</td><td>{p.hook}</td></tr>)}
        {!rows.length && <tr><td colSpan={8} className="mut">Ninguém no banco de recuperação.</td></tr>}</tbody></table></div>
  </>);
}

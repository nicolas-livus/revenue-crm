import { sql, STAGES } from "@/lib/db";
import { setStage, addTouch, setReply, updateContact, updateAccount, deleteContact } from "@/lib/actions";
import { enrichEmail } from "@/lib/treg";
export const dynamic = "force-dynamic";

export default async function Contato({ params, searchParams }) {
  const { id } = await params; const { enr } = await searchParams;
  const [c] = await sql`select c.*, a.name empresa, a.domain, a.round, a.thesis, a.radar_notes, a.status acc_status
    from contacts c left join accounts a on a.id=c.account_id where c.id=${Number(id)}`;
  if (!c) return <p>Contato não encontrado. <a href="/">voltar</a></p>;
  const touches = await sql`select * from touches where contact_id=${c.id} order by sent_at`;
  const f = (n, l, val) => <label>{l}<br /><input name={n} defaultValue={val || ""} style={{ width: "100%" }} /></label>;

  return (<>
    <p><a href="/">← voltar</a></p>
    <h1>{c.name} <span className="mut">· {c.empresa}</span></h1>

    <form action={setStage} className="card row"><input type="hidden" name="id" value={c.id} />
      Etapa: <select name="stage" defaultValue={c.stage}>{STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <button>Salvar</button></form>

    <form action={updateContact} className="card"><input type="hidden" name="id" value={c.id} />
      <h3>Dados</h3>
      <div className="grid">{f("nome", "Nome", c.name)}{f("cargo", "Cargo", c.title)}{f("email", "E-mail", c.email)}
        {f("telefone", "Telefone", c.phone)}{f("linkedin", "LinkedIn", c.linkedin)}</div>
      <p><label>Notas<br /><textarea name="notas" rows={3} style={{ width: "100%" }} defaultValue={c.notes || ""} /></label></p>
      <div className="row"><button>Salvar dados</button>
        <button formAction={enrichEmail} className="sec">Buscar e-mail via treg</button>
        {enr && <span className="mut">{enr}</span>}</div>
    </form>

    <div className="card">
      <h3>Toques</h3>
      {touches.map(t => (
        <div key={t.id} style={{ borderBottom: "1px solid var(--bd)", padding: "8px 0" }}>
          <b>T{t.touch_no ?? "?"}</b> · {t.channel} · <span className="mut">{new Date(t.sent_at).toLocaleString("pt-BR")}</span>
          <pre>{t.message}</pre>
          {t.reply ? <p><b>Resposta:</b> {t.reply}</p> :
            <form action={setReply} className="row"><input type="hidden" name="touch_id" value={t.id} />
              <input type="hidden" name="contact_id" value={c.id} />
              <input name="resposta" placeholder="Registrar resposta" style={{ flex: 1 }} /><button className="sec">salvar</button></form>}
        </div>))}
      <form action={addTouch} style={{ marginTop: 12 }}><input type="hidden" name="contact_id" value={c.id} />
        <div className="row">
          <select name="touch_no" defaultValue={(touches.at(-1)?.touch_no || 0) + 1}>{[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>T{n}</option>)}</select>
          <select name="canal">{["whatsapp", "email", "linkedin", "ligacao"].map(x => <option key={x}>{x}</option>)}</select>
        </div>
        <p><textarea name="mensagem" rows={4} style={{ width: "100%" }} placeholder="Mensagem exatamente como enviada" required /></p>
        <p><input name="resposta" placeholder="Resposta (opcional)" style={{ width: "100%" }} /></p>
        <button>Registrar envio</button>
      </form>
    </div>

    <form action={updateAccount} className="card"><input type="hidden" name="account_id" value={c.account_id} />
      <input type="hidden" name="contact_id" value={c.id} />
      <h3>Conta: {c.empresa} <span className="mut">{c.domain} · {c.round}</span></h3>
      <div className="grid">{f("tese", "Tese", c.thesis)}
        <label>Status<br /><select name="status" defaultValue={c.acc_status}><option>ativa</option><option>descartada</option></select></label></div>
      <p><label>Radar (sinais públicos)<br /><textarea name="radar" rows={4} style={{ width: "100%" }} defaultValue={c.radar_notes || ""} /></label></p>
      <button>Salvar conta</button>
    </form>

    <form action={deleteContact}><input type="hidden" name="id" value={c.id} /><button className="sec">Excluir contato</button></form>
  </>);
}

import { neon } from "@neondatabase/serverless";
export const sql = neon(process.env.DATABASE_URL);

// Listas iguais às validações da planilha crm_livus
export const STAGES = ["Prospect", "Conexão", "Pipeline", "Recuperação", "Desqualificado", "Contato Incorreto", "Duplicado", "Redirecionado"];
export const PIPELINES = ["fora de pipe", "reunião agendada", "escopo", "proposta", "verbal agreement", "venda", "desqualificada", "perdida", "redirecionado"];
export const KANBAN = PIPELINES.slice(1);
export const CHANNELS = ["EMAIL", "WHATSAPP", "LINKEDIN", "INSTAGRAM", "LIGAÇÃO"];
export const TOUCH_STATUS = ["Enviado", "Recebido", "Respondido"];

// Todos os prospects com os 6 touches (t[0..5] = {channel,status,content})
export async function loadProspects() {
  const rows = await sql`
    select p.*, coalesce(json_agg(json_build_object('n', t.touch_no, 'channel', t.channel, 'status', t.status, 'content', t.content))
      filter (where t.touch_no is not null), '[]') as touches
    from prospects p left join prospect_touches t on t.prospect_id = p.id
    group by p.id order by p.created_on desc nulls last, p.code`;
  for (const r of rows) {
    const t = Array.from({ length: 6 }, () => ({}));
    for (const x of r.touches) t[x.n - 1] = x;
    r.t = t;
    r.week = weekOf(r.created_on);
  }
  return rows;
}

export function weekOf(d) {
  if (!d) return null;
  const x = new Date(d); const day = (x.getUTCDay() + 6) % 7; // segunda-feira
  x.setUTCDate(x.getUTCDate() - day);
  return x.toISOString().slice(0, 10);
}
export const daysSince = d => d ? Math.floor((Date.now() - new Date(d)) / 864e5) : null;
export const fmtDate = d => d ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "";
export const brl = v => v == null || v === "" ? "—" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

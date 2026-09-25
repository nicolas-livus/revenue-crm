// Conversão entre linhas da aba "Outbound Database" e o banco
import { STAGES, PIPELINES, weekOf, daysSince } from "./db";

export const HEADERS = ["Estratégia", "ID", "Nome", "Empresa", "LinkedIn", "Email", "Telefone", "Tem WhatsApp?", "Estágio", "Pipeline",
  "Ordem Estágio", "Data de Criação", ...[1, 2, 3, 4, 5, 6].flatMap(n => [`Touch ${n}`, `Canal Touch ${n}`, `Status Touch ${n}`]),
  "Reunião Agendada", "No Show", "Responsável", "Gancho de Recuperação", "Notas", "Semana", "Chave", "Seq Recuperação",
  "Valor da Proposta", "Data da Proposta", "Dias desde a Proposta"];

const str = v => (v == null || v === "" ? null : String(v).trim() || null);
const date = v => {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") return new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10);
  const m = String(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const d = new Date(v); return isNaN(d) ? null : d.toISOString().slice(0, 10);
};
const canon = (v, list) => { const s = str(v); if (!s) return null; return list.find(x => x.toLowerCase() === s.toLowerCase()) || s; };
const phone = v => { const s = str(v); return s && /^\d+(\.0)?$/.test(s) ? s.replace(/\.0$/, "") : s; };
const num = v => { if (v == null || v === "") return null; const n = Number(String(v).replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3})/g, "").replace(",", ".")); return isNaN(n) ? null : n; };

export function rowToRecord(o) {
  const g = k => o[k];
  return {
    code: str(g("ID")), strategy: str(g("Estratégia")), name: str(g("Nome")), company: str(g("Empresa")), linkedin: str(g("LinkedIn")),
    email: str(g("Email") ?? g("E-mail")), phone: phone(g("Telefone")), has_whatsapp: str(g("Tem WhatsApp?")),
    stage: canon(g("Estágio"), STAGES), pipeline: canon(g("Pipeline"), PIPELINES)?.toLowerCase() ?? null, created_on: date(g("Data de Criação")),
    meeting_scheduled: str(g("Reunião Agendada")) == null ? null : str(g("Reunião Agendada")).toLowerCase() === "sim",
    no_show: str(g("No Show")) == null ? null : str(g("No Show")).toLowerCase() === "sim",
    owner: str(g("Responsável")), hook: str(g("Gancho de Recuperação")), notes: str(g("Notas")),
    proposal_value: num(g("Valor da Proposta")), proposal_date: date(g("Data da Proposta")),
    touches: [1, 2, 3, 4, 5, 6].map(n => ({ touch_no: n, content: str(g(`Touch ${n}`)), channel: str(g(`Canal Touch ${n}`))?.toUpperCase() ?? null, status: str(g(`Status Touch ${n}`)) }))
      .filter(t => t.content || t.channel || t.status),
  };
}

export function recordToRow(p) {
  const yn = b => (b ? "Sim" : "");
  return [p.strategy, p.code, p.name, p.company, p.linkedin, p.email, p.phone, p.has_whatsapp, p.stage, p.pipeline,
    p.stage === "Pipeline" ? 2 : 1, p.created_on ? new Date(p.created_on) : null,
    ...p.t.flatMap(t => [t.content, t.channel, t.status]),
    yn(p.meeting_scheduled), yn(p.no_show), p.owner, p.hook, p.notes, p.week ? new Date(p.week) : null, null, null,
    p.proposal_value == null ? null : Number(p.proposal_value), p.proposal_date ? new Date(p.proposal_date) : null, daysSince(p.proposal_date)];
}
export { weekOf };

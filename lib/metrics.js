// Mesmas fórmulas da aba Revenue BI (base exclui Estágio = Redirecionado)
const AFTER = { "reunião agendada": 1, escopo: 2, proposta: 3, "verbal agreement": 4, venda: 5 };
const pl = p => (p.pipeline || "").toLowerCase().trim();
const at = (p, lvl) => (AFTER[pl(p)] || 0) >= lvl;
const div = (a, b) => (b ? a / b : null);

export const filled = p => p.t.filter(x => x.content).length;
export const isScheduled = p => p.meeting_scheduled || at(p, 1);

export function metrics(all) {
  const base = all.filter(p => p.stage !== "Redirecionado");
  const contacted = base.filter(p => p.t[0].content);
  const conexoes = base.filter(p => ["Conexão", "Pipeline"].includes(p.stage));
  const agendadas = base.filter(isScheduled);
  const noShows = agendadas.filter(p => p.no_show);
  const funnel = [
    ["Prospects (base)", base.length, "registros da base, exceto redirecionados"],
    ["Contatados (T1)", contacted.length, "Touch 1 preenchido"],
    ["Conexões", conexoes.length, "Estágio Conexão ou Pipeline"],
    ["Reuniões agendadas", agendadas.length, "Reunião Agendada = Sim ou Pipeline em reunião agendada ou adiante"],
    ["Reuniões realizadas", agendadas.length - noShows.length, "agendadas menos no-show"],
    ["Escopos", base.filter(p => at(p, 2)).length, "Pipeline em escopo ou adiante"],
    ["Propostas", base.filter(p => at(p, 3)).length, "Pipeline em proposta ou adiante"],
    ["Verbal agreement", base.filter(p => at(p, 4)).length, "Confirmação verbal pela sequência para fechamento"],
    ["Vendas", base.filter(p => at(p, 5)).length, "Pipeline = venda"],
  ].map(([label, n, def], i, arr) => ({ label, n, def, convStep: i ? div(n, arr[i - 1][1]) : null, convContacted: i > 1 ? div(n, contacted.length) : null }));
  const vendas = funnel[8].n;
  const touches = base.reduce((s, p) => s + filled(p), 0);
  const desq = base.filter(p => p.stage === "Desqualificado" || pl(p) === "desqualificada").length;
  const efficiency = [
    ["Prospects por agendamento", div(base.length, agendadas.length), "n", "quantos prospects a base consome para gerar 1 reunião"],
    ["Touches por agendamento", div(touches, agendadas.length), "n", "esforço de toques por reunião agendada"],
    ["Touches por prospect", div(touches, base.length), "n", "profundidade média da cadência"],
    ["Touches por venda", div(touches, vendas), "n", "esforço total por venda fechada"],
    ["Taxa de no-show", div(noShows.length, agendadas.length), "%", "reuniões agendadas que não aconteceram"],
    ["Taxa de resposta (T1→conexão)", div(conexoes.length, contacted.length), "%", "conexões sobre contatados"],
    ["Taxa de desqualificação", div(desq, base.length), "%", "base perdida por fit"],
    ["Cobertura de contato (T1)", div(contacted.length, base.length), "%", "quanto da base já foi trabalhada"],
    ["Prospects por venda", div(base.length, vendas), "n", "base necessária para 1 venda"],
  ];
  const open = base.filter(p => ["proposta", "verbal agreement"].includes(pl(p)));
  const withVal = base.filter(p => p.proposal_value != null);
  const openAges = open.filter(p => p.proposal_date).map(p => Math.floor((Date.now() - new Date(p.proposal_date)) / 864e5));
  const sum = a => a.reduce((s, p) => s + Number(p.proposal_value || 0), 0);
  const proposals = [
    ["Propostas em aberto", open.length, "n", "Pipeline em proposta ou verbal agreement"],
    ["Valor em aberto", sum(open), "R$", "soma do Valor da Proposta em proposta + verbal agreement"],
    ["Valor vendido", sum(base.filter(p => pl(p) === "venda")), "R$", "soma do Valor da Proposta com Pipeline = venda"],
    ["Ticket médio das propostas", div(sum(withVal), withVal.length), "R$", "média de todas as propostas com valor preenchido"],
    ["Dias médios desde a proposta", div(openAges.reduce((a, b) => a + b, 0), openAges.length), "n", "idade média das propostas em aberto"],
    ["Proposta aberta mais antiga (dias)", openAges.length ? Math.max(...openAges) : null, "n", "quanto tempo a proposta em aberto mais antiga está esperando"],
  ];
  return { funnel, efficiency, proposals };
}

// Consolidado por estratégia / por semana
export function consolidate(all, keyFn) {
  const g = new Map();
  for (const p of all.filter(p => p.stage !== "Redirecionado")) {
    const k = keyFn(p) ?? "(vazio)";
    const r = g.get(k) || { key: k, prospects: 0, linkedin: 0, email: 0, phone: 0, t: [0, 0, 0, 0, 0, 0], scheduled: 0, sales: 0 };
    r.prospects++; if (p.linkedin) r.linkedin++; if (p.email) r.email++; if (p.phone) r.phone++;
    p.t.forEach((x, i) => { if (x.content) r.t[i]++; });
    if (isScheduled(p)) r.scheduled++; if (pl(p) === "venda") r.sales++;
    g.set(k, r);
  }
  const rows = [...g.values()].sort((a, b) => String(a.key).localeCompare(String(b.key)));
  const total = rows.reduce((s, r) => ({ ...s, prospects: s.prospects + r.prospects, linkedin: s.linkedin + r.linkedin, email: s.email + r.email,
    phone: s.phone + r.phone, t: s.t.map((v, i) => v + r.t[i]), scheduled: s.scheduled + r.scheduled, sales: s.sales + r.sales }),
    { key: "TOTAL", prospects: 0, linkedin: 0, email: 0, phone: 0, t: [0, 0, 0, 0, 0, 0], scheduled: 0, sales: 0 });
  return { rows, total };
}

export const fmt = (v, kind) => v == null ? "—" : kind === "%" ? (v * 100).toFixed(1) + "%" :
  kind === "R$" ? Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : Number.isInteger(v) ? v : v.toFixed(1);

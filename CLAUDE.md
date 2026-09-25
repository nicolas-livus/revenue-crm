# Livus · CRM de prospecção

CRM do Nícolas (não-técnico) que substitui a planilha crm_livus + HTML de envios.
Stack: Next.js (App Router, server actions) · Neon Postgres (driver HTTP `@neondatabase/serverless`) · Vercel.

- Segredos ficam em `.env` (nunca commitar). Modelo em `.env.example`.
- Acesso protegido por senha única (`CRM_PASSWORD`), cookie via `middleware.js`.
- Espelha a planilha crm_livus_v2.xlsx: Database (`/`), Ficha do Prospect (`/prospects/[id]`), Revenue BI (`/bi`), Estratégias e Cadências (`/estrategias`), Banco de Recuperação (`/recuperacao`), Importar/Exportar xlsx (`/importar`, `/api/export`).
- Schema: `lib/schema.sql` → `npm run db:migrate`. Tabelas: prospects (1 linha = 1 linha da aba Outbound Database, casada pelo ID tipo ECOM-10M-A-001), prospect_touches (T1–T6: canal, status, conteúdo), strategies (link do CSV da cadência, observações).
- Métricas do BI em `lib/metrics.js` (mesmas fórmulas da aba Revenue BI; base exclui Estágio = Redirecionado). Listas de Estágio/Pipeline/Canal em `lib/db.js`.
- **Deploy: sempre `npm run deploy`** (API da Vercel com o token, time Livus AI). Nunca Vercel CLI nem integração GitHub — dá o erro "GitHub account is not a Vercel team member".
- Enriquecimento: treg.to (`lib/treg.js`, header `X-Treg-Token`, endpoint roteado `treg.people.email.find`, teto US$0,30/chamada). Apollo continua via MCP; treg é o fallback mais barato.
- Repositórios GitHub da Livus: sempre privados, na org https://github.com/Livus-AI
- Produção: https://revenue-crm-chi.vercel.app

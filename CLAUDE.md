# Livus · CRM de prospecção

CRM do Nícolas (não-técnico) que substitui a planilha crm_livus + HTML de envios.
Stack: Next.js (App Router, server actions) · Neon Postgres (driver HTTP `@neondatabase/serverless`) · Vercel.

- Segredos ficam em `.env` (nunca commitar). Modelo em `.env.example`.
- Acesso protegido por senha única (`CRM_PASSWORD`), cookie via `middleware.js`.
- Schema: `lib/schema.sql` → `npm run db:migrate`. Tabelas: accounts (empresa/rodada/tese/radar), contacts (etapa do funil), touches (T1–T6, mensagem enviada, resposta).
- **Deploy: sempre `npm run deploy`** (API da Vercel com o token, time Livus AI). Nunca Vercel CLI nem integração GitHub — dá o erro "GitHub account is not a Vercel team member".
- Enriquecimento: treg.to (`lib/treg.js`, header `X-Treg-Token`, endpoint roteado `treg.people.email.find`, teto US$0,30/chamada). Apollo continua via MCP; treg é o fallback mais barato.
- Repositórios GitHub da Livus: sempre privados, na org https://github.com/Livus-AI
- Produção: https://revenue-crm-chi.vercel.app

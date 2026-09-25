// Deploy para a Vercel via API usando o token (identidade do dono do token).
// Nunca via CLI/integração GitHub — evita o erro "GitHub account is not a Vercel team member".
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const env = {};
for (const l of readFileSync(".env", "utf8").split("\n")) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2]; }
const { VERCEL_TOKEN: TOKEN, VERCEL_TEAM_ID: TEAM } = env;
const PROJECT = "revenue-crm";
const api = async (path, opts = {}) => {
  const r = await fetch(`https://api.vercel.com${path}${path.includes("?") ? "&" : "?"}teamId=${TEAM}`, {
    ...opts, headers: { Authorization: `Bearer ${TOKEN}`, ...(opts.headers || {}) },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok && !opts.allowFail) throw new Error(`${path} ${r.status} ${JSON.stringify(j)}`);
  return j;
};
const json = body => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

// 1. projeto
let project = await api(`/v9/projects/${PROJECT}`, { allowFail: true });
if (!project.id) project = await api("/v11/projects", json({ name: PROJECT, framework: "nextjs" }));

// 2. variáveis de ambiente (upsert)
for (const key of ["DATABASE_URL", "TREG_TOKEN", "CRM_PASSWORD"]) {
  await api(`/v10/projects/${project.id}/env?upsert=true`,
    json({ key, value: env[key], type: "encrypted", target: ["production", "preview"] }));
}

// 3. upload dos arquivos
const IGNORE = new Set(["node_modules", ".next", ".git", ".env", ".vercel"]);
const walk = d => readdirSync(d).flatMap(f => IGNORE.has(f) ? [] :
  statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]);
const files = [];
for (const file of walk(".")) {
  const data = readFileSync(file), sha = createHash("sha1").update(data).digest("hex");
  await api("/v2/files", { method: "POST", body: data,
    headers: { "Content-Type": "application/octet-stream", "x-vercel-digest": sha, "Content-Length": String(data.length) } });
  files.push({ file, sha, size: data.length });
}

// 4. deployment de produção
let d = await api("/v13/deployments?skipAutoDetectionConfirmation=1",
  json({ name: PROJECT, project: project.id, target: "production", files, projectSettings: { framework: "nextjs" } }));
process.stdout.write(`deploy ${d.id} `);
while (!["READY", "ERROR", "CANCELED"].includes(d.readyState)) {
  await new Promise(r => setTimeout(r, 5000)); process.stdout.write(".");
  d = await api(`/v13/deployments/${d.id}`);
}
console.log(`\n${d.readyState}: https://${d.alias?.[0] || d.url}`);
if (d.readyState !== "READY") process.exit(1);

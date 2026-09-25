import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
for (const l of readFileSync(".env", "utf8").split("\n")) {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sql = neon(process.env.DATABASE_URL);
const ddl = readFileSync("lib/schema.sql", "utf8").split(";").map(s => s.trim()).filter(Boolean);
for (const s of ddl) await sql.query(s);
console.log("migração ok:", ddl.length, "comandos");

import { neon } from "@neondatabase/serverless";
export const sql = neon(process.env.DATABASE_URL);
export const STAGES = [
  ["novo", "Novo"], ["t1_enviado", "T1 enviado"], ["cadencia", "Em cadência"],
  ["respondeu", "Respondeu"], ["conexao", "Conexão"], ["reuniao", "Reunião"],
  ["ganho", "Ganho"], ["perdido", "Perdido"],
];

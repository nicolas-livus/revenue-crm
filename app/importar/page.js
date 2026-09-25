import { importSheet } from "@/lib/actions";
export default async function Importar({ searchParams }) {
  const { msg } = await searchParams;
  return (<>
    <h1>Importar / Exportar</h1>
    {msg && <p className="card">{msg}</p>}
    <form action={importSheet} className="card">
      <h3>Importar planilha</h3>
      <p className="mut">Aceita o crm_livus (.xlsx), o R##_99_crm.xlsx da skill 99 (abas novos / atualizar) ou CSV — qualquer aba com as colunas da “Outbound Database” (ID, Nome, Empresa, Touch 1…). Prospects são casados pelo <b>ID</b>: existentes são atualizados, novos são criados. Células vazias não apagam dados já salvos.</p>
      <input type="file" name="file" accept=".xlsx,.xls,.csv" required /> <button>Importar</button>
    </form>
    <div className="card">
      <h3>Exportar</h3>
      <p className="mut">Baixa a Database completa no mesmo formato da aba “Outbound Database” — use como entrada das skills (ex.: 01-dedup).</p>
      <a href="/api/export"><button type="button">Baixar crm_livus.xlsx</button></a>
    </div>
  </>);
}

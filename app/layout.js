import "./globals.css";
export const metadata = { title: "Livus CRM" };
const NAV = [["/", "Database"], ["/bi", "Revenue BI"], ["/estrategias", "Estratégias e Cadências"], ["/recuperacao", "Banco de Recuperação"], ["/importar", "Importar / Exportar"]];
export default function Layout({ children }) {
  return (<html lang="pt-BR"><body>
    <nav className="nav"><b>Livus · CRM</b>{NAV.map(([h, l]) => <a key={h} href={h}>{l}</a>)}</nav>
    <main>{children}</main></body></html>);
}

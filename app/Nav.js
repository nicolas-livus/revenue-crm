"use client";
import { usePathname } from "next/navigation";
import { Wordmark } from "./Logo";
const NAV = [["/", "Revenue BI"], ["/estrategias", "Estratégias e Cadências"], ["/recuperacao", "Banco de Recuperação"], ["/importar", "Importar / Exportar"]];
export default function Nav() {
  const path = usePathname();
  if (path === "/login") return null;
  return (<nav className="nav"><a href="/" className="brand"><Wordmark size={28} /><span className="tag">CRM</span></a>
    <div className="links">{NAV.map(([h, l]) => <a key={h} href={h} className={path === h ? "on" : ""}>{l}</a>)}</div></nav>);
}

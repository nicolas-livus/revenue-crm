import "./globals.css";
import Nav from "./Nav";
export const metadata = { title: "Livus · CRM", description: "inteligência implantada na operação." };
export default function Layout({ children }) {
  return (<html lang="pt-BR"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head><body><Nav /><main>{children}</main></body></html>);
}

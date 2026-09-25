import "./globals.css";
export const metadata = { title: "Livus CRM" };
export default function Layout({ children }) {
  return (<html lang="pt-BR"><body><main>{children}</main></body></html>);
}

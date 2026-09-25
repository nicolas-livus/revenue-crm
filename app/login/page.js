import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { token } from "@/lib/auth";

async function login(fd) {
  "use server";
  if (fd.get("pw") !== process.env.CRM_PASSWORD) redirect("/login?e=1");
  (await cookies()).set("crm_auth", await token(process.env.CRM_PASSWORD), {
    httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}
export default async function Login({ searchParams }) {
  const { e } = await searchParams;
  return (
    <form action={login} className="card login">
      <h1>Livus · CRM</h1>
      <input name="pw" type="password" placeholder="Senha" autoFocus />
      {e && <p className="err">Senha incorreta</p>}
      <button>Entrar</button>
    </form>
  );
}

"use client";
import { useState } from "react";
export default function CopyButton({ text }) {
  const [ok, setOk] = useState(false);
  return (<button type="button" onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}>
    {ok ? "Copiado ✓" : "Copiar mensagem"}</button>);
}

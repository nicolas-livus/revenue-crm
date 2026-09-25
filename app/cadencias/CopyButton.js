"use client";
import { useState } from "react";
export default function CopyButton({ text, label = "Copiar mensagem", className }) {
  const [ok, setOk] = useState(false);
  return (<button type="button" className={className} onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}>
    {ok ? "Copiado ✓" : label}</button>);
}

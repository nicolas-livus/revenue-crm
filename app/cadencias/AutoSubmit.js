"use client";
// Envia o formulário de filtros assim que uma caixa de seleção muda
export default function AutoSubmit({ children }) {
  return <form className="card row op-filters" onChange={e => e.currentTarget.requestSubmit()}>{children}</form>;
}

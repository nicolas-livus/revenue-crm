export async function token(pw) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("crm:" + pw));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}

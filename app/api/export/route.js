import * as XLSX from "xlsx";
import { loadProspects } from "@/lib/db";
import { HEADERS, recordToRow } from "@/lib/sheet";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = (await loadProspects()).sort((a, b) => a.code.localeCompare(b.code));
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows.map(recordToRow)], { cellDates: true });
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Outbound Database");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new Response(buf, { headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="crm_livus_${new Date().toISOString().slice(0, 10)}.xlsx"` } });
}

import { listLeads } from "@/lib/store";
import { STAGES } from "@/lib/types";

function esc(value: unknown): string {
  const s = value === undefined || value === null ? "" : String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const leads = await listLeads();
  const stageLabel = (id: string) => STAGES.find((s) => s.id === id)?.label ?? id;
  const header = [
    "Nome",
    "Nicho",
    "Cidade",
    "Telefone",
    "WhatsApp",
    "Site",
    "Rede social",
    "Endereco",
    "Score",
    "Etapa",
    "Observacoes",
    "Mensagem",
    "Latitude",
    "Longitude",
  ];
  const rows = leads.map((l) =>
    [
      l.name,
      l.nicheLabel ?? l.category ?? "",
      l.city ?? "",
      l.phone ?? "",
      l.whatsapp ?? "",
      l.website ?? "",
      l.social ?? "",
      l.address ?? "",
      l.score,
      stageLabel(l.stage),
      l.notes ?? "",
      l.message ?? "",
      l.lat,
      l.lon,
    ]
      .map(esc)
      .join(","),
  );
  const csv = "\uFEFF" + [header.map(esc).join(","), ...rows].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${stamp}.csv"`,
    },
  });
}

import { addLeads, listLeads } from "@/lib/store";
import { Lead } from "@/lib/types";

export async function GET() {
  const leads = await listLeads();
  return Response.json({ leads });
}

export async function POST(request: Request) {
  let body: { leads?: Lead[] };
  try {
    body = (await request.json()) as { leads?: Lead[] };
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const leads = Array.isArray(body?.leads) ? body.leads : [];
  if (!leads.length) {
    return Response.json({ error: "Nenhum lead enviado." }, { status: 400 });
  }
  const result = await addLeads(leads);
  return Response.json(result);
}

import { deleteLeads } from "@/lib/store";

export async function POST(request: Request) {
  let body: { ids?: string[] };
  try {
    body = (await request.json()) as { ids?: string[] };
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const ids = Array.isArray(body?.ids) ? body.ids : [];
  if (!ids.length) return Response.json({ removed: 0 });
  const removed = await deleteLeads(ids);
  return Response.json({ removed });
}

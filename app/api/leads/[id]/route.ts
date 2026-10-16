import { deleteLead, updateLead } from "@/lib/store";
import { Lead } from "@/lib/types";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  let patch: Partial<Lead>;
  try {
    patch = (await request.json()) as Partial<Lead>;
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  delete (patch as Record<string, unknown>).id;
  const updated = await updateLead(id, patch);
  if (!updated) return Response.json({ error: "Lead não encontrado" }, { status: 404 });
  return Response.json({ lead: updated });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const ok = await deleteLead(id);
  if (!ok) return Response.json({ error: "Lead não encontrado" }, { status: 404 });
  return Response.json({ ok: true });
}

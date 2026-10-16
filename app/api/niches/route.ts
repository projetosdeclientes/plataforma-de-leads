import { NICHES } from "@/lib/niches";

export async function GET() {
  return Response.json(
    NICHES.map((n) => ({ id: n.id, label: n.label, emoji: n.emoji })),
  );
}

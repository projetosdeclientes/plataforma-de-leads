import { runSearch } from "@/lib/search";
import { SearchInput } from "@/lib/types";

export async function POST(request: Request) {
  let body: SearchInput;
  try {
    body = (await request.json()) as SearchInput;
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body?.city || !body?.nicheId) {
    return Response.json({ error: "Informe cidade e nicho." }, { status: 400 });
  }

  try {
    const data = await runSearch(body);
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro na busca.";
    const isBotBlock = /captcha|recaptcha|robot|robô|bloque|anti-bot|cloudflare|verify|detected|automated/i.test(
      message,
    );
    return Response.json(
      {
        error: isBotBlock
          ? "Google bloqueou a busca temporariamente (proteção anti-bot). Aguarde 1–2 minutos e tente novamente com cidade mais específica ou limite menor."
          : message,
      },
      { status: 502 },
    );
  }
}

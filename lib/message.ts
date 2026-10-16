export interface MessageContext {
  name: string;
  nicheLabel?: string;
  city?: string;
  meuNome?: string;
}

export type MessageVariant = "direto" | "consultivo" | "curto" | "sem-site" | "social";

export const MESSAGE_VARIANTS: { id: MessageVariant; label: string }[] = [
  { id: "direto", label: "Direto ao ponto" },
  { id: "consultivo", label: "Consultivo" },
  { id: "curto", label: "Curto e casual" },
  { id: "sem-site", label: "Foco: sem site" },
  { id: "social", label: "Foco: só rede social" },
];

export function generateMessage(
  ctx: MessageContext,
  variant: MessageVariant = "direto",
): string {
  const negocio = ctx.name?.trim() || "seu negócio";
  const cidade = ctx.city?.trim();
  const onde = cidade ? ` em ${cidade}` : "";
  const eu = ctx.meuNome?.trim() || "[seu nome]";

  const templates: Record<MessageVariant, string> = {
    direto:
      `Olá! Falo com o(a) responsável pelo ${negocio}${onde}? ` +
      `Meu nome é ${eu} e eu crio sites para negócios locais. ` +
      `Percebi que o ${negocio} ainda não aparece com um site próprio na internet — ` +
      `e hoje a maioria das pessoas procura no Google antes de comprar ou contratar. ` +
      `Posso te mostrar em 2 minutos como um site simples poderia trazer mais clientes?`,

    consultivo:
      `Bom dia! Tudo bem? Meu nome é ${eu}, sou ${eu} e trabalho ajudando negócios${onde} a atrair mais clientes pela internet. ` +
      `Vi o ${negocio} e fiquei curioso: hoje vocês recebem clientes mais pelo boca a boca ou pelo Google/Instagram? ` +
      `Pergunto porque percebi que o ${negocio} não tem um site próprio — e isso costuma ser a diferença entre quem te acha e quem acha o concorrente. ` +
      `Se quiser, posso te mandar um exemplo pronto (sem compromisso). Faz sentido?`,

    curto:
      `Oi! Tudo bem? Sou ${eu}. Vi o ${negocio}${onde} e notei que vocês ainda não têm site próprio. ` +
      `Eu faço sites rápidos e baratos para negócios locais. Quer que eu te mostre um modelo?`,

    "sem-site":
      `Olá! ${eu} aqui. Encontrei o ${negocio}${onde} e vi que não há um site cadastrado no Google Maps. ` +
      `Isso significa que quando alguém procura "${ctx.nicheLabel || "o seu serviço"}"${onde}, ` +
      `provavelmente encontra o concorrente primeiro. ` +
      `Eu monto um site profissional para o ${negocio} e cuido de tudo. ` +
      `Consigo te mostrar um exemplo em poucos minutos — qual o melhor horário para conversar?`,

    social:
      `Oi! Sou ${eu}. Achei o ${negocio}${onde} pelo Instagram/rede social e curti o trabalho de vocês. ` +
      `Só notei que vocês não têm um site — e muita gente ainda procura no Google antes de chamar. ` +
      `Eu faço site justamente para negócios como o de vocês, com botão de WhatsApp e tudo. Quer dar uma olhada num modelo?`,
  };

  return templates[variant];
}

export function whatsappLink(phone: string | undefined, message: string): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 8) return undefined;
  if (!digits.startsWith("55")) digits = "55" + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

import { RawElement } from "./overpass";

export interface ScoreResult {
  score: number;
  reasons: string[];
}

export function scoreLead(el: RawElement): ScoreResult {
  const tags = el.tags ?? {};
  const reasons: string[] = [];
  let score = 0;

  const website =
    tags.website || tags["contact:website"] || tags.url || undefined;
  const social =
    tags["contact:instagram"] ||
    tags["contact:facebook"] ||
    tags.instagram ||
    tags.facebook ||
    undefined;
  const phone =
    tags["contact:phone"] ||
    tags.phone ||
    tags["contact:mobile"] ||
    tags.mobile ||
    tags["contact:whatsapp"] ||
    tags.whatsapp ||
    undefined;

  const socialOnly =
    !!website &&
    /instagram|facebook|fb\.me|linktr\.ee|wa\.me|whatsapp|tiktok/i.test(website);

  if (!website) {
    score += 55;
    reasons.push("Não tem site (+55)");
  } else if (socialOnly) {
    score += 42;
    reasons.push("Usa rede social no lugar do site (+42)");
  } else {
    score += 5;
    reasons.push("Já possui site próprio (+5)");
  }

  if (social) {
    score += 6;
    reasons.push("Tem rede social para contato (+6)");
  }

  if (phone) {
    score += 15;
    reasons.push("Telefone/WhatsApp disponível (+15)");
  } else {
    reasons.push("Sem telefone cadastrado (+0)");
  }

  if (tags["addr:street"]) {
    score += 8;
    reasons.push("Endereço completo (+8)");
  } else if (tags["addr:city"] || tags["addr:suburb"]) {
    score += 4;
    reasons.push("Localização parcial (+4)");
  }

  if (tags.opening_hours) {
    score += 6;
    reasons.push("Horário de funcionamento informado (+6)");
  }

  if (tags.cuisine || tags.description) {
    score += 4;
    reasons.push("Detalhes do negócio preenchidos (+4)");
  }

  if (tags["contact:email"] || tags.email) {
    score += 6;
    reasons.push("E-mail disponível (+6)");
  }

  const opening = tags.opening_date || tags["start_date"];
  if (opening) {
    const year = Number(String(opening).slice(0, 4));
    if (year && year >= new Date().getFullYear() - 2) {
      score += 5;
      reasons.push("Negócio recente (+5)");
    }
  }

  score = Math.max(0, Math.min(100, score));
  return { score, reasons };
}

import { getNiche } from "./niches";
import { scoreLead } from "./score";
import { generateMessage } from "./message";
import type { GeocodeResult, Lead, SearchInput, SearchResponse } from "./types";
import { searchBusinessesGmaps, isWebsiteLike } from "./gmaps";

function makeId(name: string, lat?: number, lon?: number) {
  const base = `${name}-${lat ?? "x"}-${lon ?? "x"}`.toLowerCase();
  return base.replace(/[^a-z0-9-_]+/g, "-");
}

function primaryCategory(nicheLabel: string): string {
  return nicheLabel.split(" ")[0] || nicheLabel;
}

function toLead(
  p: {
    name: string;
    address?: string;
    phone?: string;
    website?: string;
    social?: string;
    lat?: number;
    lon?: number;
    placeUrl?: string;
  },
  nicheLabel: string,
): Lead {
  const hasWebsite = !!p.website && isWebsiteLike(p.website);
  const onlySocial = !hasWebsite && !!p.social;
  const score = scoreLead({
    hasWebsite,
    hasPhone: !!p.phone,
    hasAddress: !!p.address,
  });

  const scoreReasons: string[] = [];
  if (p.phone) scoreReasons.push("Tem telefone/WhatsApp");
  if (p.address) scoreReasons.push("Endereço disponível");
  if (hasWebsite) scoreReasons.push("Tem site próprio");
  if (onlySocial) scoreReasons.push("Só tem rede social");
  if (!hasWebsite && !onlySocial) scoreReasons.push("Sem site e sem rede social visível");

  return {
    id: makeId(p.name, p.lat, p.lon),
    name: p.name,
    nicheId: "",
    nicheLabel,
    category: primaryCategory(nicheLabel),
    address: p.address,
    lat: p.lat,
    lon: p.lon,
    phone: p.phone,
    website: p.website,
    social: p.social,
    hasWebsite,
    onlySocial,
    score,
    scoreReasons,
    message: generateMessage(p.name),
    stage: "new",
    notes: p.placeUrl ? `Maps: ${p.placeUrl}` : "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export async function runSearch(input: SearchInput): Promise<SearchResponse> {
  const niche = getNiche(input.nicheId);
  if (!niche) throw new Error("Nicho não encontrado.");

  const city = input.city.trim();
  if (!city) throw new Error("Informe a cidade.");

  const limit = input.limit ?? 60;
  const requirePhone = input.requirePhone ?? false;

  const geocode: GeocodeResult = {
    lat: 0,
    lon: 0,
    displayName: city,
    osmId: undefined,
    areaId: undefined,
    boundingbox: undefined,
  };

  const raw = await searchBusinessesGmaps(geocode, niche, limit, requirePhone);

  let results = raw
    .filter((p) => {
      const hasSite = !!p.website && isWebsiteLike(p.website);
      const onlySoc = !hasSite && !!p.social;
      return !hasSite && !onlySoc;
    })
    .map((p) => toLead(p, niche.label));

  if (requirePhone) {
    results = results.filter((r) => !!r.phone);
  }

  results = results.slice(0, limit);

  return {
    results,
    geocode: {
      ...geocode,
      lat: results.find((r) => r.lat != null)?.lat ?? geocode.lat,
      lon: results.find((r) => r.lon != null)?.lon ?? geocode.lon,
    },
    total: results.length,
  };
}

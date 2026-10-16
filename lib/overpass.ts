import { Niche } from "./niches";
import { GeocodeResult } from "./types";

const USER_AGENT = "LeadSemSite/1.0 (ferramenta pessoal de prospecção)";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const OVERPASS_ATTEMPTS = 2;
const OVERPASS_BACKOFF_MS = 1500;
const RETRYABLE_STATUS = [429, 502, 503, 504];

export async function geocodeCity(city: string): Promise<GeocodeResult> {
  const url = `${NOMINATIM}?q=${encodeURIComponent(city)}&format=jsonv2&addressdetails=1&limit=1&countrycodes=br`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Geocodificação falhou (${res.status})`);
  const data = (await res.json()) as Array<{
    osm_type: string;
    osm_id: number;
    lat: string;
    lon: string;
    display_name: string;
    boundingbox?: [string, string, string, string];
  }>;
  if (!data.length) {
    throw new Error(`Cidade não encontrada: "${city}"`);
  }
  const r = data[0];
  let areaId: number | undefined;
  if (r.osm_type === "relation") areaId = 3600000000 + r.osm_id;
  else if (r.osm_type === "way") areaId = 2400000000 + r.osm_id;
  else areaId = 3600000000 + r.osm_id;
  return {
    displayName: r.display_name,
    lat: Number(r.lat),
    lon: Number(r.lon),
    areaId,
    boundingbox: r.boundingbox,
  };
}

function selectorToFilter(selector: Record<string, string>): string {
  return Object.entries(selector)
    .map(([k, v]) => `["${k}"="${v}"]`)
    .join("");
}

export interface RawElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export async function queryBusinesses(
  geo: GeocodeResult,
  niche: Niche,
  limit: number,
): Promise<RawElement[]> {
  const areaFilter = geo.areaId ? `area(${geo.areaId})` : "";
  const parts: string[] = [];
  for (const selector of niche.selectors) {
    const f = selectorToFilter(selector);
    parts.push(`node${f}(${areaFilter});`);
    parts.push(`way${f}(${areaFilter});`);
  }
  const body = `[out:json][timeout:90];\n(\n  ${parts.join("\n  ")}\n);\nout center tags ${limit};`;
  const bodyEncoded = "data=" + encodeURIComponent(body);

  let lastStatus: number | undefined;
  for (let attempt = 0; attempt < OVERPASS_ATTEMPTS; attempt++) {
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "User-Agent": USER_AGENT,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: bodyEncoded,
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as { elements?: RawElement[] };
          return data.elements ?? [];
        }
        lastStatus = res.status;
        if (!RETRYABLE_STATUS.includes(lastStatus)) {
          throw new Error(
            `Consulta ao OpenStreetMap falhou (${lastStatus}). Tente novamente em instantes.`,
          );
        }
      } catch (err) {
        const errorObj = err as { message?: string };
        const message = errorObj?.message;
        if (message && message.startsWith("Consulta ao OpenStreetMap falhou (")) {
          throw err;
        }
        // Network/fetch error: continue to next endpoint/attempt
      }
    }
    if (attempt < OVERPASS_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, OVERPASS_BACKOFF_MS * (attempt + 1)));
    }
  }
  throw new Error(
    `Consulta ao OpenStreetMap falhou (${lastStatus ?? 503}). Tente novamente em instantes.`,
  );
}

export function buildAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(", "),
    tags["addr:suburb"],
    tags["addr:city"],
  ].filter(Boolean);
  return parts.length ? parts.join(" - ") : undefined;
}

export function extractPhone(tags: Record<string, string>): string | undefined {
  const keys = [
    "contact:phone",
    "contact:mobile",
    "phone",
    "mobile",
    "contact:whatsapp",
    "whatsapp",
  ];
  for (const k of keys) {
    if (tags[k]) return tags[k];
  }
  return undefined;
}

export function extractWhatsapp(tags: Record<string, string>): string | undefined {
  for (const k of ["contact:whatsapp", "whatsapp"]) {
    if (tags[k]) return tags[k];
  }
  return undefined;
}

export function extractWebsite(tags: Record<string, string>): string | undefined {
  for (const k of ["website", "contact:website", "url"]) {
    if (tags[k]) return tags[k];
  }
  return undefined;
}

export function extractSocial(tags: Record<string, string>): string | undefined {
  for (const k of [
    "contact:instagram",
    "contact:facebook",
    "contact:facebook:page",
    "instagram",
    "facebook",
  ]) {
    if (tags[k]) return tags[k];
  }
  return undefined;
}

export function isSocialDomain(url: string | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes("instagram.com") ||
    u.includes("facebook.com") ||
    u.includes("fb.me") ||
    u.includes("linktr.ee") ||
    u.includes("wa.me") ||
    u.includes("whatsapp.com") ||
    u.includes("tiktok.com")
  );
}

export function normalizeWhatsappLink(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 8) return undefined;
  if (!digits.startsWith("55")) {
    digits = "55" + digits;
  }
  return `https://wa.me/${digits}`;
}

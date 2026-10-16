import { chromium, Browser, BrowserContext, Page } from "playwright";
import type { GeocodeResult } from "./types";
import type { Niche } from "./niches";

export interface GmapsPlace {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  social?: string;
  lat?: number;
  lon?: number;
  placeUrl?: string;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const SOCIAL_DOMAINS = [
  "instagram.com",
  "www.instagram.com",
  "facebook.com",
  "www.facebook.com",
  "fb.com",
  "www.fb.com",
  "m.facebook.com",
  "wa.me",
  "api.whatsapp.com",
  "whatsapp.com",
  "www.whatsapp.com",
  "tiktok.com",
  "www.tiktok.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "google.com/maps",
  "maps.app.goo.gl",
  "g.page",
  "linktr.ee",
  "bit.ly",
  "cutt.ly",
];

function isSocialDomain(u?: string | null): boolean {
  if (!u) return false;
  try {
    const url = new URL(u.startsWith("http") ? u : `https://${u}`);
    const h = url.hostname.toLowerCase();
    return SOCIAL_DOMAINS.some(
      (d) => h === d || h.endsWith(`.${d}`) || h.includes(d),
    );
  } catch {
    const s = (u || "").toLowerCase();
    return SOCIAL_DOMAINS.some((d) => s.includes(d));
  }
}

export function isWebsiteLike(u?: string | null): boolean {
  if (!u) return false;
  if (isSocialDomain(u)) return false;
  try {
    const url = new URL(u.startsWith("http") ? u : `https://${u}`);
    const h = url.hostname.toLowerCase();
    if (h === "google.com" || h.endsWith(".google.com")) return false;
    if (h === "maps.google.com") return false;
    return true;
  } catch {
    const s = (u || "").toLowerCase();
    if (s.includes("google.com/maps")) return false;
    if (s.includes("maps.app.goo.gl")) return false;
    if (s.includes("g.page")) return false;
    return s.startsWith("http") || s.includes(".");
  }
}

function normalizePhone(p?: string | null): string | undefined {
  if (!p) return undefined;
  const m = p.replace(/[^\d+]/g, "");
  if (m.startsWith("+55") || m.startsWith("55") || m.length >= 10) return m;
  return m || undefined;
}

function extractPhoneText(text: string): string | undefined {
  const m = text.match(
    /(\+?55\s?\d{2}\s?\d{4,5}-?\d{4}|\(\d{2}\)\s?\d{4,5}-?\d{4}|\d{4,5}-\d{4}|\+?\d{10,15})/,
  );
  if (m) return m[1];
  return undefined;
}

function extractWebsiteFromHref(href?: string | null): string | undefined {
  if (!href) return undefined;
  try {
    const u = new URL(href, "https://www.google.com");
    const q =
      u.searchParams.get("q") ||
      u.searchParams.get("url") ||
      u.searchParams.get("link");
    if (q) {
      const v = new URL(q);
      return v.origin + v.pathname.replace(/\/$/, "");
    }
    if (u.hostname.includes("google.com") && u.pathname.includes("/url")) {
      const q2 = u.searchParams.get("url");
      if (q2) {
        const v2 = new URL(q2);
        return v2.origin + v2.pathname.replace(/\/$/, "");
      }
    }
    if (!u.hostname.includes("google.com")) {
      return u.origin + u.pathname.replace(/\/$/, "");
    }
  } catch {}
  return undefined;
}

export async function searchBusinessesGmaps(
  geo: GeocodeResult,
  niche: Niche,
  limit: number,
  requirePhone = false,
): Promise<GmapsPlace[]> {
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--disable-features=AutomationControlled",
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
      ],
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      locale: "pt-BR",
      timezoneId: "America/Sao_Paulo",
      permissions: [],
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
      // @ts-ignore
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3],
      });
      Object.defineProperty(navigator, "languages", {
        get: () => ["pt-BR", "pt", "en-US", "en"],
      });
    });

    page = await context.newPage();

    const nicheLabel = niche.label;
    const city = geo.displayName;
    const q = `${nicheLabel} ${city}`;
    const url = `https://maps.google.com/maps/search/${encodeURIComponent(q)}`;

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    await sleep(rand(800, 1_500));

    const hasCaptcha = await page
      .locator("text=/captcha|I'm not a robot|não sou um robô|reCAPTCHA/i")
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false);
    if (hasCaptcha) {
      throw new Error(
        "Proteção do Google detectada (reCAPTCHA). Tente novamente em alguns minutos.",
      );
    }

    const feedSel = '[role="feed"], .Nv2PK, .m6QErb, .section-result';
    await page.waitForSelector(feedSel, { timeout: 60_000 }).catch(() => {});

    const places: GmapsPlace[] = [];
    let scrollAttempts = 0;
    const maxScroll = Math.min(20, Math.ceil(limit / 10) + 3);

    while (places.length < limit && scrollAttempts < maxScroll) {
      const cards = page.locator(
        '[role="feed"] [role="article"], .Nv2PK, .section-result',
      );
      const count = await cards.count();
      if (count === 0) break;

      for (let i = places.length; i < count && places.length < limit; i++) {
        try {
          const card = cards.nth(i);
          const title = (
            await card
              .locator("a[aria-label], .qBF1Pd, .fontHeadlineSmall")
              .first()
              .innerText()
              .catch(() => "")
          )?.trim();
          const subtitle = (
            await card
              .locator(".W4Efsd, .address, .Z8fK3b")
              .innerText()
              .catch(() => "")
          )?.trim();
          const fullText = `${title}\n${subtitle}`;

          let website: string | undefined;
          const webLink = card
            .locator(
              'a[href*="google.com/url"][href*="q=http"], a[data-value*="http"], .ab_button[href*="http"]',
            )
            .first();
          if (await webLink.isVisible().catch(() => false)) {
            const href = await webLink.getAttribute("href");
            website = extractWebsiteFromHref(href);
          }

          let lat: number | undefined;
          let lon: number | undefined;
          const placeUrlHref = await card
            .locator('a[href*="/maps/place/"]')
            .first()
            .getAttribute("href")
            .catch(() => undefined);
          if (placeUrlHref) {
            try {
              const pu = new URL(placeUrlHref, "https://maps.google.com");
              const ll = pu.searchParams.get("ll");
              if (ll) {
                const [la, lo] = ll.split(",");
                lat = parseFloat(la);
                lon = parseFloat(lo);
              }
            } catch {}
          }

          const phone = normalizePhone(
            extractPhoneText(fullText) ||
              extractPhoneText(subtitle || "") ||
              extractPhoneText(title || ""),
          );

          const socialHref = await card
            .locator(
              'a[href*="instagram"], a[href*="facebook"], a[href*="wa.me"], a[href*="tiktok"], a[href*="youtube"]',
            )
            .first()
            .getAttribute("href")
            .catch(() => undefined);
          const socialCandidate = extractWebsiteFromHref(socialHref);
          const social =
            socialCandidate && isSocialDomain(socialCandidate)
              ? socialCandidate
              : undefined;

          const wFinal = isWebsiteLike(website) ? website : undefined;
          const sFinal =
            !wFinal && social && isSocialDomain(social) ? social : undefined;

          if (requirePhone && !phone) continue;

          places.push({
            name: title || "Sem nome",
            address: subtitle || undefined,
            phone,
            website: wFinal,
            social: sFinal,
            lat,
            lon,
            placeUrl: placeUrlHref
              ? new URL(placeUrlHref, "https://maps.google.com").toString()
              : undefined,
          });
        } catch {
          // ignora card individual
        }
      }

      await page.mouse.wheel(0, 1_200 + rand(200, 400));
      await sleep(rand(900, 1_600));
      scrollAttempts++;
    }

    const seen = new Set<string>();
    const deduped = places.filter((p) => {
      const k = `${p.name.toLowerCase()}|${(p.address || "").toLowerCase()}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return deduped.slice(0, limit);
  } finally {
    await page?.close().catch(() => {});
    await context?.close().catch(() => {});
    await browser?.close().catch(() => {});
  }
}

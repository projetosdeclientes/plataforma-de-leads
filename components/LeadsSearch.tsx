"use client";

import { useEffect, useState } from "react";
import type { GeocodeResult, Lead } from "@/lib/types";

interface NicheOption {
  id: string;
  label: string;
  emoji: string;
}

function scoreColor(score: number) {
  if (score >= 75) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  if (score >= 50) return "bg-amber-500/20 text-amber-300 border-amber-500/40";
  return "bg-slate-500/20 text-slate-300 border-slate-500/40";
}

export default function LeadsSearch() {
  const [niches, setNiches] = useState<NicheOption[]>([]);
  const [city, setCity] = useState("");
  const [nicheId, setNicheId] = useState("");
  const [limit, setLimit] = useState(60);
  const [requirePhone, setRequirePhone] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Lead[]>([]);
  const [geocode, setGeocode] = useState<GeocodeResult | null>(null);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/niches")
      .then((r) => r.json())
      .then((data: NicheOption[]) => {
        setNiches(data);
        if (data.length) setNicheId(data[0].id);
      })
      .catch(() => setError("Não foi possível carregar os nichos."));
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim() || !nicheId) return;
    setLoading(true);
    setError(null);
    setFeedback(null);
    setResults([]);
    setSelected(new Set());
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, nicheId, limit, requirePhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na busca.");
      setResults(data.results as Lead[]);
      setGeocode(data.geocode as GeocodeResult);
      setTotal(data.total as number);
      setSelected(new Set((data.results as Lead[]).map((l) => l.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro na busca.");
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function addSelected() {
    const chosen = results.filter((l) => selected.has(l.id));
    if (!chosen.length) return;
    setFeedback(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: chosen }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar.");
      setFeedback(`${data.added} adicionados. ${data.skipped} já estavam no CRM.`);
      setSelected(new Set());
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  const selectedCount = selected.size;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Buscar leads sem site</h1>
        <p className="mt-1 text-sm text-slate-400">
          Encontra negócios reais no OpenStreetMap que ainda não têm site próprio.
          Dados públicos, grátis e sem chave de API.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1.5fr_1.5fr_0.8fr_auto] md:items-end"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-400">
            Cidade (ou cidade + estado)
          </span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex.: Campinas, SP"
            className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500/60"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-400">Nicho</span>
          <select
            value={nicheId}
            onChange={(e) => setNicheId(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/60"
          >
            {niches.map((n) => (
              <option key={n.id} value={n.id}>
                {n.emoji} {n.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-400">Máx. resultados</span>
          <input
            type="number"
            min={1}
            max={200}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/60"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="h-[42px] rounded-lg bg-emerald-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? "Buscando…" : "Buscar"}
        </button>

        <label className="flex items-center gap-2 text-sm text-slate-300 md:col-span-4">
          <input
            type="checkbox"
            checked={requirePhone}
            onChange={(e) => setRequirePhone(e.target.checked)}
            className="h-4 w-4 accent-emerald-500"
          />
          Mostrar apenas negócios com telefone/WhatsApp cadastrado
        </label>
      </form>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {geocode && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-400">
            <span className="text-slate-200">
              {results.length} de {total}
            </span>{" "}
            negócios sem site · {geocode.displayName}
          </div>
          <div className="flex items-center gap-3">
            {feedback && (
              <span className="text-sm text-emerald-300">{feedback}</span>
            )}
            <button
              onClick={addSelected}
              disabled={selectedCount === 0}
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-40"
            >
              ➕ Adicionar {selectedCount || ""} ao CRM
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {results.map((l) => (
          <div
            key={l.id}
            className={`rounded-xl border bg-white/[0.03] p-4 transition ${
              selected.has(l.id)
                ? "border-emerald-500/50"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <label className="flex flex-1 cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(l.id)}
                  onChange={() => toggle(l.id)}
                  className="mt-0.5 h-4 w-4 accent-emerald-500"
                />
                <div>
                  <div className="font-semibold leading-tight text-white">
                    {l.name}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {l.nicheLabel}
                    {l.onlySocial ? " · só rede social" : " · sem site"}
                  </div>
                </div>
              </label>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${scoreColor(
                  l.score,
                )}`}
              >
                {l.score}
              </span>
            </div>

            <div className="mt-3 space-y-1 text-xs text-slate-400">
              {l.address && <div>📍 {l.address}</div>}
              {l.phone && <div>📞 {l.phone}</div>}
              {l.social && <div>🔗 {l.social}</div>}
              {l.openingHours && <div>🕒 {l.openingHours}</div>}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {l.scoreReasons.slice(0, 3).map((r) => (
                <span
                  key={r}
                  className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-slate-400"
                >
                  {r}
                </span>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 underline-offset-2 hover:text-emerald-300 hover:underline"
              >
                Ver no mapa
              </a>
            </div>
          </div>
        ))}
      </div>

      {!loading && !error && geocode && results.length === 0 && (
        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-400">
          Nenhum negócio sem site encontrado para esse nicho nessa cidade.
          Tente outro nicho ou uma cidade maior.
        </div>
      )}
    </main>
  );
}

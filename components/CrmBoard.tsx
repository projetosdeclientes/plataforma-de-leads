"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Lead, STAGES, Stage } from "@/lib/types";
import LeadDrawer from "./LeadDrawer";

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-300";
  if (score >= 50) return "text-amber-300";
  return "text-slate-400";
}

function fmtPhone(p?: string) {
  return p ? p : "—";
}

export default function CrmBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<Stage | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/leads");
        const data = await res.json();
        if (!cancelled) setLeads(data.leads as Lead[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.city ?? "").toLowerCase().includes(q) ||
        (l.nicheLabel ?? "").toLowerCase().includes(q),
    );
  }, [leads, query]);

  const byStage = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of STAGES) map[s.id] = [];
    for (const l of filtered) (map[l.stage] ??= []).push(l);
    return map;
  }, [filtered]);

  const stats = useMemo(() => {
    const total = leads.length;
    const comTelefone = leads.filter((l) => l.phone || l.whatsapp).length;
    const fechados = leads.filter((l) => l.stage === "fechado").length;
    const media = total
      ? Math.round(leads.reduce((a, l) => a + l.score, 0) / total)
      : 0;
    return { total, comTelefone, fechados, media };
  }, [leads]);

  async function moveTo(id: string, stage: Stage) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage } : l)));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
  }

  function onDrop(stage: Stage) {
    if (dragId) moveTo(dragId, stage);
    setDragId(null);
    setOverStage(null);
  }

  const openLead = leads.find((l) => l.id === openId) ?? null;

  return (
    <main className="flex flex-1 flex-col px-4 py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Meu CRM</h1>
            <p className="mt-1 text-sm text-slate-400">
              Arraste os cartões entre as etapas. Clique para ver detalhes e gerar
              a mensagem.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar por nome, cidade, nicho…"
              className="w-64 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500/60"
            />
            <a
              href="/api/export"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Exportar CSV
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total no CRM", value: stats.total },
            { label: "Com telefone", value: stats.comTelefone },
            { label: "Fechados", value: stats.fechados },
            { label: "Score médio", value: stats.media },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">Carregando…</div>
        ) : leads.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center text-slate-400">
            Seu CRM está vazio. Vá em{" "}
            <Link href="/" className="text-emerald-300 underline">
              Buscar Leads
            </Link>{" "}
            e adicione negócios.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map((s) => (
              <div
                key={s.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverStage(s.id);
                }}
                onDragLeave={() => setOverStage((v) => (v === s.id ? null : v))}
                onDrop={() => onDrop(s.id)}
                className={`flex w-72 shrink-0 flex-col rounded-xl border p-3 transition ${
                  overStage === s.id
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: s.cor }}
                    />
                    <span className="text-sm font-semibold text-white">
                      {s.label}
                    </span>
                  </div>
                  <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                    {byStage[s.id]?.length ?? 0}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {(byStage[s.id] ?? []).map((l) => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={() => setDragId(l.id)}
                      onClick={() => setOpenId(l.id)}
                      className="cursor-pointer rounded-lg border border-white/10 bg-slate-900/70 p-3 transition hover:border-emerald-500/40 hover:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium leading-tight text-white">
                          {l.name}
                        </span>
                        <span
                          className={`text-xs font-bold ${scoreColor(l.score)}`}
                        >
                          {l.score}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {l.nicheLabel}
                        {l.city ? ` · ${l.city}` : ""}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{fmtPhone(l.phone)}</span>
                        {l.onlySocial && (
                          <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-sky-300">
                            rede social
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {openLead && (
        <LeadDrawer
          lead={openLead}
          onClose={() => setOpenId(null)}
          onChanged={(updated) =>
            setLeads((prev) =>
              prev.map((l) => (l.id === updated.id ? updated : l)),
            )
          }
          onDeleted={(id) =>
            setLeads((prev) => prev.filter((l) => l.id !== id))
          }
        />
      )}
    </main>
  );
}

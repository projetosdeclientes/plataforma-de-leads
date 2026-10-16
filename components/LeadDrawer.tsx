"use client";

import { useState } from "react";
import { Lead, STAGES, Stage } from "@/lib/types";
import {
  generateMessage,
  MESSAGE_VARIANTS,
  MessageVariant,
  whatsappLink,
} from "@/lib/message";

interface Props {
  lead: Lead;
  onClose: () => void;
  onChanged: (lead: Lead) => void;
  onDeleted: (id: string) => void;
}

export default function LeadDrawer({ lead, onClose, onChanged, onDeleted }: Props) {
  const [stage, setStage] = useState<Stage>(lead.stage);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [variant, setVariant] = useState<MessageVariant>("direto");
  const [meuNome, setMeuNome] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("lead-sem-site:nome") ?? ""
      : "",
  );
  const [message, setMessage] = useState(lead.message ?? "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const phone = lead.whatsapp || lead.phone;

  function buildMessage(v: MessageVariant = variant) {
    const text = generateMessage(
      {
        name: lead.name,
        nicheLabel: lead.nicheLabel,
        city: lead.city,
        meuNome: meuNome || undefined,
      },
      v,
    );
    setMessage(text);
    if (typeof window !== "undefined" && meuNome) {
      localStorage.setItem("lead-sem-site:nome", meuNome);
    }
  }

  async function persist(patch: Partial<Lead>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok) onChanged(data.lead as Lead);
    } finally {
      setSaving(false);
    }
  }

  async function changeStage(v: Stage) {
    setStage(v);
    await persist({ stage: v });
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  async function openWhatsapp() {
    await persist({ message });
    const link = whatsappLink(phone, message);
    if (link) window.open(link, "_blank");
  }

  async function removeLead() {
    if (!confirm(`Excluir "${lead.name}" do CRM?`)) return;
    const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted(lead.id);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-white/10 bg-slate-950 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">{lead.name}</h2>
            <p className="text-sm text-slate-400">
              {lead.nicheLabel}
              {lead.city ? ` · ${lead.city}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-2.5 py-1 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-300">
            Score {lead.score}
          </span>
          {lead.onlySocial && (
            <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs text-sky-300">
              só rede social
            </span>
          )}
          {!lead.phone && !lead.whatsapp && (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
              sem telefone
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-300">
          {lead.address && <div>📍 {lead.address}</div>}
          {lead.phone && <div>📞 {lead.phone}</div>}
          {lead.email && <div>✉️ {lead.email}</div>}
          {lead.social && (
            <a
              href={lead.social.startsWith("http") ? lead.social : `https://${lead.social}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-300 hover:underline"
            >
              🔗 Rede social
            </a>
          )}
          {lead.website && <div>🌐 {lead.website}</div>}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lead.lat},${lead.lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-emerald-300 hover:underline"
          >
            Ver no mapa ↗
          </a>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-slate-400">Etapa</label>
          <select
            value={stage}
            onChange={(e) => changeStage(e.target.value as Stage)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/60"
          >
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-slate-400">
            Observações
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => persist({ notes })}
            rows={2}
            placeholder="Anotações sobre o contato…"
            className="mt-1 w-full resize-y rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500/60"
          />
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h3 className="text-sm font-semibold text-white">
            Mensagem de WhatsApp
          </h3>

          <div className="mt-3">
            <label className="text-xs font-medium text-slate-400">Seu nome</label>
            <input
              value={meuNome}
              onChange={(e) => setMeuNome(e.target.value)}
              placeholder="Como você quer assinar"
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500/60"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {MESSAGE_VARIANTS.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setVariant(v.id);
                  buildMessage(v.id);
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
                  variant === v.id
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 text-slate-300 hover:bg-white/5"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => buildMessage()}
            className="mt-3 w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
          >
            ✨ Gerar mensagem
          </button>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="A mensagem aparecerá aqui. Você pode editar antes de enviar."
            className="mt-3 w-full resize-y rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500/60"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={openWhatsapp}
              disabled={!phone || !message}
              className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Abrir no WhatsApp
            </button>
            <button
              onClick={copyMessage}
              disabled={!message}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-40"
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
          {!phone && (
            <p className="mt-2 text-xs text-amber-300/80">
              Este lead não tem telefone no OpenStreetMap. Use a busca do Google
              para encontrar o contato.
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-5">
          <button
            onClick={removeLead}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Excluir lead
          </button>
          <span className="text-xs text-slate-500">
            {saving ? "Salvando…" : "Salvo automaticamente"}
          </span>
        </div>
      </aside>
    </div>
  );
}

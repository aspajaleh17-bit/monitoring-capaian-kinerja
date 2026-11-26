import React, { useState } from 'react';
import { Check, Copy, Mail, Send } from 'lucide-react';
import { SubdirektoratSummaryRow } from '../types/kinerja';
import { formatTanggalIndonesia } from '../utils/kinerjaEngine';

interface ReminderDraftsSectionProps {
  rows: SubdirektoratSummaryRow[];
  onIncrementSent: (subdirektorat: string) => void;
}

export const ReminderDraftsSection: React.FC<ReminderDraftsSectionProps> = ({
  rows,
  onIncrementSent,
}) => {
  const [copiedSubdit, setCopiedSubdit] = useState<string | null>(null);

  const draftRows = rows.filter((r) => r.draftPesan !== null);

  const handleCopyDraft = async (subdit: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSubdit(subdit);
      setTimeout(() => setCopiedSubdit(null), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Draf Pengingat Subdirektorat
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Seluruh pesan disiapkan sebagai SARAN (belum dikirim otomatis). Salin lalu kirim melalui jalur koordinasi resmi.
          </p>
        </div>

        <div className="font-mono text-xs text-slate-600 tabular-nums">
          <strong className="text-slate-900">{draftRows.length}</strong> draf siap disalin
        </div>
      </div>

      {draftRows.length === 0 ? (
        <div className="rounded-xl border border-slate-200/90 bg-white p-10 text-center text-xs text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          Seluruh subdirektorat pada filter saat ini telah lengkap atau belum ada draf yang perlu disiapkan.
        </div>
      ) : (
        <div className="space-y-4">
          {draftRows.map((row) => (
            <article
              key={row.subdirektorat}
              className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {row.subdirektorat}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-amber-800">
                      DRAF, belum dikirim
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{row.draftStage}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {row.draftKalimatCount} kalimat
                    </span>
                    {row.tenggatTerdekat && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>
                          Tenggat {formatTanggalIndonesia(row.tenggatTerdekat)} ({row.sisaHariLabel})
                        </span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Terkirim: {row.pengingatTerkirim}x
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onIncrementSent(row.subdirektorat)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
                  >
                    <Send className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                    <span>Catat Terkirim (+1)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyDraft(row.subdirektorat, row.draftPesan || '')
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
                  >
                    {copiedSubdit === row.subdirektorat ? (
                      <>
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Salin Pesan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-800">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <p>{row.draftPesan}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

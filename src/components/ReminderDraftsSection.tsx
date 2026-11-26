import React, { useState } from 'react';
import { Check, Copy, Send } from 'lucide-react';
import {
  MonitoringReport,
  SubdirektoratSummaryRow,
} from '../types/kinerja';

interface ReminderDraftsSectionProps {
  report: MonitoringReport;
  filteredRows: SubdirektoratSummaryRow[];
  selectedSubdit: string | null;
  onClearSelectedSubdit: () => void;
  onUpdateReminderCount: (subdit: string, nextCount: number) => void;
}

export const ReminderDraftsSection: React.FC<ReminderDraftsSectionProps> = ({
  report,
  filteredRows,
  selectedSubdit,
  onClearSelectedSubdit,
  onUpdateReminderCount,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (report.blockedBySecurity || !report.missingInput.isComplete) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Penyusunan draf pengingat menunggu data masukan lengkap dan bebas dari data terlarang.
      </div>
    );
  }

  const draftRows = (
    selectedSubdit
      ? filteredRows.filter((r) => r.subdirektorat === selectedSubdit)
      : filteredRows
  ).filter((r) => r.draftPesan !== null);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(key);
      setTimeout(() => setCopiedId((prev) => (prev === key ? null : prev)), 2000);
    } catch {
      // Fallback ignored in restricted clipboard contexts
    }
  };

  const handleCopyAll = async () => {
    const combined = draftRows
      .map(
        (r) =>
          `[${r.subdirektorat}] — DRAF, belum dikirim (${r.draftStage})\n${r.draftPesan}`
      )
      .join('\n\n---\n\n');
    await handleCopy('all-drafts', combined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            3. Draf Pengingat per Subdirektorat
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Seluruh pesan berstatus DRAF, belum dikirim. Salin teks di bawah lalu kirim secara manual melalui saluran resmi Direktorat.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedSubdit && (
            <button
              type="button"
              onClick={onClearSelectedSubdit}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Semua Subdirektorat
            </button>
          )}
          {draftRows.length > 0 && (
            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
            >
              {copiedId === 'all-drafts' ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Semua Draf Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Salin Semua Draf</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {draftRows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-1">
          <p className="text-sm font-semibold text-slate-900">
            Tidak ada draf pengingat yang perlu disiapkan
          </p>
          <p className="text-xs text-slate-500">
            Subdirektorat yang ditampilkan sudah lengkap menurut daftar wajib.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {draftRows.map((row) => {
            const isOverdue = row.sisaHariAngka !== null && row.sisaHariAngka < 0;
            return (
              <article
                key={row.subdirektorat}
                className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {row.subdirektorat}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="font-semibold text-amber-800">
                        DRAF, belum dikirim
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          isOverdue
                            ? 'font-medium text-rose-700'
                            : 'font-medium text-slate-700'
                        }
                      >
                        Tahap: {row.draftStage}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-500">
                        {row.draftKalimatCount} kalimat
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-500">
                        Terkirim sebelumnya: {row.pengingatTerkirim}x
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateReminderCount(
                          row.subdirektorat,
                          row.pengingatTerkirim + 1
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
                      title="Catat jika Anda sudah mengirim draf ini secara manual"
                    >
                      <Send className="h-3 w-3" aria-hidden="true" />
                      <span>Catat +1 Terkirim</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(row.subdirektorat, row.draftPesan || '')
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
                    >
                      {copiedId === row.subdirektorat ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Disalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Salin Draf</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
                  {row.draftPesan}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

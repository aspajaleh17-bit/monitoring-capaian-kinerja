import React, { useEffect, useState } from 'react';
import { Clock, X } from 'lucide-react';
import { SubdirektoratSummaryRow } from '../types/kinerja';
import { formatTanggalIndonesia } from '../utils/kinerjaEngine';

interface UrgentDeadlineBannerProps {
  subdirektoratRows: SubdirektoratSummaryRow[];
  tanggalHariIni: string;
  onInspectSubdit: (subdit: string) => void;
  onGoToDrafts: (subdit: string) => void;
}

export const UrgentDeadlineBanner: React.FC<UrgentDeadlineBannerProps> = ({
  subdirektoratRows,
  tanggalHariIni,
  onInspectSubdit,
  onGoToDrafts,
}) => {
  const urgentWithin24h = subdirektoratRows.filter(
    (row) =>
      row.status !== 'Sudah lengkap menurut daftar' &&
      row.sisaHariAngka !== null &&
      row.sisaHariAngka >= 0 &&
      row.sisaHariAngka <= 1
  );

  const signature = `${tanggalHariIni}|${urgentWithin24h
    .map((r) => `${r.subdirektorat}:${r.sisaHariAngka}`)
    .join(',')}`;

  const [dismissedSignature, setDismissedSignature] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (dismissedSignature && dismissedSignature !== signature) {
      setDismissedSignature(null);
    }
  }, [signature, dismissedSignature]);

  if (urgentWithin24h.length === 0 || dismissedSignature === signature) {
    return null;
  }

  return (
    <div
      role="alert"
      className="no-print mb-6 rounded-xl border border-rose-300 bg-rose-50 px-5 py-4 text-rose-950"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Clock
            className="mt-0.5 h-5 w-5 shrink-0 text-rose-700"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <div>
              <h2 className="text-sm font-bold text-rose-950">
                Peringatan Mendesak: Tenggat Kurang dari 24 Jam ({urgentWithin24h.length} Subdirektorat)
              </h2>
              <p className="mt-0.5 text-xs text-rose-900">
                Subdirektorat berikut belum lengkap dan batas waktu pengumpulan data dukungnya jatuh pada hari ini atau besok.
              </p>
            </div>

            <ul className="space-y-2">
              {urgentWithin24h.map((row) => (
                <li
                  key={row.subdirektorat}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-white px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {row.subdirektorat}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                      <span className="font-mono font-semibold text-rose-700 tabular-nums">
                        {row.sisaHariAngka === 0
                          ? 'Jatuh hari ini (< 24 jam)'
                          : 'Besok (≤ 24 jam)'}
                      </span>
                      {row.tenggatTerdekat && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            Tenggat {formatTanggalIndonesia(row.tenggatTerdekat)}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{row.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => onInspectSubdit(row.subdirektorat)}
                      className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap"
                    >
                      Cek Kelengkapan
                    </button>
                    {row.draftPesan && (
                      <button
                        type="button"
                        onClick={() => onGoToDrafts(row.subdirektorat)}
                        className="rounded-md bg-rose-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-800 whitespace-nowrap"
                      >
                        Buka Draf Pengingat
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          type="button"
          aria-label="Tutup banner peringatan tenggat"
          onClick={() => setDismissedSignature(signature)}
          className="rounded-lg p-1 text-rose-700 hover:bg-rose-100 shrink-0"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

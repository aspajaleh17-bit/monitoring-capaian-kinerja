import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import {
  CheckOutcome,
  MonitoringReport,
  SubdirektoratSummaryRow,
} from '../types/kinerja';
import { formatTanggalIndonesia } from '../utils/kinerjaEngine';

interface CompletenessAuditSectionProps {
  report: MonitoringReport;
  filteredRows: SubdirektoratSummaryRow[];
  selectedSubdit: string | null;
  onClearSelectedSubdit: () => void;
}

function OutcomeBadge({ outcome }: { outcome: CheckOutcome }) {
  if (outcome === 'Sesuai') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Sesuai</span>
      </span>
    );
  }
  if (outcome === 'Kurang') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Kurang</span>
      </span>
    );
  }
  if (outcome === 'Perlu Verifikasi') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
        <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Perlu Verifikasi</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
      <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Belum Ada</span>
    </span>
  );
}

function CellCheck({ value }: { value: boolean | 'Tidak wajib' | 'Tidak diketahui' }) {
  if (value === true) {
    return <span className="font-medium text-emerald-700">Ya</span>;
  }
  if (value === false) {
    return <span className="font-medium text-rose-700">Tidak</span>;
  }
  if (value === 'Tidak wajib') {
    return <span className="text-slate-400">Tidak wajib</span>;
  }
  return <span className="font-medium text-amber-700">Tidak diketahui</span>;
}

export const CompletenessAuditSection: React.FC<CompletenessAuditSectionProps> = ({
  report,
  filteredRows,
  selectedSubdit,
  onClearSelectedSubdit,
}) => {
  if (report.blockedBySecurity || !report.missingInput.isComplete) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Pemeriksaan kelengkapan menunggu data masukan lengkap dan bebas dari data terlarang. Silakan lihat tab Ringkasan atau perbaiki pada Input Data.
      </div>
    );
  }

  const rowsToDisplay = selectedSubdit
    ? filteredRows.filter((r) => r.subdirektorat === selectedSubdit)
    : filteredRows;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Cek Kelengkapan Data per Dokumen
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Membandingkan setiap data masuk terhadap daftar wajib: keberadaan dokumen, periode ({report.periodeTarget}), format berkas, dan status tanda tangan.
          </p>
        </div>

        {selectedSubdit && (
          <button
            type="button"
            onClick={onClearSelectedSubdit}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Tampilkan Semua Subdirektorat
          </button>
        )}
      </div>

      {rowsToDisplay.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Tidak ada subdirektorat yang ditampilkan sesuai filter saat ini.
        </div>
      ) : (
        <div className="space-y-6">
          {rowsToDisplay.map((row) => (
            <section
              key={row.subdirektorat}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {row.subdirektorat}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    <span>Status: {row.status}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono tabular-nums">{row.sisaHariLabel}</span>
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        Dokumen Wajib & Rujukan Masuk
                      </th>
                      <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        Ada
                      </th>
                      <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        Periode
                      </th>
                      <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        Format
                      </th>
                      <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        Tanda Tangan
                      </th>
                      <th scope="col" className="px-4 py-2.5 font-semibold whitespace-nowrap">
                        Hasil Cek
                      </th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        Alasan Penilaian
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {row.auditItems.map((item) => (
                      <tr key={item.id} className="align-top hover:bg-slate-50/70">
                        <td className="px-4 py-3 min-w-[220px]">
                          <div className="font-semibold text-slate-900">
                            {item.requiredDoc.namaDokumen}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            <span>Wajib: {item.requiredDoc.formatWajib || 'Bebas'}</span>
                            <span aria-hidden="true"> · </span>
                            <span>
                              {item.requiredDoc.perluTandaTangan
                                ? 'Perlu TTD'
                                : 'Tanpa TTD'}
                            </span>
                            {item.requiredDoc.tenggat && (
                              <>
                                <span aria-hidden="true"> · </span>
                                <span>
                                  Tenggat {formatTanggalIndonesia(item.requiredDoc.tenggat)}
                                </span>
                              </>
                            )}
                          </div>
                          {item.matchedSubmittedDoc && (
                            <div className="mt-1.5 text-[11px] text-slate-700">
                              <span className="font-medium">Dirujuk dari masuk:</span>{' '}
                              {item.matchedSubmittedDoc.namaDokumen} (
                              {formatTanggalIndonesia(item.matchedSubmittedDoc.tanggalMasuk)})
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <CellCheck value={item.checks.ada} />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <CellCheck value={item.checks.sesuaiPeriode} />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <CellCheck value={item.checks.sesuaiFormat} />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <CellCheck value={item.checks.sudahTtd} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <OutcomeBadge outcome={item.outcome} />
                        </td>
                        <td className="px-4 py-3 text-slate-700 leading-relaxed max-w-sm">
                          {item.alasan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {row.extraSubmittedDocs.length > 0 && (
                <div className="border-t border-amber-200 bg-amber-50/60 px-5 py-3 text-xs text-amber-900">
                  <span className="font-semibold">
                    Dokumen di luar daftar wajib (dieskalasi ke manusia):
                  </span>{' '}
                  {row.extraSubmittedDocs
                    .map(
                      (e) =>
                        `"${e.namaDokumen}" (masuk ${formatTanggalIndonesia(
                          e.tanggalMasuk
                        )})`
                    )
                    .join('; ')}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

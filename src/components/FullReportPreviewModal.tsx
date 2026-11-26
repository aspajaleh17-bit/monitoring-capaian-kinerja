import React, { useState } from 'react';
import { Check, Copy, Download, Printer, X } from 'lucide-react';
import { MonitoringReport } from '../types/kinerja';
import { formatTanggalIndonesia } from '../utils/kinerjaEngine';

interface FullReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MonitoringReport;
}

export const FullReportPreviewModal: React.FC<FullReportPreviewModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(report.formattedMarkdownReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleDownloadPdf = () => {
    const previousTitle = document.title;
    const safePeriod = (report.periodeTarget || 'Laporan')
      .trim()
      .replace(/\s+/g, '-');
    document.title = `Laporan-Data-Dukung-Ditsar-${safePeriod}`;
    window.print();
    setTimeout(() => {
      document.title = previousTitle;
    }, 500);
  };

  const draftRows = report.subdirektoratRows.filter((r) => r.draftPesan !== null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-report-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 print:static print:inset-auto print:block print:bg-white print:p-0"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:border-0">
        <div className="no-print flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="modal-report-title"
              className="text-base font-bold text-slate-900"
            >
              Keluaran Terformat Lengkap (4 Bagian)
            </h2>
            <p className="text-xs text-slate-500">
              Siap disalin ke nota dinas, pesan koordinasi, atau diunduh sebagai PDF. Seluruh isi berstatus SARAN.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cetak</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-900 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Unduh Laporan</span>
            </button>
            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Salin Laporan</span>
                </>
              )}
            </button>
            <button
              type="button"
              aria-label="Tutup jendela laporan"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 print:overflow-visible print:p-0">
          <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-5 font-mono text-xs leading-relaxed text-slate-800 print:hidden">
            {report.formattedMarkdownReport}
          </pre>

          <div className="hidden print:block space-y-6 text-slate-900">
            <div className="border-b border-slate-300 pb-4">
              <h1 className="text-lg font-bold">
                Laporan Pemantauan Data Dukung Kinerja — Direktorat Sarana Perkeretaapian
              </h1>
              <p className="mt-1 text-xs text-slate-600">
                Tanggal Pemantauan: {report.tanggalHariIniFormatted} · Periode Target:{' '}
                {report.periodeTarget || 'tidak ada di data yang diberikan'} · Status Keluaran: SARAN (Perlu Pemeriksaan Manusia)
              </p>
            </div>

            <section className="space-y-2">
              <h2 className="text-sm font-bold">1. Ringkasan</h2>
              <div className="space-y-1 text-xs leading-relaxed">
                {report.ringkasanBaris.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold">2. Tabel Status</h2>
              {report.subdirektoratRows.length === 0 ? (
                <p className="text-xs text-slate-600">
                  Belum ada tabel status yang dapat disusun.
                </p>
              ) : (
                <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-2.5 py-1.5 font-semibold">
                        Subdirektorat
                      </th>
                      <th className="border border-slate-300 px-2.5 py-1.5 font-semibold text-right tabular-nums">
                        Data wajib
                      </th>
                      <th className="border border-slate-300 px-2.5 py-1.5 font-semibold text-right tabular-nums">
                        Data masuk
                      </th>
                      <th className="border border-slate-300 px-2.5 py-1.5 font-semibold">
                        Status
                      </th>
                      <th className="border border-slate-300 px-2.5 py-1.5 font-semibold">
                        Sisa hari ke tenggat
                      </th>
                      <th className="border border-slate-300 px-2.5 py-1.5 font-semibold">
                        Catatan
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.subdirektoratRows.map((row) => (
                      <tr key={row.subdirektorat} className="align-top">
                        <td className="border border-slate-300 px-2.5 py-1.5 font-medium">
                          {row.subdirektorat}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5 text-right font-mono tabular-nums">
                          {row.dataWajibList.length}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5 text-right font-mono tabular-nums">
                          {row.dataMasukList.length}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5">
                          {row.status}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5 font-mono tabular-nums">
                          {row.sisaHariLabel}
                          {row.tenggatTerdekat
                            ? ` (${formatTanggalIndonesia(row.tenggatTerdekat)})`
                            : ''}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5">
                          {row.catatan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold">3. Draf Pengingat</h2>
              {draftRows.length === 0 ? (
                <p className="text-xs text-slate-600">
                  Tidak ada draf pengingat yang perlu disiapkan.
                </p>
              ) : (
                <div className="space-y-3">
                  {draftRows.map((row) => (
                    <div
                      key={row.subdirektorat}
                      className="border border-slate-300 p-3 text-xs space-y-1 break-inside-avoid"
                    >
                      <div className="font-semibold">
                        {row.subdirektorat} — DRAF, belum dikirim ({row.draftStage})
                      </div>
                      <p className="leading-relaxed">{row.draftPesan}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold">4. Perlu diputuskan manusia</h2>
              {report.escalations.length === 0 ? (
                <p className="text-xs">tidak ada</p>
              ) : (
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  {report.escalations.map((esc) => (
                    <li key={esc.id}>
                      <strong>{esc.subdirektorat}</strong> ({esc.labelKondisi}):{' '}
                      {esc.alasan}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

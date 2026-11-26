import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  MinusCircle,
  ShieldAlert,
} from 'lucide-react';
import {
  EscalationItem,
  MonitoringReport,
  SubdirektoratStatus,
  SubdirektoratSummaryRow,
} from '../types/kinerja';
import { formatTanggalIndonesia } from '../utils/kinerjaEngine';

interface SummaryAndStatusSectionProps {
  report: MonitoringReport;
  filteredRows: SubdirektoratSummaryRow[];
  onInspectSubdit: (subdit: string) => void;
  onGoToDrafts: (subdit: string) => void;
  onGoToInput: () => void;
  onUpdateReminderCount: (subdit: string, nextCount: number) => void;
}

function StatusLabel({ status }: { status: SubdirektoratStatus }) {
  if (status === 'Sudah lengkap menurut daftar') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Sudah lengkap menurut daftar</span>
      </span>
    );
  }
  if (status === 'Kurang lengkap') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Kurang lengkap</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
      <MinusCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Belum kirim</span>
    </span>
  );
}

export const SummaryAndStatusSection: React.FC<SummaryAndStatusSectionProps> = ({
  report,
  filteredRows,
  onInspectSubdit,
  onGoToDrafts,
  onGoToInput,
  onUpdateReminderCount,
}) => {
  // Security stop state
  if (report.blockedBySecurity) {
    return (
      <div className="space-y-6">
        <section className="rounded-xl border border-rose-300 bg-rose-50 p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" />
            <div className="space-y-2">
              <h2 className="text-base font-bold text-rose-900">
                Pemrosesan Dihentikan: Terdeteksi Data Terlarang atau Sensitif
              </h2>
              <p className="text-sm text-rose-800 leading-relaxed">
                Sistem mendeteksi indikasi data pribadi (NIK, alamat, data
                kepegawaian, kesehatan), data keuangan/kontrak sensitif, atau
                dokumen berklasifikasi terbatas/rahasia. Harap hapus data
                tersebut terlebih dahulu sebelum melanjutkan pemantauan.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-rose-900 list-disc pl-5">
                {report.securityAlerts.map((alert) => (
                  <li key={alert.id}>
                    <strong>{alert.kategori}</strong> — {alert.detail}
                  </li>
                ))}
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onGoToInput}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-800"
                >
                  <span>Perbaiki di Input Data</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Missing required inputs state
  if (!report.missingInput.isComplete) {
    return (
      <section className="rounded-xl border border-amber-300 bg-amber-50 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">
              Data Masukan Belum Lengkap — Pemantauan Ditunda
            </h2>
            <p className="text-sm text-slate-700">
              Sesuai aturan kerja, asisten tidak akan menebak data yang belum
              tersedia. Mohon lengkapi masukan berikut terlebih dahulu:
            </p>
            <ul className="space-y-1.5 text-sm text-slate-800 list-disc pl-5">
              {report.missingInput.missingMessages.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
            <div className="pt-2">
              <button
                type="button"
                onClick={onGoToInput}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800"
              >
                <span>Lengkapi Data Masukan</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Ringkasan (maksimal 3 baris + KPI strip) */}
      <section aria-labelledby="heading-ringkasan" className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h1
                id="heading-ringkasan"
                className="text-xl font-bold tracking-tight text-slate-900"
              >
                1. Ringkasan Pemantauan Data Dukung
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                <span>Tanggal {report.tanggalHariIniFormatted}</span>
                <span aria-hidden="true"> · </span>
                <span>Periode {report.periodeTarget}</span>
                <span aria-hidden="true"> · </span>
                <span>Berstatus SARAN (perlu pemeriksaan tim)</span>
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 text-sm leading-relaxed text-slate-800">
            {report.ringkasanBaris.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-4">
            <div>
              <div className="text-xs text-slate-500">Total Subdirektorat</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {report.counts.totalSubdit}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Sudah Lengkap</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-emerald-700 tabular-nums">
                {report.counts.lengkap}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Kurang Lengkap</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-amber-700 tabular-nums">
                {report.counts.kurang}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Belum Kirim</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-rose-700 tabular-nums">
                {report.counts.belumKirim}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Tabel Status */}
      <section aria-labelledby="heading-tabel-status" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              id="heading-tabel-status"
              className="text-lg font-bold tracking-tight text-slate-900"
            >
              2. Tabel Status per Subdirektorat
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredRows.length} dari {report.subdirektoratRows.length} subdirektorat. Klik nama subdirektorat untuk memeriksa rincian dokumen.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Subdirektorat
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right tabular-nums">
                    Data wajib
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right tabular-nums">
                    Data masuk
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Sisa hari ke tenggat
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Catatan & Tindakan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Tidak ada subdirektorat yang cocok dengan filter pencarian saat ini.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const isOverdue =
                      row.sisaHariAngka !== null &&
                      row.sisaHariAngka < 0 &&
                      row.status !== 'Sudah lengkap menurut daftar';
                    const isWarning =
                      row.sisaHariAngka !== null &&
                      row.sisaHariAngka >= 0 &&
                      row.sisaHariAngka <= 3 &&
                      row.status !== 'Sudah lengkap menurut daftar';

                    return (
                      <tr
                        key={row.subdirektorat}
                        className="transition-colors hover:bg-slate-50/70 align-top"
                      >
                        <td className="px-4 py-3.5 font-medium text-slate-900 min-w-[200px]">
                          <button
                            type="button"
                            onClick={() => onInspectSubdit(row.subdirektorat)}
                            className="text-left font-semibold text-slate-900 hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-700"
                          >
                            {row.subdirektorat}
                          </button>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                            <span>Pengingat terkirim:</span>
                            <div className="inline-flex items-center rounded border border-slate-200 bg-white">
                              <button
                                type="button"
                                aria-label={`Kurangi pengingat ${row.subdirektorat}`}
                                onClick={() =>
                                  onUpdateReminderCount(
                                    row.subdirektorat,
                                    Math.max(0, row.pengingatTerkirim - 1)
                                  )
                                }
                                className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100"
                              >
                                -
                              </button>
                              <span className="px-2 font-mono tabular-nums text-slate-800">
                                {row.pengingatTerkirim}
                              </span>
                              <button
                                type="button"
                                aria-label={`Tambah pengingat ${row.subdirektorat}`}
                                onClick={() =>
                                  onUpdateReminderCount(
                                    row.subdirektorat,
                                    row.pengingatTerkirim + 1
                                  )
                                }
                                className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                          {row.dataWajibList.length} dok
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                          {row.dataMasukList.length} dok
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusLabel status={row.status} />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div
                            className={`font-mono tabular-nums font-medium ${
                              isOverdue
                                ? 'text-rose-700'
                                : isWarning
                                ? 'text-amber-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {row.sisaHariLabel}
                          </div>
                          {row.tenggatTerdekat && (
                            <div className="mt-0.5 text-[11px] text-slate-500">
                              Tenggat: {formatTanggalIndonesia(row.tenggatTerdekat)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 max-w-md leading-relaxed">
                          <p>{row.catatan}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => onInspectSubdit(row.subdirektorat)}
                              className="text-[11px] font-semibold text-blue-700 hover:underline whitespace-nowrap"
                            >
                              Cek Kelengkapan Dokumen
                            </button>
                            {row.draftPesan && (
                              <button
                                type="button"
                                onClick={() => onGoToDrafts(row.subdirektorat)}
                                className="text-[11px] font-semibold text-slate-700 hover:text-blue-700 hover:underline whitespace-nowrap"
                              >
                                Lihat Draf Pengingat ({row.draftStage.split(' ')[0]})
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4. Perlu diputuskan manusia */}
      <EscalationPanel escalations={report.escalations} />
    </div>
  );
};

export const EscalationPanel: React.FC<{ escalations: EscalationItem[] }> = ({
  escalations,
}) => {
  return (
    <section
      aria-labelledby="heading-eskalasi"
      className="rounded-xl border border-slate-200 bg-white p-6 space-y-3"
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h2
            id="heading-eskalasi"
            className="text-lg font-bold tracking-tight text-slate-900"
          >
            4. Perlu diputuskan manusia
          </h2>
          <p className="text-xs text-slate-500">
            Kondisi wajib berhenti dan eskalasi kepada tim pelaporan kinerja atau pimpinan.
          </p>
        </div>
        <span className="font-mono text-xs font-medium text-slate-600 tabular-nums">
          {escalations.length} butir
        </span>
      </div>

      {escalations.length === 0 ? (
        <p className="text-sm text-slate-600 py-2">tidak ada</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {escalations.map((item) => (
            <li key={item.id} className="py-3 first:pt-1 last:pb-0">
              <div className="flex items-start gap-2.5">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                  aria-hidden="true"
                />
                <div className="space-y-0.5 text-xs leading-relaxed">
                  <div className="font-semibold text-slate-900">
                    <span>{item.subdirektorat}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="text-amber-800">
                      Kondisi {item.nomorKondisi}: {item.labelKondisi}
                    </span>
                  </div>
                  <p className="text-slate-700">{item.alasan}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

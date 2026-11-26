import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  ShieldAlert,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  CapaianKinerjaItem,
  MonitoringReport,
  PreviousMonthBaseline,
  SubdirektoratStatus,
} from '../types/kinerja';
import { StatusComparisonChart } from './StatusComparisonChart';
import { MonthlyTrendChart } from './MonthlyTrendChart';
import { RequiredDocsDistributionChart } from './RequiredDocsDistributionChart';
import {
  computeCapaianPct,
  computeEffectiveRealisasi,
  getItemYear,
} from '../utils/capaianUtils';

interface SummaryAndStatusSectionProps {
  report: MonitoringReport;
  previousMonth: PreviousMonthBaseline;
  onChangePreviousMonth: (next: PreviousMonthBaseline) => void;
  subditTargets: Record<string, number>;
  onChangeSubditTarget: (subdit: string, targetPct: number) => void;
  onApplyAllTargets: (targetPct: number) => void;
  capaianItems: CapaianKinerjaItem[];
  onOpenCapaianKinerja: () => void;
  onOpenCapaianDashboard: () => void;
  onInspectSubdit: (subdit: string) => void;
  onGoToDrafts: (subdit: string) => void;
}

function StatusText({ status }: { status: SubdirektoratStatus }) {
  if (status === 'Sudah lengkap menurut daftar') {
    return (
      <span className="font-semibold text-emerald-700">
        Sudah lengkap menurut daftar
      </span>
    );
  }
  if (status === 'Kurang lengkap') {
    return <span className="font-semibold text-amber-700">Kurang lengkap</span>;
  }
  return <span className="font-semibold text-rose-700">Belum kirim</span>;
}

export const SummaryAndStatusSection: React.FC<SummaryAndStatusSectionProps> = ({
  report,
  previousMonth,
  onChangePreviousMonth,
  subditTargets,
  onChangeSubditTarget,
  onApplyAllTargets,
  capaianItems,
  onOpenCapaianKinerja,
  onOpenCapaianDashboard,
  onInspectSubdit,
  onGoToDrafts,
}) => {
  const [bulkTargetInput, setBulkTargetInput] = useState('100');

  const complianceMetrics = useMemo(() => {
    const rows = report.subdirektoratRows;
    const totalSubdit = rows.length;
    const lengkapSubdit = rows.filter(
      (r) => r.status === 'Sudah lengkap menurut daftar'
    ).length;

    let totalWajib = 0;
    let totalSesuai = 0;
    let metCount = 0;

    for (const row of rows) {
      const targetPct = subditTargets[row.subdirektorat] ?? 100;
      const sesuaiCount = row.auditItems.filter(
        (a) => a.outcome === 'Sesuai'
      ).length;
      const wajibCount = row.dataWajibList.length;

      totalWajib += wajibCount;
      totalSesuai += sesuaiCount;

      const actualPct =
        wajibCount > 0 ? Math.round((sesuaiCount / wajibCount) * 100) : 0;
      if (actualPct >= targetPct) metCount++;
    }

    const overallDocPct =
      totalWajib > 0 ? Math.round((totalSesuai / totalWajib) * 1000) / 10 : 0;
    const subditCompletePct =
      totalSubdit > 0 ? Math.round((lengkapSubdit / totalSubdit) * 1000) / 10 : 0;
    const targetMetPct =
      totalSubdit > 0 ? Math.round((metCount / totalSubdit) * 100) : 0;

    return {
      totalSubdit,
      lengkapSubdit,
      totalWajib,
      totalSesuai,
      pendingDocs: Math.max(0, totalWajib - totalSesuai),
      overallDocPct,
      subditCompletePct,
      metCount,
      targetMetPct,
    };
  }, [report.subdirektoratRows, subditTargets]);

  const capaianStats = useMemo(() => {
    const targetYearMatch = report.periodeTarget.match(/\b(20\d{2})\b/);
    const activeYear = targetYearMatch ? targetYearMatch[1] : null;
    const scopedItems =
      activeYear && capaianItems.some((i) => getItemYear(i) === activeYear)
        ? capaianItems.filter((i) => getItemYear(i) === activeYear)
        : capaianItems;

    const total = scopedItems.length;
    if (total === 0) {
      return { total: 0, tercapai: 0, rataRata: 0 };
    }
    let tercapai = 0;
    let sumPct = 0;
    for (const item of scopedItems) {
      const eff = computeEffectiveRealisasi(item);
      const pct = computeCapaianPct(item.target, eff.realisasi);
      sumPct += pct;
      if (pct >= 100) tercapai++;
    }
    return {
      total,
      tercapai,
      rataRata: Math.round((sumPct / total) * 10) / 10,
    };
  }, [capaianItems, report.periodeTarget]);

  return (
    <div className="space-y-6">
      {report.blockedBySecurity && (
        <section
          role="alert"
          className="rounded-xl border border-rose-300 bg-rose-50 p-5 space-y-2"
        >
          <div className="flex items-center gap-2 text-rose-900">
            <ShieldAlert className="h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" />
            <h2 className="text-sm font-bold">
              Proses Dihentikan: Terdeteksi Data Pribadi atau Klasifikasi Terbatas
            </h2>
          </div>
          <ul className="list-disc pl-6 space-y-1 text-xs text-rose-900">
            {report.securityAlerts.map((alert) => (
              <li key={alert.id}>
                <strong>{alert.kategori}:</strong> {alert.detail}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Header & Ringkasan */}
      <section
        aria-labelledby="heading-ringkasan"
        className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h1
              id="heading-ringkasan"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              Ringkasan Pemantauan Data Dukung
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Evaluasi otomatis berstatus SARAN untuk verifikasi tim pelaporan kinerja Direktorat Sarana Perkeretaapian.
            </p>
          </div>
          <div className="font-mono text-xs text-slate-600 tabular-nums">
            {report.tanggalHariIniFormatted} · {report.periodeTarget || '-'}
          </div>
        </div>

        <div className="space-y-1 text-sm leading-relaxed text-slate-700">
          {report.ringkasanBaris.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </section>

      {/* Kartu Ringkasan KPI Real-Time */}
      <section
        aria-label="Kartu Ringkasan KPI Kepatuhan"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">
              Total Kepatuhan Seluruh Subdit
            </span>
            <TrendingUp className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
          </div>
          <div
            className={`font-mono text-3xl font-bold tabular-nums ${
              complianceMetrics.overallDocPct >= 80
                ? 'text-emerald-700'
                : complianceMetrics.overallDocPct >= 50
                ? 'text-blue-700'
                : 'text-amber-700'
            }`}
          >
            {complianceMetrics.overallDocPct}%
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all ${
                complianceMetrics.overallDocPct >= 80
                  ? 'bg-emerald-600'
                  : complianceMetrics.overallDocPct >= 50
                  ? 'bg-blue-700'
                  : 'bg-amber-600'
              }`}
              style={{ width: `${Math.min(100, complianceMetrics.overallDocPct)}%` }}
            />
          </div>
          <p className="font-mono text-[11px] text-slate-600 tabular-nums">
            {complianceMetrics.totalSesuai} dari {complianceMetrics.totalWajib} dokumen sesuai
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">
              Subdirektorat Lengkap
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
          </div>
          <div className="font-mono text-3xl font-bold text-slate-900 tabular-nums">
            {complianceMetrics.subditCompletePct}%
          </div>
          <p className="font-mono text-[11px] text-slate-600 tabular-nums">
            {complianceMetrics.lengkapSubdit}/{complianceMetrics.totalSubdit} lengkap · {report.counts.kurang} kurang · {report.counts.belumKirim} belum
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">
              Capai Target Bulanan
            </span>
            <Target className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
          </div>
          <div className="font-mono text-3xl font-bold text-blue-700 tabular-nums">
            {complianceMetrics.metCount}/{complianceMetrics.totalSubdit}
          </div>
          <p className="font-mono text-[11px] text-slate-600 tabular-nums">
            {complianceMetrics.targetMetPct}% subdirektorat memenuhi target
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">
              Perlu Tindak Lanjut
            </span>
            <FileCheck2 className="h-4 w-4 text-amber-700 shrink-0" aria-hidden="true" />
          </div>
          <div className="font-mono text-3xl font-bold text-amber-700 tabular-nums">
            {complianceMetrics.pendingDocs}
          </div>
          <p className="font-mono text-[11px] text-slate-600 tabular-nums">
            Dokumen belum ada atau kurang lengkap
          </p>
        </div>
      </section>

      {/* Grafik Perbandingan & Tren Bulanan */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <StatusComparisonChart
          lengkap={report.counts.lengkap}
          kurang={report.counts.kurang}
          belumKirim={report.counts.belumKirim}
          totalSubdit={report.counts.totalSubdit}
        />
        <MonthlyTrendChart
          currentPeriode={report.periodeTarget}
          lengkapCount={report.counts.lengkap}
          totalSubdit={report.counts.totalSubdit}
          previousMonth={previousMonth}
          onChangePreviousMonth={onChangePreviousMonth}
        />
      </div>

      {/* Grafik Distribusi Beban Dokumen Wajib */}
      <RequiredDocsDistributionChart rows={report.subdirektoratRows} />

      {/* Ringkasan Capaian Kinerja (IKU/IKK) */}
      <section
        aria-labelledby="heading-ringkasan-capaian"
        className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <ClipboardCheck
            className="mt-0.5 h-5 w-5 shrink-0 text-blue-700"
            aria-hidden="true"
          />
          <div>
            <h2
              id="heading-ringkasan-capaian"
              className="text-sm font-bold text-slate-900"
            >
              Capaian Realisasi Kinerja (IKU / IKK)
            </h2>
            <p className="mt-0.5 text-xs text-slate-600 font-mono tabular-nums">
              {capaianStats.total} indikator · {capaianStats.tercapai} tercapai (≥ 100%) · Rata-rata {capaianStats.rataRata}%
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenCapaianDashboard}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
          >
            <span>Lihat Dashboard Capaian</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onOpenCapaianKinerja}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
          >
            <span>Input Realisasi</span>
          </button>
        </div>
      </section>

      {/* Tabel Status & Target */}
      <section
        aria-labelledby="heading-tabel-status"
        className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="heading-tabel-status"
              className="text-base font-bold tracking-tight text-slate-900"
            >
              Status & Target Kepatuhan Subdirektorat
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Sesuaikan target persentase tiap subdirektorat untuk memantau kesesuaian dokumen.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="bulk-target" className="text-slate-600 font-medium whitespace-nowrap">
              Atur Target Semua (%):
            </label>
            <input
              id="bulk-target"
              type="number"
              min={0}
              max={100}
              value={bulkTargetInput}
              onChange={(e) => setBulkTargetInput(e.target.value)}
              className="w-16 rounded-lg border border-slate-200 px-2 py-1 font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const parsed = Math.max(0, Math.min(100, Number(bulkTargetInput) || 0));
                onApplyAllTargets(parsed);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              Terapkan
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                <th scope="col" className="px-5 py-3 font-semibold">
                  Subdirektorat
                </th>
                <th scope="col" className="px-3 py-3 font-semibold text-right whitespace-nowrap">
                  Wajib
                </th>
                <th scope="col" className="px-3 py-3 font-semibold text-right whitespace-nowrap">
                  Masuk
                </th>
                <th scope="col" className="px-3 py-3 font-semibold whitespace-nowrap">
                  Capaian vs Target
                </th>
                <th scope="col" className="px-3 py-3 font-semibold whitespace-nowrap">
                  Status
                </th>
                <th scope="col" className="px-3 py-3 font-semibold whitespace-nowrap">
                  Sisa Hari
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Catatan
                </th>
                <th scope="col" className="px-5 py-3 font-semibold text-right whitespace-nowrap">
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.subdirektoratRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                    Tidak ada subdirektorat yang cocok dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                report.subdirektoratRows.map((row) => {
                  const targetPct = subditTargets[row.subdirektorat] ?? 100;
                  const sesuaiCount = row.auditItems.filter(
                    (a) => a.outcome === 'Sesuai'
                  ).length;
                  const actualPct =
                    row.dataWajibList.length > 0
                      ? Math.round((sesuaiCount / row.dataWajibList.length) * 100)
                      : 0;
                  const metTarget = actualPct >= targetPct;

                  return (
                    <tr key={row.subdirektorat} className="align-top transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-semibold text-slate-900 min-w-[185px]">
                        {row.subdirektorat}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono tabular-nums text-slate-700">
                        {row.dataWajibList.length}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono tabular-nums text-slate-700">
                        {row.dataMasukList.length}
                      </td>
                      <td className="px-3 py-3.5 min-w-[155px]">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold tabular-nums ${
                              metTarget ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {actualPct}%
                          </span>
                          <span className="text-slate-400">/</span>
                          <label className="sr-only" htmlFor={`target-${row.subdirektorat}`}>
                            Target kepatuhan {row.subdirektorat}
                          </label>
                          <input
                            id={`target-${row.subdirektorat}`}
                            type="number"
                            min={0}
                            max={100}
                            value={targetPct}
                            onChange={(e) => {
                              const val = Math.max(
                                0,
                                Math.min(100, Number(e.target.value) || 0)
                              );
                              onChangeSubditTarget(row.subdirektorat, val);
                            }}
                            className="w-13 rounded border border-slate-200 px-1.5 py-0.5 font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
                          />
                          <span className="text-slate-500">%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full ${
                              metTarget ? 'bg-emerald-600' : 'bg-amber-600'
                            }`}
                            style={{ width: `${Math.min(100, actualPct)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <StatusText status={row.status} />
                      </td>
                      <td className="px-3 py-3.5 font-mono tabular-nums whitespace-nowrap text-slate-700">
                        {row.sisaHariLabel}
                      </td>
                      <td className="px-3 py-3.5 text-slate-600 min-w-[210px] leading-relaxed">
                        {row.catatan}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-3">
                        <button
                          type="button"
                          onClick={() => onInspectSubdit(row.subdirektorat)}
                          className="font-semibold text-blue-700 hover:underline"
                        >
                          Periksa
                        </button>
                        {row.draftPesan && (
                          <button
                            type="button"
                            onClick={() => onGoToDrafts(row.subdirektorat)}
                            className="font-semibold text-slate-700 hover:underline"
                          >
                            Draf
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Perlu diputuskan manusia */}
      <section
        aria-labelledby="heading-eskalasi"
        className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            {report.escalations.length > 0 ? (
              <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            )}
            <h2
              id="heading-eskalasi"
              className="text-base font-bold tracking-tight text-slate-900"
            >
              Perlu Diputuskan Manusia
            </h2>
          </div>
          <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
            {report.escalations.length} butir
          </span>
        </div>

        {report.escalations.length === 0 ? (
          <p className="text-xs text-slate-600">
            Tidak ada hal yang memerlukan eskalasi keputusan saat ini.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {report.escalations.map((esc) => (
              <li key={esc.id} className="py-3 first:pt-0 last:pb-0 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900">{esc.subdirektorat}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="font-semibold text-amber-800">
                    Kondisi {esc.nomorKondisi}: {esc.labelKondisi}
                  </span>
                </div>
                <p className="mt-1 text-slate-600 leading-relaxed">{esc.alasan}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

import React from 'react';
import {
  AlertTriangle,
  Calendar,
  History,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import {
  MissingInputStatus,
  SubdirektoratStatus,
  SubdirektoratSummaryRow,
} from '../types/kinerja';
import { formatTimestampIndonesia } from '../utils/kinerjaEngine';

export type StatusFilter =
  | 'Semua'
  | SubdirektoratStatus
  | 'Prioritas Tinggi';

interface ControlSidebarProps {
  tanggalHariIni: string;
  onChangeTanggalHariIni: (value: string) => void;
  periodeTarget: string;
  onChangePeriodeTarget: (value: string) => void;
  statusFilter: StatusFilter;
  onChangeStatusFilter: (value: StatusFilter) => void;
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;
  missingInput: MissingInputStatus;
  requiredCount: number;
  submittedCount: number;
  submittedConfirmedWhenEmpty: boolean;
  onToggleSubmittedConfirmed: (val: boolean) => void;
  onLoadSample: () => void;
  onClearAll: () => void;
  subdirektoratRows: SubdirektoratSummaryRow[];
  onSelectUrgentSubdit: (subdit: string) => void;
  lastUpdatedIso: string;
  onOpenActivityLog: () => void;
}

const FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'Semua', label: 'Semua' },
  { value: 'Sudah lengkap menurut daftar', label: 'Lengkap' },
  { value: 'Kurang lengkap', label: 'Kurang' },
  { value: 'Belum kirim', label: 'Belum kirim' },
];

export const ControlSidebar: React.FC<ControlSidebarProps> = ({
  tanggalHariIni,
  onChangeTanggalHariIni,
  periodeTarget,
  onChangePeriodeTarget,
  statusFilter,
  onChangeStatusFilter,
  searchQuery,
  onChangeSearchQuery,
  missingInput,
  submittedCount,
  submittedConfirmedWhenEmpty,
  onToggleSubmittedConfirmed,
  onLoadSample,
  onClearAll,
  subdirektoratRows,
  onSelectUrgentSubdit,
  lastUpdatedIso,
  onOpenActivityLog,
}) => {
  const highPriorityCount = subdirektoratRows.filter(
    (r) =>
      r.status !== 'Sudah lengkap menurut daftar' &&
      r.sisaHariAngka !== null &&
      r.sisaHariAngka < 3
  ).length;

  const urgentRows = subdirektoratRows
    .filter(
      (r) =>
        r.status !== 'Sudah lengkap menurut daftar' &&
        r.sisaHariAngka !== null &&
        r.sisaHariAngka <= 3
    )
    .sort((a, b) => (a.sisaHariAngka ?? 0) - (b.sisaHariAngka ?? 0));

  const hasOverdue = urgentRows.some((r) => (r.sisaHariAngka ?? 0) < 0);

  return (
    <aside className="no-print w-full lg:w-[272px] shrink-0 space-y-5">
      {/* Filter & Periode */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Filter & Periode
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Direktorat Sarana Perkeretaapian
          </p>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-3">
          <div>
            <label
              htmlFor="tanggal-hari-ini"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Tanggal Pemantauan
            </label>
            <div className="relative">
              <Calendar
                className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="tanggal-hari-ini"
                type="date"
                value={tanggalHariIni}
                onChange={(e) => onChangeTanggalHariIni(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 font-mono text-xs text-slate-900 tabular-nums transition-colors focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="periode-target"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Periode Target
            </label>
            <input
              id="periode-target"
              type="text"
              placeholder="Mis. November 2026"
              value={periodeTarget}
              onChange={(e) => onChangePeriodeTarget(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 transition-colors focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="cari-subdit"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Cari Subdirektorat
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="cari-subdit"
                type="text"
                placeholder="Ketik nama subdit..."
                value={searchQuery}
                onChange={(e) => onChangeSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 text-xs text-slate-900 transition-colors focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-700 mb-1.5">
              Tampilkan Status
            </span>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
              {FILTER_OPTIONS.map((opt) => {
                const active = statusFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChangeStatusFilter(opt.value)}
                    className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => onChangeStatusFilter('Prioritas Tinggi')}
                className={`col-span-2 flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === 'Prioritas Tinggi'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-rose-800 hover:bg-rose-50'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Prioritas Tinggi (&lt; 3 Hari)</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums">
                  {highPriorityCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        {!missingInput.isComplete && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-950 space-y-1">
            <div className="font-semibold">Data masukan belum lengkap:</div>
            <ul className="list-disc pl-4 space-y-0.5">
              {missingInput.missingMessages.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {submittedCount === 0 && (
          <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={submittedConfirmedWhenEmpty}
              onChange={(e) => onToggleSubmittedConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
            />
            <span>Konfirmasi: Memang belum ada kiriman data masuk.</span>
          </label>
        )}

        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Contoh Data</span>
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 whitespace-nowrap"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Kosongkan</span>
          </button>
        </div>
      </div>

      {/* Pantauan Cepat: Tenggat <= 3 Hari & Pembaruan Terakhir */}
      <div
        aria-live="polite"
        className={`rounded-xl border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3 ${
          urgentRows.length === 0
            ? 'border-slate-200/90 bg-white'
            : hasOverdue
            ? 'border-rose-200 bg-rose-50/50'
            : 'border-amber-200 bg-amber-50/50'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle
              className={`h-3.5 w-3.5 shrink-0 ${
                urgentRows.length === 0
                  ? 'text-slate-400'
                  : hasOverdue
                  ? 'text-rose-700'
                  : 'text-amber-700'
              }`}
              aria-hidden="true"
            />
            <h3 className="text-xs font-bold text-slate-900">
              Tenggat Dekat (≤ 3 Hari)
            </h3>
          </div>
          <span
            className={`font-mono text-xs font-semibold tabular-nums ${
              urgentRows.length === 0
                ? 'text-slate-500'
                : hasOverdue
                ? 'text-rose-700'
                : 'text-amber-800'
            }`}
          >
            {urgentRows.length} subdit
          </span>
        </div>

        {urgentRows.length === 0 ? (
          <p className="text-xs text-slate-500 leading-relaxed">
            Tidak ada subdirektorat dengan tenggat mendesak saat ini.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200/70">
            {urgentRows.map((row) => {
              const isOverdue = (row.sisaHariAngka ?? 0) < 0;
              return (
                <li key={row.subdirektorat} className="py-2 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => onSelectUrgentSubdit(row.subdirektorat)}
                    className="w-full text-left group focus-visible:outline-2 focus-visible:outline-blue-700"
                  >
                    <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 group-hover:underline truncate">
                      {row.subdirektorat}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span
                        className={`font-mono font-semibold tabular-nums ${
                          isOverdue ? 'text-rose-700' : 'text-amber-800'
                        }`}
                      >
                        {row.sisaHariLabel}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span className="text-slate-600">{row.status}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t border-slate-200/70 pt-3 flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-500 truncate">
            <History className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="font-mono tabular-nums truncate">
              {formatTimestampIndonesia(lastUpdatedIso)}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenActivityLog}
            className="font-semibold text-blue-700 hover:underline whitespace-nowrap shrink-0"
          >
            Lihat Log
          </button>
        </div>
      </div>
    </aside>
  );
};

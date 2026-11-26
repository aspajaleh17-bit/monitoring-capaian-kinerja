import React from 'react';
import {
  Calendar,
  CheckCircle2,
  CircleAlert,
  Database,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { MissingInputStatus, SubdirektoratStatus } from '../types/kinerja';

export type StatusFilter = 'Semua' | SubdirektoratStatus;

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
  requiredCount,
  submittedCount,
  submittedConfirmedWhenEmpty,
  onToggleSubmittedConfirmed,
  onLoadSample,
  onClearAll,
}) => {
  return (
    <aside className="no-print w-full lg:w-[272px] shrink-0 space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Parameter Pemantauan
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Direktorat Sarana Perkeretaapian
          </p>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-3">
          <div>
            <label
              htmlFor="tanggal-hari-ini"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Tanggal Hari Ini
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
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="periode-target"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Periode Laporan Target
            </label>
            <input
              id="periode-target"
              type="text"
              placeholder="Mis. November 2026"
              value={periodeTarget}
              onChange={(e) => onChangePeriodeTarget(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
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
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-700 mb-1.5">
              Filter Status
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
            </div>
          </div>
        </div>
      </div>

      {/* Status 3 Masukan Wajib */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900">
            Kelengkapan 3 Data Masukan
          </h3>
          <Database className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
        </div>

        <ul className="space-y-2 text-xs">
          <li className="flex items-start gap-2">
            {!missingInput.missingRequiredList ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
            ) : (
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
            )}
            <span className="text-slate-700">
              1. Daftar Wajib ({requiredCount} item)
            </span>
          </li>
          <li className="flex items-start gap-2">
            {!missingInput.missingSubmittedConfirmation ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
            ) : (
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
            )}
            <span className="text-slate-700">
              2. Data Masuk ({submittedCount} item)
            </span>
          </li>
          <li className="flex items-start gap-2">
            {!missingInput.missingTodayDate && !missingInput.missingTargetPeriod ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
            ) : (
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
            )}
            <span className="text-slate-700">3. Tanggal & Periode</span>
          </li>
        </ul>

        {submittedCount === 0 && (
          <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={submittedConfirmedWhenEmpty}
              onChange={(e) => onToggleSubmittedConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
            />
            <span>Konfirmasi: Memang belum ada data masuk sama sekali saat ini.</span>
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

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600">
        <p className="font-semibold text-slate-800 mb-1">
          Catatan Peran Asisten
        </p>
        <p>
          Seluruh keluaran berstatus <strong>SARAN</strong> dan belum dikirim
          ke pihak mana pun. Keputusan kelayakan laporan tetap berada pada tim
          pelaporan kinerja Ditsar.
        </p>
      </div>
    </aside>
  );
};

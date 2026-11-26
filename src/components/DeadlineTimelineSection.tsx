import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListOrdered,
} from 'lucide-react';
import { SubdirektoratSummaryRow } from '../types/kinerja';
import {
  diffDaysIso,
  formatSisaHari,
  formatTanggalIndonesia,
  isValidIsoDate,
} from '../utils/kinerjaEngine';

interface DeadlineTimelineSectionProps {
  subdirektoratRows: SubdirektoratSummaryRow[];
  tanggalHariIni: string;
  onInspectSubdit: (subdit: string) => void;
  onGoToDrafts: (subdit: string) => void;
}

interface DeadlineEvent {
  id: string;
  isoDate: string;
  subdirektorat: string;
  docNames: string[];
  status: SubdirektoratSummaryRow['status'];
  sisaHari: number | null;
  sisaHariLabel: string;
  hasDraft: boolean;
}

const BULAN_NAMA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const HARI_MINGGU = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const DeadlineTimelineSection: React.FC<DeadlineTimelineSectionProps> = ({
  subdirektoratRows,
  tanggalHariIni,
  onInspectSubdit,
  onGoToDrafts,
}) => {
  const initialMonth = useMemo(() => {
    if (isValidIsoDate(tanggalHariIni)) {
      const [y, m] = tanggalHariIni.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [tanggalHariIni]);

  const [viewYear, setViewYear] = useState(initialMonth.year);
  const [viewMonth, setViewMonth] = useState(initialMonth.month);
  const [viewMode, setViewMode] = useState<'kalender' | 'linimasa'>('kalender');
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(null);

  const events = useMemo<DeadlineEvent[]>(() => {
    const list: DeadlineEvent[] = [];
    for (const row of subdirektoratRows) {
      const byDate = new Map<string, string[]>();
      for (const req of row.dataWajibList) {
        if (!isValidIsoDate(req.tenggat)) continue;
        if (!byDate.has(req.tenggat)) byDate.set(req.tenggat, []);
        byDate.get(req.tenggat)!.push(req.namaDokumen);
      }
      for (const [isoDate, docNames] of byDate.entries()) {
        const sisa = diffDaysIso(isoDate, tanggalHariIni);
        list.push({
          id: `${row.subdirektorat}|${isoDate}`,
          isoDate,
          subdirektorat: row.subdirektorat,
          docNames,
          status: row.status,
          sisaHari: sisa,
          sisaHariLabel: formatSisaHari(sisa),
          hasDraft: row.draftPesan !== null,
        });
      }
    }
    return list.sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  }, [subdirektoratRows, tanggalHariIni]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, DeadlineEvent[]>();
    for (const ev of events) {
      if (!map.has(ev.isoDate)) map.set(ev.isoDate, []);
      map.get(ev.isoDate)!.push(ev);
    }
    return map;
  }, [events]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(Date.UTC(viewYear, viewMonth, 1));
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
    const startOffset = (firstDay.getUTCDay() + 6) % 7;

    const cells: Array<{ day: number | null; isoDate: string | null }> = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, isoDate: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(viewMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ day: d, isoDate: `${viewYear}-${mm}-${dd}` });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, isoDate: null });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedIsoDate) return [];
    return eventsByDate.get(selectedIsoDate) || [];
  }, [selectedIsoDate, eventsByDate]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedIsoDate(null);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedIsoDate(null);
  };

  const statusTextClass = (ev: DeadlineEvent) => {
    if (ev.status === 'Sudah lengkap menurut daftar') {
      return 'text-emerald-700';
    }
    if (ev.sisaHari !== null && ev.sisaHari <= 1) {
      return 'text-rose-700';
    }
    if (ev.sisaHari !== null && ev.sisaHari <= 3) {
      return 'text-amber-700';
    }
    return 'text-blue-700';
  };

  const calendarPillClass = (ev: DeadlineEvent) => {
    if (ev.status === 'Sudah lengkap menurut daftar') {
      return 'bg-emerald-50 text-emerald-900';
    }
    if (ev.sisaHari !== null && ev.sisaHari <= 1) {
      return 'bg-rose-50 text-rose-900';
    }
    if (ev.sisaHari !== null && ev.sisaHari <= 3) {
      return 'bg-amber-50 text-amber-950';
    }
    return 'bg-blue-50 text-blue-950';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Jadwal Tenggat Pengumpulan Data Dukung
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Klik tanggal atau baris lini masa untuk melihat dokumen wajib dan mengambil tindakan.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setViewMode('kalender')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
              viewMode === 'kalender'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Kalender</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('linimasa')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
              viewMode === 'linimasa'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Lini Masa</span>
          </button>
        </div>
      </div>

      {viewMode === 'kalender' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h3 className="text-sm font-bold text-slate-900">
                {BULAN_NAMA[viewMonth]} {viewYear}
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Bulan sebelumnya"
                  onClick={handlePrevMonth}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewYear(initialMonth.year);
                    setViewMonth(initialMonth.month);
                    setSelectedIsoDate(tanggalHariIni || null);
                  }}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  aria-label="Bulan berikutnya"
                  onClick={handleNextMonth}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-semibold text-slate-600">
              {HARI_MINGGU.map((h) => (
                <div key={h} className="py-2">
                  {h}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
              {calendarCells.map((cell, idx) => {
                if (!cell.day || !cell.isoDate) {
                  return <div key={`empty-${idx}`} className="min-h-[88px] bg-slate-50/40 p-2" />;
                }
                const dayEvents = eventsByDate.get(cell.isoDate) || [];
                const isToday = cell.isoDate === tanggalHariIni;
                const isSelected = cell.isoDate === selectedIsoDate;

                return (
                  <button
                    key={cell.isoDate}
                    type="button"
                    onClick={() => setSelectedIsoDate(cell.isoDate)}
                    className={`min-h-[88px] p-2 text-left align-top transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-700 ${
                      isSelected ? 'bg-blue-50/50 ring-1 ring-inset ring-blue-700' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono text-xs font-semibold tabular-nums ${
                          isToday
                            ? 'rounded bg-blue-700 px-1.5 py-0.5 text-white'
                            : 'text-slate-700'
                        }`}
                      >
                        {cell.day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 space-y-1">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${calendarPillClass(
                            ev
                          )}`}
                          title={`${ev.subdirektorat} — ${ev.status}`}
                        >
                          {ev.subdirektorat.replace(/^Subdit\s+/i, '')}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] font-medium text-slate-500">
                          +{dayEvents.length - 2} lainnya
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {selectedIsoDate
                  ? `Tenggat ${formatTanggalIndonesia(selectedIsoDate)}`
                  : 'Detail Jadwal Tanggal'}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Rincian subdirektorat yang jatuh tempo pada tanggal terpilih.
              </p>
            </div>

            {!selectedIsoDate ? (
              <p className="text-xs text-slate-500 leading-relaxed">
                Pilih salah satu tanggal pada kalender di sebelah kiri untuk melihat dokumen wajib yang harus dikumpulkan.
              </p>
            ) : selectedDateEvents.length === 0 ? (
              <p className="text-xs text-slate-500">
                Tidak ada tenggat pada {formatTanggalIndonesia(selectedIsoDate)}.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {selectedDateEvents.map((ev) => (
                  <li key={ev.id} className="py-3 first:pt-0 last:pb-0 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-900">
                      {ev.subdirektorat}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono tabular-nums">
                      <span className={`font-semibold ${statusTextClass(ev)}`}>
                        {ev.sisaHariLabel}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="text-slate-600">{ev.status}</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                      {ev.docNames.map((doc, i) => (
                        <li key={i}>{doc}</li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => onInspectSubdit(ev.subdirektorat)}
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        Periksa Dokumen
                      </button>
                      {ev.hasDraft && (
                        <button
                          type="button"
                          onClick={() => onGoToDrafts(ev.subdirektorat)}
                          className="font-semibold text-slate-700 hover:underline"
                        >
                          Buka Draf
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <section className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
          {events.length === 0 ? (
            <p className="text-xs text-slate-500">
              Belum ada data tenggat pada daftar wajib.
            </p>
          ) : (
            <ol className="divide-y divide-slate-100">
              {events.map((ev) => (
                <li
                  key={ev.id}
                  className="flex flex-wrap items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 font-mono font-semibold text-slate-900 tabular-nums">
                        <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        {formatTanggalIndonesia(ev.isoDate)}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span
                        className={`font-mono text-[11px] font-semibold tabular-nums ${statusTextClass(
                          ev
                        )}`}
                      >
                        {ev.sisaHariLabel}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {ev.subdirektorat}
                    </div>
                    <div className="text-xs text-slate-600">
                      {ev.docNames.join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <span className={`font-semibold ${statusTextClass(ev)}`}>
                      {ev.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => onInspectSubdit(ev.subdirektorat)}
                      className="font-semibold text-blue-700 hover:underline whitespace-nowrap"
                    >
                      Periksa
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
};

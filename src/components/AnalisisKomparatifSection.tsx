import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Camera,
  History,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { ActivityLogEntry, SubdirektoratSummaryRow } from '../types/kinerja';
import { formatTimestampIndonesia } from '../utils/kinerjaEngine';

interface AnalisisKomparatifSectionProps {
  activityLogs: ActivityLogEntry[];
  subdirektoratRows: SubdirektoratSummaryRow[];
  onRecordSnapshot: () => void;
}

const SUBDIT_COLORS = [
  '#15803D',
  '#B45309',
  '#7C3AED',
  '#0F766E',
  '#BE123C',
  '#0369A1',
];

const SUBDIT_DOT_CLASSES = [
  'bg-emerald-700',
  'bg-amber-700',
  'bg-violet-600',
  'bg-teal-700',
  'bg-rose-700',
  'bg-sky-700',
];

interface ChartPoint {
  key: string;
  labelWaktu: string;
  timestampIso: string;
  kategori: string;
  ringkasan: string;
  rataRataKepatuhan: number;
  totalDokumenSesuai: number;
  totalDokumenWajib: number;
  [subditKey: string]: string | number;
}

interface CustomTrendTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    payload?: ChartPoint;
  }>;
}

const ComparativeTrendTooltip: React.FC<CustomTrendTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  if (!point) return null;

  return (
    <div className="max-w-xs rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm space-y-1.5">
      <div className="font-mono text-[11px] font-semibold text-slate-500 tabular-nums">
        {formatTimestampIndonesia(point.timestampIso)}
      </div>
      <div className="font-semibold text-slate-900 leading-snug">
        {point.ringkasan}
      </div>
      <div className="border-t border-slate-100 pt-1.5 space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between gap-4 font-mono text-[11px] tabular-nums"
          >
            <span className="truncate text-slate-700">{entry.name}</span>
            <span
              className="font-semibold"
              style={{ color: entry.color || '#0F172A' }}
            >
              {entry.value ?? 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

function formatShortAxisTime(iso: string, perTanggal: boolean): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso.slice(0, 10);
  const d = String(dt.getDate()).padStart(2, '0');
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  if (perTanggal) return `${d}/${m}`;
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${d}/${m} ${hh}:${mm}`;
}

export const AnalisisKomparatifSection: React.FC<
  AnalisisKomparatifSectionProps
> = ({ activityLogs, subdirektoratRows, onRecordSnapshot }) => {
  const [groupMode, setGroupMode] = useState<'semua' | 'harian'>('semua');

  const subditNames = useMemo(() => {
    const set = new Set<string>();
    subdirektoratRows.forEach((r) => set.add(r.subdirektorat));
    activityLogs.forEach((log) => {
      if (log.subditKepatuhan) {
        Object.keys(log.subditKepatuhan).forEach((name) => set.add(name));
      }
    });
    return Array.from(set);
  }, [subdirektoratRows, activityLogs]);

  const [selectedSubdits, setSelectedSubdits] = useState<string[]>(() =>
    subditNames.slice(0, 4)
  );

  const activeSubdits = useMemo(() => {
    const valid = selectedSubdits.filter((s) => subditNames.includes(s));
    return valid.length > 0 ? valid : subditNames.slice(0, 4);
  }, [selectedSubdits, subditNames]);

  const rawSnapshots = useMemo(() => {
    return [...activityLogs]
      .filter(
        (entry) =>
          typeof entry.rataRataKepatuhan === 'number' &&
          entry.subditKepatuhan !== undefined
      )
      .sort((a, b) => a.timestampIso.localeCompare(b.timestampIso));
  }, [activityLogs]);

  const chartData = useMemo<ChartPoint[]>(() => {
    let source = rawSnapshots;
    if (groupMode === 'harian') {
      const byDay = new Map<string, ActivityLogEntry>();
      for (const item of rawSnapshots) {
        const dayKey = item.timestampIso.slice(0, 10);
        byDay.set(dayKey, item);
      }
      source = Array.from(byDay.values());
    }

    return source.map((entry) => {
      const point: ChartPoint = {
        key: entry.id,
        labelWaktu: formatShortAxisTime(
          entry.timestampIso,
          groupMode === 'harian'
        ),
        timestampIso: entry.timestampIso,
        kategori: entry.kategori,
        ringkasan: entry.ringkasan,
        rataRataKepatuhan: entry.rataRataKepatuhan ?? 0,
        totalDokumenSesuai: entry.totalDokumenSesuai ?? 0,
        totalDokumenWajib: entry.totalDokumenWajib ?? 0,
      };
      for (const name of subditNames) {
        point[name] = entry.subditKepatuhan?.[name] ?? 0;
      }
      return point;
    });
  }, [rawSnapshots, groupMode, subditNames]);

  const summaryStats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        totalPoints: 0,
        firstAvg: 0,
        latestAvg: 0,
        delta: 0,
        topSubdit: '-',
        topSubditPct: 0,
      };
    }
    const first = chartData[0];
    const latest = chartData[chartData.length - 1];
    const delta =
      Math.round((latest.rataRataKepatuhan - first.rataRataKepatuhan) * 10) /
      10;

    let topName = '-';
    let topVal = -1;
    for (const name of subditNames) {
      const val = Number(latest[name] ?? 0);
      if (val > topVal) {
        topVal = val;
        topName = name;
      }
    }

    return {
      totalPoints: chartData.length,
      firstAvg: first.rataRataKepatuhan,
      latestAvg: latest.rataRataKepatuhan,
      delta,
      topSubdit: topName,
      topSubditPct: Math.max(0, topVal),
    };
  }, [chartData, subditNames]);

  const comparisonBarsData = useMemo(() => {
    if (chartData.length === 0) return [];
    const first = chartData[0];
    const latest = chartData[chartData.length - 1];
    return subditNames.map((name) => ({
      subdirektorat: name,
      labelSingkat: name.replace(/^Subdit\s+/i, ''),
      awal: Number(first[name] ?? 0),
      terbaru: Number(latest[name] ?? 0),
    }));
  }, [chartData, subditNames]);

  const toggleSubdit = (name: string) => {
    setSelectedSubdits((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Analisis Komparatif Tren Kepatuhan Subdirektorat
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Visualisasi perubahan rata-rata kepatuhan dan perbandingan antar-subdirektorat dari waktu ke waktu berdasarkan histori aktivitas tersimpan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setGroupMode('semua')}
              className={`rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
                groupMode === 'semua'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Aktivitas
            </button>
            <button
              type="button"
              onClick={() => setGroupMode('harian')}
              className={`rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
                groupMode === 'harian'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ringkas per Tanggal
            </button>
          </div>

          <button
            type="button"
            onClick={onRecordSnapshot}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
          >
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Rekam Snapshot Saat Ini</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1.5">
          <div className="text-xs font-medium text-slate-500">
            Titik Histori Tercatat
          </div>
          <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {summaryStats.totalPoints}
          </div>
          <div className="text-[11px] text-slate-500">
            Snapshot aktivitas dengan metrik kepatuhan
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1.5">
          <div className="text-xs font-medium text-slate-500">
            Rata-Rata Kepatuhan Terbaru
          </div>
          <div className="font-mono text-2xl font-bold text-blue-700 tabular-nums">
            {summaryStats.latestAvg}%
          </div>
          <div className="font-mono text-[11px] text-slate-500 tabular-nums">
            Awal tercatat: {summaryStats.firstAvg}%
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1.5">
          <div className="text-xs font-medium text-slate-500">
            Delta Pergerakan Kepatuhan
          </div>
          <div
            className={`inline-flex items-center gap-1.5 font-mono text-2xl font-bold tabular-nums ${
              summaryStats.delta > 0
                ? 'text-emerald-700'
                : summaryStats.delta < 0
                ? 'text-rose-700'
                : 'text-slate-700'
            }`}
          >
            {summaryStats.delta > 0 ? (
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
            ) : summaryStats.delta < 0 ? (
              <TrendingDown className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Minus className="h-5 w-5" aria-hidden="true" />
            )}
            <span>
              {summaryStats.delta > 0
                ? `+${summaryStats.delta}%`
                : `${summaryStats.delta}%`}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Perbandingan titik awal hingga terbaru
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1.5">
          <div className="text-xs font-medium text-slate-500">
            Capaian Subdirektorat Tertinggi
          </div>
          <div className="font-mono text-2xl font-bold text-emerald-700 tabular-nums">
            {summaryStats.topSubditPct}%
          </div>
          <div className="truncate text-[11px] font-medium text-slate-600" title={summaryStats.topSubdit}>
            {summaryStats.topSubdit}
          </div>
        </div>
      </div>

      {/* Main Comparative Line Chart */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Tren Rata-Rata Kepatuhan & Perbandingan Subdirektorat
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Garis tebal biru menunjukkan rata-rata kepatuhan seluruh subdirektorat; garis lainnya membandingkan unit yang dipilih.
            </p>
          </div>

          {subditNames.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {subditNames.map((name, idx) => {
                const checked = activeSubdits.includes(name);
                const dotClass =
                  SUBDIT_DOT_CLASSES[idx % SUBDIT_DOT_CLASSES.length];
                return (
                  <label
                    key={name}
                    className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSubdit(name)}
                      className="rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                    />
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${dotClass}`}
                      aria-hidden="true"
                    />
                    <span>{name.replace(/^Subdit\s+/i, '')}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {chartData.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-xs text-slate-500">
            <p>
              Belum ada histori aktivitas dengan snapshot kepatuhan yang tersimpan.
            </p>
            <button
              type="button"
              onClick={onRecordSnapshot}
              className="rounded-lg border border-blue-700 bg-blue-50 px-3 py-1.5 font-semibold text-blue-800 hover:bg-blue-100"
            >
              Rekam Snapshot Pertama
            </button>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 18, right: 24, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="labelWaktu"
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  tick={{ fill: '#334155', fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                />
                <Tooltip content={<ComparativeTrendTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <ReferenceLine
                  y={100}
                  stroke="#15803D"
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="rataRataKepatuhan"
                  name="Rata-Rata Seluruh Subdit"
                  stroke="#1D4ED8"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#1D4ED8', stroke: '#FFFFFF', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                {activeSubdits.map((name) => {
                  const colorIdx = subditNames.indexOf(name);
                  const color =
                    SUBDIT_COLORS[
                      (colorIdx >= 0 ? colorIdx : 0) % SUBDIT_COLORS.length
                    ];
                  return (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      name={name.replace(/^Subdit\s+/i, '')}
                      stroke={color}
                      strokeWidth={1.75}
                      strokeDasharray="4 2"
                      dot={{ r: 3, fill: color }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Bar Chart: Awal vs Terbaru per Subdirektorat */}
      {comparisonBarsData.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Komparasi Kepatuhan Awal vs Terbaru per Subdirektorat
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Membandingkan persentase kepatuhan pada catatan histori paling awal terhadap catatan terbaru.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonBarsData}
                margin={{ top: 16, right: 20, left: 0, bottom: 8 }}
                barGap={6}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="labelSingkat"
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                  interval={0}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  formatter={(value: unknown) => `${value ?? 0}%`}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar
                  dataKey="awal"
                  name="Histori Awal (%)"
                  fill="#94A3B8"
                  radius={[4, 4, 0, 0]}
                  barSize={26}
                />
                <Bar
                  dataKey="terbaru"
                  name="Histori Terbaru (%)"
                  fill="#1D4ED8"
                  radius={[4, 4, 0, 0]}
                  barSize={26}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Tabel Log Snapshot Histori */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Rincian Titik Histori Aktivitas ({rawSnapshots.length})
              </h2>
              <p className="text-xs text-slate-500">
                Urutan kronologis histori aktivitas beserta rata-rata kepatuhan pada masing-masing waktu pencatatan.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
                  Waktu Aktivitas
                </th>
                <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                  Kategori
                </th>
                <th className="px-3 py-2.5 font-semibold">
                  Ringkasan Perubahan
                </th>
                <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">
                  Dokumen Sesuai
                </th>
                <th className="px-4 py-2.5 font-semibold text-right whitespace-nowrap">
                  Rata-Rata Kepatuhan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rawSnapshots.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Belum ada catatan histori yang memiliki data kepatuhan.
                  </td>
                </tr>
              ) : (
                [...rawSnapshots].reverse().map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600 tabular-nums whitespace-nowrap">
                      {formatTimestampIndonesia(entry.timestampIso)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-semibold text-slate-700">
                      {entry.kategori}
                    </td>
                    <td className="px-3 py-2.5 text-slate-800">
                      {entry.ringkasan}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-700">
                      {entry.totalDokumenSesuai ?? 0}/
                      {entry.totalDokumenWajib ?? 0}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-blue-700 tabular-nums">
                      {entry.rataRataKepatuhan ?? 0}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  FilterX,
  LayoutGrid,
  Pencil,
  Table2,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CapaianKinerjaItem } from '../types/kinerja';
import {
  BULAN_LENGKAP,
  BULAN_SINGKAT,
  computeFocusedMetrics,
  computeMonthlyCapaianPct,
  getCalcMode,
  getItemYear,
  normalizeMonthlyArray,
} from '../utils/capaianUtils';

interface CapaianRealisasiDashboardProps {
  items: CapaianKinerjaItem[];
  knownSubdirectorates: string[];
  onOpenInputCapaian: () => void;
}

interface IndicatorComparisonDatum {
  labelSingkat: string;
  kodeIku: string;
  tahun: string;
  subdirektorat: string;
  indikatorKinerja: string;
  satuan: string;
  target: number;
  realisasi: number;
  realisasiDisplay: number | null;
  selisih: number | null;
  capaianPct: number | null;
  realisasiColor: string;
}

interface MonthlyChartDatum {
  bulan: string;
  bulanLengkap: string;
  rataCapaian: number | null;
  selisihTarget: number | null;
  jumlahIndikatorTerisi: number;
}

interface SubditChartDatum {
  subditSingkat: string;
  subdirektorat: string;
  rataCapaian: number;
  jumlahIndikator: number;
  fill: string;
}

interface IkkYearEntry {
  tahun: string;
  item: CapaianKinerjaItem;
}

interface IkkOption {
  key: string;
  kodeIku: string;
  indikatorKinerja: string;
  subdirektorat: string;
  satuan: string;
  entries: IkkYearEntry[];
}

interface IkkMonthlyDatum {
  bulan: string;
  bulanLengkap: string;
  satuan: string;
  targetByYear: Record<string, number>;
  pctByYear: Record<string, number | null>;
  [yearKey: string]: unknown;
}

interface IkkYearlyDatum {
  tahun: string;
  kodeIku: string;
  indikatorKinerja: string;
  subdirektorat: string;
  satuan: string;
  target: number;
  realisasi: number;
  realisasiDisplay: number | null;
  selisih: number | null;
  capaianPct: number | null;
  yoyDiff: number | null;
  realisasiColor: string;
}

function formatNumberId(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(val);
}

function TargetVsRealisasiTooltip({
  active,
  payload,
  focusLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: IndicatorComparisonDatum }>;
  focusLabel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  const selisihText =
    d.selisih === null
      ? '-'
      : `${d.selisih > 0 ? '+' : ''}${formatNumberId(d.selisih)} ${d.satuan}`;

  return (
    <div className="max-w-xs rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs shadow-sm">
      <div className="font-semibold text-blue-800">
        {d.subdirektorat} · {d.tahun}
      </div>
      <div className="mt-0.5 font-medium text-slate-900 leading-snug">
        {d.kodeIku} — {d.indikatorKinerja}
      </div>
      <div className="mt-2 space-y-1 border-t border-slate-100 pt-2 font-mono tabular-nums">
        <div className="flex items-center justify-between gap-4 text-slate-600">
          <span>Target ({focusLabel}):</span>
          <span className="font-semibold text-slate-900">
            {formatNumberId(d.target)} {d.satuan}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-600">
          <span>Realisasi:</span>
          <span className="font-semibold text-slate-900">
            {d.realisasiDisplay === null
              ? 'Belum diisi'
              : `${formatNumberId(d.realisasiDisplay)} ${d.satuan}`}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-600">
          <span>Selisih:</span>
          <span
            className={`font-semibold ${
              d.selisih === null
                ? 'text-slate-400'
                : d.selisih >= 0
                ? 'text-emerald-700'
                : 'text-rose-700'
            }`}
          >
            {selisihText}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-600">
          <span>Capaian:</span>
          <span
            className={`font-bold ${
              d.capaianPct === null
                ? 'text-slate-400'
                : d.capaianPct >= 100
                ? 'text-emerald-700'
                : d.capaianPct >= 75
                ? 'text-amber-700'
                : 'text-rose-700'
            }`}
          >
            {d.capaianPct === null ? '-' : `${d.capaianPct}%`}
          </span>
        </div>
      </div>
    </div>
  );
}

function MonthlyTrendTooltip({
  active,
  payload,
  yearLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: MonthlyChartDatum }>;
  yearLabel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <div className="font-semibold text-slate-900">
        {d.bulanLengkap} ({yearLabel})
      </div>
      {d.rataCapaian === null ? (
        <div className="mt-1 text-slate-500">Belum ada realisasi tercatat</div>
      ) : (
        <div className="mt-1 space-y-0.5 font-mono tabular-nums">
          <div className="font-semibold text-blue-700">
            Rata-rata Capaian: {d.rataCapaian}%
          </div>
          {d.selisihTarget !== null && (
            <div
              className={
                d.selisihTarget >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }
            >
              vs Target 100%: {d.selisihTarget >= 0 ? '+' : ''}
              {d.selisihTarget}%
            </div>
          )}
          <div className="font-sans text-[11px] text-slate-500">
            Berdasarkan {d.jumlahIndikatorTerisi} indikator terisi
          </div>
        </div>
      )}
    </div>
  );
}

function SubditBarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: SubditChartDatum }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <div className="font-semibold text-slate-900">{d.subdirektorat}</div>
      <div className="mt-1 font-mono font-semibold text-slate-800 tabular-nums">
        Capaian: {d.rataCapaian}% ({d.jumlahIndikator} indikator)
      </div>
    </div>
  );
}

function IkkMonthlyTooltip({
  active,
  payload,
  years,
  kodeIku,
}: {
  active?: boolean;
  payload?: Array<{ payload: IkkMonthlyDatum }>;
  years: string[];
  kodeIku: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  const filledPairs = years
    .map((yr) => {
      const val = d[`y_${yr}`];
      return {
        yr,
        val: typeof val === 'number' ? val : null,
        target: d.targetByYear[yr] ?? 0,
        pct: d.pctByYear[yr] ?? null,
      };
    });
  const latestTwo = filledPairs.filter((p) => p.val !== null);
  const yoyDelta =
    latestTwo.length >= 2
      ? Math.round(
          ((latestTwo[latestTwo.length - 1].val as number) -
            (latestTwo[latestTwo.length - 2].val as number)) *
            100
        ) / 100
      : null;

  return (
    <div className="min-w-[215px] rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs shadow-sm">
      <div className="font-semibold text-slate-900">
        {d.bulanLengkap} · {kodeIku}
      </div>
      <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2 font-mono tabular-nums">
        {filledPairs.map((p) => (
          <div key={p.yr} className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-700">{p.yr}</span>
            {p.val === null ? (
              <span className="text-slate-400">Belum diisi</span>
            ) : (
              <span className="text-right">
                <span className="font-semibold text-slate-900">
                  {formatNumberId(p.val)} {d.satuan}
                </span>
                <span className="ml-1.5 text-[11px] text-slate-500">
                  (Target {formatNumberId(p.target)} · {p.pct ?? 0}%)
                </span>
              </span>
            )}
          </div>
        ))}
        {yoyDelta !== null && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-1.5 text-[11px]">
            <span className="font-sans text-slate-500">
              Selisih {latestTwo[latestTwo.length - 1].yr} vs{' '}
              {latestTwo[latestTwo.length - 2].yr}:
            </span>
            <span
              className={`font-semibold ${
                yoyDelta > 0
                  ? 'text-emerald-700'
                  : yoyDelta < 0
                  ? 'text-rose-700'
                  : 'text-slate-700'
              }`}
            >
              {yoyDelta > 0 ? '+' : ''}
              {formatNumberId(yoyDelta)} {d.satuan}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function IkkYearlyTooltip({
  active,
  payload,
  focusLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: IkkYearlyDatum }>;
  focusLabel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  const selisihText =
    d.selisih === null
      ? '-'
      : `${d.selisih > 0 ? '+' : ''}${formatNumberId(d.selisih)} ${d.satuan}`;

  return (
    <div className="min-w-[215px] rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs shadow-sm">
      <div className="font-semibold text-blue-800">
        Tahun {d.tahun} · {d.kodeIku}
      </div>
      <div className="mt-0.5 text-[11px] text-slate-500">
        Periode: {focusLabel}
      </div>
      <div className="mt-2 space-y-1 border-t border-slate-100 pt-2 font-mono tabular-nums">
        <div className="flex items-center justify-between gap-4 text-slate-600">
          <span>Target:</span>
          <span className="font-semibold text-slate-900">
            {formatNumberId(d.target)} {d.satuan}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-600">
          <span>Realisasi:</span>
          <span className="font-semibold text-slate-900">
            {d.realisasiDisplay === null
              ? 'Belum diisi'
              : `${formatNumberId(d.realisasiDisplay)} ${d.satuan}`}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-600">
          <span>Selisih Target:</span>
          <span
            className={`font-semibold ${
              d.selisih === null
                ? 'text-slate-400'
                : d.selisih >= 0
                ? 'text-emerald-700'
                : 'text-rose-700'
            }`}
          >
            {selisihText}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-600">
          <span>Capaian:</span>
          <span
            className={`font-bold ${
              d.capaianPct === null
                ? 'text-slate-400'
                : d.capaianPct >= 100
                ? 'text-emerald-700'
                : d.capaianPct >= 75
                ? 'text-amber-700'
                : 'text-rose-700'
            }`}
          >
            {d.capaianPct === null ? '-' : `${d.capaianPct}%`}
          </span>
        </div>
        {d.yoyDiff !== null && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-1 text-[11px]">
            <span className="font-sans text-slate-500">vs Tahun Sebelumnya:</span>
            <span
              className={`font-semibold ${
                d.yoyDiff > 0
                  ? 'text-emerald-700'
                  : d.yoyDiff < 0
                  ? 'text-rose-700'
                  : 'text-slate-700'
              }`}
            >
              {d.yoyDiff > 0 ? '+' : ''}
              {formatNumberId(d.yoyDiff)} {d.satuan}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusLabel({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-slate-400">Belum diisi</span>;
  }
  if (pct >= 100) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Tercapai</span>
      </span>
    );
  }
  if (pct >= 75) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Mendekati</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Perlu Perhatian</span>
    </span>
  );
}

export const CapaianRealisasiDashboard: React.FC<
  CapaianRealisasiDashboardProps
> = ({ items, knownSubdirectorates, onOpenInputCapaian }) => {
  const availableYears = useMemo(() => {
    const yearSet = new Set<string>();
    items.forEach((item) => {
      yearSet.add(getItemYear(item));
    });
    return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  }, [items]);

  const [selectedYear, setSelectedYear] = useState<string>(
    () => availableYears[0] || 'Semua'
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('ytd');
  const [selectedSubdit, setSelectedSubdit] = useState<string>('Semua');
  const [section2Mode, setSection2Mode] = useState<
    'bulanan' | 'tahunan' | 'semua_ikk'
  >('bulanan');
  const [selectedIkkKey, setSelectedIkkKey] = useState<string>('');
  const [tableMode, setTableMode] = useState<'perbandingan' | 'matriks'>(
    'perbandingan'
  );

  const effectiveYear = useMemo(() => {
    if (selectedYear === 'Semua') return 'Semua';
    if (availableYears.includes(selectedYear)) return selectedYear;
    return availableYears[0] || 'Semua';
  }, [selectedYear, availableYears]);

  const subditOptions = useMemo(() => {
    const set = new Set<string>(knownSubdirectorates);
    items.forEach((i) => {
      if (i.subdirektorat.trim()) set.add(i.subdirektorat.trim());
    });
    return Array.from(set);
  }, [knownSubdirectorates, items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (effectiveYear !== 'Semua' && getItemYear(item) !== effectiveYear) {
        return false;
      }
      if (selectedSubdit !== 'Semua' && item.subdirektorat !== selectedSubdit) {
        return false;
      }
      return true;
    });
  }, [items, effectiveYear, selectedSubdit]);

  const focusMonthIdx =
    selectedMonth === 'ytd' ? null : Number(selectedMonth);

  const evaluatedRows = useMemo(() => {
    return filteredItems.map((item) => {
      const monthly = normalizeMonthlyArray(item.realisasiBulanan);
      const metrics = computeFocusedMetrics(item, focusMonthIdx);
      const tahun = getItemYear(item);

      return {
        item,
        tahun,
        monthly,
        target: metrics.target,
        displayRealisasi: metrics.realisasi,
        selisih: metrics.selisih,
        displayPct: metrics.capaianPct,
        isMonthlyTargetProportional: metrics.isMonthlyTargetProportional,
      };
    });
  }, [filteredItems, focusMonthIdx]);

  const kpiStats = useMemo(() => {
    const total = evaluatedRows.length;
    if (total === 0) {
      return {
        total: 0,
        countedForAvg: 0,
        rataRata: 0,
        tercapai: 0,
        belumTercapai: 0,
        perluPerhatian: 0,
        activeMonthsCount: 0,
      };
    }

    let sumPct = 0;
    let countedForAvg = 0;
    let tercapai = 0;
    let perluPerhatian = 0;
    const monthsWithData = new Set<number>();

    for (const row of evaluatedRows) {
      row.monthly.forEach((v, idx) => {
        if (v !== null) monthsWithData.add(idx);
      });
      if (row.displayPct !== null) {
        sumPct += row.displayPct;
        countedForAvg++;
        if (row.displayPct >= 100) tercapai++;
        else if (row.displayPct < 75) perluPerhatian++;
      }
    }

    return {
      total,
      countedForAvg,
      rataRata:
        countedForAvg > 0
          ? Math.round((sumPct / countedForAvg) * 10) / 10
          : 0,
      tercapai,
      belumTercapai: Math.max(0, countedForAvg - tercapai),
      perluPerhatian,
      activeMonthsCount: monthsWithData.size,
    };
  }, [evaluatedRows]);

  const groupedTableRows = useMemo(() => {
    const groups = new Map<string, typeof evaluatedRows>();
    for (const row of evaluatedRows) {
      const rawSasaran = row.item.sasaranKinerja?.trim() || '';
      const key = rawSasaran
        ? rawSasaran.toLowerCase().replace(/\s+/g, ' ')
        : `__empty_${row.item.id}`;
      const existing = groups.get(key);
      if (existing) {
        existing.push(row);
      } else {
        groups.set(key, [row]);
      }
    }

    const result: Array<
      (typeof evaluatedRows)[number] & {
        sasaranRowSpan: number;
        isGroupStart: boolean;
      }
    > = [];

    for (const group of groups.values()) {
      group.forEach((row, idx) => {
        result.push({
          ...row,
          sasaranRowSpan: idx === 0 ? group.length : 0,
          isGroupStart: idx === 0,
        });
      });
    }

    return result;
  }, [evaluatedRows]);

  const indicatorComparisonData = useMemo<IndicatorComparisonDatum[]>(() => {
    return evaluatedRows.map((row) => {
      const shortSubdit = row.item.subdirektorat
        .replace(/^Subdit\s+/i, '')
        .split(' ')
        .slice(0, 2)
        .join(' ');
      const labelSingkat =
        effectiveYear === 'Semua'
          ? `${row.item.kodeIku} (${row.tahun})`
          : `${row.item.kodeIku} · ${shortSubdit}`;

      const pct = row.displayPct;
      const realisasiColor =
        pct === null
          ? '#CBD5E1'
          : pct >= 100
          ? '#15803D'
          : pct >= 75
          ? '#1D4ED8'
          : '#B91C1C';

      return {
        labelSingkat,
        kodeIku: row.item.kodeIku,
        tahun: row.tahun,
        subdirektorat: row.item.subdirektorat,
        indikatorKinerja: row.item.indikatorKinerja,
        satuan: row.item.satuan,
        target: row.target,
        realisasi: row.displayRealisasi ?? 0,
        realisasiDisplay: row.displayRealisasi,
        selisih: row.selisih,
        capaianPct: pct,
        realisasiColor,
      };
    });
  }, [evaluatedRows, effectiveYear]);

  const monthlyTrendData = useMemo<MonthlyChartDatum[]>(() => {
    return BULAN_SINGKAT.map((bln, mIdx) => {
      const pcts: number[] = [];
      for (const item of filteredItems) {
        const mPct = computeMonthlyCapaianPct(item, mIdx);
        if (mPct !== null) pcts.push(mPct);
      }
      const avg =
        pcts.length > 0
          ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) /
            10
          : null;

      return {
        bulan: bln,
        bulanLengkap: BULAN_LENGKAP[mIdx],
        rataCapaian: avg,
        selisihTarget: avg !== null ? Math.round((avg - 100) * 10) / 10 : null,
        jumlahIndikatorTerisi: pcts.length,
      };
    });
  }, [filteredItems]);

  const ikkOptions = useMemo<IkkOption[]>(() => {
    const map = new Map<string, IkkOption>();
    for (const item of items) {
      if (selectedSubdit !== 'Semua' && item.subdirektorat !== selectedSubdit) {
        continue;
      }
      const key = `${item.kodeIku}:::${item.subdirektorat}`;
      const tahun = getItemYear(item);
      const existing = map.get(key);
      if (existing) {
        existing.entries.push({ tahun, item });
      } else {
        map.set(key, {
          key,
          kodeIku: item.kodeIku,
          indikatorKinerja: item.indikatorKinerja,
          subdirektorat: item.subdirektorat,
          satuan: item.satuan,
          entries: [{ tahun, item }],
        });
      }
    }

    return Array.from(map.values())
      .map((opt) => ({
        ...opt,
        entries: [...opt.entries].sort((a, b) => a.tahun.localeCompare(b.tahun)),
      }))
      .sort((a, b) => a.kodeIku.localeCompare(b.kodeIku));
  }, [items, selectedSubdit]);

  const activeIkkOption = useMemo(() => {
    if (ikkOptions.length === 0) return null;
    return (
      ikkOptions.find((opt) => opt.key === selectedIkkKey) || ikkOptions[0]
    );
  }, [ikkOptions, selectedIkkKey]);

  const ikkYears = useMemo(
    () => (activeIkkOption ? activeIkkOption.entries.map((e) => e.tahun) : []),
    [activeIkkOption]
  );

  const ikkMonthlyData = useMemo<IkkMonthlyDatum[]>(() => {
    if (!activeIkkOption) return [];
    return BULAN_SINGKAT.map((bln, mIdx) => {
      const datum: IkkMonthlyDatum = {
        bulan: bln,
        bulanLengkap: BULAN_LENGKAP[mIdx],
        satuan: activeIkkOption.satuan,
        targetByYear: {},
        pctByYear: {},
      };
      for (const entry of activeIkkOption.entries) {
        const monthly = normalizeMonthlyArray(entry.item.realisasiBulanan);
        const val = monthly[mIdx];
        const mMetrics = computeFocusedMetrics(entry.item, mIdx);
        datum[`y_${entry.tahun}`] = val;
        datum.targetByYear[entry.tahun] = mMetrics.target;
        datum.pctByYear[entry.tahun] = mMetrics.capaianPct;
      }
      return datum;
    });
  }, [activeIkkOption]);

  const ikkYearlyData = useMemo<IkkYearlyDatum[]>(() => {
    if (!activeIkkOption) return [];
    let prevRealisasi: number | null = null;
    return activeIkkOption.entries.map((entry) => {
      const metrics = computeFocusedMetrics(entry.item, focusMonthIdx);
      const pct = metrics.capaianPct;
      const realisasiColor =
        pct === null
          ? '#CBD5E1'
          : pct >= 100
          ? '#15803D'
          : pct >= 75
          ? '#1D4ED8'
          : '#B91C1C';
      const yoyDiff =
        metrics.realisasi !== null && prevRealisasi !== null
          ? Math.round((metrics.realisasi - prevRealisasi) * 100) / 100
          : null;
      if (metrics.realisasi !== null) {
        prevRealisasi = metrics.realisasi;
      }

      return {
        tahun: entry.tahun,
        kodeIku: entry.item.kodeIku,
        indikatorKinerja: entry.item.indikatorKinerja,
        subdirektorat: entry.item.subdirektorat,
        satuan: entry.item.satuan,
        target: metrics.target,
        realisasi: metrics.realisasi ?? 0,
        realisasiDisplay: metrics.realisasi,
        selisih: metrics.selisih,
        capaianPct: pct,
        yoyDiff,
        realisasiColor,
      };
    });
  }, [activeIkkOption, focusMonthIdx]);

  const ikkMonthlyTargetRef = useMemo(() => {
    if (!activeIkkOption || activeIkkOption.entries.length === 0) return null;
    const preferredEntry =
      (effectiveYear !== 'Semua'
        ? activeIkkOption.entries.find((e) => e.tahun === effectiveYear)
        : undefined) ||
      activeIkkOption.entries[activeIkkOption.entries.length - 1];
    const mMetrics = computeFocusedMetrics(preferredEntry.item, 0);
    return {
      tahun: preferredEntry.tahun,
      target: mMetrics.target,
      satuan: preferredEntry.item.satuan,
    };
  }, [activeIkkOption, effectiveYear]);

  const subditChartData = useMemo<SubditChartDatum[]>(() => {
    const map = new Map<string, number[]>();
    for (const row of evaluatedRows) {
      const name = row.item.subdirektorat;
      if (!map.has(name)) map.set(name, []);
      if (row.displayPct !== null) {
        map.get(name)!.push(row.displayPct);
      }
    }

    return Array.from(map.entries()).map(([subdirektorat, pcts]) => {
      const avg =
        pcts.length > 0
          ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) /
            10
          : 0;
      const fill =
        avg >= 100 ? '#15803D' : avg >= 75 ? '#B45309' : '#B91C1C';
      return {
        subdirektorat,
        subditSingkat: subdirektorat.replace(/^Subdit\s+/i, ''),
        rataCapaian: avg,
        jumlahIndikator: pcts.length,
        fill,
      };
    });
  }, [evaluatedRows]);

  const focusLabel =
    focusMonthIdx === null
      ? 'Keseluruhan (YTD)'
      : BULAN_LENGKAP[focusMonthIdx];
  const yearLabel =
    effectiveYear === 'Semua' ? 'Semua Tahun' : `Tahun ${effectiveYear}`;

  const isFilteredNonDefault =
    selectedSubdit !== 'Semua' ||
    selectedMonth !== 'ytd' ||
    (availableYears.length > 0 && effectiveYear !== availableYears[0]);

  const handleResetFilters = () => {
    setSelectedYear(availableYears[0] || 'Semua');
    setSelectedMonth('ytd');
    setSelectedSubdit('Semua');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Dashboard Perbandingan Target, Realisasi &amp; Capaian Kinerja
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Bandingkan target, realisasi aktual, selisih, dan persentase capaian kinerja dengan filter per bulan dan tahun.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenInputCapaian}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
        >
          <span>Input / Perbarui Realisasi</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Filter Bar: Tahun, Bulan, Subdirektorat */}
      <section
        aria-label="Filter dashboard capaian"
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/90 bg-white px-5 py-3.5 text-xs shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label
              htmlFor="dash-tahun"
              className="inline-flex items-center gap-1 font-medium text-slate-700 whitespace-nowrap"
            >
              <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <span>Tahun:</span>
            </label>
            <select
              id="dash-tahun"
              value={effectiveYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs font-medium text-slate-900 focus:border-blue-700 focus:outline-none"
            >
              <option value="Semua">Semua Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="dash-bulan"
              className="font-medium text-slate-700 whitespace-nowrap"
            >
              Bulan:
            </label>
            <select
              id="dash-bulan"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
            >
              <option value="ytd">Keseluruhan (YTD)</option>
              {BULAN_LENGKAP.map((bln, idx) => (
                <option key={bln} value={String(idx)}>
                  {bln}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="dash-subdit"
              className="font-medium text-slate-700 whitespace-nowrap"
            >
              Unit Kerja:
            </label>
            <select
              id="dash-subdit"
              value={selectedSubdit}
              onChange={(e) => setSelectedSubdit(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
            >
              <option value="Semua">Semua Unit Kerja</option>
              {subditOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {isFilteredNonDefault && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap"
            >
              <FilterX className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
          {yearLabel} · {focusLabel} · {kpiStats.activeMonthsCount}/12 bln terisi
        </div>
      </section>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="text-xs font-medium text-slate-500">
            Indikator Dipantau
          </div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {kpiStats.total}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">{yearLabel}</div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="text-xs font-medium text-slate-500">
            Rata-Rata Capaian
          </div>
          <div
            className={`mt-1.5 font-mono text-2xl font-bold tabular-nums ${
              kpiStats.rataRata >= 100
                ? 'text-emerald-700'
                : kpiStats.rataRata >= 75
                ? 'text-blue-700'
                : 'text-rose-700'
            }`}
          >
            {kpiStats.rataRata}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Target 100% · {focusLabel}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="text-xs font-medium text-slate-500">
            Mencapai Target (≥ 100%)
          </div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
            {kpiStats.tercapai}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
            dari {kpiStats.countedForAvg} indikator terisi
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="text-xs font-medium text-slate-500">
            Di Bawah Target (&lt; 100%)
          </div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-amber-700 tabular-nums">
            {kpiStats.belumTercapai}
          </div>
          <div className="mt-1 text-[11px] text-rose-700 font-mono tabular-nums">
            {kpiStats.perluPerhatian} perlu perhatian (&lt; 75%)
          </div>
        </div>
      </div>

      {/* Chart 1 / Section 2: Perbandingan Tiap IKK Berdasarkan Waktu (Bulan, Tahun) & Snapshot */}
      <section className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              {section2Mode === 'bulanan'
                ? 'Perbandingan IKK per Bulan Antar Tahun (Jan–Des)'
                : section2Mode === 'tahunan'
                ? `Perbandingan IKK Antar Tahun (${focusLabel})`
                : `Perbandingan Nilai Target vs Realisasi (${yearLabel} · ${focusLabel})`}
            </h2>
            <p className="text-xs text-slate-500">
              {section2Mode === 'bulanan'
                ? 'Membandingkan realisasi bulanan satu IKK dari Januari hingga Desember lintas tahun anggaran.'
                : section2Mode === 'tahunan'
                ? 'Membandingkan target, realisasi, dan % capaian satu IKK dari tahun ke tahun pada periode terpilih.'
                : 'Membandingkan angka target terhadap realisasi seluruh indikator; arahkan kursor pada batang untuk melihat selisih dan % capaian.'}
            </p>
          </div>

          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setSection2Mode('bulanan')}
              className={`rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
                section2Mode === 'bulanan'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Bulan (Jan–Des)
            </button>
            <button
              type="button"
              onClick={() => setSection2Mode('tahunan')}
              className={`rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
                section2Mode === 'tahunan'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Tahun
            </button>
            <button
              type="button"
              onClick={() => setSection2Mode('semua_ikk')}
              className={`rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
                section2Mode === 'semua_ikk'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua IKK
            </button>
          </div>
        </div>

        {section2Mode !== 'semua_ikk' ? (
          <>
            {/* Bar Kontrol Pilihan IKK + Ringkasan Tahun */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 min-w-0 flex-1">
                <label
                  htmlFor="dash-ikk-select"
                  className="font-semibold text-slate-700 whitespace-nowrap"
                >
                  Pilih IKK:
                </label>
                <select
                  id="dash-ikk-select"
                  value={activeIkkOption?.key || ''}
                  onChange={(e) => setSelectedIkkKey(e.target.value)}
                  className="max-w-full min-w-[240px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-blue-700 focus:outline-none sm:max-w-xl"
                >
                  {ikkOptions.length === 0 ? (
                    <option value="">Tidak ada IKK tersedia</option>
                  ) : (
                    ikkOptions.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.kodeIku} — {opt.indikatorKinerja} ({opt.subdirektorat})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {activeIkkOption && (
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600">
                  {section2Mode === 'bulanan' ? (
                    <>
                      {ikkYears.map((yr, idx) => {
                        const isPrimary =
                          effectiveYear !== 'Semua'
                            ? yr === effectiveYear
                            : idx === ikkYears.length - 1;
                        const dotColor = isPrimary
                          ? '#1D4ED8'
                          : idx % 2 === 0
                          ? '#94A3B8'
                          : '#0D9488';
                        return (
                          <span
                            key={yr}
                            className="inline-flex items-center gap-1.5"
                          >
                            <svg
                              className="h-2.5 w-2.5 shrink-0"
                              viewBox="0 0 10 10"
                              aria-hidden="true"
                            >
                              <rect
                                x="0"
                                y="0"
                                width="10"
                                height="10"
                                rx="2"
                                fill={dotColor}
                              />
                            </svg>
                            <span className="font-mono font-semibold text-slate-800">
                              {yr}
                            </span>
                          </span>
                        );
                      })}
                      {ikkMonthlyTargetRef && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700">
                          <span className="h-0.5 w-3 bg-emerald-700" aria-hidden="true" />
                          <span>
                            Target {ikkMonthlyTargetRef.tahun}:{' '}
                            {formatNumberId(ikkMonthlyTargetRef.target)}{' '}
                            {ikkMonthlyTargetRef.satuan}/bln
                          </span>
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-xs bg-slate-400"
                          aria-hidden="true"
                        />
                        <span>Target</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-xs bg-emerald-700"
                          aria-hidden="true"
                        />
                        <span>Realisasi ≥ 100%</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-xs bg-blue-700"
                          aria-hidden="true"
                        />
                        <span>Realisasi 75–99%</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-xs bg-rose-700"
                          aria-hidden="true"
                        />
                        <span>Realisasi &lt; 75%</span>
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {!activeIkkOption ? (
              <div className="flex h-64 items-center justify-center text-xs text-slate-500">
                Tidak ada indikator IKK yang sesuai dengan filter Unit Kerja saat ini.
              </div>
            ) : section2Mode === 'bulanan' ? (
              <>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={ikkMonthlyData}
                      margin={{ top: 18, right: 16, left: 0, bottom: 4 }}
                      barGap={3}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E2E8F0"
                      />
                      <XAxis
                        dataKey="bulan"
                        axisLine={{ stroke: '#CBD5E1' }}
                        tickLine={false}
                        tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        width={42}
                        tick={{ fill: '#64748B', fontSize: 11 }}
                      />
                      <Tooltip
                        cursor={{ fill: '#F1F5F9' }}
                        content={
                          <IkkMonthlyTooltip
                            years={ikkYears}
                            kodeIku={activeIkkOption.kodeIku}
                          />
                        }
                      />
                      {ikkMonthlyTargetRef && ikkMonthlyTargetRef.target > 0 && (
                        <ReferenceLine
                          y={ikkMonthlyTargetRef.target}
                          stroke="#15803D"
                          strokeDasharray="4 4"
                          label={{
                            value: `Target (${formatNumberId(
                              ikkMonthlyTargetRef.target
                            )})`,
                            position: 'insideTopRight',
                            fill: '#15803D',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        />
                      )}
                      {focusMonthIdx !== null && (
                        <ReferenceLine
                          x={BULAN_SINGKAT[focusMonthIdx]}
                          stroke="#1D4ED8"
                          strokeDasharray="3 3"
                        />
                      )}
                      {ikkYears.map((yr, idx) => {
                        const isPrimary =
                          effectiveYear !== 'Semua'
                            ? yr === effectiveYear
                            : idx === ikkYears.length - 1;
                        const fillColor = isPrimary
                          ? '#1D4ED8'
                          : idx % 2 === 0
                          ? '#94A3B8'
                          : '#0D9488';
                        return (
                          <Bar
                            key={yr}
                            dataKey={`y_${yr}`}
                            name={`Tahun ${yr}`}
                            fill={fillColor}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={24}
                          />
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Ringkasan komparasi antar tahun untuk IKK terpilih */}
                <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
                  {ikkYearlyData.map((yItem) => (
                    <div
                      key={yItem.tahun}
                      className="rounded-lg border border-slate-200/80 bg-slate-50/50 px-3.5 py-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          Tahun {yItem.tahun}
                        </span>
                        <span
                          className={`font-mono font-bold tabular-nums ${
                            yItem.capaianPct === null
                              ? 'text-slate-400'
                              : yItem.capaianPct >= 100
                              ? 'text-emerald-700'
                              : yItem.capaianPct >= 75
                              ? 'text-blue-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {yItem.capaianPct === null ? '-' : `${yItem.capaianPct}%`}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 font-mono text-[11px] text-slate-600 tabular-nums">
                        <span>
                          Target: {formatNumberId(yItem.target)} {yItem.satuan}
                        </span>
                        <span className="font-semibold text-slate-900">
                          Real:{' '}
                          {yItem.realisasiDisplay === null
                            ? '-'
                            : `${formatNumberId(yItem.realisasiDisplay)} ${
                                yItem.satuan
                              }`}
                        </span>
                      </div>
                      {yItem.yoyDiff !== null && (
                        <div
                          className={`mt-1 font-mono text-[11px] font-semibold tabular-nums ${
                            yItem.yoyDiff > 0
                              ? 'text-emerald-700'
                              : yItem.yoyDiff < 0
                              ? 'text-rose-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {yItem.yoyDiff > 0 ? '+' : ''}
                          {formatNumberId(yItem.yoyDiff)} {yItem.satuan} vs tahun lalu
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={ikkYearlyData}
                      margin={{ top: 20, right: 16, left: 0, bottom: 8 }}
                      barGap={8}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E2E8F0"
                      />
                      <XAxis
                        dataKey="tahun"
                        axisLine={{ stroke: '#CBD5E1' }}
                        tickLine={false}
                        tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        width={42}
                        tick={{ fill: '#64748B', fontSize: 11 }}
                      />
                      <Tooltip
                        cursor={{ fill: '#F1F5F9' }}
                        content={<IkkYearlyTooltip focusLabel={focusLabel} />}
                      />
                      <Bar
                        dataKey="target"
                        name="Target"
                        fill="#94A3B8"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={48}
                      >
                        <LabelList
                          dataKey="target"
                          position="top"
                          formatter={(v: unknown) =>
                            typeof v === 'number' ? formatNumberId(v) : ''
                          }
                          fill="#64748B"
                          fontSize={11}
                          fontWeight={600}
                        />
                      </Bar>
                      <Bar
                        dataKey="realisasi"
                        name="Realisasi"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={48}
                      >
                        {ikkYearlyData.map((entry) => (
                          <Cell
                            key={`${entry.kodeIku}-${entry.tahun}`}
                            fill={entry.realisasiColor}
                          />
                        ))}
                        <LabelList
                          dataKey="realisasiDisplay"
                          position="top"
                          formatter={(v: unknown) =>
                            typeof v === 'number' ? formatNumberId(v) : '-'
                          }
                          fill="#0F172A"
                          fontSize={11}
                          fontWeight={700}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
                  {ikkYearlyData.map((yItem) => (
                    <div
                      key={yItem.tahun}
                      className="rounded-lg border border-slate-200/80 bg-slate-50/50 px-3.5 py-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          {yItem.tahun} ({focusLabel})
                        </span>
                        <span
                          className={`font-mono font-bold tabular-nums ${
                            yItem.capaianPct === null
                              ? 'text-slate-400'
                              : yItem.capaianPct >= 100
                              ? 'text-emerald-700'
                              : yItem.capaianPct >= 75
                              ? 'text-blue-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {yItem.capaianPct === null ? '-' : `${yItem.capaianPct}%`}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-slate-600 tabular-nums">
                        Target {formatNumberId(yItem.target)} · Realisasi{' '}
                        {yItem.realisasiDisplay === null
                          ? 'Belum diisi'
                          : `${formatNumberId(yItem.realisasiDisplay)} ${
                              yItem.satuan
                            }`}
                      </div>
                      {yItem.yoyDiff !== null && (
                        <div
                          className={`mt-1 font-mono text-[11px] font-semibold tabular-nums ${
                            yItem.yoyDiff > 0
                              ? 'text-emerald-700'
                              : yItem.yoyDiff < 0
                              ? 'text-rose-700'
                              : 'text-slate-500'
                          }`}
                        >
                          Tren YoY: {yItem.yoyDiff > 0 ? '+' : ''}
                          {formatNumberId(yItem.yoyDiff)} {yItem.satuan}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-slate-400" aria-hidden="true" />
                <span>Target</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-700" aria-hidden="true" />
                <span>Realisasi ≥ 100%</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-blue-700" aria-hidden="true" />
                <span>Realisasi 75–99%</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-rose-700" aria-hidden="true" />
                <span>Realisasi &lt; 75%</span>
              </span>
            </div>

            {indicatorComparisonData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-xs text-slate-500">
                Tidak ada indikator capaian kinerja untuk filter tahun/unit kerja yang dipilih.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={indicatorComparisonData}
                    margin={{ top: 18, right: 16, left: 0, bottom: 8 }}
                    barGap={4}
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
                      axisLine={false}
                      tickLine={false}
                      width={42}
                      tick={{ fill: '#64748B', fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ fill: '#F1F5F9' }}
                      content={<TargetVsRealisasiTooltip focusLabel={focusLabel} />}
                    />
                    <Bar
                      dataKey="target"
                      name="Target"
                      fill="#94A3B8"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    >
                      <LabelList
                        dataKey="target"
                        position="top"
                        formatter={(v: unknown) =>
                          typeof v === 'number' ? formatNumberId(v) : ''
                        }
                        fill="#64748B"
                        fontSize={10}
                        fontWeight={600}
                      />
                    </Bar>
                    <Bar
                      dataKey="realisasi"
                      name="Realisasi"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    >
                      {indicatorComparisonData.map((entry) => (
                        <Cell
                          key={`${entry.kodeIku}-${entry.tahun}-${entry.subdirektorat}`}
                          fill={entry.realisasiColor}
                        />
                      ))}
                      <LabelList
                        dataKey="realisasiDisplay"
                        position="top"
                        formatter={(v: unknown) =>
                          typeof v === 'number' ? formatNumberId(v) : '-'
                        }
                        fill="#0F172A"
                        fontSize={10}
                        fontWeight={700}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </section>

      {/* Charts Grid: Tren Bulanan + Capaian per Subdirektorat */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Tren Capaian Bulanan */}
        <section className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                Tren Capaian Bulanan vs Target ({yearLabel})
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Rata-rata persentase capaian seluruh indikator terisi tiap bulan (Jan–Des) terhadap target 100%.
              </p>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="flex h-60 items-center justify-center text-xs text-slate-500">
              Belum ada data indikator untuk menampilkan grafik bulanan.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTrendData}
                  margin={{ top: 18, right: 16, left: 0, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="capaianFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                  />
                  <XAxis
                    dataKey="bulan"
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                    tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis
                    domain={[0, 120]}
                    ticks={[0, 25, 50, 75, 100]}
                    axisLine={false}
                    tickLine={false}
                    width={38}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                  />
                  <Tooltip
                    content={<MonthlyTrendTooltip yearLabel={yearLabel} />}
                  />
                  <ReferenceLine
                    y={100}
                    stroke="#15803D"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Target 100%',
                      position: 'insideTopRight',
                      fill: '#15803D',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                  {focusMonthIdx !== null && (
                    <ReferenceLine
                      x={BULAN_SINGKAT[focusMonthIdx]}
                      stroke="#1D4ED8"
                      strokeDasharray="3 3"
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="rataCapaian"
                    connectNulls={false}
                    stroke="#1D4ED8"
                    strokeWidth={2.5}
                    fill="url(#capaianFill)"
                    dot={{
                      r: 4,
                      fill: '#1D4ED8',
                      stroke: '#FFFFFF',
                      strokeWidth: 2,
                    }}
                    activeDot={{ r: 6, fill: '#1E3A8A' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Perbandingan Capaian per Subdirektorat */}
        <section className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                Capaian per Subdirektorat ({focusLabel})
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Rata-rata persentase capaian tiap subdirektorat dibandingkan target 100% pada {yearLabel}.
              </p>
            </div>
            <BarChart3 className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>

          {subditChartData.length === 0 ? (
            <div className="flex h-60 items-center justify-center text-xs text-slate-500">
              Belum ada data capaian subdirektorat untuk ditampilkan.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subditChartData}
                  margin={{ top: 20, right: 16, left: 0, bottom: 8 }}
                  barSize={44}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                  />
                  <XAxis
                    dataKey="subditSingkat"
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                    tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 120]}
                    ticks={[0, 25, 50, 75, 100]}
                    axisLine={false}
                    tickLine={false}
                    width={38}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#F1F5F9' }}
                    content={<SubditBarTooltip />}
                  />
                  <ReferenceLine y={100} stroke="#15803D" strokeDasharray="4 4" />
                  <Bar dataKey="rataCapaian" radius={[6, 6, 0, 0]}>
                    {subditChartData.map((entry) => (
                      <Cell key={entry.subdirektorat} fill={entry.fill} />
                    ))}
                    <LabelList
                      dataKey="rataCapaian"
                      position="top"
                      formatter={(val: unknown) => `${val ?? 0}%`}
                      fill="#0F172A"
                      fontSize={11}
                      fontWeight={600}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* Tabel Perbandingan Target, Realisasi & Capaian / Matriks Jan-Des */}
      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              {tableMode === 'perbandingan'
                ? `Tabel Perbandingan Target, Realisasi & Capaian (${yearLabel} · ${focusLabel})`
                : `Matriks Realisasi & Capaian Bulanan Jan–Des (${yearLabel})`}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {tableMode === 'perbandingan'
                ? 'Menampilkan target, realisasi aktual, selisih deviasi, dan persentase capaian tiap indikator.'
                : 'Klik nilai pada bulan mana saja atau ubah filter bulan di atas untuk menyorot periode tertentu.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setTableMode('perbandingan')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
                  tableMode === 'perbandingan'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Tabel Perbandingan</span>
              </button>
              <button
                type="button"
                onClick={() => setTableMode('matriks')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
                  tableMode === 'matriks'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Matriks Jan–Des</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenInputCapaian}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-700 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100 whitespace-nowrap"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Edit Input Data</span>
            </button>
          </div>
        </div>

        {tableMode === 'perbandingan' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th scope="col" className="px-5 py-3 font-semibold min-w-[210px]">
                    Sasaran Kinerja
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold min-w-[220px]">
                    Indikator Kinerja
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 font-semibold text-center whitespace-nowrap"
                  >
                    Tahun
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 font-semibold text-right whitespace-nowrap"
                  >
                    Target ({focusLabel})
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 font-semibold text-right whitespace-nowrap"
                  >
                    Realisasi
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 font-semibold text-right whitespace-nowrap"
                  >
                    Selisih
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold whitespace-nowrap min-w-[155px]"
                  >
                    Capaian (%)
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold whitespace-nowrap"
                  >
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold min-w-[170px]">
                    Unit Kerja
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupedTableRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-8 text-center text-slate-500"
                    >
                      Belum ada data indikator kinerja untuk filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  groupedTableRows.map((row) => {
                    const {
                      item,
                      tahun,
                      target,
                      displayRealisasi,
                      selisih,
                      displayPct,
                      isMonthlyTargetProportional,
                      sasaranRowSpan,
                      isGroupStart,
                    } = row;
                    const mode = getCalcMode(item);
                    const pctClamped =
                      displayPct === null ? 0 : Math.min(100, Math.max(0, displayPct));
                    const barColor =
                      displayPct === null
                        ? '#CBD5E1'
                        : displayPct >= 100
                        ? '#15803D'
                        : displayPct >= 75
                        ? '#1D4ED8'
                        : '#B91C1C';

                    return (
                      <tr
                        key={item.id}
                        className={`align-top hover:bg-slate-50/60 ${
                          isGroupStart
                            ? 'border-t border-slate-200 first:border-t-0'
                            : 'border-t border-slate-100'
                        }`}
                      >
                        {sasaranRowSpan > 0 && (
                          <td
                            rowSpan={sasaranRowSpan}
                            className="border-r border-slate-100 bg-slate-50/40 px-5 py-3.5 align-top text-slate-700"
                          >
                            {item.nomorSasaranKinerja || item.sasaranKinerja ? (
                              <div className="space-y-0.5">
                                {item.nomorSasaranKinerja ? (
                                  <div className="font-mono text-[11px] font-semibold text-slate-800">
                                    {item.nomorSasaranKinerja}
                                  </div>
                                ) : null}
                                {item.sasaranKinerja ? (
                                  <div className="leading-relaxed">
                                    {item.sasaranKinerja}
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {item.kodeIku} · {item.indikatorKinerja}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            Pola:{' '}
                            {mode === 'akumulasi'
                              ? 'Akumulasi Tahunan'
                              : mode === 'nilai'
                              ? 'Nilai'
                              : 'Rata-rata Bulanan'}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-center font-mono font-semibold text-slate-700 tabular-nums whitespace-nowrap">
                          {tahun}
                        </td>
                        <td className="px-3 py-3.5 text-right font-mono tabular-nums whitespace-nowrap text-slate-700">
                          <div>
                            {formatNumberId(target)} {item.satuan}
                          </div>
                          {isMonthlyTargetProportional && (
                            <div className="text-[10px] text-slate-400">
                              1/12 dr {formatNumberId(item.target)} {item.satuan}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-right font-mono font-semibold tabular-nums whitespace-nowrap text-slate-900">
                          <div>
                            {displayRealisasi === null
                              ? 'Belum diisi'
                              : `${formatNumberId(displayRealisasi)} ${item.satuan}`}
                          </div>
                          {item.realisasiOutput?.trim() && (
                            <div className="mt-0.5 text-[10px] font-normal text-slate-500">
                              Output: {item.realisasiOutput} {item.satuanOutput || ''}
                            </div>
                          )}
                        </td>
                        <td
                          className={`px-3 py-3.5 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                            selisih === null
                              ? 'text-slate-400'
                              : selisih >= 0
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {selisih === null
                            ? '-'
                            : `${selisih > 0 ? '+' : ''}${formatNumberId(selisih)} ${
                                item.satuan
                              }`}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center justify-between gap-2 font-mono font-bold tabular-nums text-slate-900">
                            <span>{displayPct === null ? '-' : `${displayPct}%`}</span>
                          </div>
                          <svg
                            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
                            viewBox="0 0 100 6"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                          >
                            <rect
                              x="0"
                              y="0"
                              width={pctClamped}
                              height="6"
                              rx="3"
                              fill={barColor}
                            />
                          </svg>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusLabel pct={displayPct} />
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-blue-800">
                          {item.subdirektorat}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold min-w-[200px]"
                  >
                    Sasaran Kinerja
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold min-w-[210px] border-r border-slate-200"
                  >
                    Indikator Kinerja
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 font-semibold text-right whitespace-nowrap"
                  >
                    Target Tahunan
                  </th>
                  {BULAN_SINGKAT.map((bln, mIdx) => (
                    <th
                      key={bln}
                      scope="col"
                      className={`px-2 py-3 font-semibold text-center whitespace-nowrap ${
                        focusMonthIdx === mIdx ? 'bg-blue-50 text-blue-800' : ''
                      }`}
                    >
                      {bln}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-right whitespace-nowrap border-l border-slate-200"
                  >
                    Realisasi &amp; Capaian ({focusLabel})
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold min-w-[160px] border-l border-slate-200"
                  >
                    Unit Kerja
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupedTableRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={17}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Belum ada indikator capaian kinerja yang tercatat.
                    </td>
                  </tr>
                ) : (
                  groupedTableRows.map((row) => {
                    const {
                      item,
                      tahun,
                      monthly,
                      displayRealisasi,
                      displayPct,
                      sasaranRowSpan,
                      isGroupStart,
                    } = row;
                    const mode = getCalcMode(item);

                    return (
                      <tr
                        key={item.id}
                        className={`align-top hover:bg-slate-50/50 ${
                          isGroupStart
                            ? 'border-t border-slate-200 first:border-t-0'
                            : 'border-t border-slate-100'
                        }`}
                      >
                        {sasaranRowSpan > 0 && (
                          <td
                            rowSpan={sasaranRowSpan}
                            className="border-r border-slate-100 bg-slate-50/40 px-4 py-3 align-top text-slate-700"
                          >
                            {item.nomorSasaranKinerja || item.sasaranKinerja ? (
                              <div className="space-y-0.5">
                                {item.nomorSasaranKinerja ? (
                                  <div className="font-mono text-[11px] font-semibold text-slate-800">
                                    {item.nomorSasaranKinerja}
                                  </div>
                                ) : null}
                                {item.sasaranKinerja ? (
                                  <div className="leading-relaxed">
                                    {item.sasaranKinerja}
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 border-r border-slate-200">
                          <div className="font-semibold text-slate-900">
                            {item.kodeIku} · {item.indikatorKinerja}
                          </div>
                          <div className="mt-0.5 text-[10px] text-slate-500">
                            Pola:{' '}
                            {mode === 'akumulasi'
                              ? 'Akumulasi Tahunan'
                              : mode === 'nilai'
                              ? 'Nilai'
                              : 'Rata-rata Bulanan'}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums whitespace-nowrap text-slate-700">
                          {formatNumberId(item.target)} {item.satuan}
                        </td>
                        {BULAN_SINGKAT.map((bln, mIdx) => {
                          const val = monthly[mIdx];
                          const mPct = computeMonthlyCapaianPct(item, mIdx);
                          const isFocused = focusMonthIdx === mIdx;

                          return (
                            <td
                              key={bln}
                              className={`px-2 py-3 text-center font-mono tabular-nums whitespace-nowrap ${
                                isFocused ? 'bg-blue-50/50' : ''
                              }`}
                            >
                              {val === null ? (
                                <span className="text-slate-300">-</span>
                              ) : (
                                <div>
                                  <div className="font-semibold text-slate-900">
                                    {val}
                                  </div>
                                  <div
                                    className={`text-[10px] font-semibold ${
                                      mPct === null
                                        ? 'text-slate-400'
                                        : mPct >= 100
                                        ? 'text-emerald-700'
                                        : mPct >= 75
                                        ? 'text-amber-700'
                                        : 'text-rose-700'
                                    }`}
                                  >
                                    {mPct}%
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right whitespace-nowrap border-l border-slate-200">
                          <div className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                            {displayRealisasi === null
                              ? 'Belum diisi'
                              : `${formatNumberId(displayRealisasi)} ${item.satuan}`}
                          </div>
                          <div className="mt-0.5 font-mono text-sm font-bold text-slate-900 tabular-nums">
                            {displayPct === null ? '-' : `${displayPct}%`}
                          </div>
                          <div className="mt-0.5 text-[11px]">
                            <StatusLabel pct={displayPct} />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-800 border-l border-slate-200">
                          <div>{item.subdirektorat}</div>
                          <div className="mt-0.5 font-mono text-[10px] font-medium text-slate-500">
                            {tahun}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Sorotan Kendala & Bukti Dukung */}
      <section className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Catatan Bukti Dukung, Kendala &amp; Tindak Lanjut
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {evaluatedRows.length} indikator
          </span>
        </div>

        {evaluatedRows.length === 0 ? (
          <p className="text-xs text-slate-500">
            Belum ada catatan indikator yang tersedia.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {evaluatedRows.map((row) => (
              <div
                key={row.item.id}
                className="rounded-lg border border-slate-200 p-4 text-xs space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-blue-800">
                    {row.item.subdirektorat} · {row.item.kodeIku} ({row.tahun})
                  </span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {row.displayPct === null ? '-' : `${row.displayPct}%`}
                  </span>
                </div>
                <div className="font-semibold text-slate-900">
                  {row.item.indikatorKinerja}
                </div>
                <div className="text-slate-600">
                  <span className="font-medium text-slate-700">Bukti Dukung:</span>{' '}
                  {row.item.buktiDukung || 'tidak ada di data yang diberikan'}
                </div>
                <div className="text-slate-600">
                  <span className="font-medium text-slate-700">
                    Kendala / Tindak Lanjut:
                  </span>{' '}
                  {row.item.kendalaDanTindakLanjut || '-'}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

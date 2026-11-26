import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { PreviousMonthBaseline } from '../types/kinerja';

interface MonthlyTrendChartProps {
  currentPeriode: string;
  lengkapCount: number;
  totalSubdit: number;
  previousMonth: PreviousMonthBaseline;
  onChangePreviousMonth: (next: PreviousMonthBaseline) => void;
}

interface TrendDatum {
  periode: string;
  kepatuhan: number;
  keterangan: string;
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TrendDatum }>;
}

const TrendTooltip: React.FC<TrendTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <div className="font-semibold text-slate-900">{item.periode}</div>
      <div className="mt-1 font-mono text-slate-700 tabular-nums">
        Kepatuhan: {item.kepatuhan}%
      </div>
      <div className="mt-0.5 text-[11px] text-slate-500">{item.keterangan}</div>
    </div>
  );
};

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
  currentPeriode,
  lengkapCount,
  totalSubdit,
  previousMonth,
  onChangePreviousMonth,
}) => {
  const currentPct =
    totalSubdit > 0 ? Math.round((lengkapCount / totalSubdit) * 100) : 0;

  const hasPrevious =
    previousMonth.kepatuhanPersen !== null &&
    !Number.isNaN(previousMonth.kepatuhanPersen);

  const prevPct = hasPrevious ? Number(previousMonth.kepatuhanPersen) : null;
  const delta = prevPct !== null ? currentPct - prevPct : null;

  const data: TrendDatum[] = [];
  if (prevPct !== null) {
    data.push({
      periode: previousMonth.periodeLabel.trim() || 'Bulan Sebelumnya',
      kepatuhan: prevPct,
      keterangan: 'Acuan bulan sebelumnya',
    });
  }
  data.push({
    periode: currentPeriode.trim() || 'Bulan Ini',
    kepatuhan: currentPct,
    keterangan: `${lengkapCount} dari ${totalSubdit} subdirektorat lengkap`,
  });

  return (
    <section
      aria-labelledby="heading-tren-bulanan"
      className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2
            id="heading-tren-bulanan"
            className="text-base font-bold tracking-tight text-slate-900"
          >
            Tren Bulanan Tingkat Kepatuhan
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Perbandingan persentase subdirektorat lengkap bulan ini terhadap bulan sebelumnya.
          </p>
        </div>

        <div className="text-right">
          <div className="font-mono text-lg font-bold text-slate-900 tabular-nums">
            {currentPct}%
          </div>
          {delta === null ? (
            <div className="text-[11px] text-slate-500">
              Pembanding belum diisi
            </div>
          ) : delta > 0 ? (
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 font-mono tabular-nums">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              <span>+{delta}% dari bulan lalu</span>
            </div>
          ) : delta < 0 ? (
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 font-mono tabular-nums">
              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{delta}% dari bulan lalu</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 font-mono tabular-nums">
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Tetap (0%) dari bulan lalu</span>
            </div>
          )}
        </div>
      </div>

      {totalSubdit === 0 ? (
        <div className="flex h-52 items-center justify-center text-xs text-slate-500">
          Belum ada data subdirektorat untuk menghitung tingkat kepatuhan bulan ini.
        </div>
      ) : (
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 22, right: 28, left: 0, bottom: 8 }}
            >
              <defs>
                <linearGradient id="kepatuhanFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
              />
              <XAxis
                dataKey="periode"
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
                padding={{ left: 28, right: 28 }}
                tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
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
              <Tooltip content={<TrendTooltip />} />
              <Area
                type="monotone"
                dataKey="kepatuhan"
                stroke="#1D4ED8"
                strokeWidth={2.5}
                fill="url(#kepatuhanFill)"
                dot={{ r: 5, fill: '#1D4ED8', stroke: '#FFFFFF', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#1E3A8A' }}
              >
                <LabelList
                  dataKey="kepatuhan"
                  position="top"
                  formatter={(val: unknown) => `${val ?? 0}%`}
                  fill="#0F172A"
                  fontSize={12}
                  fontWeight={600}
                />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3 text-xs">
        <div className="flex-1 min-w-[130px]">
          <label
            htmlFor="periode-sebelumnya"
            className="block text-[11px] font-medium text-slate-600 mb-1"
          >
            Periode Sebelumnya
          </label>
          <input
            id="periode-sebelumnya"
            type="text"
            value={previousMonth.periodeLabel}
            onChange={(e) =>
              onChangePreviousMonth({
                ...previousMonth,
                periodeLabel: e.target.value,
              })
            }
            placeholder="Mis. Oktober 2026"
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
          />
        </div>
        <div className="w-36">
          <label
            htmlFor="kepatuhan-sebelumnya"
            className="block text-[11px] font-medium text-slate-600 mb-1"
          >
            Kepatuhan Lalu (%)
          </label>
          <input
            id="kepatuhan-sebelumnya"
            type="number"
            min={0}
            max={100}
            value={
              previousMonth.kepatuhanPersen === null
                ? ''
                : previousMonth.kepatuhanPersen
            }
            onChange={(e) => {
              const raw = e.target.value.trim();
              if (raw === '') {
                onChangePreviousMonth({
                  ...previousMonth,
                  kepatuhanPersen: null,
                });
                return;
              }
              const parsed = Math.max(0, Math.min(100, Number(raw)));
              onChangePreviousMonth({
                ...previousMonth,
                kepatuhanPersen: Number.isNaN(parsed) ? null : parsed,
              });
            }}
            placeholder="0 - 100"
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
          />
        </div>
      </div>
    </section>
  );
};

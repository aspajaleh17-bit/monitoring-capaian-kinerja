import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface StatusComparisonChartProps {
  lengkap: number;
  kurang: number;
  belumKirim: number;
  totalSubdit: number;
}

interface ChartDatum {
  status: string;
  jumlah: number;
  fill: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum }>;
  totalSubdit: number;
}

const ChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  totalSubdit,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  const pct =
    totalSubdit > 0 ? Math.round((item.jumlah / totalSubdit) * 100) : 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <div className="font-semibold text-slate-900">{item.status}</div>
      <div className="mt-1 font-mono text-slate-700 tabular-nums">
        {item.jumlah} subdirektorat ({pct}%)
      </div>
    </div>
  );
};

export const StatusComparisonChart: React.FC<StatusComparisonChartProps> = ({
  lengkap,
  kurang,
  belumKirim,
  totalSubdit,
}) => {
  const data: ChartDatum[] = [
    { status: 'Lengkap', jumlah: lengkap, fill: '#15803D' },
    { status: 'Kurang Lengkap', jumlah: kurang, fill: '#B45309' },
    { status: 'Belum Kirim', jumlah: belumKirim, fill: '#B91C1C' },
  ];

  return (
    <section
      aria-labelledby="heading-grafik-status"
      className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h2
            id="heading-grafik-status"
            className="text-base font-bold tracking-tight text-slate-900"
          >
            Perbandingan Status Pengumpulan Subdirektorat
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Distribusi {totalSubdit} subdirektorat berdasarkan kelengkapan data dukung saat ini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-mono tabular-nums">
          <span>Lengkap: {lengkap}</span>
          <span aria-hidden="true">·</span>
          <span>Kurang Lengkap: {kurang}</span>
          <span aria-hidden="true">·</span>
          <span>Belum Kirim: {belumKirim}</span>
        </div>
      </div>

      {totalSubdit === 0 ? (
        <div className="flex h-52 items-center justify-center text-xs text-slate-500">
          Belum ada data subdirektorat untuk ditampilkan pada grafik.
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 20, left: 0, bottom: 8 }}
              barSize={56}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
              />
              <XAxis
                dataKey="status"
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
                tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                width={32}
                tick={{ fill: '#64748B', fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: '#F1F5F9' }}
                content={<ChartTooltip totalSubdit={totalSubdit} />}
              />
              <Bar dataKey="jumlah" radius={[6, 6, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="jumlah"
                  position="top"
                  fill="#0F172A"
                  fontSize={12}
                  fontWeight={600}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};

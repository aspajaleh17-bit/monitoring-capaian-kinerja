import React, { useMemo } from 'react';
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
import { SubdirektoratSummaryRow } from '../types/kinerja';

interface RequiredDocsDistributionChartProps {
  rows: SubdirektoratSummaryRow[];
}

interface WorkloadDatum {
  subdirektorat: string;
  labelSingkat: string;
  jumlahWajib: number;
  jumlahSesuai: number;
  porsiPersen: number;
  isTertinggi: boolean;
  fill: string;
}

interface WorkloadTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: WorkloadDatum }>;
}

const WorkloadTooltip: React.FC<WorkloadTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <div className="font-semibold text-slate-900">{item.subdirektorat}</div>
      <div className="mt-1 font-mono text-slate-800 tabular-nums">
        Dokumen Wajib: <strong>{item.jumlahWajib}</strong> ({item.porsiPersen}% dari total)
      </div>
      <div className="mt-0.5 font-mono text-[11px] text-slate-600 tabular-nums">
        Sudah Sesuai: {item.jumlahSesuai}/{item.jumlahWajib} dokumen
      </div>
    </div>
  );
};

export const RequiredDocsDistributionChart: React.FC<
  RequiredDocsDistributionChartProps
> = ({ rows }) => {
  const { data, totalDocs, maxCount, topSubdits } = useMemo(() => {
    const total = rows.reduce((sum, r) => sum + r.dataWajibList.length, 0);
    const maxVal = rows.reduce(
      (max, r) => Math.max(max, r.dataWajibList.length),
      0
    );

    const sorted = [...rows]
      .sort((a, b) => b.dataWajibList.length - a.dataWajibList.length)
      .map<WorkloadDatum>((row) => {
        const count = row.dataWajibList.length;
        const sesuaiCount = row.auditItems.filter(
          (a) => a.outcome === 'Sesuai'
        ).length;
        const isHighest = maxVal > 0 && count === maxVal;
        return {
          subdirektorat: row.subdirektorat,
          labelSingkat: row.subdirektorat.replace(/^Subdit\s+/i, ''),
          jumlahWajib: count,
          jumlahSesuai: sesuaiCount,
          porsiPersen: total > 0 ? Math.round((count / total) * 100) : 0,
          isTertinggi: isHighest,
          fill: isHighest ? '#1D4ED8' : '#64748B',
        };
      });

    const highestNames = sorted
      .filter((d) => d.isTertinggi)
      .map((d) => d.labelSingkat);

    return {
      data: sorted,
      totalDocs: total,
      maxCount: maxVal,
      topSubdits: highestNames,
    };
  }, [rows]);

  const heightClass =
    data.length <= 4 ? 'h-56' : data.length <= 7 ? 'h-72' : 'h-96';

  return (
    <section
      aria-labelledby="heading-distribusi-wajib"
      className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h2
            id="heading-distribusi-wajib"
            className="text-base font-bold tracking-tight text-slate-900"
          >
            Distribusi Jumlah Dokumen Wajib per Subdirektorat
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Urutan beban administratif berdasarkan jumlah dokumen wajib pada daftar pemantauan ({totalDocs} dokumen total).
          </p>
        </div>

        {maxCount > 0 && topSubdits.length > 0 && (
          <div className="font-mono text-xs text-blue-800 tabular-nums">
            Beban tertinggi:{' '}
            <strong className="font-semibold">
              {topSubdits.length === data.length
                ? `Merata (${maxCount} dok/subdit)`
                : `${topSubdits.join(', ')} (${maxCount} dok)`}
            </strong>
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex h-44 items-center justify-center text-xs text-slate-500">
          Belum ada data dokumen wajib subdirektorat untuk ditampilkan pada grafik.
        </div>
      ) : (
        <div className={`${heightClass} w-full`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 36, left: 8, bottom: 8 }}
              barSize={24}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#E2E8F0"
              />
              <XAxis
                type="number"
                allowDecimals={false}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="labelSingkat"
                width={210}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#1E293B', fontSize: 12, fontWeight: 500 }}
              />
              <Tooltip
                cursor={{ fill: '#F1F5F9' }}
                content={<WorkloadTooltip />}
              />
              <Bar dataKey="jumlahWajib" radius={[0, 6, 6, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.subdirektorat} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="jumlahWajib"
                  position="right"
                  formatter={(val: unknown) => `${val ?? 0} dok`}
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

import React from 'react';
import {
  CheckCircle2,
  CircleHelp,
  FileWarning,
  XCircle,
} from 'lucide-react';
import {
  CheckOutcome,
  ManualVerificationEntry,
  SubdirektoratSummaryRow,
} from '../types/kinerja';
import { formatTimestampIndonesia } from '../utils/kinerjaEngine';

interface CompletenessAuditSectionProps {
  rows: SubdirektoratSummaryRow[];
  manualVerifications: Record<string, ManualVerificationEntry>;
  onToggleManualVerification: (
    reqId: string,
    docName: string,
    subdirektorat: string
  ) => void;
  onGoToDrafts: (subdit: string) => void;
}

function CheckCell({
  value,
  trueLabel = 'Ya',
  falseLabel = 'Tidak',
}: {
  value: boolean | 'Tidak wajib' | 'Tidak diketahui';
  trueLabel?: string;
  falseLabel?: string;
}) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{trueLabel}</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
        <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{falseLabel}</span>
      </span>
    );
  }
  if (value === 'Tidak wajib') {
    return <span className="text-slate-400">Tidak wajib</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
      <CircleHelp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Perlu cek</span>
    </span>
  );
}

function OutcomeLabel({ outcome }: { outcome: CheckOutcome }) {
  if (outcome === 'Sesuai') {
    return <span className="font-semibold text-emerald-700">Sesuai</span>;
  }
  if (outcome === 'Kurang') {
    return <span className="font-semibold text-amber-700">Kurang</span>;
  }
  if (outcome === 'Belum Ada') {
    return <span className="font-semibold text-rose-700">Belum Ada</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
      <FileWarning className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Perlu Verifikasi</span>
    </span>
  );
}

export const CompletenessAuditSection: React.FC<
  CompletenessAuditSectionProps
> = ({
  rows,
  manualVerifications,
  onToggleManualVerification,
  onGoToDrafts,
}) => {
  const totalDocs = rows.reduce((sum, r) => sum + r.auditItems.length, 0);
  const totalVerified = rows.reduce(
    (sum, r) =>
      sum +
      r.auditItems.filter(
        (item) => manualVerifications[item.requiredDoc.id]?.verified
      ).length,
    0
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Pemeriksaan 4 Poin & Verifikasi Atasan
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Periksa keberadaan, periode, format, dan tanda tangan dokumen, lalu tandai jika sudah diverifikasi atasan.
          </p>
        </div>

        <div className="font-mono text-xs text-slate-600 tabular-nums">
          Terverifikasi atasan:{' '}
          <strong className="text-slate-900">
            {totalVerified}/{totalDocs} dokumen
          </strong>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200/90 bg-white p-10 text-center text-xs text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          Tidak ada subdirektorat yang cocok dengan filter saat ini.
        </div>
      ) : (
        <div className="space-y-5">
          {rows.map((row) => {
            const subVerifiedCount = row.auditItems.filter(
              (a) => manualVerifications[a.requiredDoc.id]?.verified
            ).length;

            return (
              <section
                key={row.subdirektorat}
                className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {row.subdirektorat}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Status:{' '}
                      <span className="font-semibold text-slate-800">
                        {row.status}
                      </span>{' '}
                      · Verifikasi atasan:{' '}
                      <span className="font-mono font-semibold text-slate-800 tabular-nums">
                        {subVerifiedCount}/{row.auditItems.length}
                      </span>
                    </p>
                  </div>

                  {row.draftPesan && (
                    <button
                      type="button"
                      onClick={() => onGoToDrafts(row.subdirektorat)}
                      className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap"
                    >
                      Buka Draf Pengingat
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                        <th scope="col" className="px-5 py-2.5 font-semibold">
                          Dokumen Wajib
                        </th>
                        <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">
                          Ada
                        </th>
                        <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">
                          Periode
                        </th>
                        <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">
                          Format
                        </th>
                        <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">
                          TTD
                        </th>
                        <th scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">
                          Hasil
                        </th>
                        <th scope="col" className="px-3 py-2.5 font-semibold">
                          Catatan
                        </th>
                        <th scope="col" className="px-5 py-2.5 font-semibold whitespace-nowrap">
                          Verifikasi Atasan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {row.auditItems.map((item) => {
                        const verif = manualVerifications[item.requiredDoc.id];
                        const isVerified = Boolean(verif?.verified);

                        return (
                          <tr key={item.id} className="align-top transition-colors hover:bg-slate-50/70">
                            <td className="px-5 py-3 min-w-[200px]">
                              <div className="font-semibold text-slate-900">
                                {item.requiredDoc.namaDokumen}
                              </div>
                              <div className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
                                {item.requiredDoc.formatWajib || 'Bebas'} · Tenggat{' '}
                                {item.requiredDoc.tenggat || '-'}
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <CheckCell value={item.checks.ada} />
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <CheckCell value={item.checks.sesuaiPeriode} />
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <CheckCell value={item.checks.sesuaiFormat} />
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <CheckCell value={item.checks.sudahTtd} />
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <OutcomeLabel outcome={item.outcome} />
                            </td>
                            <td className="px-3 py-3 text-slate-600 min-w-[200px] leading-relaxed">
                              {item.alasan}
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap">
                              <label className="inline-flex items-start gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isVerified}
                                  onChange={() =>
                                    onToggleManualVerification(
                                      item.requiredDoc.id,
                                      item.requiredDoc.namaDokumen,
                                      row.subdirektorat
                                    )
                                  }
                                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                                />
                                <div>
                                  <span
                                    className={`font-medium ${
                                      isVerified
                                        ? 'text-emerald-700'
                                        : 'text-slate-600'
                                    }`}
                                  >
                                    {isVerified ? 'Terverifikasi' : 'Tandai selesai'}
                                  </span>
                                  {isVerified && verif?.verifiedAtIso && (
                                    <div className="font-mono text-[10px] text-slate-500 tabular-nums">
                                      {formatTimestampIndonesia(verif.verifiedAtIso)}
                                    </div>
                                  )}
                                </div>
                              </label>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {row.extraSubmittedDocs.length > 0 && (
                  <div className="border-t border-amber-200 bg-amber-50/50 px-5 py-3 text-xs text-amber-950">
                    <span className="font-semibold">
                      Dokumen tambahan di luar daftar wajib ({row.extraSubmittedDocs.length}):
                    </span>{' '}
                    {row.extraSubmittedDocs.map((e) => e.namaDokumen).join(', ')}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

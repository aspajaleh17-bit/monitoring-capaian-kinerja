import React, { useState } from 'react';
import { Check, Copy, Printer, X } from 'lucide-react';
import { MonitoringReport } from '../types/kinerja';

interface FullReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MonitoringReport;
}

export const FullReportPreviewModal: React.FC<FullReportPreviewModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(report.formattedMarkdownReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-report-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="no-print flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="modal-report-title"
              className="text-base font-bold text-slate-900"
            >
              Keluaran Terformat Lengkap (4 Bagian)
            </h2>
            <p className="text-xs text-slate-500">
              Siap disalin ke nota dinas, pesan koordinasi, atau dicetak. Seluruh isi berstatus SARAN.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cetak</span>
            </button>
            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Salin Laporan</span>
                </>
              )}
            </button>
            <button
              type="button"
              aria-label="Tutup jendela laporan"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6">
          <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-5 font-mono text-xs leading-relaxed text-slate-800">
            {report.formattedMarkdownReport}
          </pre>
        </div>
      </div>
    </div>
  );
};

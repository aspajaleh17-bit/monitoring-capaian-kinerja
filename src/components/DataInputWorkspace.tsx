import React, { useState } from 'react';
import {
  ClipboardList,
  FileSpreadsheet,
  History,
  ListChecks,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  ActivityCategory,
  ActivityLogEntry,
  CapaianKinerjaItem,
  RencanaAksiItem,
  RequiredDocument,
  SignatureStatus,
  SubmittedDocument,
} from '../types/kinerja';
import {
  SAMPLE_BULK_REQUIRED_TEXT,
  SAMPLE_BULK_SUBMITTED_TEXT,
} from '../data/sampleData';
import {
  formatTimestampIndonesia,
  generateId,
  parseBulkRequiredText,
  parseBulkSubmittedText,
} from '../utils/kinerjaEngine';
import { CapaianKinerjaSection } from './CapaianKinerjaSection';
import { RencanaAksiSection } from './RencanaAksiSection';

export type InputSubTab = 'dokumen' | 'capaian' | 'rencana_aksi' | 'log';

interface DataInputWorkspaceProps {
  inputSubTab: InputSubTab;
  onChangeInputSubTab: (tab: InputSubTab) => void;
  requiredDocs: RequiredDocument[];
  onChangeRequiredDocs: (next: RequiredDocument[]) => void;
  submittedDocs: SubmittedDocument[];
  onChangeSubmittedDocs: (next: SubmittedDocument[]) => void;
  submittedConfirmedWhenEmpty: boolean;
  onToggleSubmittedConfirmed: (val: boolean) => void;
  activityLogs: ActivityLogEntry[];
  onClearActivityLogs: () => void;
  onRecordActivity: (kategori: ActivityCategory, ringkasan: string) => void;
  capaianItems: CapaianKinerjaItem[];
  onChangeCapaianItems: (next: CapaianKinerjaItem[]) => void;
  rencanaAksiItems: RencanaAksiItem[];
  onChangeRencanaAksiItems: (next: RencanaAksiItem[]) => void;
  knownSubdirectorates: string[];
  periodeTarget: string;
  onOpenCapaianDashboard: () => void;
}

export const DataInputWorkspace: React.FC<DataInputWorkspaceProps> = ({
  inputSubTab,
  onChangeInputSubTab,
  requiredDocs,
  onChangeRequiredDocs,
  submittedDocs,
  onChangeSubmittedDocs,
  submittedConfirmedWhenEmpty,
  onToggleSubmittedConfirmed,
  activityLogs,
  onClearActivityLogs,
  onRecordActivity,
  capaianItems,
  onChangeCapaianItems,
  rencanaAksiItems,
  onChangeRencanaAksiItems,
  knownSubdirectorates,
  periodeTarget,
  onOpenCapaianDashboard,
}) => {
  const [reqSubdit, setReqSubdit] = useState(knownSubdirectorates[0] || '');
  const [reqNama, setReqNama] = useState('');
  const [reqFormat, setReqFormat] = useState('PDF');
  const [reqTtd, setReqTtd] = useState(true);
  const [reqTenggat, setReqTenggat] = useState('');

  const [subSubdit, setSubSubdit] = useState(knownSubdirectorates[0] || '');
  const [subNama, setSubNama] = useState('');
  const [subTanggal, setSubTanggal] = useState('');
  const [subPeriode, setSubPeriode] = useState(periodeTarget || '');
  const [subFormat, setSubFormat] = useState('PDF');
  const [subTtd, setSubTtd] = useState<SignatureStatus>('Sudah TTD');
  const [subCatatan, setSubCatatan] = useState('');

  const [showBulkReq, setShowBulkReq] = useState(false);
  const [bulkReqText, setBulkReqText] = useState('');
  const [showBulkSub, setShowBulkSub] = useState(false);
  const [bulkSubText, setBulkSubText] = useState('');
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const handleAddRequired = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqSubdit.trim() || !reqNama.trim()) return;
    const item: RequiredDocument = {
      id: generateId('req'),
      subdirektorat: reqSubdit.trim(),
      namaDokumen: reqNama.trim(),
      formatWajib: reqFormat.trim() || 'Bebas',
      perluTandaTangan: reqTtd,
      tenggat: reqTenggat,
    };
    onChangeRequiredDocs([...requiredDocs, item]);
    onRecordActivity(
      'Daftar Wajib',
      `Menambahkan dokumen wajib "${item.namaDokumen}" (${item.subdirektorat})`
    );
    setReqNama('');
  };

  const handleAddSubmitted = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subSubdit.trim() || !subNama.trim()) return;
    const item: SubmittedDocument = {
      id: generateId('sub'),
      subdirektorat: subSubdit.trim(),
      namaDokumen: subNama.trim(),
      tanggalMasuk: subTanggal,
      periode: subPeriode.trim(),
      format: subFormat.trim(),
      statusTandaTangan: subTtd,
      catatan: subCatatan.trim(),
    };
    onChangeSubmittedDocs([...submittedDocs, item]);
    onRecordActivity(
      'Data Masuk',
      `Mencatat dokumen masuk "${item.namaDokumen}" (${item.subdirektorat})`
    );
    setSubNama('');
    setSubCatatan('');
  };

  const handleParseBulkRequired = () => {
    const { items, skippedLines } = parseBulkRequiredText(bulkReqText);
    if (items.length === 0) {
      setBulkMessage('Tidak ada baris daftar wajib yang berhasil diparsing.');
      return;
    }
    onChangeRequiredDocs([...requiredDocs, ...items]);
    onRecordActivity(
      'Daftar Wajib',
      `Impor massal ${items.length} dokumen wajib`
    );
    setBulkMessage(
      `Berhasil menambahkan ${items.length} dokumen wajib${
        skippedLines > 0 ? ` (${skippedLines} baris dilewati)` : ''
      }.`
    );
    setBulkReqText('');
    setShowBulkReq(false);
  };

  const handleParseBulkSubmitted = () => {
    const { items, skippedLines } = parseBulkSubmittedText(bulkSubText);
    if (items.length === 0) {
      setBulkMessage('Tidak ada baris data masuk yang berhasil diparsing.');
      return;
    }
    onChangeSubmittedDocs([...submittedDocs, ...items]);
    onRecordActivity(
      'Data Masuk',
      `Impor massal ${items.length} dokumen masuk`
    );
    setBulkMessage(
      `Berhasil menambahkan ${items.length} dokumen masuk${
        skippedLines > 0 ? ` (${skippedLines} baris dilewati)` : ''
      }.`
    );
    setBulkSubText('');
    setShowBulkSub(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Pengelolaan Data & Capaian Kinerja
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Kelola daftar dokumen wajib, pencatatan berkas masuk, realisasi capaian bulanan, dan riwayat aktivitas.
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => onChangeInputSubTab('dokumen')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
              inputSubTab === 'dokumen'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Dokumen ({requiredDocs.length + submittedDocs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeInputSubTab('capaian')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
              inputSubTab === 'capaian'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Capaian Bulanan ({capaianItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeInputSubTab('rencana_aksi')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
              inputSubTab === 'rencana_aksi'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Rencana Aksi ({rencanaAksiItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeInputSubTab('log')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors whitespace-nowrap ${
              inputSubTab === 'log'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Riwayat ({activityLogs.length})</span>
          </button>
        </div>
      </div>

      {bulkMessage && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-medium text-blue-900">
          {bulkMessage}
        </div>
      )}

      {inputSubTab === 'capaian' ? (
        <CapaianKinerjaSection
          items={capaianItems}
          onChangeItems={onChangeCapaianItems}
          knownSubdirectorates={knownSubdirectorates}
          defaultPeriode={periodeTarget}
          onRecordActivity={onRecordActivity}
          onOpenDashboard={onOpenCapaianDashboard}
        />
      ) : inputSubTab === 'rencana_aksi' ? (
        <RencanaAksiSection
          rencanaAksiItems={rencanaAksiItems}
          onChangeRencanaAksiItems={onChangeRencanaAksiItems}
          capaianItems={capaianItems}
          knownSubdirectorates={knownSubdirectorates}
          onRecordActivity={onRecordActivity}
          onOpenCapaianInput={() => onChangeInputSubTab('capaian')}
        />
      ) : inputSubTab === 'log' ? (
        <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Riwayat Aktivitas Perubahan Data ({activityLogs.length})
              </h2>
              <p className="text-xs text-slate-500">
                Catatan waktu penginputan berkas, verifikasi atasan, target, pengingat, dan capaian kinerja.
              </p>
            </div>

            {activityLogs.length > 0 && (
              <button
                type="button"
                onClick={onClearActivityLogs}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50"
              >
                Bersihkan Riwayat
              </button>
            )}
          </div>

          {activityLogs.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Belum ada aktivitas perubahan yang tercatat.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 px-6 py-2">
              {activityLogs.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {entry.kategori}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-700">{entry.ringkasan}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                    {formatTimestampIndonesia(entry.timestampIso)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <div className="space-y-6">
          {/* 1. Daftar Data Dukung Wajib */}
          <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Daftar Dokumen Wajib & Tenggat ({requiredDocs.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Atur dokumen yang harus dikumpulkan tiap subdirektorat beserta batas waktunya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkReq((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{showBulkReq ? 'Tutup Impor Excel' : 'Impor dari Excel / Teks'}</span>
              </button>
            </div>

            {showBulkReq && (
              <div className="border-b border-slate-200 bg-slate-50 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-700">
                    Format: Subdirektorat | Nama Dokumen | Format | Wajib TTD (Ya/Tidak) | Tenggat (YYYY-MM-DD)
                  </span>
                  <button
                    type="button"
                    onClick={() => setBulkReqText(SAMPLE_BULK_REQUIRED_TEXT)}
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    Isi Contoh Format
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={bulkReqText}
                  onChange={(e) => setBulkReqText(e.target.value)}
                  placeholder="Tempel baris dari Excel atau teks dipisah tanda | atau tab..."
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParseBulkRequired}
                    className="rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
                  >
                    Tambahkan ke Daftar Wajib
                  </button>
                </div>
              </div>
            )}

            <form
              onSubmit={handleAddRequired}
              className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50/50 p-4 md:grid-cols-12"
            >
              <input
                type="text"
                placeholder="Subdirektorat"
                value={reqSubdit}
                onChange={(e) => setReqSubdit(e.target.value)}
                className="md:col-span-3 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Nama Dokumen Wajib"
                value={reqNama}
                onChange={(e) => setReqNama(e.target.value)}
                className="md:col-span-4 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Format (PDF/XLSX)"
                value={reqFormat}
                onChange={(e) => setReqFormat(e.target.value)}
                className="md:col-span-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
              <label className="md:col-span-1 flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reqTtd}
                  onChange={(e) => setReqTtd(e.target.checked)}
                  className="rounded border-slate-300 text-blue-700"
                />
                <span>TTD</span>
              </label>
              <input
                type="date"
                value={reqTenggat}
                onChange={(e) => setReqTenggat(e.target.value)}
                className="md:col-span-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
              <button
                type="submit"
                className="md:col-span-1 inline-flex items-center justify-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Tambah</span>
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                    <th className="px-5 py-2.5 font-semibold">Subdirektorat</th>
                    <th className="px-3 py-2.5 font-semibold">Nama Dokumen Wajib</th>
                    <th className="px-3 py-2.5 font-semibold">Format</th>
                    <th className="px-3 py-2.5 font-semibold">Wajib TTD</th>
                    <th className="px-3 py-2.5 font-semibold">Tenggat</th>
                    <th className="px-3 py-2.5 font-semibold text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requiredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        Daftar wajib kosong. Tambahkan baris di atas atau muat contoh data dari panel kiri.
                      </td>
                    </tr>
                  ) : (
                    requiredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-2.5 font-medium text-slate-900">
                          {doc.subdirektorat}
                        </td>
                        <td className="px-3 py-2.5 text-slate-800">
                          {doc.namaDokumen}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-700">
                          {doc.formatWajib || 'Bebas'}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {doc.perluTandaTangan ? 'Ya' : 'Tidak'}
                        </td>
                        <td className="px-3 py-2.5 font-mono tabular-nums text-slate-700">
                          <input
                            type="date"
                            aria-label={`Tenggat ${doc.namaDokumen}`}
                            value={doc.tenggat}
                            onChange={(e) => {
                              const val = e.target.value;
                              onChangeRequiredDocs(
                                requiredDocs.map((r) =>
                                  r.id === doc.id ? { ...r, tenggat: val } : r
                                )
                              );
                              onRecordActivity(
                                'Daftar Wajib',
                                `Mengubah tenggat "${doc.namaDokumen}" menjadi ${val || '-'}`
                              );
                            }}
                            className="rounded border border-slate-200 px-2 py-0.5 font-mono text-xs text-slate-900"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            type="button"
                            aria-label={`Hapus ${doc.namaDokumen}`}
                            onClick={() => {
                              onChangeRequiredDocs(
                                requiredDocs.filter((r) => r.id !== doc.id)
                              );
                              onRecordActivity(
                                'Daftar Wajib',
                                `Menghapus dokumen wajib "${doc.namaDokumen}"`
                              );
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. Data Dukung Masuk */}
          <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Daftar Dokumen Masuk ({submittedDocs.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Catat dokumen yang sudah diterima dari masing-masing subdirektorat.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {submittedDocs.length === 0 && (
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={submittedConfirmedWhenEmpty}
                      onChange={(e) => onToggleSubmittedConfirmed(e.target.checked)}
                      className="rounded border-slate-300 text-blue-700"
                    />
                    <span>Konfirmasi belum ada kiriman</span>
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => setShowBulkSub((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{showBulkSub ? 'Tutup Impor Excel' : 'Impor dari Excel / Teks'}</span>
                </button>
              </div>
            </div>

            {showBulkSub && (
              <div className="border-b border-slate-200 bg-slate-50 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-700">
                    Format: Subdirektorat | Nama Dokumen | Tanggal Masuk | Periode | Format | Status TTD | Catatan
                  </span>
                  <button
                    type="button"
                    onClick={() => setBulkSubText(SAMPLE_BULK_SUBMITTED_TEXT)}
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    Isi Contoh Format
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={bulkSubText}
                  onChange={(e) => setBulkSubText(e.target.value)}
                  placeholder="Tempel baris kiriman masuk dari Excel atau teks dipisah tanda | atau tab..."
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParseBulkSubmitted}
                    className="rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
                  >
                    Tambahkan ke Data Masuk
                  </button>
                </div>
              </div>
            )}

            <form
              onSubmit={handleAddSubmitted}
              className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50/50 p-4 md:grid-cols-12"
            >
              <input
                type="text"
                placeholder="Subdirektorat"
                value={subSubdit}
                onChange={(e) => setSubSubdit(e.target.value)}
                className="md:col-span-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Nama Dokumen Masuk"
                value={subNama}
                onChange={(e) => setSubNama(e.target.value)}
                className="md:col-span-3 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
              <input
                type="date"
                value={subTanggal}
                onChange={(e) => setSubTanggal(e.target.value)}
                className="md:col-span-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Periode"
                value={subPeriode}
                onChange={(e) => setSubPeriode(e.target.value)}
                className="md:col-span-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Format"
                value={subFormat}
                onChange={(e) => setSubFormat(e.target.value)}
                className="md:col-span-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
              <select
                value={subTtd}
                onChange={(e) => setSubTtd(e.target.value as SignatureStatus)}
                className="md:col-span-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              >
                <option value="Sudah TTD">Sudah TTD</option>
                <option value="Belum TTD">Belum TTD</option>
                <option value="Tidak Ada Info">Tidak Ada Info</option>
              </select>
              <input
                type="text"
                placeholder="Catatan"
                value={subCatatan}
                onChange={(e) => setSubCatatan(e.target.value)}
                className="md:col-span-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
              <button
                type="submit"
                className="md:col-span-1 inline-flex items-center justify-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Tambah</span>
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                    <th className="px-5 py-2.5 font-semibold">Subdirektorat</th>
                    <th className="px-3 py-2.5 font-semibold">Nama Dokumen</th>
                    <th className="px-3 py-2.5 font-semibold">Tanggal Masuk</th>
                    <th className="px-3 py-2.5 font-semibold">Periode</th>
                    <th className="px-3 py-2.5 font-semibold">Format</th>
                    <th className="px-3 py-2.5 font-semibold">Status TTD</th>
                    <th className="px-3 py-2.5 font-semibold">Catatan</th>
                    <th className="px-3 py-2.5 font-semibold text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submittedDocs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                        Belum ada dokumen masuk yang dicatat.
                      </td>
                    </tr>
                  ) : (
                    submittedDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-2.5 font-medium text-slate-900">
                          {doc.subdirektorat}
                        </td>
                        <td className="px-3 py-2.5 text-slate-800">
                          {doc.namaDokumen}
                        </td>
                        <td className="px-3 py-2.5 font-mono tabular-nums text-slate-700">
                          {doc.tanggalMasuk || '-'}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {doc.periode || '-'}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-700">
                          {doc.format || '-'}
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            aria-label={`Status TTD ${doc.namaDokumen}`}
                            value={doc.statusTandaTangan}
                            onChange={(e) => {
                              const nextVal = e.target.value as SignatureStatus;
                              onChangeSubmittedDocs(
                                submittedDocs.map((s) =>
                                  s.id === doc.id
                                    ? { ...s, statusTandaTangan: nextVal }
                                    : s
                                )
                              );
                              onRecordActivity(
                                'Data Masuk',
                                `Mengubah status TTD "${doc.namaDokumen}" menjadi ${nextVal}`
                              );
                            }}
                            className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-900"
                          >
                            <option value="Sudah TTD">Sudah TTD</option>
                            <option value="Belum TTD">Belum TTD</option>
                            <option value="Tidak Ada Info">Tidak Ada Info</option>
                          </select>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 max-w-[220px]">
                          {doc.catatan || '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            type="button"
                            aria-label={`Hapus ${doc.namaDokumen}`}
                            onClick={() => {
                              onChangeSubmittedDocs(
                                submittedDocs.filter((s) => s.id !== doc.id)
                              );
                              onRecordActivity(
                                'Data Masuk',
                                `Menghapus dokumen masuk "${doc.namaDokumen}"`
                              );
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

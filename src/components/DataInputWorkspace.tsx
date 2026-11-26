import React, { useState } from 'react';
import {
  ClipboardPaste,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import {
  RequiredDocument,
  SecurityAlert,
  SignatureStatus,
  SubmittedDocument,
} from '../types/kinerja';
import {
  generateId,
  parseBulkRequiredText,
  parseBulkSubmittedText,
  scanForSensitiveData,
} from '../utils/kinerjaEngine';
import {
  SAMPLE_BULK_REQUIRED_TEXT,
  SAMPLE_BULK_SUBMITTED_TEXT,
} from '../data/sampleData';

interface DataInputWorkspaceProps {
  requiredDocs: RequiredDocument[];
  onChangeRequiredDocs: (docs: RequiredDocument[]) => void;
  submittedDocs: SubmittedDocument[];
  onChangeSubmittedDocs: (docs: SubmittedDocument[]) => void;
  securityAlerts: SecurityAlert[];
  tanggalHariIni: string;
}

export const DataInputWorkspace: React.FC<DataInputWorkspaceProps> = ({
  requiredDocs,
  onChangeRequiredDocs,
  submittedDocs,
  onChangeSubmittedDocs,
  securityAlerts,
  tanggalHariIni,
}) => {
  const [showBulkRequired, setShowBulkRequired] = useState(false);
  const [bulkRequiredText, setBulkRequiredText] = useState('');
  const [bulkRequiredFeedback, setBulkRequiredFeedback] = useState<string | null>(null);

  const [showBulkSubmitted, setShowBulkSubmitted] = useState(false);
  const [bulkSubmittedText, setBulkSubmittedText] = useState('');
  const [bulkSubmittedFeedback, setBulkSubmittedFeedback] = useState<string | null>(null);

  const handleAddRequiredRow = () => {
    onChangeRequiredDocs([
      ...requiredDocs,
      {
        id: generateId('req'),
        subdirektorat: '',
        namaDokumen: '',
        formatWajib: 'PDF',
        perluTandaTangan: true,
        tenggat: tanggalHariIni || '',
      },
    ]);
  };

  const handleUpdateRequiredRow = (
    id: string,
    patch: Partial<RequiredDocument>
  ) => {
    onChangeRequiredDocs(
      requiredDocs.map((d) => (d.id === id ? { ...d, ...patch } : d))
    );
  };

  const handleDeleteRequiredRow = (id: string) => {
    onChangeRequiredDocs(requiredDocs.filter((d) => d.id !== id));
  };

  const handleAddSubmittedRow = () => {
    onChangeSubmittedDocs([
      ...submittedDocs,
      {
        id: generateId('sub'),
        subdirektorat: requiredDocs[0]?.subdirektorat || '',
        namaDokumen: '',
        tanggalMasuk: tanggalHariIni || '',
        periode: '',
        format: 'PDF',
        statusTandaTangan: 'Sudah TTD',
        catatan: '',
      },
    ]);
  };

  const handleUpdateSubmittedRow = (
    id: string,
    patch: Partial<SubmittedDocument>
  ) => {
    onChangeSubmittedDocs(
      submittedDocs.map((d) => (d.id === id ? { ...d, ...patch } : d))
    );
  };

  const handleDeleteSubmittedRow = (id: string) => {
    onChangeSubmittedDocs(submittedDocs.filter((d) => d.id !== id));
  };

  const handleImportBulkRequired = (replaceExisting: boolean) => {
    const rawAlerts = scanForSensitiveData([], [], bulkRequiredText);
    if (rawAlerts.length > 0) {
      setBulkRequiredFeedback(
        `Dihentikan: ${rawAlerts[0].detail} Hapus data sensitif sebelum mengimpor.`
      );
      return;
    }
    const { items, skippedLines } = parseBulkRequiredText(
      bulkRequiredText,
      tanggalHariIni
    );
    if (items.length === 0) {
      setBulkRequiredFeedback(
        'Tidak ada baris valid yang terbaca. Gunakan pemisah Tab (dari Excel), tanda pipa (|), atau koma.'
      );
      return;
    }
    onChangeRequiredDocs(replaceExisting ? items : [...requiredDocs, ...items]);
    setBulkRequiredFeedback(
      `Berhasil memproses ${items.length} baris daftar wajib${
        skippedLines > 0 ? ` (${skippedLines} baris dilewati karena format tidak lengkap)` : ''
      }.`
    );
    setBulkRequiredText('');
  };

  const handleImportBulkSubmitted = (replaceExisting: boolean) => {
    const rawAlerts = scanForSensitiveData([], [], bulkSubmittedText);
    if (rawAlerts.length > 0) {
      setBulkSubmittedFeedback(
        `Dihentikan: ${rawAlerts[0].detail} Hapus data sensitif sebelum mengimpor.`
      );
      return;
    }
    const { items, skippedLines } = parseBulkSubmittedText(bulkSubmittedText);
    if (items.length === 0) {
      setBulkSubmittedFeedback(
        'Tidak ada baris valid yang terbaca. Gunakan pemisah Tab (dari Excel), tanda pipa (|), atau koma.'
      );
      return;
    }
    onChangeSubmittedDocs(replaceExisting ? items : [...submittedDocs, ...items]);
    setBulkSubmittedFeedback(
      `Berhasil memproses ${items.length} baris data masuk${
        skippedLines > 0 ? ` (${skippedLines} baris dilewati karena format tidak lengkap)` : ''
      }.`
    );
    setBulkSubmittedText('');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Input & Pengolahan Data Otomatis
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Masukkan data secara langsung pada tabel di bawah atau tempel salinan tabel dari Excel / pesan koordinasi. Jangan memasukkan data pribadi (NIK, alamat, kepegawaian, kesehatan) atau dokumen rahasia.
        </p>
      </div>

      {securityAlerts.length > 0 && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 space-y-1.5">
          <div className="flex items-center gap-2 font-bold">
            <ShieldAlert className="h-4 w-4 text-rose-700" aria-hidden="true" />
            <span>Peringatan Data Terlarang / Sensitif Terdeteksi</span>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {securityAlerts.map((a) => (
              <li key={a.id}>{a.detail}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Section A: Daftar Data Dukung Wajib */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              1. Daftar Data Dukung Wajib & Tenggat
            </h2>
            <p className="text-xs text-slate-500">
              Daftar acuan dokumen yang wajib dikumpulkan tiap subdirektorat.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBulkRequired((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{showBulkRequired ? 'Tutup Tempel Massal' : 'Tempel Data Massal'}</span>
            </button>
            <button
              type="button"
              onClick={handleAddRequiredRow}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Tambah Baris</span>
            </button>
          </div>
        </div>

        {showBulkRequired && (
          <div className="border-b border-slate-200 bg-slate-50 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-700">
                Format kolom (pisahkan dengan Tab dari Excel atau tanda <code className="font-mono">|</code>):{' '}
                <span className="font-mono text-slate-900">
                  Subdirektorat | Nama Dokumen Wajib | Format Wajib | Wajib TTD (Ya/Tidak) | Tenggat (YYYY-MM-DD)
                </span>
              </p>
              <button
                type="button"
                onClick={() => setBulkRequiredText(SAMPLE_BULK_REQUIRED_TEXT)}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Isi Contoh Tempelan
              </button>
            </div>
            <textarea
              rows={4}
              value={bulkRequiredText}
              onChange={(e) => setBulkRequiredText(e.target.value)}
              placeholder="Tempel baris data dari Excel atau teks terstruktur di sini..."
              className="w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
            />
            {bulkRequiredFeedback && (
              <p className="text-xs font-medium text-slate-700">{bulkRequiredFeedback}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleImportBulkRequired(false)}
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Proses & Tambahkan
              </button>
              <button
                type="button"
                onClick={() => handleImportBulkRequired(true)}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Ganti Seluruh Daftar Wajib
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Subdirektorat
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Nama Dokumen Wajib
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold w-28">
                  Format
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold w-28">
                  Wajib TTD
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold w-36">
                  Tenggat
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold w-12 text-center">
                  Hapus
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requiredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Belum ada daftar data dukung wajib. Klik "Tambah Baris" atau "Tempel Data Massal".
                  </td>
                </tr>
              ) : (
                requiredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        aria-label="Subdirektorat wajib"
                        value={doc.subdirektorat}
                        onChange={(e) =>
                          handleUpdateRequiredRow(doc.id, {
                            subdirektorat: e.target.value,
                          })
                        }
                        placeholder="Nama subdirektorat"
                        className="w-full min-w-[180px] rounded border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        aria-label="Nama dokumen wajib"
                        value={doc.namaDokumen}
                        onChange={(e) =>
                          handleUpdateRequiredRow(doc.id, {
                            namaDokumen: e.target.value,
                          })
                        }
                        placeholder="Nama dokumen wajib"
                        className="w-full min-w-[220px] rounded border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        aria-label="Format wajib"
                        value={doc.formatWajib}
                        onChange={(e) =>
                          handleUpdateRequiredRow(doc.id, {
                            formatWajib: e.target.value,
                          })
                        }
                        placeholder="PDF/XLSX"
                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        aria-label="Wajib tanda tangan"
                        value={doc.perluTandaTangan ? 'ya' : 'tidak'}
                        onChange={(e) =>
                          handleUpdateRequiredRow(doc.id, {
                            perluTandaTangan: e.target.value === 'ya',
                          })
                        }
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                      >
                        <option value="ya">Ya (Wajib)</option>
                        <option value="tidak">Tidak</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        aria-label="Tanggal tenggat"
                        value={doc.tenggat}
                        onChange={(e) =>
                          handleUpdateRequiredRow(doc.id, {
                            tenggat: e.target.value,
                          })
                        }
                        className="w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        aria-label={`Hapus ${doc.namaDokumen || 'baris'}`}
                        onClick={() => handleDeleteRequiredRow(doc.id)}
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

      {/* Section B: Daftar Data Dukung yang Sudah Masuk */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              2. Daftar Data Dukung yang Sudah Masuk
            </h2>
            <p className="text-xs text-slate-500">
              Catatan dokumen yang telah dikirim oleh masing-masing subdirektorat.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBulkSubmitted((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{showBulkSubmitted ? 'Tutup Tempel Massal' : 'Tempel Data Massal'}</span>
            </button>
            <button
              type="button"
              onClick={handleAddSubmittedRow}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Tambah Baris</span>
            </button>
          </div>
        </div>

        {showBulkSubmitted && (
          <div className="border-b border-slate-200 bg-slate-50 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-700">
                Format kolom (Tab / <code className="font-mono">|</code> / koma):{' '}
                <span className="font-mono text-slate-900">
                  Subdirektorat | Nama Dokumen | Tanggal Masuk | Periode | Format | Status TTD | Catatan
                </span>
              </p>
              <button
                type="button"
                onClick={() => setBulkSubmittedText(SAMPLE_BULK_SUBMITTED_TEXT)}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Isi Contoh Tempelan
              </button>
            </div>
            <textarea
              rows={4}
              value={bulkSubmittedText}
              onChange={(e) => setBulkSubmittedText(e.target.value)}
              placeholder="Tempel daftar data yang sudah masuk di sini..."
              className="w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
            />
            {bulkSubmittedFeedback && (
              <p className="text-xs font-medium text-slate-700">
                {bulkSubmittedFeedback}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleImportBulkSubmitted(false)}
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Proses & Tambahkan
              </button>
              <button
                type="button"
                onClick={() => handleImportBulkSubmitted(true)}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Ganti Seluruh Data Masuk
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Subdirektorat
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Nama Dokumen Masuk
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold w-32">
                  Tgl Masuk
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold w-32">
                  Periode
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold w-24">
                  Format
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold w-36">
                  Status TTD
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Catatan / Keterangan
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold w-12 text-center">
                  Hapus
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submittedDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    Belum ada data masuk yang dicatat. Jika memang belum ada kiriman, centang konfirmasi di panel kiri.
                  </td>
                </tr>
              ) : (
                submittedDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        aria-label="Subdirektorat pengirim"
                        value={doc.subdirektorat}
                        onChange={(e) =>
                          handleUpdateSubmittedRow(doc.id, {
                            subdirektorat: e.target.value,
                          })
                        }
                        placeholder="Subdirektorat"
                        className="w-full min-w-[160px] rounded border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        aria-label="Nama dokumen masuk"
                        value={doc.namaDokumen}
                        onChange={(e) =>
                          handleUpdateSubmittedRow(doc.id, {
                            namaDokumen: e.target.value,
                          })
                        }
                        placeholder="Nama dokumen"
                        className="w-full min-w-[200px] rounded border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        aria-label="Tanggal masuk"
                        value={doc.tanggalMasuk}
                        onChange={(e) =>
                          handleUpdateSubmittedRow(doc.id, {
                            tanggalMasuk: e.target.value,
                          })
                        }
                        placeholder="YYYY-MM-DD"
                        className="w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        aria-label="Periode dokumen"
                        value={doc.periode}
                        onChange={(e) =>
                          handleUpdateSubmittedRow(doc.id, {
                            periode: e.target.value,
                          })
                        }
                        placeholder="November 2026"
                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        aria-label="Format dokumen"
                        value={doc.format}
                        onChange={(e) =>
                          handleUpdateSubmittedRow(doc.id, {
                            format: e.target.value,
                          })
                        }
                        placeholder="PDF"
                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        aria-label="Status tanda tangan"
                        value={doc.statusTandaTangan}
                        onChange={(e) =>
                          handleUpdateSubmittedRow(doc.id, {
                            statusTandaTangan: e.target.value as SignatureStatus,
                          })
                        }
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                      >
                        <option value="Sudah TTD">Sudah TTD</option>
                        <option value="Belum TTD">Belum TTD</option>
                        <option value="Tidak Ada Info">Tidak Ada Info</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        aria-label="Catatan dokumen"
                        value={doc.catatan}
                        onChange={(e) =>
                          handleUpdateSubmittedRow(doc.id, {
                            catatan: e.target.value,
                          })
                        }
                        placeholder="Mis. pengecualian / salah kirim"
                        className="w-full min-w-[160px] rounded border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        aria-label={`Hapus ${doc.namaDokumen || 'baris'}`}
                        onClick={() => handleDeleteSubmittedRow(doc.id)}
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
  );
};

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  LayoutGrid,
  List,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import {
  ActivityCategory,
  CapaianCalcMode,
  CapaianKinerjaItem,
} from '../types/kinerja';
import { generateId, scanForSensitiveData } from '../utils/kinerjaEngine';
import {
  BULAN_LENGKAP,
  BULAN_SINGKAT,
  computeCapaianPct,
  computeEffectiveRealisasi,
  computeMonthlyCapaianPct,
  createEmptyMonthlyArray,
  getCalcMode,
  getItemYear,
  normalizeMonthlyArray,
} from '../utils/capaianUtils';

interface CapaianKinerjaSectionProps {
  items: CapaianKinerjaItem[];
  onChangeItems: (next: CapaianKinerjaItem[]) => void;
  knownSubdirectorates: string[];
  defaultPeriode: string;
  onRecordActivity: (kategori: ActivityCategory, ringkasan: string) => void;
  onOpenDashboard?: () => void;
}

function CapaianStatusLabel({ pct }: { pct: number }) {
  if (pct >= 100) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Tercapai</span>
      </span>
    );
  }
  if (pct >= 75) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Mendekati</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Perlu Perhatian</span>
    </span>
  );
}

export const CapaianKinerjaSection: React.FC<CapaianKinerjaSectionProps> = ({
  items,
  onChangeItems,
  knownSubdirectorates,
  defaultPeriode,
  onRecordActivity,
  onOpenDashboard,
}) => {
  const defaultYearMatch = defaultPeriode.match(/\b(20\d{2})\b/);
  const defaultYear = defaultYearMatch ? defaultYearMatch[1] : '2026';

  const [subdirektorat, setSubdirektorat] = useState(
    knownSubdirectorates[0] || ''
  );
  const [nomorSasaranKinerja, setNomorSasaranKinerja] = useState('');
  const [sasaranKinerja, setSasaranKinerja] = useState('');
  const [kodeIku, setKodeIku] = useState('');
  const [indikatorKinerja, setIndikatorKinerja] = useState('');
  const [satuan, setSatuan] = useState('%');
  const [target, setTarget] = useState('100');
  const [realisasi, setRealisasi] = useState('');
  const [periode, setPeriode] = useState(defaultPeriode || '');
  const [tahun, setTahun] = useState(defaultYear);
  const [jenisPerhitungan, setJenisPerhitungan] =
    useState<CapaianCalcMode>('tetap');
  const [monthlyInputs, setMonthlyInputs] = useState<Array<string>>(() =>
    Array.from({ length: 12 }, () => '')
  );
  const [realisasiOutput, setRealisasiOutput] = useState('');
  const [satuanOutput, setSatuanOutput] = useState('Dokumen');
  const [buktiDukung, setBuktiDukung] = useState('');
  const [kendalaDanTindakLanjut, setKendalaDanTindakLanjut] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [filterSubdit, setFilterSubdit] = useState<string>('Semua');
  const [filterTahun, setFilterTahun] = useState<string>('Semua');
  const [tableView, setTableView] = useState<'ringkasan' | 'matriks'>(
    'ringkasan'
  );
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [showMonthlyFormGrid, setShowMonthlyFormGrid] = useState(false);

  const subditOptions = useMemo(() => {
    const set = new Set<string>(knownSubdirectorates);
    items.forEach((i) => {
      if (i.subdirektorat.trim()) set.add(i.subdirektorat.trim());
    });
    return Array.from(set);
  }, [knownSubdirectorates, items]);

  const yearOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(getItemYear(i)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      if (filterSubdit !== 'Semua' && i.subdirektorat !== filterSubdit) {
        return false;
      }
      if (filterTahun !== 'Semua' && getItemYear(i) !== filterTahun) {
        return false;
      }
      return true;
    });
  }, [items, filterSubdit, filterTahun]);

  const formMonthlyPreview = useMemo(() => {
    const parsed = monthlyInputs.map((v) => {
      const trimmed = v.trim();
      if (!trimmed) return null;
      const n = Number(trimmed);
      return Number.isFinite(n) && n >= 0 ? n : null;
    });
    const filled = parsed.filter((v): v is number => v !== null);
    const numTarget = Number(target);

    let effectiveReal = Number(realisasi || '0');
    if (filled.length > 0) {
      const sum = filled.reduce((a, b) => a + b, 0);
      effectiveReal =
        jenisPerhitungan === 'akumulasi'
          ? Math.round(sum * 100) / 100
          : Math.round((sum / filled.length) * 10) / 10;
    }

    const pct =
      Number.isFinite(numTarget) && numTarget > 0
        ? computeCapaianPct(numTarget, effectiveReal)
        : 0;

    return {
      parsed,
      filledCount: filled.length,
      effectiveReal: Number.isFinite(effectiveReal) ? effectiveReal : 0,
      pct,
    };
  }, [monthlyInputs, target, realisasi, jenisPerhitungan]);

  const stats = useMemo(() => {
    const total = filteredItems.length;
    if (total === 0) {
      return { total: 0, tercapai: 0, belum: 0, rataRata: 0 };
    }
    let tercapai = 0;
    let sumPct = 0;
    for (const item of filteredItems) {
      const { realisasi: effReal } = computeEffectiveRealisasi(item);
      const pct = computeCapaianPct(item.target, effReal);
      sumPct += pct;
      if (pct >= 100) tercapai++;
    }
    return {
      total,
      tercapai,
      belum: total - tercapai,
      rataRata: Math.round((sumPct / total) * 10) / 10,
    };
  }, [filteredItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!subdirektorat.trim() || !indikatorKinerja.trim()) {
      setFormError('Unit Kerja dan Nama Indikator Kinerja wajib diisi.');
      return;
    }

    const numTarget = Number(target);
    if (!Number.isFinite(numTarget) || numTarget <= 0) {
      setFormError('Target harus berupa angka lebih besar dari 0.');
      return;
    }

    const numRealisasiManual = Number(realisasi || '0');
    if (!Number.isFinite(numRealisasiManual) || numRealisasiManual < 0) {
      setFormError('Realisasi harus berupa angka 0 atau lebih.');
      return;
    }

    const combinedText = `${subdirektorat} ${nomorSasaranKinerja} ${sasaranKinerja} ${kodeIku} ${indikatorKinerja} ${realisasiOutput} ${satuanOutput} ${buktiDukung} ${kendalaDanTindakLanjut}`;
    const securityCheck = scanForSensitiveData([], [], combinedText);
    if (securityCheck.length > 0) {
      setFormError(`Dihentikan: ${securityCheck[0].detail}`);
      return;
    }

    const realisasiBulanan = formMonthlyPreview.parsed;
    const effectiveReal =
      formMonthlyPreview.filledCount > 0
        ? formMonthlyPreview.effectiveReal
        : numRealisasiManual;

    const newItem: CapaianKinerjaItem = {
      id: generateId('cap'),
      subdirektorat: subdirektorat.trim(),
      nomorSasaranKinerja: nomorSasaranKinerja.trim(),
      sasaranKinerja: sasaranKinerja.trim(),
      kodeIku: kodeIku.trim() || '-',
      indikatorKinerja: indikatorKinerja.trim(),
      satuan: satuan.trim() || '%',
      target: numTarget,
      realisasi: effectiveReal,
      periode: periode.trim() || defaultPeriode || '-',
      tahun: tahun.trim() || defaultYear,
      jenisPerhitungan,
      realisasiBulanan,
      realisasiOutput: realisasiOutput.trim(),
      satuanOutput: realisasiOutput.trim() ? satuanOutput.trim() || 'Jumlah' : '',
      buktiDukung: buktiDukung.trim(),
      kendalaDanTindakLanjut: kendalaDanTindakLanjut.trim(),
    };

    onChangeItems([newItem, ...items]);
    onRecordActivity(
      'Capaian Kinerja',
      `Menambahkan capaian "${newItem.indikatorKinerja}" (${newItem.subdirektorat})`
    );

    setNomorSasaranKinerja('');
    setSasaranKinerja('');
    setKodeIku('');
    setIndikatorKinerja('');
    setRealisasi('');
    setRealisasiOutput('');
    setMonthlyInputs(Array.from({ length: 12 }, () => ''));
    setBuktiDukung('');
    setKendalaDanTindakLanjut('');
  };

  const handleUpdateItem = (
    id: string,
    patch: Partial<CapaianKinerjaItem>
  ) => {
    const current = items.find((i) => i.id === id);
    const nextText = `${patch.nomorSasaranKinerja ?? ''} ${patch.sasaranKinerja ?? ''} ${
      patch.indikatorKinerja ?? ''
    } ${patch.realisasiOutput ?? ''} ${patch.satuanOutput ?? ''} ${
      patch.buktiDukung ?? ''
    } ${patch.kendalaDanTindakLanjut ?? ''}`;
    const securityCheck = scanForSensitiveData([], [], nextText);
    if (securityCheck.length > 0) {
      setFormError(`Dihentikan: ${securityCheck[0].detail}`);
      return;
    }
    setFormError(null);
    onChangeItems(
      items.map((i) => {
        if (i.id !== id) return i;
        const updated = { ...i, ...patch };
        const eff = computeEffectiveRealisasi(updated);
        if (eff.fromMonthly) {
          updated.realisasi = eff.realisasi;
        }
        return updated;
      })
    );
    onRecordActivity(
      'Capaian Kinerja',
      `Memperbarui realisasi/keterangan "${current?.indikatorKinerja || 'indikator'}"`
    );
  };

  const handleUpdateMonthlyCell = (
    id: string,
    monthIndex: number,
    rawValue: string
  ) => {
    const current = items.find((i) => i.id === id);
    if (!current) return;

    const trimmed = rawValue.trim();
    const nextMonthly = normalizeMonthlyArray(current.realisasiBulanan);

    if (trimmed === '') {
      nextMonthly[monthIndex] = null;
    } else {
      const num = Number(trimmed);
      if (!Number.isFinite(num) || num < 0) return;
      nextMonthly[monthIndex] = num;
    }

    const draftUpdated: CapaianKinerjaItem = {
      ...current,
      realisasiBulanan: nextMonthly,
    };
    const eff = computeEffectiveRealisasi(draftUpdated);
    if (eff.fromMonthly) {
      draftUpdated.realisasi = eff.realisasi;
    }

    onChangeItems(items.map((i) => (i.id === id ? draftUpdated : i)));
    onRecordActivity(
      'Capaian Kinerja',
      `Mengisi realisasi ${BULAN_LENGKAP[monthIndex]} untuk "${current.indikatorKinerja}"`
    );
  };

  const handleDeleteItem = (id: string) => {
    const targetItem = items.find((i) => i.id === id);
    onChangeItems(items.filter((i) => i.id !== id));
    onRecordActivity(
      'Capaian Kinerja',
      `Menghapus capaian "${targetItem?.indikatorKinerja || 'indikator'}"`
    );
  };

  const handleCopyRekap = async () => {
    const lines: string[] = [];
    lines.push(
      `Rekap Pengisian Capaian Kinerja Ditsar (${defaultPeriode || 'Periode Berjalan'})`
    );
    lines.push(
      '| Subdirektorat | No. Sasaran | Sasaran Kinerja | Kode | Indikator Kinerja | Target | Realisasi (YTD) | Realisasi Output | Capaian (%) | Rincian Bulanan | Bukti Dukung |'
    );
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const item of filteredItems) {
      const eff = computeEffectiveRealisasi(item);
      const pct = computeCapaianPct(item.target, eff.realisasi);
      const monthly = normalizeMonthlyArray(item.realisasiBulanan);
      const monthlySummary = monthly
        .map((v, idx) => (v !== null ? `${BULAN_SINGKAT[idx]}:${v}` : null))
        .filter(Boolean)
        .join(', ');
      const outputSummary = item.realisasiOutput?.trim()
        ? `${item.realisasiOutput.trim()} ${item.satuanOutput?.trim() || ''}`.trim()
        : '-';

      lines.push(
        `| ${item.subdirektorat} | ${item.nomorSasaranKinerja || '-'} | ${
          item.sasaranKinerja || '-'
        } | ${item.kodeIku} | ${item.indikatorKinerja} | ${item.target} ${
          item.satuan
        } | ${eff.realisasi} ${item.satuan} | ${outputSummary} | ${pct}% | ${
          monthlySummary || '-'
        } | ${item.buktiDukung || 'tidak ada di data yang diberikan'} |`
      );
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Pengisian Capaian Kinerja & Realisasi Bulanan
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Catat indikator, target, dan realisasi bulanan (Jan–Des). Hindari memasukkan data pribadi atau dokumen rahasia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenDashboard && (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-700 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 whitespace-nowrap"
            >
              <span>Buka Dashboard Capaian</span>
            </button>
          )}
          {filteredItems.length > 0 && (
            <button
              type="button"
              onClick={handleCopyRekap}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
            >
              {copiedSummary ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Rekap Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Salin Rekap</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:grid-cols-4">
        <div>
          <div className="text-xs text-slate-500">Total Indikator</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {stats.total}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Capai Target (≥ 100%)</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-emerald-700 tabular-nums">
            {stats.tercapai}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Belum Capai Target</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-amber-700 tabular-nums">
            {stats.belum}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Rata-Rata Capaian</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-blue-700 tabular-nums">
            {stats.rataRata}%
          </div>
        </div>
      </div>

      {/* Form Tambah Capaian Kinerja */}
      <section className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Tambah Indikator Capaian
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Lengkapi data secara berurutan mulai dari unit kerja, sasaran kinerja, indikator kinerja, hingga target dan realisasi output.
            </p>
          </div>
          {formMonthlyPreview.filledCount > 0 && (
            <div className="text-xs font-mono text-blue-800 tabular-nums">
              Pratinjau ({formMonthlyPreview.filledCount} bln):{' '}
              <strong>
                {formMonthlyPreview.effectiveReal} {satuan}
              </strong>{' '}
              ({formMonthlyPreview.pct}%)
            </div>
          )}
        </div>

        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-900"
          >
            <ShieldAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-rose-700"
              aria-hidden="true"
            />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Unit Kerja & Periode */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              1. Unit Kerja &amp; Periode
            </div>
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-12">
              <div className="md:col-span-6">
                <label
                  htmlFor="cap-subdit"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Unit Kerja <span className="text-rose-600">*</span>
                </label>
                <input
                  id="cap-subdit"
                  list="subdit-datalist"
                  type="text"
                  value={subdirektorat}
                  onChange={(e) => setSubdirektorat(e.target.value)}
                  placeholder="Pilih atau ketik nama unit kerja"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
                <datalist id="subdit-datalist">
                  {subditOptions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="cap-tahun"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Tahun
                </label>
                <input
                  id="cap-tahun"
                  type="text"
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  placeholder="2026"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div className="md:col-span-4">
                <label
                  htmlFor="cap-periode"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Periode Acuan
                </label>
                <input
                  id="cap-periode"
                  type="text"
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                  placeholder="Mis. November 2026"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Sasaran Kinerja & Indikator Kinerja */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              2. Sasaran Kinerja &amp; Indikator Kinerja
            </div>
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-12">
              <div className="md:col-span-3">
                <label
                  htmlFor="cap-no-sasaran"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Nomor Sasaran Kinerja
                </label>
                <input
                  id="cap-no-sasaran"
                  type="text"
                  value={nomorSasaranKinerja}
                  onChange={(e) => setNomorSasaranKinerja(e.target.value)}
                  placeholder="Mis. SK-01"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div className="md:col-span-9">
                <label
                  htmlFor="cap-sasaran"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Sasaran Kinerja
                </label>
                <input
                  id="cap-sasaran"
                  type="text"
                  value={sasaranKinerja}
                  onChange={(e) => setSasaranKinerja(e.target.value)}
                  placeholder="Mis. Meningkatnya ketepatan waktu pengujian dan sertifikasi sarana"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label
                  htmlFor="cap-kode"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Kode IKK / IKU
                </label>
                <input
                  id="cap-kode"
                  type="text"
                  value={kodeIku}
                  onChange={(e) => setKodeIku(e.target.value)}
                  placeholder="Mis. IKK-1.2"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div className="md:col-span-9">
                <label
                  htmlFor="cap-indikator"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Nama Indikator Kinerja <span className="text-rose-600">*</span>
                </label>
                <input
                  id="cap-indikator"
                  type="text"
                  value={indikatorKinerja}
                  onChange={(e) => setIndikatorKinerja(e.target.value)}
                  placeholder="Mis. Persentase sarana yang tersertifikasi tepat waktu"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Target, Realisasi & Output */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              3. Target, Realisasi &amp; Output
            </div>
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-12">
              <div className="md:col-span-3">
                <label
                  htmlFor="cap-pola"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Pola Realisasi
                </label>
                <select
                  id="cap-pola"
                  value={jenisPerhitungan}
                  onChange={(e) =>
                    setJenisPerhitungan(e.target.value as CapaianCalcMode)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                >
                  <option value="tetap">Rata-rata / Tetap (%)</option>
                  <option value="akumulasi">Akumulasi (Jumlah)</option>
                  <option value="nilai">Nilai</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label
                  htmlFor="cap-target"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Target <span className="text-rose-600">*</span>
                </label>
                <input
                  id="cap-target"
                  type="number"
                  step="any"
                  min={0}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label
                  htmlFor="cap-realisasi"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Realisasi Capaian (Opsional)
                </label>
                <input
                  id="cap-realisasi"
                  type="number"
                  step="any"
                  min={0}
                  value={
                    formMonthlyPreview.filledCount > 0
                      ? String(formMonthlyPreview.effectiveReal)
                      : realisasi
                  }
                  disabled={formMonthlyPreview.filledCount > 0}
                  onChange={(e) => setRealisasi(e.target.value)}
                  placeholder="Otomatis dr bulanan"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 tabular-nums disabled:bg-slate-50 disabled:text-slate-600 focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label
                  htmlFor="cap-satuan"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Satuan Indikator
                </label>
                <input
                  id="cap-satuan"
                  type="text"
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value)}
                  placeholder="%, Unit, Nilai"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div className="md:col-span-6">
                <label
                  htmlFor="cap-realisasi-output"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Realisasi Output
                </label>
                <div className="flex gap-2">
                  <input
                    id="cap-realisasi-output"
                    type="number"
                    step="any"
                    min={0}
                    value={realisasiOutput}
                    onChange={(e) => setRealisasiOutput(e.target.value)}
                    placeholder="Mis. 120"
                    className="w-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
                  />
                  <input
                    id="cap-satuan-output"
                    aria-label="Satuan Realisasi Output"
                    list="satuan-output-datalist"
                    type="text"
                    value={satuanOutput}
                    onChange={(e) => setSatuanOutput(e.target.value)}
                    placeholder="Jumlah, Sertifikat, Dokumen..."
                    className="w-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                  />
                  <datalist id="satuan-output-datalist">
                    <option value="Jumlah" />
                    <option value="Sertifikat" />
                    <option value="Dokumen" />
                    <option value="Unit" />
                    <option value="Laporan" />
                    <option value="Rekomendasi" />
                    <option value="Berita Acara" />
                    <option value="Kegiatan" />
                  </datalist>
                </div>
              </div>

              <div className="md:col-span-6 flex items-end pb-1">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Catat volume keluaran nyata (mis. <span className="font-mono text-slate-700">148 Sertifikat</span> atau <span className="font-mono text-slate-700">24 Dokumen</span>) sebagai penguat realisasi kinerja.
                </p>
              </div>
            </div>

            {/* Grid Realisasi Bulanan Jan - Des (Collapsible) */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowMonthlyFormGrid((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800"
                >
                  {showMonthlyFormGrid ? (
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>
                    {showMonthlyFormGrid
                      ? 'Sembunyikan rincian realisasi per bulan (Jan–Des)'
                      : 'Isi rincian realisasi per bulan (Jan–Des)'}
                  </span>
                  {formMonthlyPreview.filledCount > 0 && (
                    <span className="font-mono text-[11px] font-medium text-slate-500 tabular-nums">
                      ({formMonthlyPreview.filledCount}/12 terisi)
                    </span>
                  )}
                </button>
                <span className="text-[11px] text-slate-500">
                  Opsional — dapat diisi langsung di tabel setelah tersimpan.
                </span>
              </div>

              {showMonthlyFormGrid && (
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-200/80 pt-3 sm:grid-cols-6 lg:grid-cols-12">
                  {BULAN_SINGKAT.map((bln, idx) => (
                    <div key={bln}>
                      <label
                        htmlFor={`form-bln-${idx}`}
                        className="block text-[11px] font-medium text-slate-600 mb-0.5"
                      >
                        {bln}
                      </label>
                      <input
                        id={`form-bln-${idx}`}
                        type="number"
                        step="any"
                        min={0}
                        value={monthlyInputs[idx]}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMonthlyInputs((prev) =>
                            prev.map((item, i) => (i === idx ? val : item))
                          );
                        }}
                        placeholder="-"
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. Bukti Dukung & Kendala */}
          <div className="grid grid-cols-1 gap-3.5 border-t border-slate-100 pt-4 md:grid-cols-12">
            <div className="md:col-span-6">
              <label
                htmlFor="cap-bukti"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Dokumen Bukti Dukung Rujukan
              </label>
              <input
                id="cap-bukti"
                type="text"
                value={buktiDukung}
                onChange={(e) => setBuktiDukung(e.target.value)}
                placeholder="Nama dokumen pendukung yang dilampirkan"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>

            <div className="md:col-span-6">
              <label
                htmlFor="cap-kendala"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Kendala &amp; Rencana Tindak Lanjut
              </label>
              <input
                id="cap-kendala"
                type="text"
                value={kendalaDanTindakLanjut}
                onChange={(e) => setKendalaDanTindakLanjut(e.target.value)}
                placeholder="Catatan capaian, hambatan, atau tindak lanjut"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Simpan Capaian Kinerja</span>
            </button>
          </div>
        </form>
      </section>

      {/* Tabel Daftar Capaian Kinerja */}
      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Daftar Capaian & Realisasi Bulanan
            </h2>
            <p className="text-xs text-slate-500">
              Pilih tampilan ringkasan atau matriks Jan–Des untuk memperbarui realisasi per bulan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setTableView('ringkasan')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors whitespace-nowrap ${
                  tableView === 'ringkasan'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Ringkasan & Rincian</span>
              </button>
              <button
                type="button"
                onClick={() => setTableView('matriks')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors whitespace-nowrap ${
                  tableView === 'matriks'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Matriks Jan–Des</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label
                htmlFor="filter-cap-tahun"
                className="text-slate-600 font-medium"
              >
                Tahun:
              </label>
              <select
                id="filter-cap-tahun"
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              >
                <option value="Semua">Semua</option>
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              <label
                htmlFor="filter-cap-subdit"
                className="text-slate-600 font-medium ml-1"
              >
                Unit:
              </label>
              <select
                id="filter-cap-subdit"
                value={filterSubdit}
                onChange={(e) => setFilterSubdit(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              >
                <option value="Semua">Semua Subdirektorat</option>
                {subditOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {tableView === 'matriks' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-slate-50 px-4 py-2.5 font-semibold min-w-[210px] border-r border-slate-200"
                  >
                    Indikator & Target
                  </th>
                  {BULAN_SINGKAT.map((bln) => (
                    <th
                      key={bln}
                      scope="col"
                      className="px-2 py-2.5 font-semibold text-center whitespace-nowrap"
                    >
                      {bln}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-3 py-2.5 font-semibold text-right whitespace-nowrap border-l border-slate-200"
                  >
                    YTD / Capaian
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={14}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Belum ada data capaian kinerja yang diisi.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const monthly = normalizeMonthlyArray(item.realisasiBulanan);
                    const eff = computeEffectiveRealisasi(item);
                    const ytdPct = computeCapaianPct(item.target, eff.realisasi);
                    const mode = getCalcMode(item);

                    return (
                      <tr key={item.id} className="align-top hover:bg-slate-50/50">
                        <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-slate-200">
                          <div className="text-[11px] font-semibold text-blue-800">
                            {item.subdirektorat}
                          </div>
                          {(item.nomorSasaranKinerja || item.sasaranKinerja) && (
                            <div className="mt-0.5 text-[11px] text-slate-600 line-clamp-1">
                              {item.nomorSasaranKinerja ? (
                                <span className="font-mono font-semibold text-slate-700">
                                  {item.nomorSasaranKinerja}
                                </span>
                              ) : null}
                              {item.nomorSasaranKinerja && item.sasaranKinerja ? ' · ' : ''}
                              {item.sasaranKinerja}
                            </div>
                          )}
                          <div className="mt-0.5 font-semibold text-slate-900 line-clamp-2">
                            {item.kodeIku} · {item.indikatorKinerja}
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
                            Target: {item.target} {item.satuan} ({mode === 'akumulasi' ? 'Akumulasi' : mode === 'nilai' ? 'Nilai' : 'Rata-rata'})
                          </div>
                        </td>
                        {BULAN_SINGKAT.map((bln, mIdx) => {
                          const val = monthly[mIdx];
                          const mPct = computeMonthlyCapaianPct(item, mIdx);
                          return (
                            <td key={bln} className="px-1.5 py-2.5 text-center">
                              <input
                                type="number"
                                step="any"
                                min={0}
                                aria-label={`Realisasi ${bln} ${item.indikatorKinerja}`}
                                value={val === null ? '' : val}
                                onChange={(e) =>
                                  handleUpdateMonthlyCell(
                                    item.id,
                                    mIdx,
                                    e.target.value
                                  )
                                }
                                placeholder="-"
                                className="w-14 rounded border border-slate-200 px-1.5 py-1 text-center font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
                              />
                              <div
                                className={`mt-1 font-mono text-[10px] font-semibold tabular-nums ${
                                  mPct === null
                                    ? 'text-slate-400'
                                    : mPct >= 100
                                    ? 'text-emerald-700'
                                    : mPct >= 75
                                    ? 'text-amber-700'
                                    : 'text-rose-700'
                                }`}
                              >
                                {mPct === null ? '-' : `${mPct}%`}
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-right whitespace-nowrap border-l border-slate-200">
                          <div className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                            {eff.realisasi} {item.satuan}
                          </div>
                          <div
                            className={`mt-0.5 font-mono text-xs font-bold tabular-nums ${
                              ytdPct >= 100
                                ? 'text-emerald-700'
                                : ytdPct >= 75
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {ytdPct}%
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {eff.filledMonths} bln terisi
                          </div>
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
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Subdirektorat & Indikator
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold w-24">
                    Target
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold w-28">
                    Realisasi
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 font-semibold whitespace-nowrap"
                  >
                    Capaian (%)
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Bukti Dukung & Tindak Lanjut
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 font-semibold whitespace-nowrap text-center"
                  >
                    Bulanan
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 font-semibold w-12 text-center"
                  >
                    Hapus
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Belum ada data capaian kinerja yang diisi. Gunakan formulir di atas untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const eff = computeEffectiveRealisasi(item);
                    const pct = computeCapaianPct(item.target, eff.realisasi);
                    const monthly = normalizeMonthlyArray(
                      item.realisasiBulanan ?? createEmptyMonthlyArray()
                    );
                    const isExpanded = expandedRowId === item.id;
                    const mode = getCalcMode(item);

                    return (
                      <React.Fragment key={item.id}>
                        <tr className="align-top hover:bg-slate-50/50">
                          <td className="px-4 py-3 min-w-[240px]">
                            <div className="text-[11px] font-semibold text-blue-800">
                              {item.subdirektorat}
                            </div>
                            {(item.nomorSasaranKinerja || item.sasaranKinerja) && (
                              <div className="mt-0.5 text-[11px] text-slate-600">
                                {item.nomorSasaranKinerja ? (
                                  <span className="font-mono font-semibold text-slate-700">
                                    {item.nomorSasaranKinerja}
                                  </span>
                                ) : null}
                                {item.nomorSasaranKinerja && item.sasaranKinerja ? ' · ' : ''}
                                {item.sasaranKinerja}
                              </div>
                            )}
                            <div className="mt-0.5 font-semibold text-slate-900">
                              {item.indikatorKinerja}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500 font-mono">
                              <span>{item.kodeIku}</span>
                              <span aria-hidden="true"> · </span>
                              <span>{item.tahun || defaultYear}</span>
                              <span aria-hidden="true"> · </span>
                              <span>Satuan: {item.satuan}</span>
                              <span aria-hidden="true"> · </span>
                              <span>
                                {mode === 'akumulasi'
                                  ? 'Akumulasi'
                                  : mode === 'nilai'
                                  ? 'Nilai'
                                  : 'Rata-rata'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              step="any"
                              min={0}
                              aria-label={`Target ${item.indikatorKinerja}`}
                              value={item.target}
                              onChange={(e) =>
                                handleUpdateItem(item.id, {
                                  target: Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                              className="w-20 rounded border border-slate-200 px-2 py-1 font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-3 space-y-1.5">
                            {eff.fromMonthly ? (
                              <div>
                                <div className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                                  {eff.realisasi} {item.satuan}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {eff.filledMonths}/12 bulan terisi
                                </div>
                              </div>
                            ) : (
                              <input
                                type="number"
                                step="any"
                                min={0}
                                aria-label={`Realisasi ${item.indikatorKinerja}`}
                                value={item.realisasi}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, {
                                    realisasi: Math.max(
                                      0,
                                      Number(e.target.value) || 0
                                    ),
                                  })
                                }
                                className="w-20 rounded border border-slate-200 px-2 py-1 font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
                              />
                            )}
                            {item.realisasiOutput?.trim() && (
                              <div className="text-[11px] font-mono text-slate-600 tabular-nums">
                                Output: {item.realisasiOutput}{' '}
                                {item.satuanOutput || ''}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                              {pct}%
                            </div>
                            <div className="mt-1">
                              <CapaianStatusLabel pct={pct} />
                            </div>
                          </td>
                          <td className="px-3 py-3 space-y-1.5 min-w-[220px]">
                            <input
                              type="text"
                              aria-label={`Bukti dukung ${item.indikatorKinerja}`}
                              value={item.buktiDukung}
                              onChange={(e) =>
                                handleUpdateItem(item.id, {
                                  buktiDukung: e.target.value,
                                })
                              }
                              placeholder="Dokumen bukti dukung"
                              className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                            />
                            <input
                              type="text"
                              aria-label={`Kendala dan tindak lanjut ${item.indikatorKinerja}`}
                              value={item.kendalaDanTindakLanjut}
                              onChange={(e) =>
                                handleUpdateItem(item.id, {
                                  kendalaDanTindakLanjut: e.target.value,
                                })
                              }
                              placeholder="Kendala & tindak lanjut"
                              className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-blue-700 focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedRowId(isExpanded ? null : item.id)
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-slate-50"
                            >
                              <span>{isExpanded ? 'Tutup' : 'Jan–Des'}</span>
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" aria-hidden="true" />
                              ) : (
                                <ChevronDown className="h-3 w-3" aria-hidden="true" />
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              aria-label={`Hapus ${item.indikatorKinerja}`}
                              onClick={() => handleDeleteItem(item.id)}
                              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={7} className="px-5 py-4">
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <span className="font-semibold text-slate-800">
                                    Rincian Realisasi & Capaian Bulanan — {item.kodeIku} ({item.tahun || defaultYear})
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <label
                                      htmlFor={`mode-${item.id}`}
                                      className="text-slate-600"
                                    >
                                      Pola:
                                    </label>
                                    <select
                                      id={`mode-${item.id}`}
                                      value={mode}
                                      onChange={(e) =>
                                        handleUpdateItem(item.id, {
                                          jenisPerhitungan: e.target
                                            .value as CapaianCalcMode,
                                        })
                                      }
                                      className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-900"
                                    >
                                      <option value="tetap">
                                        Rata-rata / Tetap
                                      </option>
                                      <option value="akumulasi">
                                        Akumulasi (Jumlah)
                                      </option>
                                      <option value="nilai">Nilai</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">
                                  {BULAN_SINGKAT.map((bln, mIdx) => {
                                    const mVal = monthly[mIdx];
                                    const mPct = computeMonthlyCapaianPct(
                                      item,
                                      mIdx
                                    );
                                    return (
                                      <div
                                        key={bln}
                                        className="rounded-lg border border-slate-200 bg-white p-2 space-y-1"
                                      >
                                        <div className="flex items-center justify-between text-[11px]">
                                          <span className="font-semibold text-slate-700">
                                            {bln}
                                          </span>
                                          <span
                                            className={`font-mono font-semibold tabular-nums ${
                                              mPct === null
                                                ? 'text-slate-400'
                                                : mPct >= 100
                                                ? 'text-emerald-700'
                                                : mPct >= 75
                                                ? 'text-amber-700'
                                                : 'text-rose-700'
                                            }`}
                                          >
                                            {mPct === null ? '-' : `${mPct}%`}
                                          </span>
                                        </div>
                                        <input
                                          type="number"
                                          step="any"
                                          min={0}
                                          aria-label={`Realisasi ${BULAN_LENGKAP[mIdx]} ${item.indikatorKinerja}`}
                                          value={mVal === null ? '' : mVal}
                                          onChange={(e) =>
                                            handleUpdateMonthlyCell(
                                              item.id,
                                              mIdx,
                                              e.target.value
                                            )
                                          }
                                          placeholder="-"
                                          className="w-full rounded border border-slate-200 px-1.5 py-1 font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

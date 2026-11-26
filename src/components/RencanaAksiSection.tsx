import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  ListChecks,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import {
  ActivityCategory,
  CapaianKinerjaItem,
  RencanaAksiBulanDetail,
  RencanaAksiItem,
} from '../types/kinerja';
import { generateId, scanForSensitiveData } from '../utils/kinerjaEngine';
import {
  BULAN_LENGKAP,
  computeCapaianPct,
  computeMonthlyTarget,
  getItemYear,
  normalizeMonthlyArray,
} from '../utils/capaianUtils';

interface RencanaAksiSectionProps {
  rencanaAksiItems: RencanaAksiItem[];
  onChangeRencanaAksiItems: (next: RencanaAksiItem[]) => void;
  capaianItems: CapaianKinerjaItem[];
  knownSubdirectorates: string[];
  onRecordActivity: (kategori: ActivityCategory, ringkasan: string) => void;
  onOpenCapaianInput: () => void;
}

function createEmptyBulanan(
  sourceItem?: CapaianKinerjaItem
): RencanaAksiBulanDetail[] {
  const defaultTarget = sourceItem ? computeMonthlyTarget(sourceItem) : null;
  const monthlyReal = sourceItem
    ? normalizeMonthlyArray(sourceItem.realisasiBulanan)
    : Array.from({ length: 12 }, () => null);

  return Array.from({ length: 12 }, (_, idx) => ({
    target: defaultTarget,
    realisasi: monthlyReal[idx] ?? null,
    evaluasi: '',
    rencanaTindakLanjut: '',
  }));
}

function normalizeBulanan(
  arr?: RencanaAksiBulanDetail[]
): RencanaAksiBulanDetail[] {
  return Array.from({ length: 12 }, (_, idx) => {
    const entry = Array.isArray(arr) ? arr[idx] : undefined;
    return {
      target:
        entry && typeof entry.target === 'number' && Number.isFinite(entry.target)
          ? entry.target
          : null,
      realisasi:
        entry &&
        typeof entry.realisasi === 'number' &&
        Number.isFinite(entry.realisasi)
          ? entry.realisasi
          : null,
      evaluasi: entry?.evaluasi ?? '',
      rencanaTindakLanjut: entry?.rencanaTindakLanjut ?? '',
    };
  });
}

function formatNumberId(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(val);
}

function MonthStatusBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-[11px] text-slate-400">Belum diisi</span>;
  }
  if (pct >= 100) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Tercapai</span>
      </span>
    );
  }
  if (pct >= 75) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Mendekati</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Perlu Perhatian</span>
    </span>
  );
}

export const RencanaAksiSection: React.FC<RencanaAksiSectionProps> = ({
  rencanaAksiItems,
  onChangeRencanaAksiItems,
  capaianItems,
  knownSubdirectorates,
  onRecordActivity,
  onOpenCapaianInput,
}) => {
  const [selectedSasaranKey, setSelectedSasaranKey] = useState<string>('Semua');
  const [selectedCapaianId, setSelectedCapaianId] = useState<string>(
    () => capaianItems[0]?.id || ''
  );
  const [selectedBulanIdx, setSelectedBulanIdx] = useState<number>(10); // November default

  const [initialDraft] = useState(() => {
    const first = capaianItems[0];
    if (!first) {
      return { target: '', realisasi: '', evaluasi: '', rtl: '' };
    }
    const existing = rencanaAksiItems.find((r) => r.capaianItemId === first.id);
    if (existing) {
      const m = normalizeBulanan(existing.bulanan)[10];
      return {
        target: m.target !== null ? String(m.target) : '',
        realisasi: m.realisasi !== null ? String(m.realisasi) : '',
        evaluasi: m.evaluasi,
        rtl: m.rencanaTindakLanjut,
      };
    }
    const t = computeMonthlyTarget(first);
    const r = normalizeMonthlyArray(first.realisasiBulanan)[10];
    return {
      target: t > 0 ? String(t) : '',
      realisasi: r !== null ? String(r) : '',
      evaluasi: '',
      rtl: '',
    };
  });

  const [draftTarget, setDraftTarget] = useState<string>(initialDraft.target);
  const [draftRealisasi, setDraftRealisasi] = useState<string>(
    initialDraft.realisasi
  );
  const [draftEvaluasi, setDraftEvaluasi] = useState<string>(
    initialDraft.evaluasi
  );
  const [draftRtl, setDraftRtl] = useState<string>(initialDraft.rtl);
  const [formNotice, setFormNotice] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const [filterSubdit, setFilterSubdit] = useState<string>('Semua');
  const [filterTahun, setFilterTahun] = useState<string>('Semua');
  const [viewMode, setViewMode] = useState<'fokus_bulan' | 'matriks_12'>(
    'fokus_bulan'
  );
  const [tableBulanIdx, setTableBulanIdx] = useState<number>(10); // November default
  const [expandedItemId, setExpandedItemId] = useState<string | null>(
    () => rencanaAksiItems[0]?.id || null
  );

  // Unique Sasaran Kinerja options sourced from existing capaianItems
  const sasaranOptions = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; nomor: string; sasaran: string }
    >();
    for (const item of capaianItems) {
      const sasaran = item.sasaranKinerja?.trim() || '';
      const nomor = item.nomorSasaranKinerja?.trim() || '';
      if (!sasaran) continue;
      const key = sasaran.toLowerCase().replace(/\s+/g, ' ');
      if (!map.has(key)) {
        map.set(key, {
          key,
          nomor,
          sasaran,
          label: nomor ? `${nomor} — ${sasaran}` : sasaran,
        });
      }
    }
    return Array.from(map.values());
  }, [capaianItems]);

  // Indikator Kinerja options filtered by selected Sasaran Kinerja
  const indikatorOptions = useMemo(() => {
    if (selectedSasaranKey === 'Semua') return capaianItems;
    return capaianItems.filter((item) => {
      const key = (item.sasaranKinerja?.trim() || '')
        .toLowerCase()
        .replace(/\s+/g, ' ');
      return key === selectedSasaranKey;
    });
  }, [capaianItems, selectedSasaranKey]);

  const activeCapaianItem = useMemo(() => {
    if (indikatorOptions.length === 0) return null;
    return (
      indikatorOptions.find((i) => i.id === selectedCapaianId) ||
      indikatorOptions[0]
    );
  }, [indikatorOptions, selectedCapaianId]);

  const loadMonthDefaultsIntoDraft = (
    capaianItem: CapaianKinerjaItem | null,
    bulanIdx: number
  ) => {
    if (!capaianItem) {
      setDraftTarget('');
      setDraftRealisasi('');
      setDraftEvaluasi('');
      setDraftRtl('');
      return;
    }

    const existingRa = rencanaAksiItems.find(
      (r) => r.capaianItemId === capaianItem.id
    );
    if (existingRa) {
      const m = normalizeBulanan(existingRa.bulanan)[bulanIdx];
      setDraftTarget(m.target !== null ? String(m.target) : '');
      setDraftRealisasi(m.realisasi !== null ? String(m.realisasi) : '');
      setDraftEvaluasi(m.evaluasi);
      setDraftRtl(m.rencanaTindakLanjut);
      return;
    }

    const monthlyTarget = computeMonthlyTarget(capaianItem);
    const monthlyReal = normalizeMonthlyArray(capaianItem.realisasiBulanan)[
      bulanIdx
    ];
    setDraftTarget(monthlyTarget > 0 ? String(monthlyTarget) : '');
    setDraftRealisasi(monthlyReal !== null ? String(monthlyReal) : '');
    setDraftEvaluasi('');
    setDraftRtl('');
  };

  const handleSelectSasaran = (nextSasaranKey: string) => {
    setSelectedSasaranKey(nextSasaranKey);
    setFormNotice(null);
    const matching =
      nextSasaranKey === 'Semua'
        ? capaianItems
        : capaianItems.filter(
            (i) =>
              (i.sasaranKinerja?.trim() || '')
                .toLowerCase()
                .replace(/\s+/g, ' ') === nextSasaranKey
          );
    const nextItem = matching[0] || null;
    setSelectedCapaianId(nextItem?.id || '');
    loadMonthDefaultsIntoDraft(nextItem, selectedBulanIdx);
  };

  const handleSelectIndikator = (nextId: string) => {
    setSelectedCapaianId(nextId);
    setFormNotice(null);
    const nextItem = capaianItems.find((i) => i.id === nextId) || null;
    loadMonthDefaultsIntoDraft(nextItem, selectedBulanIdx);
  };

  const handleSelectDraftBulan = (nextMonthIdx: number) => {
    setSelectedBulanIdx(nextMonthIdx);
    setFormNotice(null);
    loadMonthDefaultsIntoDraft(activeCapaianItem, nextMonthIdx);
  };

  const draftPreviewPct = useMemo(() => {
    const t = Number(draftTarget);
    const r = Number(draftRealisasi);
    if (!draftTarget.trim() || !draftRealisasi.trim()) return null;
    if (!Number.isFinite(t) || t <= 0 || !Number.isFinite(r) || r < 0) {
      return null;
    }
    return computeCapaianPct(t, r);
  }, [draftTarget, draftRealisasi]);

  const handleSaveMonthAction = (e: React.FormEvent) => {
    e.preventDefault();
    setFormNotice(null);

    if (!activeCapaianItem) {
      setFormNotice({
        type: 'error',
        text: 'Pilih Sasaran Kinerja dan Indikator Kinerja terlebih dahulu.',
      });
      return;
    }

    const trimmedTarget = draftTarget.trim();
    const parsedTarget =
      trimmedTarget === '' ? null : Number(trimmedTarget);
    if (
      trimmedTarget !== '' &&
      (!Number.isFinite(parsedTarget) || (parsedTarget as number) < 0)
    ) {
      setFormNotice({
        type: 'error',
        text: 'Target kinerja per bulan harus berupa angka 0 atau lebih.',
      });
      return;
    }

    const trimmedReal = draftRealisasi.trim();
    const parsedReal = trimmedReal === '' ? null : Number(trimmedReal);
    if (
      trimmedReal !== '' &&
      (!Number.isFinite(parsedReal) || (parsedReal as number) < 0)
    ) {
      setFormNotice({
        type: 'error',
        text: 'Realisasi per bulan harus berupa angka 0 atau lebih.',
      });
      return;
    }

    const secAlerts = scanForSensitiveData(
      [],
      [],
      `${draftEvaluasi} ${draftRtl}`
    );
    if (secAlerts.length > 0) {
      setFormNotice({
        type: 'error',
        text: `Dihentikan: ${secAlerts[0].detail}`,
      });
      return;
    }

    const existingIdx = rencanaAksiItems.findIndex(
      (r) => r.capaianItemId === activeCapaianItem.id
    );

    const monthEntry: RencanaAksiBulanDetail = {
      target: parsedTarget,
      realisasi: parsedReal,
      evaluasi: draftEvaluasi.trim(),
      rencanaTindakLanjut: draftRtl.trim(),
    };

    if (existingIdx >= 0) {
      const updated = rencanaAksiItems.map((ra, idx) => {
        if (idx !== existingIdx) return ra;
        const nextBulanan = normalizeBulanan(ra.bulanan);
        nextBulanan[selectedBulanIdx] = monthEntry;
        return {
          ...ra,
          subdirektorat: activeCapaianItem.subdirektorat,
          tahun: getItemYear(activeCapaianItem),
          nomorSasaranKinerja: activeCapaianItem.nomorSasaranKinerja || '',
          sasaranKinerja: activeCapaianItem.sasaranKinerja || '-',
          kodeIku: activeCapaianItem.kodeIku,
          indikatorKinerja: activeCapaianItem.indikatorKinerja,
          satuan: activeCapaianItem.satuan,
          bulanan: nextBulanan,
        };
      });
      onChangeRencanaAksiItems(updated);
      setExpandedItemId(rencanaAksiItems[existingIdx].id);
    } else {
      const nextBulanan = createEmptyBulanan(activeCapaianItem);
      nextBulanan[selectedBulanIdx] = monthEntry;
      const newRa: RencanaAksiItem = {
        id: generateId('ra'),
        capaianItemId: activeCapaianItem.id,
        subdirektorat: activeCapaianItem.subdirektorat,
        tahun: getItemYear(activeCapaianItem),
        nomorSasaranKinerja: activeCapaianItem.nomorSasaranKinerja || '',
        sasaranKinerja: activeCapaianItem.sasaranKinerja || '-',
        kodeIku: activeCapaianItem.kodeIku,
        indikatorKinerja: activeCapaianItem.indikatorKinerja,
        satuan: activeCapaianItem.satuan,
        bulanan: nextBulanan,
      };
      onChangeRencanaAksiItems([newRa, ...rencanaAksiItems]);
      setExpandedItemId(newRa.id);
    }

    setTableBulanIdx(selectedBulanIdx);
    onRecordActivity(
      'Rencana Aksi',
      `Menyimpan monitoring rencana aksi ${BULAN_LENGKAP[selectedBulanIdx]} untuk ${activeCapaianItem.kodeIku} (${activeCapaianItem.subdirektorat})`
    );
    setFormNotice({
      type: 'success',
      text: `Monitoring bulan ${BULAN_LENGKAP[selectedBulanIdx]} untuk ${activeCapaianItem.kodeIku} berhasil disimpan.`,
    });
  };

  const handleInit12MonthsFromIkk = () => {
    setFormNotice(null);
    if (!activeCapaianItem) return;

    const existing = rencanaAksiItems.find(
      (r) => r.capaianItemId === activeCapaianItem.id
    );
    if (existing) {
      setExpandedItemId(existing.id);
      setViewMode('matriks_12');
      setFormNotice({
        type: 'success',
        text: `Matriks 12 bulan untuk ${activeCapaianItem.kodeIku} sudah tersedia di tabel bawah.`,
      });
      return;
    }

    const newRa: RencanaAksiItem = {
      id: generateId('ra'),
      capaianItemId: activeCapaianItem.id,
      subdirektorat: activeCapaianItem.subdirektorat,
      tahun: getItemYear(activeCapaianItem),
      nomorSasaranKinerja: activeCapaianItem.nomorSasaranKinerja || '',
      sasaranKinerja: activeCapaianItem.sasaranKinerja || '-',
      kodeIku: activeCapaianItem.kodeIku,
      indikatorKinerja: activeCapaianItem.indikatorKinerja,
      satuan: activeCapaianItem.satuan,
      bulanan: createEmptyBulanan(activeCapaianItem),
    };
    onChangeRencanaAksiItems([newRa, ...rencanaAksiItems]);
    setExpandedItemId(newRa.id);
    setViewMode('matriks_12');
    onRecordActivity(
      'Rencana Aksi',
      `Membuat matriks monitoring 12 bulan untuk ${activeCapaianItem.kodeIku} (${activeCapaianItem.subdirektorat})`
    );
    setFormNotice({
      type: 'success',
      text: `Matriks 12 bulan untuk ${activeCapaianItem.kodeIku} dimuat dari target & realisasi yang ada.`,
    });
  };

  const handleUpdateInlineMonth = (
    raId: string,
    bulanIdx: number,
    patch: Partial<RencanaAksiBulanDetail>
  ) => {
    if (
      patch.evaluasi !== undefined ||
      patch.rencanaTindakLanjut !== undefined
    ) {
      const checkText = `${patch.evaluasi ?? ''} ${
        patch.rencanaTindakLanjut ?? ''
      }`;
      const alerts = scanForSensitiveData([], [], checkText);
      if (alerts.length > 0) {
        setFormNotice({
          type: 'error',
          text: `Dihentikan: ${alerts[0].detail}`,
        });
        return;
      }
    }

    onChangeRencanaAksiItems(
      rencanaAksiItems.map((ra) => {
        if (ra.id !== raId) return ra;
        const nextBulanan = normalizeBulanan(ra.bulanan);
        nextBulanan[bulanIdx] = {
          ...nextBulanan[bulanIdx],
          ...patch,
        };
        return { ...ra, bulanan: nextBulanan };
      })
    );
  };

  const handleDeleteRaItem = (ra: RencanaAksiItem) => {
    onChangeRencanaAksiItems(
      rencanaAksiItems.filter((item) => item.id !== ra.id)
    );
    onRecordActivity(
      'Rencana Aksi',
      `Menghapus monitoring rencana aksi ${ra.kodeIku} (${ra.subdirektorat})`
    );
  };

  const subditOptions = useMemo(() => {
    const set = new Set<string>(knownSubdirectorates);
    rencanaAksiItems.forEach((r) => {
      if (r.subdirektorat.trim()) set.add(r.subdirektorat.trim());
    });
    return Array.from(set);
  }, [knownSubdirectorates, rencanaAksiItems]);

  const yearOptions = useMemo(() => {
    const set = new Set<string>();
    rencanaAksiItems.forEach((r) => {
      if (r.tahun.trim()) set.add(r.tahun.trim());
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [rencanaAksiItems]);

  const filteredRaItems = useMemo(() => {
    return rencanaAksiItems.filter((ra) => {
      if (filterSubdit !== 'Semua' && ra.subdirektorat !== filterSubdit) {
        return false;
      }
      if (filterTahun !== 'Semua' && ra.tahun !== filterTahun) {
        return false;
      }
      return true;
    });
  }, [rencanaAksiItems, filterSubdit, filterTahun]);

  // Group identical Sasaran Kinerja rows cleanly in Fokus Bulan view
  const groupedMonthRows = useMemo(() => {
    const groups = new Map<string, RencanaAksiItem[]>();
    for (const ra of filteredRaItems) {
      const rawSasaran = ra.sasaranKinerja.trim();
      const key =
        rawSasaran && rawSasaran !== '-'
          ? rawSasaran.toLowerCase().replace(/\s+/g, ' ')
          : `__empty_${ra.id}`;
      const existing = groups.get(key);
      if (existing) existing.push(ra);
      else groups.set(key, [ra]);
    }

    const result: Array<{
      ra: RencanaAksiItem;
      sasaranRowSpan: number;
      isGroupStart: boolean;
    }> = [];

    for (const group of groups.values()) {
      group.forEach((ra, idx) => {
        result.push({
          ra,
          sasaranRowSpan: idx === 0 ? group.length : 0,
          isGroupStart: idx === 0,
        });
      });
    }
    return result;
  }, [filteredRaItems]);

  const stats = useMemo(() => {
    let filledMonths = 0;
    let achievedMonths = 0;
    let notesMonths = 0;
    let pctSum = 0;

    for (const ra of filteredRaItems) {
      const bulanan = normalizeBulanan(ra.bulanan);
      for (const m of bulanan) {
        if (m.target !== null && m.target > 0 && m.realisasi !== null) {
          const pct = computeCapaianPct(m.target, m.realisasi);
          filledMonths++;
          pctSum += pct;
          if (pct >= 100) achievedMonths++;
        }
        if (m.evaluasi.trim() || m.rencanaTindakLanjut.trim()) {
          notesMonths++;
        }
      }
    }

    return {
      totalIndikator: filteredRaItems.length,
      filledMonths,
      achievedMonths,
      notesMonths,
      avgPct:
        filledMonths > 0
          ? Math.round((pctSum / filledMonths) * 10) / 10
          : 0,
    };
  }, [filteredRaItems]);

  return (
    <div className="space-y-6">
      {/* Form Pilih Sasaran & Indikator Kinerja + Input Monitoring Bulanan */}
      <section className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Input Monitoring Rencana Aksi Bulanan
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Pilih Sasaran Kinerja dan Indikator Kinerja dari data yang sudah diinput, lalu catat target, realisasi, evaluasi, dan rencana tindak lanjut tiap bulan.
            </p>
          </div>

          {activeCapaianItem && (
            <button
              type="button"
              onClick={handleInit12MonthsFromIkk}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-700 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100 whitespace-nowrap"
            >
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Muat Matriks 12 Bulan dari IKK Ini</span>
            </button>
          )}
        </div>

        {capaianItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center space-y-3">
            <p className="text-xs text-slate-600">
              Belum ada data Sasaran Kinerja dan Indikator Kinerja yang tersimpan pada menu Capaian Bulanan.
            </p>
            <button
              type="button"
              onClick={onOpenCapaianInput}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Isi Sasaran &amp; Indikator di Capaian Bulanan</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveMonthAction} className="space-y-4">
            {/* Step 1: Pilih dari input Sasaran & Indikator yang sudah ada */}
            <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-4 space-y-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                1. Pilih Sasaran Kinerja &amp; Indikator Kinerja (Dari Data Tersimpan)
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="ra-sasaran"
                    className="mb-1 block text-xs font-medium text-slate-700"
                  >
                    Sasaran Kinerja
                  </label>
                  <select
                    id="ra-sasaran"
                    value={selectedSasaranKey}
                    onChange={(e) => handleSelectSasaran(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                  >
                    <option value="Semua">
                      Semua Sasaran Kinerja ({capaianItems.length} indikator)
                    </option>
                    {sasaranOptions.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="ra-indikator"
                    className="mb-1 block text-xs font-medium text-slate-700"
                  >
                    Indikator Kinerja (IKK)
                  </label>
                  <select
                    id="ra-indikator"
                    value={activeCapaianItem?.id || ''}
                    onChange={(e) => handleSelectIndikator(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                  >
                    {indikatorOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.kodeIku} — {item.indikatorKinerja} ({item.subdirektorat} · {getItemYear(item)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {activeCapaianItem && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-slate-200/70 pt-2.5 text-[11px] text-slate-600">
                  <span>
                    <strong className="text-slate-800">Unit Kerja:</strong>{' '}
                    {activeCapaianItem.subdirektorat}
                  </span>
                  <span>
                    <strong className="text-slate-800">Tahun:</strong>{' '}
                    <span className="font-mono">{getItemYear(activeCapaianItem)}</span>
                  </span>
                  <span>
                    <strong className="text-slate-800">Sasaran:</strong>{' '}
                    {activeCapaianItem.nomorSasaranKinerja
                      ? `${activeCapaianItem.nomorSasaranKinerja} · `
                      : ''}
                    {activeCapaianItem.sasaranKinerja || '-'}
                  </span>
                  <span>
                    <strong className="text-slate-800">Satuan:</strong>{' '}
                    <span className="font-mono">{activeCapaianItem.satuan}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Step 2: Target, Realisasi, Capaian, Evaluasi & RTL per Bulan */}
            <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-4 space-y-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                2. Target, Realisasi, Evaluasi &amp; Rencana Tindak Lanjut Bulan Terpilih
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
                <div className="lg:col-span-3">
                  <label
                    htmlFor="ra-bulan"
                    className="mb-1 block text-xs font-medium text-slate-700"
                  >
                    Bulan Monitoring
                  </label>
                  <select
                    id="ra-bulan"
                    value={selectedBulanIdx}
                    onChange={(e) =>
                      handleSelectDraftBulan(Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-700 focus:outline-none"
                  >
                    {BULAN_LENGKAP.map((bln, idx) => (
                      <option key={bln} value={idx}>
                        {bln}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <label
                    htmlFor="ra-target"
                    className="mb-1 block text-xs font-medium text-slate-700"
                  >
                    Target Kinerja / Bulan ({activeCapaianItem?.satuan || '-'})
                  </label>
                  <input
                    id="ra-target"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Contoh: 100"
                    value={draftTarget}
                    onChange={(e) => setDraftTarget(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label
                    htmlFor="ra-realisasi"
                    className="mb-1 block text-xs font-medium text-slate-700"
                  >
                    Realisasi / Bulan ({activeCapaianItem?.satuan || '-'})
                  </label>
                  <input
                    id="ra-realisasi"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Angka realisasi bulan ini"
                    value={draftRealisasi}
                    onChange={(e) => setDraftRealisasi(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div className="lg:col-span-3">
                  <div className="mb-1 text-xs font-medium text-slate-700">
                    Capaian Bulan Ini (Otomatis)
                  </div>
                  <div className="flex h-[34px] items-center justify-between rounded-lg border border-slate-200 bg-white px-3">
                    <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                      {draftPreviewPct === null ? '-' : `${draftPreviewPct}%`}
                    </span>
                    <MonthStatusBadge pct={draftPreviewPct} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="ra-evaluasi"
                    className="mb-1 block text-xs font-medium text-slate-700"
                  >
                    Evaluasi Bulan {BULAN_LENGKAP[selectedBulanIdx]}
                  </label>
                  <textarea
                    id="ra-evaluasi"
                    rows={2}
                    placeholder="Catatan evaluasi capaian, kendala, atau penyebab deviasi bulan ini..."
                    value={draftEvaluasi}
                    onChange={(e) => setDraftEvaluasi(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ra-rtl"
                    className="mb-1 block text-xs font-medium text-slate-700"
                  >
                    Rencana Tindak Lanjut Bulan {BULAN_LENGKAP[selectedBulanIdx]}
                  </label>
                  <textarea
                    id="ra-rtl"
                    rows={2}
                    placeholder="Langkah perbaikan atau tindak lanjut konkret yang dijadwalkan bulan ini..."
                    value={draftRtl}
                    onChange={(e) => setDraftRtl(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {formNotice && (
              <div
                className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs ${
                  formNotice.type === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-800'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                }`}
              >
                {formNotice.type === 'error' ? (
                  <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span>{formNotice.text}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Simpan Monitoring Bulan {BULAN_LENGKAP[selectedBulanIdx]}</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Ringkasan KPI Monitoring Rencana Aksi */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="text-xs font-medium text-slate-500">
            Indikator Dimonitor
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {stats.totalIndikator}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="text-xs font-medium text-slate-500">
            Rata-Rata Capaian Bulanan
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-blue-700 tabular-nums">
            {stats.avgPct}%
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="text-xs font-medium text-slate-500">
            Bulan Tercapai (≥ 100%)
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
            {stats.achievedMonths}{' '}
            <span className="text-xs font-normal text-slate-500">
              / {stats.filledMonths} bln
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="text-xs font-medium text-slate-500">
            Evaluasi &amp; RTL Terisi
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {stats.notesMonths}{' '}
            <span className="text-xs font-normal text-slate-500">bulan</span>
          </div>
        </div>
      </div>

      {/* Tabel Monitoring Rencana Aksi Tiap Bulan (Editable Inline) */}
      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-blue-700" aria-hidden="true" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Monitoring Rencana Aksi Tiap Bulan ({filteredRaItems.length})
              </h2>
              <p className="text-xs text-slate-500">
                Ubah langsung target bulanan, realisasi, evaluasi, atau rencana tindak lanjut pada tabel; perubahan tersimpan otomatis.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <select
              aria-label="Filter Tahun Rencana Aksi"
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-slate-900 focus:border-blue-700 focus:outline-none"
            >
              <option value="Semua">Semua Tahun</option>
              {yearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter Unit Kerja Rencana Aksi"
              value={filterSubdit}
              onChange={(e) => setFilterSubdit(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-900 focus:border-blue-700 focus:outline-none"
            >
              <option value="Semua">Semua Unit Kerja</option>
              {subditOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {viewMode === 'fokus_bulan' && (
              <select
                aria-label="Pilih Bulan Fokus"
                value={tableBulanIdx}
                onChange={(e) => setTableBulanIdx(Number(e.target.value))}
                className="rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1.5 font-medium text-blue-900 focus:border-blue-700 focus:outline-none"
              >
                {BULAN_LENGKAP.map((bln, idx) => (
                  <option key={bln} value={idx}>
                    Bulan: {bln}
                  </option>
                ))}
              </select>
            )}

            <div className="inline-flex rounded-lg bg-slate-100 p-1 font-medium">
              <button
                type="button"
                onClick={() => setViewMode('fokus_bulan')}
                className={`rounded-md px-2.5 py-1 transition-colors whitespace-nowrap ${
                  viewMode === 'fokus_bulan'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Per Bulan
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matriks_12')}
                className={`rounded-md px-2.5 py-1 transition-colors whitespace-nowrap ${
                  viewMode === 'matriks_12'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                12 Bulan / IKK
              </button>
            </div>
          </div>
        </div>

        {filteredRaItems.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            Belum ada data monitoring rencana aksi untuk filter yang dipilih. Pilih Sasaran Kinerja dan Indikator Kinerja di formulir atas untuk memulai.
          </div>
        ) : viewMode === 'fokus_bulan' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-semibold min-w-[190px]">
                    Sasaran Kinerja
                  </th>
                  <th className="px-4 py-3 font-semibold min-w-[210px]">
                    Indikator Kinerja
                  </th>
                  <th className="px-3 py-3 font-semibold text-right whitespace-nowrap">
                    Target ({BULAN_LENGKAP[tableBulanIdx]})
                  </th>
                  <th className="px-3 py-3 font-semibold text-right whitespace-nowrap">
                    Realisasi ({BULAN_LENGKAP[tableBulanIdx]})
                  </th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap min-w-[110px]">
                    Capaian / Bln
                  </th>
                  <th className="px-3 py-3 font-semibold min-w-[220px]">
                    Evaluasi
                  </th>
                  <th className="px-3 py-3 font-semibold min-w-[220px]">
                    Rencana Tindak Lanjut
                  </th>
                  <th className="px-3 py-3 font-semibold text-center whitespace-nowrap">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupedMonthRows.map(({ ra, sasaranRowSpan, isGroupStart }) => {
                  const m = normalizeBulanan(ra.bulanan)[tableBulanIdx];
                  const pct =
                    m.target !== null && m.target > 0 && m.realisasi !== null
                      ? computeCapaianPct(m.target, m.realisasi)
                      : null;

                  return (
                    <tr
                      key={ra.id}
                      className={`align-top hover:bg-slate-50/60 ${
                        isGroupStart
                          ? 'border-t border-slate-200 first:border-t-0'
                          : 'border-t border-slate-100'
                      }`}
                    >
                      {sasaranRowSpan > 0 && (
                        <td
                          rowSpan={sasaranRowSpan}
                          className="border-r border-slate-100 bg-slate-50/40 px-4 py-3.5 text-slate-700"
                        >
                          {ra.nomorSasaranKinerja && (
                            <div className="font-mono text-[11px] font-semibold text-slate-800">
                              {ra.nomorSasaranKinerja}
                            </div>
                          )}
                          <div className="leading-relaxed">
                            {ra.sasaranKinerja}
                          </div>
                        </td>
                      )}

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {ra.kodeIku} · {ra.indikatorKinerja}
                        </div>
                        <div className="mt-0.5 text-[11px] text-blue-800 font-medium">
                          {ra.subdirektorat} · {ra.tahun}
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            aria-label={`Target ${BULAN_LENGKAP[tableBulanIdx]} ${ra.kodeIku}`}
                            value={m.target === null ? '' : String(m.target)}
                            onChange={(e) => {
                              const raw = e.target.value.trim();
                              const val = raw === '' ? null : Number(raw);
                              if (
                                val === null ||
                                (Number.isFinite(val) && val >= 0)
                              ) {
                                handleUpdateInlineMonth(ra.id, tableBulanIdx, {
                                  target: val,
                                });
                              }
                            }}
                            className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-right font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                          />
                          <span className="text-[11px] text-slate-500">
                            {ra.satuan}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            aria-label={`Realisasi ${BULAN_LENGKAP[tableBulanIdx]} ${ra.kodeIku}`}
                            value={
                              m.realisasi === null ? '' : String(m.realisasi)
                            }
                            onChange={(e) => {
                              const raw = e.target.value.trim();
                              const val = raw === '' ? null : Number(raw);
                              if (
                                val === null ||
                                (Number.isFinite(val) && val >= 0)
                              ) {
                                handleUpdateInlineMonth(ra.id, tableBulanIdx, {
                                  realisasi: val,
                                });
                              }
                            }}
                            className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-right font-mono text-xs font-semibold text-slate-900 focus:border-blue-700 focus:outline-none"
                          />
                          <span className="text-[11px] text-slate-500">
                            {ra.satuan}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                          {pct === null ? '-' : `${pct}%`}
                        </div>
                        <div className="mt-0.5">
                          <MonthStatusBadge pct={pct} />
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <textarea
                          rows={2}
                          aria-label={`Evaluasi ${BULAN_LENGKAP[tableBulanIdx]} ${ra.kodeIku}`}
                          placeholder="Tulis evaluasi bulan ini..."
                          value={m.evaluasi}
                          onChange={(e) =>
                            handleUpdateInlineMonth(ra.id, tableBulanIdx, {
                              evaluasi: e.target.value,
                            })
                          }
                          className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                        />
                      </td>

                      <td className="px-3 py-3.5">
                        <textarea
                          rows={2}
                          aria-label={`Rencana Tindak Lanjut ${BULAN_LENGKAP[tableBulanIdx]} ${ra.kodeIku}`}
                          placeholder="Tulis rencana tindak lanjut bulan ini..."
                          value={m.rencanaTindakLanjut}
                          onChange={(e) =>
                            handleUpdateInlineMonth(ra.id, tableBulanIdx, {
                              rencanaTindakLanjut: e.target.value,
                            })
                          }
                          className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                        />
                      </td>

                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedItemId(ra.id);
                              setViewMode('matriks_12');
                            }}
                            className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50"
                          >
                            12 Bln
                          </button>
                          <button
                            type="button"
                            aria-label={`Hapus rencana aksi ${ra.kodeIku}`}
                            onClick={() => handleDeleteRaItem(ra)}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredRaItems.map((ra) => {
              const bulanan = normalizeBulanan(ra.bulanan);
              const isOpen = expandedItemId === ra.id;
              const filledPairs = bulanan.filter(
                (m) => m.target !== null && m.target > 0 && m.realisasi !== null
              );
              const avgPct =
                filledPairs.length > 0
                  ? Math.round(
                      (filledPairs.reduce(
                        (acc, m) =>
                          acc +
                          computeCapaianPct(
                            m.target as number,
                            m.realisasi as number
                          ),
                        0
                      ) /
                        filledPairs.length) *
                        10
                    ) / 10
                  : null;

              return (
                <div key={ra.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 px-6 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedItemId(isOpen ? null : ra.id)
                      }
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <span className="mt-0.5 text-slate-500">
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0 space-y-0.5 text-xs">
                        <div className="text-[11px] font-medium text-blue-800">
                          {ra.subdirektorat} · Tahun {ra.tahun}
                        </div>
                        <div className="font-semibold text-slate-900">
                          {ra.kodeIku} — {ra.indikatorKinerja}
                        </div>
                        <div className="text-slate-600">
                          <span className="font-medium text-slate-700">
                            Sasaran Kinerja:
                          </span>{' '}
                          {ra.nomorSasaranKinerja
                            ? `${ra.nomorSasaranKinerja} · `
                            : ''}
                          {ra.sasaranKinerja}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-right font-mono tabular-nums">
                        <div className="font-bold text-slate-900">
                          {avgPct === null ? '-' : `${avgPct}%`}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Rata-rata ({filledPairs.length}/12 bln)
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Hapus rencana aksi ${ra.kodeIku}`}
                        onClick={() => handleDeleteRaItem(ra)}
                        className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="overflow-x-auto border-t border-slate-100">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                            <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
                              Bulan
                            </th>
                            <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">
                              Target / Bulan ({ra.satuan})
                            </th>
                            <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">
                              Realisasi / Bulan ({ra.satuan})
                            </th>
                            <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                              Capaian / Bulan
                            </th>
                            <th className="px-3 py-2.5 font-semibold min-w-[230px]">
                              Evaluasi
                            </th>
                            <th className="px-5 py-2.5 font-semibold min-w-[230px]">
                              Rencana Tindak Lanjut
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {BULAN_LENGKAP.map((bln, mIdx) => {
                            const m = bulanan[mIdx];
                            const pct =
                              m.target !== null &&
                              m.target > 0 &&
                              m.realisasi !== null
                                ? computeCapaianPct(m.target, m.realisasi)
                                : null;

                            return (
                              <tr key={bln} className="align-top hover:bg-slate-50/50">
                                <td className="px-5 py-2.5 font-semibold text-slate-800 whitespace-nowrap">
                                  {bln}
                                </td>
                                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    aria-label={`Target ${bln} ${ra.kodeIku}`}
                                    value={
                                      m.target === null ? '' : String(m.target)
                                    }
                                    onChange={(e) => {
                                      const raw = e.target.value.trim();
                                      const val =
                                        raw === '' ? null : Number(raw);
                                      if (
                                        val === null ||
                                        (Number.isFinite(val) && val >= 0)
                                      ) {
                                        handleUpdateInlineMonth(ra.id, mIdx, {
                                          target: val,
                                        });
                                      }
                                    }}
                                    className="w-24 rounded border border-slate-200 bg-white px-2 py-1 text-right font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    aria-label={`Realisasi ${bln} ${ra.kodeIku}`}
                                    value={
                                      m.realisasi === null
                                        ? ''
                                        : String(m.realisasi)
                                    }
                                    onChange={(e) => {
                                      const raw = e.target.value.trim();
                                      const val =
                                        raw === '' ? null : Number(raw);
                                      if (
                                        val === null ||
                                        (Number.isFinite(val) && val >= 0)
                                      ) {
                                        handleUpdateInlineMonth(ra.id, mIdx, {
                                          realisasi: val,
                                        });
                                      }
                                    }}
                                    className="w-24 rounded border border-slate-200 bg-white px-2 py-1 text-right font-mono text-xs font-semibold text-slate-900 focus:border-blue-700 focus:outline-none"
                                  />
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <div className="flex items-center gap-2 font-mono font-bold tabular-nums text-slate-900">
                                    <span>
                                      {pct === null
                                        ? '-'
                                        : `${formatNumberId(pct)}%`}
                                    </span>
                                    <MonthStatusBadge pct={pct} />
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <textarea
                                    rows={2}
                                    aria-label={`Evaluasi ${bln} ${ra.kodeIku}`}
                                    placeholder="Evaluasi bulan ini..."
                                    value={m.evaluasi}
                                    onChange={(e) =>
                                      handleUpdateInlineMonth(ra.id, mIdx, {
                                        evaluasi: e.target.value,
                                      })
                                    }
                                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                                  />
                                </td>
                                <td className="px-5 py-2.5">
                                  <textarea
                                    rows={2}
                                    aria-label={`Rencana Tindak Lanjut ${bln} ${ra.kodeIku}`}
                                    placeholder="Rencana tindak lanjut bulan ini..."
                                    value={m.rencanaTindakLanjut}
                                    onChange={(e) =>
                                      handleUpdateInlineMonth(ra.id, mIdx, {
                                        rencanaTindakLanjut: e.target.value,
                                      })
                                    }
                                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

import { CapaianCalcMode, CapaianKinerjaItem } from '../types/kinerja';

export const BULAN_SINGKAT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;

export const BULAN_LENGKAP = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export function createEmptyMonthlyArray(): Array<number | null> {
  return Array.from({ length: 12 }, () => null);
}

export function normalizeMonthlyArray(
  arr?: Array<number | null>
): Array<number | null> {
  const base = createEmptyMonthlyArray();
  if (!Array.isArray(arr)) return base;
  for (let i = 0; i < 12; i++) {
    const val = arr[i];
    base[i] =
      typeof val === 'number' && Number.isFinite(val) ? val : null;
  }
  return base;
}

export function getCalcMode(item: CapaianKinerjaItem): CapaianCalcMode {
  if (
    item.jenisPerhitungan === 'akumulasi' ||
    item.jenisPerhitungan === 'tetap' ||
    item.jenisPerhitungan === 'nilai'
  ) {
    return item.jenisPerhitungan;
  }
  return item.satuan.trim() === '%' ? 'tetap' : 'akumulasi';
}

export function computeEffectiveRealisasi(item: CapaianKinerjaItem): {
  realisasi: number;
  filledMonths: number;
  fromMonthly: boolean;
} {
  const monthly = normalizeMonthlyArray(item.realisasiBulanan);
  const filledValues = monthly.filter((v): v is number => v !== null);

  if (filledValues.length === 0) {
    return {
      realisasi: Number.isFinite(item.realisasi) ? item.realisasi : 0,
      filledMonths: 0,
      fromMonthly: false,
    };
  }

  const sum = filledValues.reduce((acc, v) => acc + v, 0);
  const mode = getCalcMode(item);

  if (mode === 'akumulasi') {
    return {
      realisasi: Math.round(sum * 100) / 100,
      filledMonths: filledValues.length,
      fromMonthly: true,
    };
  }

  if (mode === 'nilai') {
    return {
      realisasi: Math.round((sum / filledValues.length) * 100) / 100,
      filledMonths: filledValues.length,
      fromMonthly: true,
    };
  }

  return {
    realisasi: Math.round((sum / filledValues.length) * 10) / 10,
    filledMonths: filledValues.length,
    fromMonthly: true,
  };
}

export function computeCapaianPct(target: number, realisasi: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0;
  return Math.round((realisasi / target) * 1000) / 10;
}

export function computeMonthlyTarget(item: CapaianKinerjaItem): number {
  if (!Number.isFinite(item.target) || item.target <= 0) return 0;
  const mode = getCalcMode(item);
  if (mode === 'akumulasi') {
    return Math.round((item.target / 12) * 100) / 100;
  }
  return item.target;
}

export function computeMonthlyCapaianPct(
  item: CapaianKinerjaItem,
  monthIndex: number
): number | null {
  const monthly = normalizeMonthlyArray(item.realisasiBulanan);
  const val = monthly[monthIndex];
  if (val === null) return null;
  const monthTarget = computeMonthlyTarget(item);
  if (monthTarget <= 0) return 0;
  return Math.round((val / monthTarget) * 1000) / 10;
}

export function getItemYear(item: CapaianKinerjaItem): string {
  const explicit = item.tahun?.trim();
  if (explicit) return explicit;
  const match = item.periode?.match(/\b(20\d{2})\b/);
  return match ? match[1] : '2026';
}

export function computeFocusedMetrics(
  item: CapaianKinerjaItem,
  focusMonthIdx: number | null
): {
  target: number;
  realisasi: number | null;
  selisih: number | null;
  capaianPct: number | null;
  isMonthlyTargetProportional: boolean;
} {
  const mode = getCalcMode(item);

  if (focusMonthIdx === null) {
    const eff = computeEffectiveRealisasi(item);
    const pct = computeCapaianPct(item.target, eff.realisasi);
    const selisih = Math.round((eff.realisasi - item.target) * 100) / 100;
    return {
      target: item.target,
      realisasi: eff.realisasi,
      selisih,
      capaianPct: pct,
      isMonthlyTargetProportional: false,
    };
  }

  const monthly = normalizeMonthlyArray(item.realisasiBulanan);
  const val = monthly[focusMonthIdx];
  const monthTarget = computeMonthlyTarget(item);

  if (val === null) {
    return {
      target: monthTarget,
      realisasi: null,
      selisih: null,
      capaianPct: null,
      isMonthlyTargetProportional: mode === 'akumulasi',
    };
  }

  const pct =
    monthTarget > 0 ? Math.round((val / monthTarget) * 1000) / 10 : 0;
  const selisih = Math.round((val - monthTarget) * 100) / 100;

  return {
    target: monthTarget,
    realisasi: val,
    selisih,
    capaianPct: pct,
    isMonthlyTargetProportional: mode === 'akumulasi',
  };
}


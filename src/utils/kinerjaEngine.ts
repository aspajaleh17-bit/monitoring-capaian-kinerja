import {
  DocumentAuditItem,
  EscalationItem,
  MissingInputStatus,
  MonitoringReport,
  ReminderStage,
  RequiredDocument,
  SecurityAlert,
  SignatureStatus,
  SubdirektoratReminderState,
  SubdirektoratStatus,
  SubdirektoratSummaryRow,
  SubmittedDocument,
} from '../types/kinerja';

const BULAN_ID = [
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
];

const BULAN_MAP: Record<string, number> = {
  januari: 1,
  jan: 1,
  februari: 2,
  feb: 2,
  maret: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  juni: 6,
  jun: 6,
  juli: 7,
  jul: 7,
  agustus: 8,
  agu: 8,
  agt: 8,
  september: 9,
  sep: 9,
  sept: 9,
  oktober: 10,
  okt: 10,
  november: 11,
  nov: 11,
  desember: 12,
  des: 12,
};

export function generateId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isValidIsoDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function parseFlexibleDate(raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) return '';
  if (isValidIsoDate(cleaned)) return cleaned;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    const candidate = `${year}-${month}-${day}`;
    return isValidIsoDate(candidate) ? candidate : '';
  }

  // DD Month YYYY (Indonesian)
  const indMatch = cleaned.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  if (indMatch) {
    const day = indMatch[1].padStart(2, '0');
    const monthNum = BULAN_MAP[indMatch[2]];
    const year = indMatch[3];
    if (monthNum) {
      const candidate = `${year}-${String(monthNum).padStart(2, '0')}-${day}`;
      return isValidIsoDate(candidate) ? candidate : '';
    }
  }

  return '';
}

export function formatTanggalIndonesia(isoDate: string): string {
  if (!isValidIsoDate(isoDate)) {
    return isoDate.trim() ? isoDate : 'tidak ada di data yang diberikan';
  }
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d} ${BULAN_ID[m - 1]} ${y}`;
}

export function diffDaysIso(targetIso: string, todayIso: string): number | null {
  if (!isValidIsoDate(targetIso) || !isValidIsoDate(todayIso)) return null;
  const [ty, tm, td] = targetIso.split('-').map(Number);
  const [cy, cm, cd] = todayIso.split('-').map(Number);
  const targetUtc = Date.UTC(ty, tm - 1, td);
  const todayUtc = Date.UTC(cy, cm - 1, cd);
  return Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

export function formatSisaHari(sisaHari: number | null): string {
  if (sisaHari === null) return 'tidak ada di data yang diberikan';
  if (sisaHari === 0) return '0 hari (hari ini tenggat)';
  if (sisaHari > 0) return `${sisaHari} hari lagi`;
  return `Terlewat ${Math.abs(sisaHari)} hari`;
}

// Mandatory PII, sensitive financial/contract, and classified doc scanner
const SENSITIVE_PATTERNS: Array<{
  regex: RegExp;
  kategori: SecurityAlert['kategori'];
  label: string;
}> = [
  { regex: /\b\d{16}\b/, kategori: 'Data Pribadi', label: 'Nomor 16 digit (indikasi NIK)' },
  { regex: /\bnik\b/i, kategori: 'Data Pribadi', label: 'NIK' },
  { regex: /\bno\.?\s*kk\b/i, kategori: 'Data Pribadi', label: 'Nomor Kartu Keluarga' },
  { regex: /\bnpwp\b/i, kategori: 'Data Pribadi', label: 'NPWP' },
  { regex: /\balamat\s*(rumah|pribadi|domisili)\b/i, kategori: 'Data Pribadi', label: 'Alamat pribadi' },
  { regex: /\b(rekam\s*medis|riwayat\s*kesehatan|diagnosa|penyakit)\b/i, kategori: 'Data Pribadi', label: 'Data kesehatan' },
  { regex: /\b(data\s*kepegawaian|sk\s*kenaikan\s*pangkat|dp3|skp\s*individu)\b/i, kategori: 'Data Pribadi', label: 'Data kepegawaian individu' },
  { regex: /\b(slip\s*gaji|nomor\s*rekening|no\.?\s*rek|honorarium\s*pribadi)\b/i, kategori: 'Keuangan/Kontrak Sensitif', label: 'Data keuangan pribadi' },
  { regex: /\b(nilai\s*kontrak|hps\s*rahasia|dokumen\s*lelang\s*terbatas|addendum\s*kontrak\s*sensitif)\b/i, kategori: 'Keuangan/Kontrak Sensitif', label: 'Data kontrak sensitif' },
  { regex: /\b(sangat\s*rahasia|rahasia|klasifikasi\s*terbatas|dokumen\s*terbatas|confidential|restricted)\b/i, kategori: 'Klasifikasi Rahasia/Terbatas', label: 'Klasifikasi terbatas/rahasia' },
];

export function scanForSensitiveData(
  requiredDocs: RequiredDocument[],
  submittedDocs: SubmittedDocument[],
  rawBulkText = ''
): SecurityAlert[] {
  const alerts: SecurityAlert[] = [];
  const seenKeys = new Set<string>();

  const checkText = (text: string, sumber: string) => {
    if (!text.trim()) return;
    for (const rule of SENSITIVE_PATTERNS) {
      const match = text.match(rule.regex);
      if (match) {
        const key = `${sumber}:${rule.label}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        alerts.push({
          id: generateId('sec'),
          sumber,
          kategori: rule.kategori,
          kataKunci: rule.label,
          detail: `Terdeteksi indikasi "${rule.label}" pada ${sumber}. Hapus data tersebut terlebih dahulu sebelum diproses.`,
        });
      }
    }
  };

  requiredDocs.forEach((doc, idx) => {
    checkText(
      `${doc.subdirektorat} ${doc.namaDokumen} ${doc.formatWajib}`,
      `Daftar Wajib baris ${idx + 1} (${doc.namaDokumen || 'tanpa nama'})`
    );
  });

  submittedDocs.forEach((doc, idx) => {
    checkText(
      `${doc.subdirektorat} ${doc.namaDokumen} ${doc.catatan}`,
      `Data Masuk baris ${idx + 1} (${doc.namaDokumen || 'tanpa nama'})`
    );
  });

  if (rawBulkText.trim()) {
    checkText(rawBulkText, 'Teks tempelan masukan');
  }

  return alerts;
}

function splitRowColumns(line: string): string[] {
  if (line.includes('\t')) {
    return line.split('\t').map((c) => c.trim());
  }
  if (line.includes('|')) {
    return line
      .split('|')
      .map((c) => c.trim())
      .filter((c, i, arr) => !(i === 0 && c === '') && !(i === arr.length - 1 && c === ''));
  }
  if (line.includes(';')) {
    return line.split(';').map((c) => c.trim());
  }
  return line.split(',').map((c) => c.trim());
}

function isHeaderRow(cols: string[], keywords: string[]): boolean {
  const joined = cols.join(' ').toLowerCase();
  const hits = keywords.filter((kw) => joined.includes(kw));
  return hits.length >= 2;
}

export function parseBulkRequiredText(
  rawText: string,
  defaultTenggat = ''
): { items: RequiredDocument[]; skippedLines: number } {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^[-=|\s]+$/.test(l));

  const items: RequiredDocument[] = [];
  let skippedLines = 0;

  for (const line of lines) {
    const cols = splitRowColumns(line);
    if (isHeaderRow(cols, ['subdirektorat', 'subdit', 'dokumen', 'wajib', 'tenggat', 'format'])) {
      continue;
    }
    if (cols.length < 2) {
      skippedLines++;
      continue;
    }

    const subdirektorat = cols[0] || '';
    const namaDokumen = cols[1] || '';
    const formatWajib = cols[2] || '';
    const ttdRaw = (cols[3] || '').toLowerCase();
    const perluTandaTangan =
      ttdRaw.includes('ya') ||
      ttdRaw.includes('wajib') ||
      ttdRaw.includes('ttd') ||
      ttdRaw === 'true';

    const parsedDate = cols[4] ? parseFlexibleDate(cols[4]) : '';
    const tenggat = parsedDate || (isValidIsoDate(defaultTenggat) ? defaultTenggat : '');

    items.push({
      id: generateId('req'),
      subdirektorat,
      namaDokumen,
      formatWajib,
      perluTandaTangan,
      tenggat,
    });
  }

  return { items, skippedLines };
}

export function parseBulkSubmittedText(rawText: string): {
  items: SubmittedDocument[];
  skippedLines: number;
} {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^[-=|\s]+$/.test(l));

  const items: SubmittedDocument[] = [];
  let skippedLines = 0;

  for (const line of lines) {
    const cols = splitRowColumns(line);
    if (isHeaderRow(cols, ['subdirektorat', 'subdit', 'dokumen', 'tanggal', 'periode', 'tanda tangan'])) {
      continue;
    }
    if (cols.length < 2) {
      skippedLines++;
      continue;
    }

    const subdirektorat = cols[0] || '';
    const namaDokumen = cols[1] || '';
    const tanggalRaw = cols[2] || '';
    const tanggalParsed = parseFlexibleDate(tanggalRaw);
    const tanggalMasuk = tanggalParsed || tanggalRaw;
    const periode = cols[3] || '';
    const format = cols[4] || '';
    const ttdRaw = (cols[5] || '').toLowerCase();
    let statusTandaTangan: SignatureStatus = 'Tidak Ada Info';
    if (
      ttdRaw.includes('sudah') ||
      ttdRaw.includes('bertanda tangan') ||
      ttdRaw === 'ya' ||
      ttdRaw === 'ttd'
    ) {
      statusTandaTangan = 'Sudah TTD';
    } else if (ttdRaw.includes('belum') || ttdRaw === 'tidak') {
      statusTandaTangan = 'Belum TTD';
    }
    const catatan = cols[6] || '';

    items.push({
      id: generateId('sub'),
      subdirektorat,
      namaDokumen,
      tanggalMasuk,
      periode,
      format,
      statusTandaTangan,
      catatan,
    });
  }

  return { items, skippedLines };
}

function docMatchScore(requiredName: string, submittedName: string): 'exact' | 'partial' | 'none' {
  const reqNorm = normalizeText(requiredName);
  const subNorm = normalizeText(submittedName);
  if (!reqNorm || !subNorm) return 'none';
  if (reqNorm === subNorm) return 'exact';

  // Compare core tokens to spot partial / ambiguous matches
  const reqTokens = reqNorm.split(' ').filter((t) => t.length > 2);
  const subTokens = subNorm.split(' ').filter((t) => t.length > 2);
  if (reqTokens.length === 0 || subTokens.length === 0) return 'none';

  const overlap = reqTokens.filter((t) => subTokens.includes(t)).length;
  const ratio = overlap / Math.max(reqTokens.length, subTokens.length);
  if (reqNorm.includes(subNorm) || subNorm.includes(reqNorm) || ratio >= 0.6) {
    return 'partial';
  }
  return 'none';
}

function countSentences(text: string): number {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length;
}

function buildReminderDraft(params: {
  subdirektorat: string;
  missingOrIncompleteItems: string[];
  tenggatIso: string | null;
  sisaHari: number | null;
  status: SubdirektoratStatus;
}): { stage: ReminderStage; draft: string | null; kalimatCount: number } {
  const { subdirektorat, missingOrIncompleteItems, tenggatIso, sisaHari, status } = params;

  if (status === 'Sudah lengkap menurut daftar') {
    return { stage: 'Tidak perlu', draft: null, kalimatCount: 0 };
  }

  const daftarKekurangan =
    missingOrIncompleteItems.length > 0
      ? missingOrIncompleteItems.join('; ')
      : 'data dukung kinerja sesuai daftar wajib';
  const tenggatLabel = tenggatIso
    ? formatTanggalIndonesia(tenggatIso)
    : 'batas waktu yang telah ditetapkan';

  let stage: ReminderStage = 'Awal bulan (pembuka)';
  let sentences: string[] = [];

  if (sisaHari !== null && sisaHari < 0) {
    stage = 'Tenggat terlewat (permintaan segera)';
    sentences = [
      `Yth. Bapak/Ibu Tim PIC Data ${subdirektorat}, semoga dalam keadaan sehat dan lancar bertugas.`,
      `Berdasarkan pencatatan tim pelaporan kinerja Direktorat Sarana Perkeretaapian, batas waktu penyampaian data dukung pada ${tenggatLabel} telah terlewat ${Math.abs(sisaHari)} hari.`,
      `Saat ini kami masih memerlukan pemenuhan dokumen berikut: ${daftarKekurangan}.`,
      `Mohon kesediaan Bapak/Ibu untuk segera menyampaikan atau melengkapi data tersebut agar laporan kepatuhan Direktorat dapat segera difinalisasi.`,
      `Terima kasih banyak atas perhatian dan kerja sama baiknya.`,
    ];
  } else if (sisaHari !== null && sisaHari <= 3) {
    stage = 'Mendekati tenggat (peringatan)';
    const sisaText =
      sisaHari === 0 ? 'jatuh pada hari ini' : `tinggal ${sisaHari} hari lagi`;
    sentences = [
      `Yth. Bapak/Ibu Tim PIC Data ${subdirektorat}, salam hormat dari tim pelaporan kinerja Direktorat Sarana Perkeretaapian.`,
      `Kami ingin mengingatkan dengan hormat bahwa tenggat pengumpulan data dukung (${tenggatLabel}) ${sisaText}.`,
      `Untuk melengkapi data ${subdirektorat}, masih diperlukan dokumen/perbaikan berikut: ${daftarKekurangan}.`,
      `Kami mohon bantuannya agar dokumen tersebut dapat disampaikan sebelum tenggat guna menjaga ketepatan pelaporan Direktorat.`,
      `Terima kasih atas dukungan dan koordinasi Bapak/Ibu.`,
    ];
  } else {
    stage = 'Awal bulan (pembuka)';
    sentences = [
      `Yth. Bapak/Ibu Tim PIC Data ${subdirektorat}, salam hangat dari tim pelaporan kinerja Direktorat Sarana Perkeretaapian.`,
      `Bersama ini kami sampaikan pengingat awal periode untuk penyampaian data dukung kinerja dengan batas waktu ${tenggatLabel}.`,
      `Adapun data dukung yang masih perlu dilengkapi saat ini meliputi: ${daftarKekurangan}.`,
      `Apabila dokumen sudah siap sebelum tenggat, mohon dapat segera disampaikan kepada tim pelaporan kinerja.`,
      `Terima kasih atas kerja sama dan perhatian Bapak/Ibu.`,
    ];
  }

  const draft = sentences.join(' ');
  return {
    stage,
    draft,
    kalimatCount: countSentences(draft),
  };
}

export function evaluateKinerjaData(params: {
  requiredDocs: RequiredDocument[];
  submittedDocs: SubmittedDocument[];
  tanggalHariIni: string;
  periodeTarget: string;
  submittedConfirmedWhenEmpty: boolean;
  reminderStates: SubdirektoratReminderState[];
  rawBulkText?: string;
}): MonitoringReport {
  const {
    requiredDocs,
    submittedDocs,
    tanggalHariIni,
    periodeTarget,
    submittedConfirmedWhenEmpty,
    reminderStates,
    rawBulkText = '',
  } = params;

  const missingMessages: string[] = [];
  const missingRequiredList = requiredDocs.length === 0;
  const missingTodayDate = !isValidIsoDate(tanggalHariIni);
  const missingTargetPeriod = !periodeTarget.trim();
  const missingSubmittedConfirmation =
    submittedDocs.length === 0 && !submittedConfirmedWhenEmpty;

  if (missingRequiredList) {
    missingMessages.push(
      'Daftar data dukung wajib per subdirektorat dan tenggatnya belum tersedia.'
    );
  }
  if (missingSubmittedConfirmation) {
    missingMessages.push(
      'Daftar data dukung yang sudah masuk belum diisi (atau konfirmasi bahwa memang belum ada kiriman masuk).'
    );
  }
  if (missingTodayDate) {
    missingMessages.push('Tanggal hari ini belum diisi dengan format tanggal yang valid.');
  }
  if (missingTargetPeriod) {
    missingMessages.push('Periode laporan target (mis. November 2026) belum ditentukan.');
  }

  const missingInput: MissingInputStatus = {
    missingRequiredList,
    missingSubmittedConfirmation,
    missingTodayDate,
    missingTargetPeriod,
    isComplete: missingMessages.length === 0,
    missingMessages,
  };

  const securityAlerts = scanForSensitiveData(requiredDocs, submittedDocs, rawBulkText);
  const blockedBySecurity = securityAlerts.length > 0;

  const tanggalFormatted = formatTanggalIndonesia(tanggalHariIni);

  // If missing required inputs or blocked by security, return early with clear state
  if (!missingInput.isComplete || blockedBySecurity) {
    const escalations: EscalationItem[] = securityAlerts.map((alert) => ({
      id: generateId('esc'),
      subdirektorat: 'Seluruh Masukan',
      nomorKondisi: 4,
      labelKondisi: 'Data pribadi / rahasia / terlarang terdeteksi',
      alasan: alert.detail,
    }));

    const ringkasanBaris: [string, string, string] = blockedBySecurity
      ? [
          `Tanggal pemantauan: ${tanggalFormatted} · Periode: ${periodeTarget || 'tidak ada di data yang diberikan'}.`,
          `Proses dihentikan sementara karena terdeteksi ${securityAlerts.length} indikasi data pribadi, keuangan sensitif, atau klasifikasi rahasia/terbatas.`,
          `Harap hapus data sensitif tersebut terlebih dahulu sebelum melanjutkan pemantauan.`,
        ]
      : [
          `Tanggal pemantauan: ${tanggalFormatted} · Periode: ${periodeTarget || 'tidak ada di data yang diberikan'}.`,
          `Pemantauan belum dapat dijalankan karena masukan wajib belum lengkap.`,
          `Mohon lengkapi: ${missingMessages.join(' ')}`,
        ];

    return {
      missingInput,
      securityAlerts,
      blockedBySecurity,
      tanggalHariIni,
      tanggalHariIniFormatted: tanggalFormatted,
      periodeTarget,
      ringkasanBaris,
      counts: { totalSubdit: 0, lengkap: 0, kurang: 0, belumKirim: 0 },
      subdirektoratRows: [],
      escalations,
      formattedMarkdownReport: buildMarkdownReport({
        ringkasanBaris,
        rows: [],
        escalations,
      }),
    };
  }

  // Group required docs by Subdirektorat
  const subditNamesOrder: string[] = [];
  const reqBySubdit = new Map<string, RequiredDocument[]>();

  for (const req of requiredDocs) {
    const name = req.subdirektorat.trim() || 'Subdirektorat Tidak Disebutkan';
    if (!reqBySubdit.has(name)) {
      reqBySubdit.set(name, []);
      subditNamesOrder.push(name);
    }
    reqBySubdit.get(name)!.push(req);
  }

  // Also check submitted docs whose subdirektorat doesn't appear in requiredDocs
  const subBySubdit = new Map<string, SubmittedDocument[]>();
  const orphanSubmittedDocs: SubmittedDocument[] = [];

  for (const sub of submittedDocs) {
    const subNameNorm = normalizeText(sub.subdirektorat);
    const matchedSubdit = subditNamesOrder.find(
      (s) => normalizeText(s) === subNameNorm
    );
    if (matchedSubdit) {
      if (!subBySubdit.has(matchedSubdit)) subBySubdit.set(matchedSubdit, []);
      subBySubdit.get(matchedSubdit)!.push(sub);
    } else {
      orphanSubmittedDocs.push(sub);
    }
  }

  const escalations: EscalationItem[] = [];
  const subdirektoratRows: SubdirektoratSummaryRow[] = [];

  const reminderCountMap = new Map<string, number>();
  for (const r of reminderStates) {
    reminderCountMap.set(normalizeText(r.subdirektorat), r.pengingatTerkirim);
  }

  // Handle orphan submitted docs (Subdirektorat tidak ada di daftar wajib -> kondisi 4 / kondisi 7)
  for (const orphan of orphanSubmittedDocs) {
    const catLower = orphan.catatan.toLowerCase();
    const isMisrouted =
      catLower.includes('salah kirim') ||
      catLower.includes('keliru') ||
      catLower.includes('bocor');
    escalations.push({
      id: generateId('esc'),
      subdirektorat: orphan.subdirektorat || 'Tidak diketahui',
      nomorKondisi: isMisrouted ? 7 : 4,
      labelKondisi: isMisrouted
        ? 'Dugaan salah kirim atau kebocoran data'
        : 'Dokumen di luar daftar wajib',
      alasan: `Dokumen "${orphan.namaDokumen || 'tanpa nama'}" tercatat atas nama "${orphan.subdirektorat || 'tidak ada di data yang diberikan'}" yang tidak tercantum dalam daftar subdirektorat wajib.`,
    });
  }

  for (const subdit of subditNamesOrder) {
    const reqList = reqBySubdit.get(subdit) || [];
    const subList = subBySubdit.get(subdit) || [];
    const pengingatTerkirim = reminderCountMap.get(normalizeText(subdit)) ?? 0;

    const matchedSubIds = new Set<string>();
    const auditItems: DocumentAuditItem[] = [];
    const missingOrIncompleteDescriptions: string[] = [];

    // Check unreadability / anomalies on submitted rows for this subdit
    for (const sub of subList) {
      if (!sub.namaDokumen.trim() || sub.namaDokumen.includes('???')) {
        escalations.push({
          id: generateId('esc'),
          subdirektorat: subdit,
          nomorKondisi: 2,
          labelKondisi: 'Data tampak janggal atau tidak terbaca',
          alasan: `Ada baris data masuk untuk ${subdit} yang nama dokumennya kosong atau tidak terbaca.`,
        });
      }
      const parsedTglMasuk = parseFlexibleDate(sub.tanggalMasuk);
      if (sub.tanggalMasuk.trim() && !parsedTglMasuk) {
        escalations.push({
          id: generateId('esc'),
          subdirektorat: subdit,
          nomorKondisi: 2,
          labelKondisi: 'Data tampak janggal atau tidak terbaca',
          alasan: `Dokumen "${sub.namaDokumen}" memiliki format tanggal masuk "${sub.tanggalMasuk}" yang tidak terbaca sebagai tanggal valid.`,
        });
      } else if (parsedTglMasuk && isValidIsoDate(tanggalHariIni) && parsedTglMasuk > tanggalHariIni) {
        escalations.push({
          id: generateId('esc'),
          subdirektorat: subdit,
          nomorKondisi: 2,
          labelKondisi: 'Data tampak janggal atau saling bertentangan',
          alasan: `Dokumen "${sub.namaDokumen}" tercatat masuk pada ${formatTanggalIndonesia(parsedTglMasuk)}, melampaui tanggal hari ini (${tanggalFormatted}).`,
        });
      }

      const noteLower = sub.catatan.toLowerCase();
      if (
        noteLower.includes('pengecualian') ||
        noteLower.includes('belum tersedia') ||
        noteLower.includes('dispensasi') ||
        noteLower.includes('kendala') ||
        noteLower.includes('minta waktu')
      ) {
        escalations.push({
          id: generateId('esc'),
          subdirektorat: subdit,
          nomorKondisi: 5,
          labelKondisi: 'Permintaan pengecualian / data belum tersedia',
          alasan: `Pada dokumen "${sub.namaDokumen}", tercatat keterangan: "${sub.catatan}".`,
        });
      }

      if (
        noteLower.includes('salah kirim') ||
        noteLower.includes('bocor') ||
        noteLower.includes('kebocoran') ||
        noteLower.includes('keliru subdit')
      ) {
        escalations.push({
          id: generateId('esc'),
          subdirektorat: subdit,
          nomorKondisi: 7,
          labelKondisi: 'Dugaan salah kirim atau kebocoran data',
          alasan: `Pada dokumen "${sub.namaDokumen}", tercatat indikasi salah kirim/kebocoran: "${sub.catatan}".`,
        });
      }
    }

    // Evaluate each required document
    for (const req of reqList) {
      const candidates = subList
        .map((sub) => ({
          sub,
          score: docMatchScore(req.namaDokumen, sub.namaDokumen),
        }))
        .filter((x) => x.score !== 'none');

      // Prefer exact match, else partial
      const exactMatches = candidates.filter((c) => c.score === 'exact');
      const selectedMatches = exactMatches.length > 0 ? exactMatches : candidates;

      if (selectedMatches.length > 1) {
        // Check if contradictory submissions exist
        const ttdSet = new Set(selectedMatches.map((m) => m.sub.statusTandaTangan));
        const periodeSet = new Set(selectedMatches.map((m) => normalizeText(m.sub.periode)));
        if (ttdSet.size > 1 || periodeSet.size > 1) {
          escalations.push({
            id: generateId('esc'),
            subdirektorat: subdit,
            nomorKondisi: 2,
            labelKondisi: 'Data tampak janggal atau saling bertentangan',
            alasan: `Terdapat ${selectedMatches.length} entri kiriman untuk dokumen "${req.namaDokumen}" dengan status tanda tangan atau periode yang saling bertentangan.`,
          });
        }
      }

      const bestMatch = selectedMatches[0] || null;

      if (!bestMatch) {
        auditItems.push({
          id: generateId('aud'),
          requiredDoc: req,
          matchedSubmittedDoc: null,
          outcome: 'Belum Ada',
          checks: {
            ada: false,
            sesuaiPeriode: 'Tidak diketahui',
            sesuaiFormat: 'Tidak diketahui',
            sudahTtd: req.perluTandaTangan ? false : 'Tidak wajib',
          },
          alasan: `Dokumen wajib "${req.namaDokumen}" belum ditemukan pada daftar data yang masuk.`,
        });
        missingOrIncompleteDescriptions.push(`${req.namaDokumen} (belum masuk)`);
        continue;
      }

      const sub = bestMatch.sub;
      matchedSubIds.add(sub.id);

      const isPartialName = bestMatch.score === 'partial';
      const periodeTrim = sub.periode.trim();
      const sesuaiPeriode: boolean | 'Tidak diketahui' = !periodeTrim
        ? 'Tidak diketahui'
        : normalizeText(periodeTrim) === normalizeText(periodeTarget) ||
            normalizeText(periodeTrim).includes(normalizeText(periodeTarget));

      const formatWajibTrim = req.formatWajib.trim();
      const subFormatTrim = sub.format.trim();
      let sesuaiFormat: boolean | 'Tidak diketahui' = true;
      if (formatWajibTrim && normalizeText(formatWajibTrim) !== 'bebas') {
        if (!subFormatTrim) {
          sesuaiFormat = 'Tidak diketahui';
        } else {
          sesuaiFormat = normalizeText(subFormatTrim) === normalizeText(formatWajibTrim);
        }
      }

      let sudahTtd: boolean | 'Tidak wajib' | 'Tidak diketahui' = 'Tidak wajib';
      if (req.perluTandaTangan) {
        if (sub.statusTandaTangan === 'Sudah TTD') sudahTtd = true;
        else if (sub.statusTandaTangan === 'Belum TTD') sudahTtd = false;
        else sudahTtd = 'Tidak diketahui';
      }

      const reasons: string[] = [];
      let outcome: DocumentAuditItem['outcome'] = 'Sesuai';

      if (isPartialName) {
        reasons.push(
          `Nama dokumen masuk "${sub.namaDokumen}" hanya cocok sebagian dengan daftar wajib "${req.namaDokumen}"`
        );
        outcome = 'Perlu Verifikasi';
        escalations.push({
          id: generateId('esc'),
          subdirektorat: subdit,
          nomorKondisi: 3,
          labelKondisi: 'Keraguan kelengkapan / kecocokan dokumen',
          alasan: `Dokumen masuk "${sub.namaDokumen}" mirip tetapi tidak persis sama dengan daftar wajib "${req.namaDokumen}". Perlu dipastikan manusia apakah dokumen tersebut yang dimaksud.`,
        });
      }

      if (sesuaiPeriode === false) {
        reasons.push(
          `Periode dokumen "${sub.namaDokumen}" tertulis "${sub.periode}", tidak sesuai periode target "${periodeTarget}"`
        );
        outcome = 'Kurang';
      } else if (sesuaiPeriode === 'Tidak diketahui') {
        reasons.push(
          `Periode dokumen "${sub.namaDokumen}" tidak ada di data yang diberikan`
        );
        if (outcome === 'Sesuai') outcome = 'Perlu Verifikasi';
        escalations.push({
          id: generateId('esc'),
          subdirektorat: subdit,
          nomorKondisi: 3,
          labelKondisi: 'Keraguan kelengkapan dokumen',
          alasan: `Informasi periode untuk dokumen "${sub.namaDokumen}" tidak tercantum di data yang diberikan.`,
        });
      }

      if (sesuaiFormat === false) {
        reasons.push(
          `Format dokumen "${sub.namaDokumen}" (${sub.format}) tidak sesuai format wajib (${req.formatWajib})`
        );
        outcome = 'Kurang';
      } else if (sesuaiFormat === 'Tidak diketahui') {
        reasons.push(
          `Format dokumen "${sub.namaDokumen}" tidak ada di data yang diberikan (wajib: ${req.formatWajib})`
        );
        if (outcome === 'Sesuai') outcome = 'Perlu Verifikasi';
        escalations.push({
          id: generateId('esc'),
          subdirektorat: subdit,
          nomorKondisi: 3,
          labelKondisi: 'Keraguan kelengkapan dokumen',
          alasan: `Format berkas untuk "${sub.namaDokumen}" tidak tercantum di data yang diberikan sehingga kesesuaian dengan format wajib (${req.formatWajib}) belum dapat dipastikan.`,
        });
      }

      if (sudahTtd === false) {
        reasons.push(`Dokumen "${sub.namaDokumen}" belum bertanda tangan`);
        outcome = 'Kurang';
      } else if (sudahTtd === 'Tidak diketahui') {
        reasons.push(
          `Status tanda tangan dokumen "${sub.namaDokumen}" tidak ada di data yang diberikan`
        );
        if (outcome === 'Sesuai') outcome = 'Perlu Verifikasi';
        escalations.push({
          id: generateId('esc'),
          subdirektorat: subdit,
          nomorKondisi: 3,
          labelKondisi: 'Keraguan kelengkapan dokumen',
          alasan: `Status tanda tangan untuk dokumen "${sub.namaDokumen}" tidak tercantum padahal tanda tangan dipersyaratkan.`,
        });
      }

      if (outcome === 'Sesuai') {
        reasons.push(
          `Dokumen "${sub.namaDokumen}" tersedia, sesuai periode ${periodeTarget}${
            formatWajibTrim ? `, format ${subFormatTrim || formatWajibTrim}` : ''
          }${req.perluTandaTangan ? ', dan sudah bertanda tangan' : ''}.`
        );
      } else {
        missingOrIncompleteDescriptions.push(
          `${req.namaDokumen} (${reasons.join('; ')})`
        );
      }

      auditItems.push({
        id: generateId('aud'),
        requiredDoc: req,
        matchedSubmittedDoc: sub,
        outcome,
        checks: {
          ada: true,
          sesuaiPeriode,
          sesuaiFormat,
          sudahTtd,
        },
        alasan: reasons.join('. '),
      });
    }

    // Extra submitted docs for this subdit not matched to any required doc -> Condition #4
    const extraSubmittedDocs = subList.filter((s) => !matchedSubIds.has(s.id));
    for (const extra of extraSubmittedDocs) {
      escalations.push({
        id: generateId('esc'),
        subdirektorat: subdit,
        nomorKondisi: 4,
        labelKondisi: 'Dokumen di luar daftar wajib',
        alasan: `Dokumen "${extra.namaDokumen}" dari ${subdit} tidak tercantum dalam daftar data dukung wajib.`,
      });
    }

    // Determine Subdirektorat overall status
    let status: SubdirektoratStatus = 'Sudah lengkap menurut daftar';
    const anyMatched = auditItems.some((a) => a.checks.ada);
    const allSesuai = auditItems.every((a) => a.outcome === 'Sesuai');

    if (!anyMatched && subList.length === 0) {
      status = 'Belum kirim';
    } else if (!allSesuai) {
      status = 'Kurang lengkap';
    }

    // Deadline calculation (take earliest valid deadline among incomplete/required docs)
    const relevantDocsForDeadline =
      auditItems.some((a) => a.outcome !== 'Sesuai')
        ? auditItems.filter((a) => a.outcome !== 'Sesuai').map((a) => a.requiredDoc)
        : reqList;

    const validDates = relevantDocsForDeadline
      .map((d) => d.tenggat)
      .filter((t) => isValidIsoDate(t))
      .sort();

    const tenggatTerdekat = validDates[0] || null;
    const sisaHariAngka = tenggatTerdekat
      ? diffDaysIso(tenggatTerdekat, tanggalHariIni)
      : null;
    const sisaHariLabel = formatSisaHari(sisaHariAngka);

    // Condition #1 & #6 checks
    if (status !== 'Sudah lengkap menurut daftar') {
      if (sisaHariAngka !== null && sisaHariAngka < 0 && pengingatTerkirim >= 1) {
        escalations.push({
          id: generateId('esc'),
          subdirektorat: subdit,
          nomorKondisi: 1,
          labelKondisi: 'Tenggat terlewat dan data belum lengkap meski sudah ada pengingat',
          alasan: `${subdit} berstatus "${status}" dan melewati tenggat ${Math.abs(sisaHariAngka)} hari meskipun sudah dikirim ${pengingatTerkirim} kali pengingat.`,
        });
      }
      if (pengingatTerkirim >= 2) {
        escalations.push({
          id: generateId('esc'),
          subdirektorat: subdit,
          nomorKondisi: 6,
          labelKondisi: 'Pengingat sudah berulang kali tanpa respons lengkap',
          alasan: `${subdit} telah menerima ${pengingatTerkirim} kali pengingat namun data dukung masih berstatus "${status}".`,
        });
      }
    }

    // Build concise status table note citing documents
    const sesuaiCount = auditItems.filter((a) => a.outcome === 'Sesuai').length;
    let catatan = '';
    if (status === 'Sudah lengkap menurut daftar') {
      const docNames = auditItems
        .map((a) => a.matchedSubmittedDoc?.namaDokumen || a.requiredDoc.namaDokumen)
        .join(', ');
      catatan = `Semua ${reqList.length} dokumen wajib telah sesuai (${docNames}).`;
    } else if (status === 'Belum kirim') {
      const missingNames = reqList.map((r) => r.namaDokumen).join(', ');
      catatan = `Belum ada kiriman masuk. Menunggu: ${missingNames}.`;
    } else {
      catatan = `${sesuaiCount}/${reqList.length} dokumen sesuai. Kurang/perlu cek: ${missingOrIncompleteDescriptions.join('; ')}.`;
    }
    if (extraSubmittedDocs.length > 0) {
      catatan += ` Ada ${extraSubmittedDocs.length} dokumen di luar daftar wajib (${extraSubmittedDocs.map((e) => e.namaDokumen).join(', ')}).`;
    }

    const { stage, draft, kalimatCount } = buildReminderDraft({
      subdirektorat: subdit,
      missingOrIncompleteItems: missingOrIncompleteDescriptions,
      tenggatIso: tenggatTerdekat,
      sisaHari: sisaHariAngka,
      status,
    });

    subdirektoratRows.push({
      subdirektorat: subdit,
      dataWajibList: reqList,
      dataMasukList: subList,
      auditItems,
      extraSubmittedDocs,
      status,
      tenggatTerdekat,
      sisaHariAngka,
      sisaHariLabel,
      catatan,
      pengingatTerkirim,
      draftStage: stage,
      draftPesan: draft,
      draftKalimatCount: kalimatCount,
    });
  }

  // Deduplicate identical escalations
  const dedupedEscalations: EscalationItem[] = [];
  const escKeys = new Set<string>();
  for (const esc of escalations) {
    const key = `${esc.subdirektorat}|${esc.nomorKondisi}|${esc.alasan}`;
    if (!escKeys.has(key)) {
      escKeys.add(key);
      dedupedEscalations.push(esc);
    }
  }

  const lengkap = subdirektoratRows.filter(
    (r) => r.status === 'Sudah lengkap menurut daftar'
  ).length;
  const kurang = subdirektoratRows.filter((r) => r.status === 'Kurang lengkap').length;
  const belumKirim = subdirektoratRows.filter((r) => r.status === 'Belum kirim').length;

  const ringkasanBaris: [string, string, string] = [
    `Tanggal pemantauan: ${tanggalFormatted} (Periode target: ${periodeTarget}).`,
    `Status ${subdirektoratRows.length} subdirektorat: ${lengkap} sudah lengkap menurut daftar, ${kurang} kurang lengkap, ${belumKirim} belum kirim.`,
    dedupedEscalations.length > 0
      ? `Catatan: Terdapat ${dedupedEscalations.length} hal yang memerlukan keputusan manusia; seluruh draf bersifat SARAN.`
      : `Seluruh keluaran bersifat SARAN dan perlu diperiksa oleh tim pelaporan kinerja sebelum digunakan.`,
  ];

  const formattedMarkdownReport = buildMarkdownReport({
    ringkasanBaris,
    rows: subdirektoratRows,
    escalations: dedupedEscalations,
  });

  return {
    missingInput,
    securityAlerts,
    blockedBySecurity,
    tanggalHariIni,
    tanggalHariIniFormatted: tanggalFormatted,
    periodeTarget,
    ringkasanBaris,
    counts: {
      totalSubdit: subdirektoratRows.length,
      lengkap,
      kurang,
      belumKirim,
    },
    subdirektoratRows,
    escalations: dedupedEscalations,
    formattedMarkdownReport,
  };
}

function buildMarkdownReport(params: {
  ringkasanBaris: [string, string, string];
  rows: SubdirektoratSummaryRow[];
  escalations: EscalationItem[];
}): string {
  const { ringkasanBaris, rows, escalations } = params;
  const lines: string[] = [];

  lines.push('1. Ringkasan');
  lines.push(ringkasanBaris[0]);
  lines.push(ringkasanBaris[1]);
  lines.push(ringkasanBaris[2]);
  lines.push('');

  lines.push('2. Tabel Status');
  if (rows.length === 0) {
    lines.push('Belum ada tabel status yang dapat disusun.');
  } else {
    lines.push(
      '| Subdirektorat | Data wajib | Data masuk | Status | Sisa hari ke tenggat | Catatan |'
    );
    lines.push('| --- | --- | --- | --- | --- | --- |');
    for (const row of rows) {
      const wajibNames = row.dataWajibList.map((w) => w.namaDokumen).join(', ');
      const masukNames =
        row.dataMasukList.length > 0
          ? row.dataMasukList.map((m) => m.namaDokumen).join(', ')
          : 'Belum ada';
      lines.push(
        `| ${row.subdirektorat} | ${wajibNames} (${row.dataWajibList.length}) | ${masukNames} (${row.dataMasukList.length}) | ${row.status} | ${row.sisaHariLabel} | ${row.catatan} |`
      );
    }
  }
  lines.push('');

  lines.push('3. Draf Pengingat');
  const drafts = rows.filter((r) => r.draftPesan !== null);
  if (drafts.length === 0) {
    lines.push('Tidak ada draf pengingat yang perlu disiapkan.');
  } else {
    for (const row of drafts) {
      lines.push(`[${row.subdirektorat}] — DRAF, belum dikirim (${row.draftStage})`);
      lines.push(row.draftPesan || '');
      lines.push('');
    }
  }
  if (drafts.length > 0) {
    // remove trailing blank if needed, keep clean
  } else {
    lines.push('');
  }

  lines.push('4. Perlu diputuskan manusia');
  if (escalations.length === 0) {
    lines.push('tidak ada');
  } else {
    for (const esc of escalations) {
      lines.push(
        `- [${esc.subdirektorat}] ${esc.labelKondisi}: ${esc.alasan}`
      );
    }
  }

  return lines.join('\n');
}

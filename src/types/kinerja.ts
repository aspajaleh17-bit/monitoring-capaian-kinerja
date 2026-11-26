export type SubdirektoratStatus =
  | 'Sudah lengkap menurut daftar'
  | 'Kurang lengkap'
  | 'Belum kirim';

export type ReminderStage =
  | 'Awal bulan (pembuka)'
  | 'Mendekati tenggat (peringatan)'
  | 'Tenggat terlewat (permintaan segera)'
  | 'Tidak perlu';

export type SignatureStatus = 'Sudah TTD' | 'Belum TTD' | 'Tidak Ada Info';

export type CheckOutcome = 'Sesuai' | 'Kurang' | 'Belum Ada' | 'Perlu Verifikasi';

export interface RequiredDocument {
  id: string;
  subdirektorat: string;
  namaDokumen: string;
  formatWajib: string;
  perluTandaTangan: boolean;
  tenggat: string; // YYYY-MM-DD
}

export interface SubmittedDocument {
  id: string;
  subdirektorat: string;
  namaDokumen: string;
  tanggalMasuk: string; // YYYY-MM-DD or raw text
  periode: string;
  format: string;
  statusTandaTangan: SignatureStatus;
  catatan: string;
}

export interface SubdirektoratReminderState {
  subdirektorat: string;
  pengingatTerkirim: number;
}

export interface DocumentAuditItem {
  id: string;
  requiredDoc: RequiredDocument;
  matchedSubmittedDoc: SubmittedDocument | null;
  outcome: CheckOutcome;
  checks: {
    ada: boolean;
    sesuaiPeriode: boolean | 'Tidak diketahui';
    sesuaiFormat: boolean | 'Tidak diketahui';
    sudahTtd: boolean | 'Tidak wajib' | 'Tidak diketahui';
  };
  alasan: string;
}

export interface SubdirektoratSummaryRow {
  subdirektorat: string;
  dataWajibList: RequiredDocument[];
  dataMasukList: SubmittedDocument[];
  auditItems: DocumentAuditItem[];
  extraSubmittedDocs: SubmittedDocument[];
  status: SubdirektoratStatus;
  tenggatTerdekat: string | null;
  sisaHariAngka: number | null;
  sisaHariLabel: string;
  catatan: string;
  pengingatTerkirim: number;
  draftStage: ReminderStage;
  draftPesan: string | null;
  draftKalimatCount: number;
}

export interface EscalationItem {
  id: string;
  subdirektorat: string;
  nomorKondisi: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  labelKondisi: string;
  alasan: string;
}

export interface SecurityAlert {
  id: string;
  sumber: string;
  kategori: 'Data Pribadi' | 'Keuangan/Kontrak Sensitif' | 'Klasifikasi Rahasia/Terbatas';
  kataKunci: string;
  detail: string;
}

export interface MissingInputStatus {
  missingRequiredList: boolean;
  missingSubmittedConfirmation: boolean;
  missingTodayDate: boolean;
  missingTargetPeriod: boolean;
  isComplete: boolean;
  missingMessages: string[];
}

export interface MonitoringReport {
  missingInput: MissingInputStatus;
  securityAlerts: SecurityAlert[];
  blockedBySecurity: boolean;
  tanggalHariIni: string;
  tanggalHariIniFormatted: string;
  periodeTarget: string;
  ringkasanBaris: [string, string, string];
  counts: {
    totalSubdit: number;
    lengkap: number;
    kurang: number;
    belumKirim: number;
  };
  subdirektoratRows: SubdirektoratSummaryRow[];
  escalations: EscalationItem[];
  formattedMarkdownReport: string;
}

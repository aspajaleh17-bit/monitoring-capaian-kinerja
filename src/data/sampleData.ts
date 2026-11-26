import {
  RequiredDocument,
  SubdirektoratReminderState,
  SubmittedDocument,
} from '../types/kinerja';

export const SAMPLE_TANGGAL_HARI_INI = '2026-11-25';
export const SAMPLE_PERIODE_TARGET = 'November 2026';

export const SAMPLE_REQUIRED_DOCS: RequiredDocument[] = [
  {
    id: 'req-1',
    subdirektorat: 'Subdit Pengujian dan Sertifikasi Sarana',
    namaDokumen: 'Laporan Realisasi Sertifikasi Sarana Perkeretaapian',
    formatWajib: 'PDF',
    perluTandaTangan: true,
    tenggat: '2026-11-28',
  },
  {
    id: 'req-2',
    subdirektorat: 'Subdit Pengujian dan Sertifikasi Sarana',
    namaDokumen: 'Rekapitulasi Hasil Pengujian Pertama dan Berkala',
    formatWajib: 'XLSX',
    perluTandaTangan: false,
    tenggat: '2026-11-28',
  },
  {
    id: 'req-3',
    subdirektorat: 'Subdit Teknik Sarana',
    namaDokumen: 'Matriks Kepatuhan Spesifikasi Teknis Sarana',
    formatWajib: 'PDF',
    perluTandaTangan: true,
    tenggat: '2026-11-27',
  },
  {
    id: 'req-4',
    subdirektorat: 'Subdit Teknik Sarana',
    namaDokumen: 'Data Rekomendasi Teknis Pembangunan Sarana',
    formatWajib: 'XLSX',
    perluTandaTangan: false,
    tenggat: '2026-11-27',
  },
  {
    id: 'req-5',
    subdirektorat: 'Subdit Laik Operasi dan Kelaikan Sarana',
    namaDokumen: 'Laporan Evaluasi Kelaikan Operasi Sarana',
    formatWajib: 'PDF',
    perluTandaTangan: true,
    tenggat: '2026-11-05',
  },
  {
    id: 'req-6',
    subdirektorat: 'Subdit Laik Operasi dan Kelaikan Sarana',
    namaDokumen: 'Daftar Pemeriksaan Perawatan Berkala Sarana',
    formatWajib: 'XLSX',
    perluTandaTangan: false,
    tenggat: '2026-11-05',
  },
  {
    id: 'req-7',
    subdirektorat: 'Subdit Pembinaan dan Pengawasan Sarana',
    namaDokumen: 'Laporan Pengawasan Kepatuhan Operator Sarana',
    formatWajib: 'PDF',
    perluTandaTangan: true,
    tenggat: '2026-12-05',
  },
  {
    id: 'req-8',
    subdirektorat: 'Subdit Pembinaan dan Pengawasan Sarana',
    namaDokumen: 'Notulen Pembinaan Teknis Keselamatan Sarana',
    formatWajib: 'PDF',
    perluTandaTangan: true,
    tenggat: '2026-12-05',
  },
];

export const SAMPLE_SUBMITTED_DOCS: SubmittedDocument[] = [
  {
    id: 'sub-1',
    subdirektorat: 'Subdit Pengujian dan Sertifikasi Sarana',
    namaDokumen: 'Laporan Realisasi Sertifikasi Sarana Perkeretaapian',
    tanggalMasuk: '2026-11-20',
    periode: 'November 2026',
    format: 'PDF',
    statusTandaTangan: 'Sudah TTD',
    catatan: 'Diterima melalui surat pengantar resmi',
  },
  {
    id: 'sub-2',
    subdirektorat: 'Subdit Pengujian dan Sertifikasi Sarana',
    namaDokumen: 'Rekapitulasi Hasil Pengujian Pertama dan Berkala',
    tanggalMasuk: '2026-11-21',
    periode: 'November 2026',
    format: 'XLSX',
    statusTandaTangan: 'Tidak Ada Info',
    catatan: '',
  },
  {
    id: 'sub-3',
    subdirektorat: 'Subdit Teknik Sarana',
    namaDokumen: 'Matriks Kepatuhan Spesifikasi Teknis Sarana',
    tanggalMasuk: '2026-11-24',
    periode: 'November 2026',
    format: 'PDF',
    statusTandaTangan: 'Belum TTD',
    catatan: 'Masih menunggu paraf pimpinan subdirektorat',
  },
  {
    id: 'sub-4',
    subdirektorat: 'Subdit Pembinaan dan Pengawasan Sarana',
    namaDokumen: 'Laporan Pengawasan Kepatuhan Operator Sarana',
    tanggalMasuk: '2026-11-23',
    periode: 'November 2026',
    format: 'PDF',
    statusTandaTangan: 'Sudah TTD',
    catatan: 'Notulen pembinaan meminta pengecualian karena kegiatan lapangan belum tersedia',
  },
  {
    id: 'sub-5',
    subdirektorat: 'Subdit Pembinaan dan Pengawasan Sarana',
    namaDokumen: 'Lampiran Dokumentasi Foto Kunjungan Balai Yasa',
    tanggalMasuk: '2026-11-23',
    periode: 'November 2026',
    format: 'PDF',
    statusTandaTangan: 'Tidak Ada Info',
    catatan: 'Dikirim bersama laporan pengawasan',
  },
];

export const SAMPLE_REMINDER_STATES: SubdirektoratReminderState[] = [
  { subdirektorat: 'Subdit Pengujian dan Sertifikasi Sarana', pengingatTerkirim: 0 },
  { subdirektorat: 'Subdit Teknik Sarana', pengingatTerkirim: 1 },
  { subdirektorat: 'Subdit Laik Operasi dan Kelaikan Sarana', pengingatTerkirim: 2 },
  { subdirektorat: 'Subdit Pembinaan dan Pengawasan Sarana', pengingatTerkirim: 0 },
];

export const SAMPLE_BULK_REQUIRED_TEXT = `Subdirektorat | Nama Dokumen Wajib | Format Wajib | Wajib Tanda Tangan | Tenggat
Subdit Pengujian dan Sertifikasi Sarana | Laporan Realisasi Sertifikasi Sarana | PDF | Ya | 2026-12-05
Subdit Teknik Sarana | Matriks Kepatuhan Spesifikasi Teknis | XLSX | Tidak | 2026-12-05`;

export const SAMPLE_BULK_SUBMITTED_TEXT = `Subdirektorat | Nama Dokumen | Tanggal Masuk | Periode | Format | Status Tanda Tangan | Catatan
Subdit Pengujian dan Sertifikasi Sarana | Laporan Realisasi Sertifikasi Sarana | 2026-11-24 | November 2026 | PDF | Sudah TTD | Terverifikasi`;

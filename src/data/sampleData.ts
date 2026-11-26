import {
  ActivityLogEntry,
  CapaianKinerjaItem,
  RencanaAksiItem,
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

export const SAMPLE_PREVIOUS_MONTH_BASELINE = {
  periodeLabel: 'Oktober 2026',
  kepatuhanPersen: 50,
};

export const SAMPLE_CAPAIAN_KINERJA: CapaianKinerjaItem[] = [
  {
    id: 'cap-1',
    subdirektorat: 'Subdit Pengujian dan Sertifikasi Sarana',
    nomorSasaranKinerja: 'SK-01',
    sasaranKinerja:
      'Meningkatnya ketepatan waktu pengujian dan sertifikasi sarana perkeretaapian',
    kodeIku: 'IKK-1.1',
    indikatorKinerja:
      'Persentase sarana perkeretaapian yang lulus uji dan tersertifikasi tepat waktu',
    satuan: '%',
    target: 100,
    realisasi: 99.1,
    periode: 'November 2026',
    tahun: '2026',
    jenisPerhitungan: 'tetap',
    realisasiBulanan: [96, 98, 100, 99, 100, 100, 98, 99, 100, 100, 100, null],
    realisasiOutput: '148',
    satuanOutput: 'Sertifikat',
    buktiDukung: 'Laporan Realisasi Sertifikasi Sarana Perkeretaapian',
    kendalaDanTindakLanjut:
      'Seluruh permohonan pengujian bulan berjalan telah tersertifikasi.',
  },
  {
    id: 'cap-2',
    subdirektorat: 'Subdit Teknik Sarana',
    nomorSasaranKinerja: 'SK-02',
    sasaranKinerja:
      'Terwujudnya pemenuhan standar spesifikasi teknis pembangunan sarana perkeretaapian',
    kodeIku: 'IKK-2.1',
    indikatorKinerja:
      'Persentase rekomendasi teknis pembangunan sarana yang memenuhi standar spesifikasi',
    satuan: '%',
    target: 95,
    realisasi: 86.5,
    periode: 'November 2026',
    tahun: '2026',
    jenisPerhitungan: 'tetap',
    realisasiBulanan: [80, 82, 85, 84, 88, 86, 87, 88, 90, 93, 88, null],
    realisasiOutput: '24',
    satuanOutput: 'Dokumen',
    buktiDukung: 'Matriks Kepatuhan Spesifikasi Teknis Sarana',
    kendalaDanTindakLanjut:
      'Menunggu penyelesaian verifikasi teknis 2 dokumen pengajuan revisi.',
  },
  {
    id: 'cap-3',
    subdirektorat: 'Subdit Laik Operasi dan Kelaikan Sarana',
    nomorSasaranKinerja: 'SK-03',
    sasaranKinerja:
      'Terjaganya keandalan dan kelaikan operasi sarana perkeretaapian nasional',
    kodeIku: 'IKK-3.1',
    indikatorKinerja:
      'Jumlah sarana perkeretaapian yang dievaluasi kelaikan operasinya',
    satuan: 'Unit',
    target: 40,
    realisasi: 32,
    periode: 'November 2026',
    tahun: '2026',
    jenisPerhitungan: 'akumulasi',
    realisasiBulanan: [2, 3, 3, 2, 4, 3, 3, 3, 4, 3, 2, null],
    realisasiOutput: '32',
    satuanOutput: 'Unit',
    buktiDukung: 'Laporan Evaluasi Kelaikan Operasi Sarana',
    kendalaDanTindakLanjut:
      'Penjadwalan ulang pemeriksaan di balai yasa akibat pergantian jadwal operasi.',
  },
  {
    id: 'cap-4',
    subdirektorat: 'Subdit Pembinaan dan Pengawasan Sarana',
    nomorSasaranKinerja: 'SK-04',
    sasaranKinerja:
      'Meningkatnya kepatuhan keselamatan operator dalam pengoperasian sarana',
    kodeIku: 'IKK-4.1',
    indikatorKinerja:
      'Persentase operator sarana yang diawasi kepatuhan keselamatannya',
    satuan: '%',
    target: 90,
    realisasi: 84.5,
    periode: 'November 2026',
    tahun: '2026',
    jenisPerhitungan: 'tetap',
    realisasiBulanan: [78, 80, 82, 84, 85, 85, 86, 88, 88, 89, 85, null],
    realisasiOutput: '18',
    satuanOutput: 'Laporan',
    buktiDukung: 'Laporan Pengawasan Kepatuhan Operator Sarana',
    kendalaDanTindakLanjut:
      'Pengawasan 1 operator dijadwalkan pada minggu pertama bulan berikutnya.',
  },
  {
    id: 'cap-2025-1',
    subdirektorat: 'Subdit Pengujian dan Sertifikasi Sarana',
    nomorSasaranKinerja: 'SK-01',
    sasaranKinerja:
      'Meningkatnya ketepatan waktu pengujian dan sertifikasi sarana perkeretaapian',
    kodeIku: 'IKK-1.1',
    indikatorKinerja:
      'Persentase sarana perkeretaapian yang lulus uji dan tersertifikasi tepat waktu',
    satuan: '%',
    target: 98,
    realisasi: 95.8,
    periode: 'Desember 2025',
    tahun: '2025',
    jenisPerhitungan: 'tetap',
    realisasiBulanan: [92, 93, 94, 95, 95, 96, 96, 97, 97, 98, 98, 99],
    buktiDukung: 'Rekapitulasi Sertifikasi Sarana Tahun 2025',
    kendalaDanTindakLanjut:
      'Target tahunan hampir terpenuhi; peningkatan kapasitas uji dilakukan di triwulan IV.',
  },
  {
    id: 'cap-2025-2',
    subdirektorat: 'Subdit Teknik Sarana',
    nomorSasaranKinerja: 'SK-02',
    sasaranKinerja:
      'Terwujudnya pemenuhan standar spesifikasi teknis pembangunan sarana perkeretaapian',
    kodeIku: 'IKK-2.1',
    indikatorKinerja:
      'Persentase rekomendasi teknis pembangunan sarana yang memenuhi standar spesifikasi',
    satuan: '%',
    target: 90,
    realisasi: 83.2,
    periode: 'Desember 2025',
    tahun: '2025',
    jenisPerhitungan: 'tetap',
    realisasiBulanan: [78, 79, 80, 81, 82, 83, 84, 85, 86, 86, 87, 87],
    buktiDukung: 'Matriks Evaluasi Spesifikasi Teknis 2025',
    kendalaDanTindakLanjut:
      'Perbaikan template dokumen pengajuan teknis agar revisi tidak berulang.',
  },
  {
    id: 'cap-2025-3',
    subdirektorat: 'Subdit Laik Operasi dan Kelaikan Sarana',
    nomorSasaranKinerja: 'SK-03',
    sasaranKinerja:
      'Terjaganya keandalan dan kelaikan operasi sarana perkeretaapian nasional',
    kodeIku: 'IKK-3.1',
    indikatorKinerja:
      'Jumlah sarana perkeretaapian yang dievaluasi kelaikan operasinya',
    satuan: 'Unit',
    target: 36,
    realisasi: 34,
    periode: 'Desember 2025',
    tahun: '2025',
    jenisPerhitungan: 'akumulasi',
    realisasiBulanan: [2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    buktiDukung: 'Laporan Evaluasi Kelaikan Operasi Sarana 2025',
    kendalaDanTindakLanjut:
      'Evaluasi akhir tahun tercapai 94,4% dari target 36 unit sarana.',
  },
  {
    id: 'cap-2025-4',
    subdirektorat: 'Subdit Pembinaan dan Pengawasan Sarana',
    nomorSasaranKinerja: 'SK-04',
    sasaranKinerja:
      'Meningkatnya kepatuhan keselamatan operator dalam pengoperasian sarana',
    kodeIku: 'IKK-4.1',
    indikatorKinerja:
      'Persentase operator sarana yang diawasi kepatuhan keselamatannya',
    satuan: '%',
    target: 85,
    realisasi: 86.3,
    periode: 'Desember 2025',
    tahun: '2025',
    jenisPerhitungan: 'tetap',
    realisasiBulanan: [80, 82, 83, 84, 85, 86, 87, 88, 89, 90, 90, 91],
    buktiDukung: 'Laporan Pengawasan Operator Sarana Tahun 2025',
    kendalaDanTindakLanjut:
      'Melampaui target tahunan 2025 melalui pengawasan terpadu lintas wilayah.',
  },
];

export const SAMPLE_ACTIVITY_LOGS: ActivityLogEntry[] = [
  {
    id: 'log-sample-5',
    timestampIso: '2026-11-25T08:30:00.000Z',
    kategori: 'Parameter',
    ringkasan: 'Pemantauan rutin periode November 2026 (2 subdit mendekati/lewat tenggat)',
    rataRataKepatuhan: 37.5,
    totalDokumenSesuai: 3,
    totalDokumenWajib: 8,
    subditKepatuhan: {
      'Subdit Pengujian dan Sertifikasi Sarana': 100,
      'Subdit Teknik Sarana': 0,
      'Subdit Laik Operasi dan Kelaikan Sarana': 0,
      'Subdit Pembinaan dan Pengawasan Sarana': 50,
    },
  },
  {
    id: 'log-sample-4',
    timestampIso: '2026-11-24T14:15:00.000Z',
    kategori: 'Data Masuk',
    ringkasan: 'Mencatat "Matriks Kepatuhan Spesifikasi Teknis Sarana" (Belum TTD)',
    rataRataKepatuhan: 37.5,
    totalDokumenSesuai: 3,
    totalDokumenWajib: 8,
    subditKepatuhan: {
      'Subdit Pengujian dan Sertifikasi Sarana': 100,
      'Subdit Teknik Sarana': 0,
      'Subdit Laik Operasi dan Kelaikan Sarana': 0,
      'Subdit Pembinaan dan Pengawasan Sarana': 50,
    },
  },
  {
    id: 'log-sample-3',
    timestampIso: '2026-11-23T10:40:00.000Z',
    kategori: 'Data Masuk',
    ringkasan: 'Mencatat "Laporan Pengawasan Kepatuhan Operator Sarana" (Sudah TTD)',
    rataRataKepatuhan: 37.5,
    totalDokumenSesuai: 3,
    totalDokumenWajib: 8,
    subditKepatuhan: {
      'Subdit Pengujian dan Sertifikasi Sarana': 100,
      'Subdit Teknik Sarana': 0,
      'Subdit Laik Operasi dan Kelaikan Sarana': 0,
      'Subdit Pembinaan dan Pengawasan Sarana': 50,
    },
  },
  {
    id: 'log-sample-2',
    timestampIso: '2026-11-21T11:20:00.000Z',
    kategori: 'Data Masuk',
    ringkasan: 'Mencatat "Rekapitulasi Hasil Pengujian Pertama dan Berkala" (Subdit Pengujian lengkap)',
    rataRataKepatuhan: 25,
    totalDokumenSesuai: 2,
    totalDokumenWajib: 8,
    subditKepatuhan: {
      'Subdit Pengujian dan Sertifikasi Sarana': 100,
      'Subdit Teknik Sarana': 0,
      'Subdit Laik Operasi dan Kelaikan Sarana': 0,
      'Subdit Pembinaan dan Pengawasan Sarana': 0,
    },
  },
  {
    id: 'log-sample-1',
    timestampIso: '2026-11-20T09:05:00.000Z',
    kategori: 'Data Masuk',
    ringkasan: 'Mencatat "Laporan Realisasi Sertifikasi Sarana Perkeretaapian" (Sudah TTD)',
    rataRataKepatuhan: 12.5,
    totalDokumenSesuai: 1,
    totalDokumenWajib: 8,
    subditKepatuhan: {
      'Subdit Pengujian dan Sertifikasi Sarana': 50,
      'Subdit Teknik Sarana': 0,
      'Subdit Laik Operasi dan Kelaikan Sarana': 0,
      'Subdit Pembinaan dan Pengawasan Sarana': 0,
    },
  },
];

export const SAMPLE_RENCANA_AKSI: RencanaAksiItem[] = [
  {
    id: 'ra-1',
    capaianItemId: 'cap-1',
    subdirektorat: 'Subdit Pengujian dan Sertifikasi Sarana',
    tahun: '2026',
    nomorSasaranKinerja: 'SK-01',
    sasaranKinerja:
      'Meningkatnya ketepatan waktu pengujian dan sertifikasi sarana perkeretaapian',
    kodeIku: 'IKK-1.1',
    indikatorKinerja:
      'Persentase sarana perkeretaapian yang lulus uji dan tersertifikasi tepat waktu',
    satuan: '%',
    bulanan: [
      { target: 100, realisasi: 96, evaluasi: '2 berkas uji tertunda kelengkapan administrasi awal.', rencanaTindakLanjut: 'Verifikasi pra-uji dokumen sebelum jadwal lapangan.' },
      { target: 100, realisasi: 98, evaluasi: 'Percepatan waktu verifikasi meningkatkan ketepatan.', rencanaTindakLanjut: 'Terapkan daftar periksa digital bagi tim penguji.' },
      { target: 100, realisasi: 100, evaluasi: 'Seluruh permohonan sertifikasi Maret selesai tepat waktu.', rencanaTindakLanjut: 'Pertahankan SLA penerbitan sertifikat ≤ 5 hari kerja.' },
      { target: 100, realisasi: 99, evaluasi: '1 sarana memerlukan uji ulang pengereman.', rencanaTindakLanjut: 'Jadwalkan uji ulang awal bulan berikutnya.' },
      { target: 100, realisasi: 100, evaluasi: 'Target Mei tercapai penuh tanpa tunggakan.', rencanaTindakLanjut: 'Konsolidasi jadwal pengujian triwulan II.' },
      { target: 100, realisasi: 100, evaluasi: 'Kapasitas tim penguji mencukupi lonjakan pengajuan.', rencanaTindakLanjut: 'Evaluasi beban kerja tim penguji lintas balai.' },
      { target: 100, realisasi: 98, evaluasi: 'Kendala cuaca memundurkan uji dinamis 1 rangkaian.', rencanaTindakLanjut: 'Siapkan jadwal cadangan pengujian lintasan.' },
      { target: 100, realisasi: 99, evaluasi: 'Koordinasi operator berjalan baik, minor revisi laporan.', rencanaTindakLanjut: 'Finalisasi format ringkasan hasil uji.' },
      { target: 100, realisasi: 100, evaluasi: 'Seluruh permohonan September tuntas tepat waktu.', rencanaTindakLanjut: 'Monitoring kesiapan permohonan triwulan IV.' },
      { target: 100, realisasi: 100, evaluasi: 'Kepatuhan ketepatan waktu terjaga 100%.', rencanaTindakLanjut: 'Siapkan rekap sertifikasi akhir tahun.' },
      { target: 100, realisasi: 100, evaluasi: 'Permohonan November tersertifikasi 100% sesuai jadwal.', rencanaTindakLanjut: 'Tutup antrean sertifikasi Desember sebelum minggu ke-3.' },
      { target: 100, realisasi: null, evaluasi: '', rencanaTindakLanjut: 'Verifikasi sisa permohonan sertifikasi akhir tahun.' },
    ],
  },
  {
    id: 'ra-2',
    capaianItemId: 'cap-2',
    subdirektorat: 'Subdit Teknik Sarana',
    tahun: '2026',
    nomorSasaranKinerja: 'SK-02',
    sasaranKinerja:
      'Terwujudnya pemenuhan standar spesifikasi teknis pembangunan sarana perkeretaapian',
    kodeIku: 'IKK-2.1',
    indikatorKinerja:
      'Persentase rekomendasi teknis pembangunan sarana yang memenuhi standar spesifikasi',
    satuan: '%',
    bulanan: [
      { target: 95, realisasi: 80, evaluasi: 'Beberapa gambar teknik pengajuan belum sesuai SNI.', rencanaTindakLanjut: 'Sosialisasi pedoman spesifikasi teknis kepada pemohon.' },
      { target: 95, realisasi: 82, evaluasi: 'Masih ada revisi perhitungan beban gandar.', rencanaTindakLanjut: 'Bimbingan teknis pengisian dokumen rancangan bangun.' },
      { target: 95, realisasi: 85, evaluasi: 'Peningkatan kelengkapan gambar teknik pada pengajuan baru.', rencanaTindakLanjut: 'Evaluasi berkala daftar periksa kelaikan rancangan.' },
      { target: 95, realisasi: 84, evaluasi: '2 dokumen membutuhkan klarifikasi material konstruksi.', rencanaTindakLanjut: 'Rapat klarifikasi teknis bersama tim pabrikan.' },
      { target: 95, realisasi: 88, evaluasi: 'Kualitas pengajuan dokumen meningkat signifikan.', rencanaTindakLanjut: 'Lanjutkan asistensi teknis pra-pengajuan.' },
      { target: 95, realisasi: 86, evaluasi: 'Keterlambatan tanggapan revisi dari pihak pemohon.', rencanaTindakLanjut: 'Tetapkan batas waktu perbaikan dokumen 7 hari kerja.' },
      { target: 95, realisasi: 87, evaluasi: 'Verifikasi dokumen berjalan stabil.', rencanaTindakLanjut: 'Perbarui templat matriks kepatuhan spesifikasi.' },
      { target: 95, realisasi: 88, evaluasi: 'Seluruh dokumen revisi Juli selesai diverifikasi.', rencanaTindakLanjut: 'Percepat review paralel untuk dokumen bervolume besar.' },
      { target: 95, realisasi: 90, evaluasi: 'Mendekati target dengan tingkat revisi yang menurun.', rencanaTindakLanjut: 'Pendampingan intensif 2 pemohon prioritas.' },
      { target: 95, realisasi: 93, evaluasi: 'Hanya 1 dokumen menunggu kelengkapan uji material.', rencanaTindakLanjut: 'Follow-up hasil uji laboratorium material.' },
      { target: 95, realisasi: 88, evaluasi: 'Menunggu penyelesaian verifikasi teknis 2 dokumen pengajuan revisi.', rencanaTindakLanjut: 'Jadwalkan pembahasan teknis final pekan pertama Desember.' },
      { target: 95, realisasi: null, evaluasi: '', rencanaTindakLanjut: 'Rampungkan verifikasi seluruh rekomendasi teknis tahun berjalan.' },
    ],
  },
  {
    id: 'ra-3',
    capaianItemId: 'cap-3',
    subdirektorat: 'Subdit Laik Operasi dan Kelaikan Sarana',
    tahun: '2026',
    nomorSasaranKinerja: 'SK-03',
    sasaranKinerja:
      'Terjaganya keandalan dan kelaikan operasi sarana perkeretaapian nasional',
    kodeIku: 'IKK-3.1',
    indikatorKinerja:
      'Jumlah sarana perkeretaapian yang dievaluasi kelaikan operasinya',
    satuan: 'Unit',
    bulanan: [
      { target: 3, realisasi: 2, evaluasi: '1 unit masuk perawatan berkala di balai yasa.', rencanaTindakLanjut: 'Reschedule evaluasi setelah keluar perawatan.' },
      { target: 3, realisasi: 3, evaluasi: 'Evaluasi 3 unit sarana sesuai rencana.', rencanaTindakLanjut: 'Lanjutkan pemeriksaan armada lintas Jawa.' },
      { target: 4, realisasi: 3, evaluasi: 'Pergantian jadwal operasi mengurangi 1 slot inspeksi.', rencanaTindakLanjut: 'Koordinasi slot inspeksi malam hari.' },
      { target: 3, realisasi: 2, evaluasi: 'Keterbatasan waktu jendela perawatan di dipo.', rencanaTindakLanjut: 'Sinkronkan jadwal tim pemeriksa dengan kalender dipo.' },
      { target: 4, realisasi: 4, evaluasi: 'Target Mei tercapai 100% (4 unit).', rencanaTindakLanjut: 'Pertahankan pola tim paralel 2 lokasi.' },
      { target: 3, realisasi: 3, evaluasi: 'Evaluasi kelaikan berjalan tepat jadwal.', rencanaTindakLanjut: 'Audit tindak lanjut temuan minor Juni.' },
      { target: 3, realisasi: 3, evaluasi: 'Seluruh unit terperiksa tanpa hambatan operasional.', rencanaTindakLanjut: 'Rekap hasil evaluasi semester I.' },
      { target: 3, realisasi: 3, evaluasi: 'Capaian bulanan sesuai rencana.', rencanaTindakLanjut: 'Persiapan inspeksi sarana angkutan akhir tahun.' },
      { target: 4, realisasi: 4, evaluasi: 'Penambahan 1 tim percepatan evaluasi berhasil.', rencanaTindakLanjut: 'Fokuskan evaluasi pada sarana berumur > 15 tahun.' },
      { target: 3, realisasi: 3, evaluasi: 'Evaluasi Oktober selesai seluruhnya.', rencanaTindakLanjut: 'Validasi laporan kelaikan dengan operator.' },
      { target: 4, realisasi: 2, evaluasi: 'Penjadwalan ulang pemeriksaan akibat pergantian jadwal operasi.', rencanaTindakLanjut: 'Tuntaskan sisa 6–8 unit sarana di bulan Desember.' },
      { target: 3, realisasi: null, evaluasi: '', rencanaTindakLanjut: 'Laksanakan evaluasi puncak kesiapan armada Desember.' },
    ],
  },
];


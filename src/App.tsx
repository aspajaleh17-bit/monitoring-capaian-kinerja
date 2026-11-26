import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityCategory,
  ActivityLogEntry,
  CapaianKinerjaItem,
  ManualVerificationEntry,
  PreviousMonthBaseline,
  RencanaAksiItem,
  RequiredDocument,
  SubdirektoratReminderState,
  SubmittedDocument,
} from './types/kinerja';
import {
  SAMPLE_ACTIVITY_LOGS,
  SAMPLE_CAPAIAN_KINERJA,
  SAMPLE_PERIODE_TARGET,
  SAMPLE_PREVIOUS_MONTH_BASELINE,
  SAMPLE_REMINDER_STATES,
  SAMPLE_RENCANA_AKSI,
  SAMPLE_REQUIRED_DOCS,
  SAMPLE_SUBMITTED_DOCS,
  SAMPLE_TANGGAL_HARI_INI,
} from './data/sampleData';
import {
  evaluateKinerjaData,
  generateId,
  normalizeText,
} from './utils/kinerjaEngine';
import { TopBar, WorkspaceTab } from './components/TopBar';
import { ControlSidebar, StatusFilter } from './components/ControlSidebar';
import { UrgentDeadlineBanner } from './components/UrgentDeadlineBanner';
import { SummaryAndStatusSection } from './components/SummaryAndStatusSection';
import { DeadlineTimelineSection } from './components/DeadlineTimelineSection';
import { CompletenessAuditSection } from './components/CompletenessAuditSection';
import { ReminderDraftsSection } from './components/ReminderDraftsSection';
import { DataInputWorkspace, InputSubTab } from './components/DataInputWorkspace';
import { CapaianRealisasiDashboard } from './components/CapaianRealisasiDashboard';
import { AnalisisKomparatifSection } from './components/AnalisisKomparatifSection';
import { FullReportPreviewModal } from './components/FullReportPreviewModal';

const STORAGE_KEY = 'ditsar_pemantau_kinerja_v1';

interface PersistedState {
  tanggalHariIni: string;
  periodeTarget: string;
  requiredDocs: RequiredDocument[];
  submittedDocs: SubmittedDocument[];
  reminderStates: SubdirektoratReminderState[];
  submittedConfirmedWhenEmpty: boolean;
  lastUpdatedIso: string;
  activityLogs: ActivityLogEntry[];
  manualVerifications: Record<string, ManualVerificationEntry>;
  previousMonth: PreviousMonthBaseline;
  subditTargets: Record<string, number>;
  capaianItems: CapaianKinerjaItem[];
  rencanaAksiItems: RencanaAksiItem[];
}

function loadInitialState(): PersistedState {
  const fallback: PersistedState = {
    tanggalHariIni: SAMPLE_TANGGAL_HARI_INI,
    periodeTarget: SAMPLE_PERIODE_TARGET,
    requiredDocs: SAMPLE_REQUIRED_DOCS,
    submittedDocs: SAMPLE_SUBMITTED_DOCS,
    reminderStates: SAMPLE_REMINDER_STATES,
    submittedConfirmedWhenEmpty: false,
    lastUpdatedIso: new Date().toISOString(),
    activityLogs: SAMPLE_ACTIVITY_LOGS,
    manualVerifications: {},
    previousMonth: SAMPLE_PREVIOUS_MONTH_BASELINE,
    subditTargets: {},
    capaianItems: SAMPLE_CAPAIAN_KINERJA,
    rencanaAksiItems: SAMPLE_RENCANA_AKSI,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const hasLogsArray = Array.isArray(parsed.activityLogs);
    return {
      tanggalHariIni: parsed.tanggalHariIni ?? fallback.tanggalHariIni,
      periodeTarget: parsed.periodeTarget ?? fallback.periodeTarget,
      requiredDocs: Array.isArray(parsed.requiredDocs)
        ? parsed.requiredDocs
        : fallback.requiredDocs,
      submittedDocs: Array.isArray(parsed.submittedDocs)
        ? parsed.submittedDocs
        : fallback.submittedDocs,
      reminderStates: Array.isArray(parsed.reminderStates)
        ? parsed.reminderStates
        : fallback.reminderStates,
      submittedConfirmedWhenEmpty: Boolean(parsed.submittedConfirmedWhenEmpty),
      lastUpdatedIso: parsed.lastUpdatedIso ?? fallback.lastUpdatedIso,
      activityLogs: hasLogsArray
        ? parsed.activityLogs!
        : SAMPLE_ACTIVITY_LOGS,
      manualVerifications:
        parsed.manualVerifications &&
        typeof parsed.manualVerifications === 'object'
          ? parsed.manualVerifications
          : {},
      previousMonth: parsed.previousMonth ?? fallback.previousMonth,
      subditTargets:
        parsed.subditTargets && typeof parsed.subditTargets === 'object'
          ? parsed.subditTargets
          : {},
      capaianItems: Array.isArray(parsed.capaianItems)
        ? parsed.capaianItems
        : fallback.capaianItems,
      rencanaAksiItems: Array.isArray(parsed.rencanaAksiItems)
        ? parsed.rencanaAksiItems
        : fallback.rencanaAksiItems,
    };
  } catch {
    return fallback;
  }
}

export default function App() {
  const [initial] = useState<PersistedState>(() => loadInitialState());

  const [tanggalHariIni, setTanggalHariIni] = useState(initial.tanggalHariIni);
  const [periodeTarget, setPeriodeTarget] = useState(initial.periodeTarget);
  const [requiredDocs, setRequiredDocs] = useState<RequiredDocument[]>(
    initial.requiredDocs
  );
  const [submittedDocs, setSubmittedDocs] = useState<SubmittedDocument[]>(
    initial.submittedDocs
  );
  const [reminderStates, setReminderStates] = useState<
    SubdirektoratReminderState[]
  >(initial.reminderStates);
  const [submittedConfirmedWhenEmpty, setSubmittedConfirmedWhenEmpty] =
    useState(initial.submittedConfirmedWhenEmpty);
  const [lastUpdatedIso, setLastUpdatedIso] = useState(initial.lastUpdatedIso);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(
    initial.activityLogs
  );
  const [manualVerifications, setManualVerifications] = useState<
    Record<string, ManualVerificationEntry>
  >(initial.manualVerifications);
  const [previousMonth, setPreviousMonth] = useState<PreviousMonthBaseline>(
    initial.previousMonth
  );
  const [subditTargets, setSubditTargets] = useState<Record<string, number>>(
    initial.subditTargets
  );
  const [capaianItems, setCapaianItems] = useState<CapaianKinerjaItem[]>(
    initial.capaianItems
  );
  const [rencanaAksiItems, setRencanaAksiItems] = useState<RencanaAksiItem[]>(
    initial.rencanaAksiItems
  );

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('ringkasan');
  const [kelengkapanSubTab, setKelengkapanSubTab] = useState<'audit' | 'kalender'>('audit');
  const [capaianSubTab, setCapaianSubTab] = useState<'dashboard' | 'komparatif'>('dashboard');
  const [inputSubTab, setInputSubTab] = useState<InputSubTab>('dokumen');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    const payload: PersistedState = {
      tanggalHariIni,
      periodeTarget,
      requiredDocs,
      submittedDocs,
      reminderStates,
      submittedConfirmedWhenEmpty,
      lastUpdatedIso,
      activityLogs,
      manualVerifications,
      previousMonth,
      subditTargets,
      capaianItems,
      rencanaAksiItems,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    tanggalHariIni,
    periodeTarget,
    requiredDocs,
    submittedDocs,
    reminderStates,
    submittedConfirmedWhenEmpty,
    lastUpdatedIso,
    activityLogs,
    manualVerifications,
    previousMonth,
    subditTargets,
    capaianItems,
    rencanaAksiItems,
  ]);

  const recordActivity = useCallback(
    (kategori: ActivityCategory, ringkasan: string) => {
      const nowIso = new Date().toISOString();
      setLastUpdatedIso(nowIso);
      setActivityLogs((prev) =>
        [
          {
            id: generateId('log'),
            timestampIso: nowIso,
            kategori,
            ringkasan,
          },
          ...prev,
        ].slice(0, 100)
      );
    },
    []
  );

  const report = useMemo(
    () =>
      evaluateKinerjaData({
        requiredDocs,
        submittedDocs,
        tanggalHariIni,
        periodeTarget,
        submittedConfirmedWhenEmpty,
        reminderStates,
      }),
    [
      requiredDocs,
      submittedDocs,
      tanggalHariIni,
      periodeTarget,
      submittedConfirmedWhenEmpty,
      reminderStates,
    ]
  );

  useEffect(() => {
    if (
      activityLogs.length > 0 &&
      activityLogs[0].subditKepatuhan === undefined
    ) {
      const rows = report.subdirektoratRows;
      const subditKepatuhan: Record<string, number> = {};
      let sumPct = 0;
      let totalWajib = 0;
      let totalSesuai = 0;

      for (const row of rows) {
        const wajib = row.dataWajibList.length;
        const sesuai = row.auditItems.filter(
          (a) => a.outcome === 'Sesuai'
        ).length;
        const pct = wajib > 0 ? Math.round((sesuai / wajib) * 1000) / 10 : 0;
        subditKepatuhan[row.subdirektorat] = pct;
        sumPct += pct;
        totalWajib += wajib;
        totalSesuai += sesuai;
      }

      const rataRataKepatuhan =
        rows.length > 0 ? Math.round((sumPct / rows.length) * 10) / 10 : 0;

      setActivityLogs((prev) =>
        prev.map((entry, idx) =>
          idx === 0 && entry.subditKepatuhan === undefined
            ? {
                ...entry,
                rataRataKepatuhan,
                totalDokumenSesuai: totalSesuai,
                totalDokumenWajib: totalWajib,
                subditKepatuhan,
              }
            : entry
        )
      );
    }
  }, [activityLogs, report]);

  const filteredRows = useMemo(() => {
    const q = normalizeText(searchQuery);
    return report.subdirektoratRows.filter((row) => {
      if (statusFilter === 'Prioritas Tinggi') {
        const isHighPriority =
          row.status !== 'Sudah lengkap menurut daftar' &&
          row.sisaHariAngka !== null &&
          row.sisaHariAngka < 3;
        if (!isHighPriority) return false;
      } else if (statusFilter !== 'Semua' && row.status !== statusFilter) {
        return false;
      }
      if (q && !normalizeText(row.subdirektorat).includes(q)) return false;
      return true;
    });
  }, [report.subdirektoratRows, statusFilter, searchQuery]);

  const filteredReport = useMemo(() => {
    if (statusFilter === 'Semua' && !searchQuery.trim()) return report;
    const lengkap = filteredRows.filter(
      (r) => r.status === 'Sudah lengkap menurut daftar'
    ).length;
    const kurang = filteredRows.filter(
      (r) => r.status === 'Kurang lengkap'
    ).length;
    const belumKirim = filteredRows.filter(
      (r) => r.status === 'Belum kirim'
    ).length;

    return {
      ...report,
      counts: {
        totalSubdit: filteredRows.length,
        lengkap,
        kurang,
        belumKirim,
      },
      subdirektoratRows: filteredRows,
    };
  }, [report, filteredRows, statusFilter, searchQuery]);

  const knownSubdirectorates = useMemo(() => {
    const set = new Set<string>();
    requiredDocs.forEach((d) => {
      if (d.subdirektorat.trim()) set.add(d.subdirektorat.trim());
    });
    submittedDocs.forEach((d) => {
      if (d.subdirektorat.trim()) set.add(d.subdirektorat.trim());
    });
    capaianItems.forEach((c) => {
      if (c.subdirektorat.trim()) set.add(c.subdirektorat.trim());
    });
    return Array.from(set);
  }, [requiredDocs, submittedDocs, capaianItems]);

  const handleLoadSample = () => {
    setTanggalHariIni(SAMPLE_TANGGAL_HARI_INI);
    setPeriodeTarget(SAMPLE_PERIODE_TARGET);
    setRequiredDocs(SAMPLE_REQUIRED_DOCS);
    setSubmittedDocs(SAMPLE_SUBMITTED_DOCS);
    setReminderStates(SAMPLE_REMINDER_STATES);
    setSubmittedConfirmedWhenEmpty(false);
    setPreviousMonth(SAMPLE_PREVIOUS_MONTH_BASELINE);
    setSubditTargets({});
    setManualVerifications({});
    setCapaianItems(SAMPLE_CAPAIAN_KINERJA);
    setRencanaAksiItems(SAMPLE_RENCANA_AKSI);
    setActivityLogs(SAMPLE_ACTIVITY_LOGS);
    setStatusFilter('Semua');
    setSearchQuery('');
    setLastUpdatedIso(new Date().toISOString());
  };

  const handleClearAll = () => {
    setRequiredDocs([]);
    setSubmittedDocs([]);
    setReminderStates([]);
    setSubmittedConfirmedWhenEmpty(false);
    setManualVerifications({});
    setSubditTargets({});
    setCapaianItems([]);
    setRencanaAksiItems([]);
    recordActivity('Sistem', 'Mengosongkan seluruh daftar masukan & capaian kinerja');
  };

  const handleIncrementSent = (subdirektorat: string) => {
    setReminderStates((prev) => {
      const idx = prev.findIndex(
        (r) => normalizeText(r.subdirektorat) === normalizeText(subdirektorat)
      );
      if (idx === -1) {
        return [...prev, { subdirektorat, pengingatTerkirim: 1 }];
      }
      return prev.map((r, i) =>
        i === idx
          ? { ...r, pengingatTerkirim: r.pengingatTerkirim + 1 }
          : r
      );
    });
    recordActivity('Pengingat', `Mencatat +1 pengingat terkirim untuk ${subdirektorat}`);
  };

  const handleToggleManualVerification = (
    reqId: string,
    docName: string,
    subdirektorat: string
  ) => {
    const currentlyVerified = Boolean(manualVerifications[reqId]?.verified);
    const nextVerified = !currentlyVerified;
    setManualVerifications((prev) => ({
      ...prev,
      [reqId]: {
        verified: nextVerified,
        verifiedAtIso: nextVerified ? new Date().toISOString() : undefined,
      },
    }));
    recordActivity(
      'Verifikasi',
      `${
        nextVerified ? 'Menandai terverifikasi' : 'Membatalkan verifikasi'
      } dokumen "${docName}" (${subdirektorat})`
    );
  };

  const handleChangeSubditTarget = (subdit: string, targetPct: number) => {
    setSubditTargets((prev) => ({ ...prev, [subdit]: targetPct }));
    recordActivity(
      'Target',
      `Menetapkan target kepatuhan ${targetPct}% untuk ${subdit}`
    );
  };

  const handleApplyAllTargets = (targetPct: number) => {
    const next: Record<string, number> = {};
    for (const row of report.subdirektoratRows) {
      next[row.subdirektorat] = targetPct;
    }
    setSubditTargets(next);
    recordActivity(
      'Target',
      `Menerapkan target kepatuhan ${targetPct}% ke seluruh subdirektorat`
    );
  };

  const handleInspectSubdit = (subdit: string) => {
    setSearchQuery(subdit);
    setStatusFilter('Semua');
    setActiveTab('kelengkapan');
    setKelengkapanSubTab('audit');
  };

  const handleGoToDrafts = (subdit: string) => {
    setSearchQuery(subdit);
    setStatusFilter('Semua');
    setActiveTab('draf');
  };

  const handleOpenCapaianKinerja = () => {
    setActiveTab('input');
    setInputSubTab('capaian');
  };

  const handleOpenCapaianDashboard = () => {
    setActiveTab('capaian');
    setCapaianSubTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenReport={() => setReportModalOpen(true)}
      />

      <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-6 lg:flex-row">
        <ControlSidebar
          tanggalHariIni={tanggalHariIni}
          onChangeTanggalHariIni={(val) => {
            setTanggalHariIni(val);
            recordActivity('Parameter', `Mengubah tanggal pemantauan menjadi ${val}`);
          }}
          periodeTarget={periodeTarget}
          onChangePeriodeTarget={(val) => {
            setPeriodeTarget(val);
            recordActivity('Parameter', `Mengubah periode target menjadi "${val}"`);
          }}
          statusFilter={statusFilter}
          onChangeStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          missingInput={report.missingInput}
          requiredCount={requiredDocs.length}
          submittedCount={submittedDocs.length}
          submittedConfirmedWhenEmpty={submittedConfirmedWhenEmpty}
          onToggleSubmittedConfirmed={(val) => {
            setSubmittedConfirmedWhenEmpty(val);
            recordActivity(
              'Parameter',
              val
                ? 'Mengonfirmasi belum ada data masuk sama sekali'
                : 'Membatalkan konfirmasi data masuk kosong'
            );
          }}
          onLoadSample={handleLoadSample}
          onClearAll={handleClearAll}
          subdirektoratRows={report.subdirektoratRows}
          onSelectUrgentSubdit={handleInspectSubdit}
          lastUpdatedIso={lastUpdatedIso}
          onOpenActivityLog={() => {
            setActiveTab('input');
            setInputSubTab('log');
          }}
        />

        <div className="min-w-0 flex-1">
          <UrgentDeadlineBanner
            subdirektoratRows={report.subdirektoratRows}
            tanggalHariIni={tanggalHariIni}
            onInspectSubdit={handleInspectSubdit}
            onGoToDrafts={handleGoToDrafts}
          />

          {activeTab === 'ringkasan' && (
            <SummaryAndStatusSection
              report={filteredReport}
              previousMonth={previousMonth}
              onChangePreviousMonth={(next) => {
                setPreviousMonth(next);
                recordActivity(
                  'Parameter',
                  `Memperbarui pembanding bulan lalu (${next.periodeLabel || '-'})`
                );
              }}
              subditTargets={subditTargets}
              onChangeSubditTarget={handleChangeSubditTarget}
              onApplyAllTargets={handleApplyAllTargets}
              capaianItems={capaianItems}
              onOpenCapaianKinerja={handleOpenCapaianKinerja}
              onOpenCapaianDashboard={handleOpenCapaianDashboard}
              onInspectSubdit={handleInspectSubdit}
              onGoToDrafts={handleGoToDrafts}
            />
          )}

          {activeTab === 'kelengkapan' && (
            <div className="space-y-5">
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-medium shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <button
                  type="button"
                  onClick={() => setKelengkapanSubTab('audit')}
                  className={`rounded-md px-3.5 py-1.5 transition-colors whitespace-nowrap ${
                    kelengkapanSubTab === 'audit'
                      ? 'bg-blue-700 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cek Dokumen (4 Poin &amp; Verifikasi)
                </button>
                <button
                  type="button"
                  onClick={() => setKelengkapanSubTab('kalender')}
                  className={`rounded-md px-3.5 py-1.5 transition-colors whitespace-nowrap ${
                    kelengkapanSubTab === 'kalender'
                      ? 'bg-blue-700 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kalender &amp; Lini Masa Tenggat
                </button>
              </div>

              {kelengkapanSubTab === 'audit' ? (
                <CompletenessAuditSection
                  rows={filteredRows}
                  manualVerifications={manualVerifications}
                  onToggleManualVerification={handleToggleManualVerification}
                  onGoToDrafts={handleGoToDrafts}
                />
              ) : (
                <DeadlineTimelineSection
                  subdirektoratRows={filteredRows}
                  tanggalHariIni={tanggalHariIni}
                  onInspectSubdit={handleInspectSubdit}
                  onGoToDrafts={handleGoToDrafts}
                />
              )}
            </div>
          )}

          {activeTab === 'draf' && (
            <ReminderDraftsSection
              rows={filteredRows}
              onIncrementSent={handleIncrementSent}
            />
          )}

          {activeTab === 'capaian' && (
            <div className="space-y-5">
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-medium shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <button
                  type="button"
                  onClick={() => setCapaianSubTab('dashboard')}
                  className={`rounded-md px-3.5 py-1.5 transition-colors whitespace-nowrap ${
                    capaianSubTab === 'dashboard'
                      ? 'bg-blue-700 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dashboard Capaian Realisasi
                </button>
                <button
                  type="button"
                  onClick={() => setCapaianSubTab('komparatif')}
                  className={`rounded-md px-3.5 py-1.5 transition-colors whitespace-nowrap ${
                    capaianSubTab === 'komparatif'
                      ? 'bg-blue-700 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Analisis Komparatif Histori
                </button>
              </div>

              {capaianSubTab === 'dashboard' ? (
                <CapaianRealisasiDashboard
                  items={capaianItems}
                  knownSubdirectorates={knownSubdirectorates}
                  onOpenInputCapaian={handleOpenCapaianKinerja}
                />
              ) : (
                <AnalisisKomparatifSection
                  activityLogs={activityLogs}
                  subdirektoratRows={report.subdirektoratRows}
                  onRecordSnapshot={() =>
                    recordActivity(
                      'Parameter',
                      `Snapshot manual kepatuhan (${report.periodeTarget || 'Periode berjalan'})`
                    )
                  }
                />
              )}
            </div>
          )}

          {activeTab === 'input' && (
            <DataInputWorkspace
              inputSubTab={inputSubTab}
              onChangeInputSubTab={setInputSubTab}
              requiredDocs={requiredDocs}
              onChangeRequiredDocs={setRequiredDocs}
              submittedDocs={submittedDocs}
              onChangeSubmittedDocs={setSubmittedDocs}
              submittedConfirmedWhenEmpty={submittedConfirmedWhenEmpty}
              onToggleSubmittedConfirmed={setSubmittedConfirmedWhenEmpty}
              activityLogs={activityLogs}
              onClearActivityLogs={() => setActivityLogs([])}
              onRecordActivity={recordActivity}
              capaianItems={capaianItems}
              onChangeCapaianItems={setCapaianItems}
              rencanaAksiItems={rencanaAksiItems}
              onChangeRencanaAksiItems={setRencanaAksiItems}
              knownSubdirectorates={knownSubdirectorates}
              periodeTarget={periodeTarget}
              onOpenCapaianDashboard={handleOpenCapaianDashboard}
            />
          )}
        </div>
      </main>

      <FullReportPreviewModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        report={report}
      />
    </div>
  );
}

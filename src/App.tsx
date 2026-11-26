import { useEffect, useMemo, useState } from 'react';
import { CompletenessAuditSection } from './components/CompletenessAuditSection';
import { ControlSidebar, StatusFilter } from './components/ControlSidebar';
import { DataInputWorkspace } from './components/DataInputWorkspace';
import { FullReportPreviewModal } from './components/FullReportPreviewModal';
import { ReminderDraftsSection } from './components/ReminderDraftsSection';
import { SummaryAndStatusSection } from './components/SummaryAndStatusSection';
import { TopBar, WorkspaceTab } from './components/TopBar';
import {
  SAMPLE_PERIODE_TARGET,
  SAMPLE_REMINDER_STATES,
  SAMPLE_REQUIRED_DOCS,
  SAMPLE_SUBMITTED_DOCS,
  SAMPLE_TANGGAL_HARI_INI,
} from './data/sampleData';
import {
  RequiredDocument,
  SubdirektoratReminderState,
  SubmittedDocument,
} from './types/kinerja';
import { evaluateKinerjaData, normalizeText } from './utils/kinerjaEngine';

const STORAGE_KEY = 'ditsar_pemantau_kinerja_v1';

interface StoredState {
  tanggalHariIni: string;
  periodeTarget: string;
  requiredDocs: RequiredDocument[];
  submittedDocs: SubmittedDocument[];
  reminderStates: SubdirektoratReminderState[];
  submittedConfirmedWhenEmpty: boolean;
}

function loadInitialState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      if (
        Array.isArray(parsed.requiredDocs) &&
        Array.isArray(parsed.submittedDocs) &&
        typeof parsed.tanggalHariIni === 'string'
      ) {
        return {
          tanggalHariIni: parsed.tanggalHariIni,
          periodeTarget: parsed.periodeTarget || SAMPLE_PERIODE_TARGET,
          requiredDocs: parsed.requiredDocs,
          submittedDocs: parsed.submittedDocs,
          reminderStates: Array.isArray(parsed.reminderStates)
            ? parsed.reminderStates
            : [],
          submittedConfirmedWhenEmpty: Boolean(parsed.submittedConfirmedWhenEmpty),
        };
      }
    }
  } catch {
    // Fallback to sample dataset
  }
  return {
    tanggalHariIni: SAMPLE_TANGGAL_HARI_INI,
    periodeTarget: SAMPLE_PERIODE_TARGET,
    requiredDocs: SAMPLE_REQUIRED_DOCS,
    submittedDocs: SAMPLE_SUBMITTED_DOCS,
    reminderStates: SAMPLE_REMINDER_STATES,
    submittedConfirmedWhenEmpty: false,
  };
}

export default function App() {
  const [initial] = useState<StoredState>(loadInitialState);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('ringkasan');
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

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubdit, setSelectedSubdit] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    try {
      const payload: StoredState = {
        tanggalHariIni,
        periodeTarget,
        requiredDocs,
        submittedDocs,
        reminderStates,
        submittedConfirmedWhenEmpty,
      };
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
  ]);

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

  const filteredRows = useMemo(() => {
    const q = normalizeText(searchQuery);
    return report.subdirektoratRows.filter((row) => {
      const matchesStatus =
        statusFilter === 'Semua' || row.status === statusFilter;
      const matchesQuery =
        !q || normalizeText(row.subdirektorat).includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [report.subdirektoratRows, statusFilter, searchQuery]);

  const handleUpdateReminderCount = (subdit: string, nextCount: number) => {
    setReminderStates((prev) => {
      const norm = normalizeText(subdit);
      const exists = prev.some((r) => normalizeText(r.subdirektorat) === norm);
      if (exists) {
        return prev.map((r) =>
          normalizeText(r.subdirektorat) === norm
            ? { ...r, pengingatTerkirim: nextCount }
            : r
        );
      }
      return [...prev, { subdirektorat: subdit, pengingatTerkirim: nextCount }];
    });
  };

  const handleLoadSample = () => {
    setTanggalHariIni(SAMPLE_TANGGAL_HARI_INI);
    setPeriodeTarget(SAMPLE_PERIODE_TARGET);
    setRequiredDocs(SAMPLE_REQUIRED_DOCS);
    setSubmittedDocs(SAMPLE_SUBMITTED_DOCS);
    setReminderStates(SAMPLE_REMINDER_STATES);
    setSubmittedConfirmedWhenEmpty(false);
    setSelectedSubdit(null);
    setStatusFilter('Semua');
    setSearchQuery('');
  };

  const handleClearAll = () => {
    setRequiredDocs([]);
    setSubmittedDocs([]);
    setReminderStates([]);
    setSubmittedConfirmedWhenEmpty(false);
    setSelectedSubdit(null);
    setStatusFilter('Semua');
    setSearchQuery('');
    setActiveTab('input');
  };

  const handleInspectSubdit = (subdit: string) => {
    setSelectedSubdit(subdit);
    setActiveTab('kelengkapan');
  };

  const handleGoToDrafts = (subdit: string) => {
    setSelectedSubdit(subdit);
    setActiveTab('draf');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'ringkasan') setSelectedSubdit(null);
        }}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start">
        <ControlSidebar
          tanggalHariIni={tanggalHariIni}
          onChangeTanggalHariIni={setTanggalHariIni}
          periodeTarget={periodeTarget}
          onChangePeriodeTarget={setPeriodeTarget}
          statusFilter={statusFilter}
          onChangeStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          missingInput={report.missingInput}
          requiredCount={requiredDocs.length}
          submittedCount={submittedDocs.length}
          submittedConfirmedWhenEmpty={submittedConfirmedWhenEmpty}
          onToggleSubmittedConfirmed={setSubmittedConfirmedWhenEmpty}
          onLoadSample={handleLoadSample}
          onClearAll={handleClearAll}
        />

        <div className="min-w-0 flex-1">
          {activeTab === 'ringkasan' && (
            <SummaryAndStatusSection
              report={report}
              filteredRows={filteredRows}
              onInspectSubdit={handleInspectSubdit}
              onGoToDrafts={handleGoToDrafts}
              onGoToInput={() => setActiveTab('input')}
              onUpdateReminderCount={handleUpdateReminderCount}
            />
          )}

          {activeTab === 'kelengkapan' && (
            <CompletenessAuditSection
              report={report}
              filteredRows={filteredRows}
              selectedSubdit={selectedSubdit}
              onClearSelectedSubdit={() => setSelectedSubdit(null)}
            />
          )}

          {activeTab === 'draf' && (
            <ReminderDraftsSection
              report={report}
              filteredRows={filteredRows}
              selectedSubdit={selectedSubdit}
              onClearSelectedSubdit={() => setSelectedSubdit(null)}
              onUpdateReminderCount={handleUpdateReminderCount}
            />
          )}

          {activeTab === 'input' && (
            <DataInputWorkspace
              requiredDocs={requiredDocs}
              onChangeRequiredDocs={setRequiredDocs}
              submittedDocs={submittedDocs}
              onChangeSubmittedDocs={setSubmittedDocs}
              securityAlerts={report.securityAlerts}
              tanggalHariIni={tanggalHariIni}
            />
          )}
        </div>
      </main>

      <FullReportPreviewModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={report}
      />
    </div>
  );
}

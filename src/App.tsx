/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ActiveTab, 
  VolunteerServiceRecord, 
  InstructionRecord, 
  GratificationRecord, 
  UserProfile, 
  ActiveShiftTimer,
  OperationType,
  CalendarTask
} from './types';
import { 
  loadProfile, 
  saveProfile, 
  loadVolunteerRecords, 
  saveVolunteerRecords, 
  loadInstructionRecords, 
  saveInstructionRecords, 
  loadGratificationRecords, 
  saveGratificationRecords, 
  loadCalendarTasks,
  saveCalendarTasks,
  loadActiveShift, 
  saveActiveShift 
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { ActiveShiftWidget } from './components/ActiveShiftWidget';
import { DashboardView } from './components/DashboardView';
import { RecordsListView } from './components/RecordsListView';
import { CalendarView } from './components/CalendarView';
import { StatsView } from './components/StatsView';
import { VolunteerHoursView } from './components/VolunteerHoursView';
import { InstructionHoursView } from './components/InstructionHoursView';
import { GratificationsView } from './components/GratificationsView';
import { ExportReportsModal } from './components/ExportReportsModal';
import { ProfileSettingsView } from './components/ProfileSettingsView';
import { RecordModal, ModalRecordType } from './components/RecordModal';
import { PinLockModal } from './components/PinLockModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { AuthModal } from './components/AuthModal';
import { SupabaseConnectModal } from './components/SupabaseConnectModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthScreen } from './components/AuthScreen';
import confetti from 'canvas-confetti';
import { GoogleUserAccount } from './types';
import { initGoogleAuth } from './services/googleAuth';
import { isUserAuthenticated, logoutFirefighter, createGuestProfile, getSavedAccounts } from './services/authService';
import { 
  isSupabaseConfigured, 
  syncAllDataWithSupabase, 
  saveSupabaseVolunteerRecord, 
  deleteSupabaseVolunteerRecord,
  saveSupabaseInstructionRecord,
  deleteSupabaseInstructionRecord,
  saveSupabaseGratification,
  deleteSupabaseGratification,
  saveSupabaseGratificationsBulk,
  saveSupabaseCalendarTask,
  deleteSupabaseCalendarTask,
  saveSupabaseUserProfile,
  SUPABASE_PROJECT_NAME,
  SUPABASE_PROJECT_ID
} from './services/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Database, CheckCircle2, RefreshCw, CloudCheck, ShieldCheck } from 'lucide-react';

export default function App() {
  // Authentication Guard State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isUserAuthenticated());

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Core Data States
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [volunteerRecords, setVolunteerRecords] = useState<VolunteerServiceRecord[]>(() => loadVolunteerRecords());
  const [instructionRecords, setInstructionRecords] = useState<InstructionRecord[]>(() => loadInstructionRecords());
  const [gratificationRecords, setGratificationRecords] = useState<GratificationRecord[]>(() => loadGratificationRecords());
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>(() => loadCalendarTasks());
  const [activeShift, setActiveShift] = useState<ActiveShiftTimer>(() => loadActiveShift());

  // Date Filtering (Current year/month by default)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // Agosto 2026 default

  // Modals & UI States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [recordModalType, setRecordModalType] = useState<ModalRecordType>('volunteer');
  const [recordToEdit, setRecordToEdit] = useState<VolunteerServiceRecord | InstructionRecord | GratificationRecord | null>(null);
  const [prefillFromShift, setPrefillFromShift] = useState<{
    startTime: string;
    endTime: string;
    durationMinutes: number;
    serviceType: OperationType;
    incidentNumber?: string;
    vehicle?: string;
    notes?: string;
  } | null>(null);

  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

  // Security Lock
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const p = loadProfile();
    return p.pinEnabled && Boolean(p.pinHash);
  });

  // Shift Timer String (e.g. 02:45:12)
  const [shiftDurationStr, setShiftDurationStr] = useState<string>('00:00:00');

  // Supabase Cloud Sync States
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const isSupabaseReady = isSupabaseConfigured();

  // Ensure Dark Mode is enabled
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Master Initial Synchronization with Supabase Database (Project: jagamaal@gmail.com's Project)
  useEffect(() => {
    const runInitialSupabaseSync = async () => {
      if (!isSupabaseConfigured()) return;
      setIsSyncingSupabase(true);
      try {
        const result = await syncAllDataWithSupabase({
          volunteerRecords,
          instructionRecords,
          gratificationRecords,
          calendarTasks,
          profile,
          accounts: getSavedAccounts(),
        });

        if (result.success && result.remoteData) {
          if (result.remoteData.volunteerRecords) {
            setVolunteerRecords(result.remoteData.volunteerRecords);
          }
          if (result.remoteData.instructionRecords) {
            setInstructionRecords(result.remoteData.instructionRecords);
          }
          if (result.remoteData.gratificationRecords) {
            setGratificationRecords(result.remoteData.gratificationRecords);
          }
          if (result.remoteData.calendarTasks) {
            setCalendarTasks(result.remoteData.calendarTasks);
          }
          if (result.remoteData.profile) {
            setProfile((prev) => ({
              ...prev,
              ...result.remoteData!.profile,
              googleUser: prev.googleUser, // keep google user session
            }));
          }
          setLastSyncTime(new Date());
          setSyncToastMessage('Base de dados Supabase conectada e sincronizada!');
          setTimeout(() => setSyncToastMessage(null), 4000);
        }
      } catch (err) {
        console.warn('Initial Supabase sync check:', err);
      } finally {
        setIsSyncingSupabase(false);
      }
    };

    runInitialSupabaseSync();
  }, []);

  // Manual Trigger to Sync All Records with Supabase
  const handleManualSupabaseSync = async () => {
    setIsSyncingSupabase(true);
    setSyncToastMessage('A sincronizar todos os registos com Supabase...');
    try {
      const result = await syncAllDataWithSupabase({
        volunteerRecords,
        instructionRecords,
        gratificationRecords,
        calendarTasks,
        profile,
        accounts: getSavedAccounts(),
      });

      if (result.success && result.remoteData) {
        if (result.remoteData.volunteerRecords) setVolunteerRecords(result.remoteData.volunteerRecords);
        if (result.remoteData.instructionRecords) setInstructionRecords(result.remoteData.instructionRecords);
        if (result.remoteData.gratificationRecords) setGratificationRecords(result.remoteData.gratificationRecords);
        if (result.remoteData.calendarTasks) setCalendarTasks(result.remoteData.calendarTasks);
        if (result.remoteData.profile) setProfile((prev) => ({ ...prev, ...result.remoteData!.profile, googleUser: prev.googleUser }));
        setLastSyncTime(new Date());
        setSyncToastMessage(`✅ Sincronizados ${result.syncedCounts.volunteer} serv., ${result.syncedCounts.instruction} inst., ${result.syncedCounts.gratifications} gratif.`);
        setTimeout(() => setSyncToastMessage(null), 4500);
      } else {
        setSyncToastMessage(result.message || 'Erro ao sincronizar com Supabase.');
        setTimeout(() => setSyncToastMessage(null), 4500);
      }
    } catch (err: any) {
      setSyncToastMessage(`Falha na sincronização: ${err.message}`);
      setTimeout(() => setSyncToastMessage(null), 4500);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Initialize Firebase Google Auth listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (googleAccount) => {
        setProfile((prev) => {
          if (prev.googleUser?.id === googleAccount.id && prev.googleUser?.email === googleAccount.email) {
            return prev;
          }
          return {
            ...prev,
            googleUser: googleAccount,
          };
        });
      },
      () => {
        // No active Firebase session
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Save changes to localStorage and sync profile to Supabase
  useEffect(() => {
    saveProfile(profile);
    if (isSupabaseConfigured()) {
      saveSupabaseUserProfile(profile).catch((err) => console.warn('Supabase profile save note:', err));
    }
  }, [profile]);

  useEffect(() => {
    saveVolunteerRecords(volunteerRecords);
  }, [volunteerRecords]);

  useEffect(() => {
    saveInstructionRecords(instructionRecords);
  }, [instructionRecords]);

  useEffect(() => {
    saveGratificationRecords(gratificationRecords);
  }, [gratificationRecords]);

  useEffect(() => {
    saveCalendarTasks(calendarTasks);
  }, [calendarTasks]);

  useEffect(() => {
    saveActiveShift(activeShift);
  }, [activeShift]);

  // Live stopwatch counter for active shift
  useEffect(() => {
    if (!activeShift.isRunning || !activeShift.startTime) {
      setShiftDurationStr('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const start = new Date(activeShift.startTime!).getTime();
      const now = Date.now();
      const elapsedMs = Math.max(0, now - start);

      const totalSec = Math.floor(elapsedMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setShiftDurationStr(formatted);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeShift.isRunning, activeShift.startTime]);

  // Trigger celebratory confetti when target hours met
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  // Start shift
  const handleStartShift = (serviceType: OperationType, incidentNumber?: string, vehicle?: string, notes?: string) => {
    const shift: ActiveShiftTimer = {
      isRunning: true,
      startTime: new Date().toISOString(),
      serviceType,
      incidentNumber,
      vehicle,
      notes,
    };
    setActiveShift(shift);
  };

  // Stop shift and open modal to save
  const handleStopShift = () => {
    if (!activeShift.startTime) return;

    const startObj = new Date(activeShift.startTime);
    const endObj = new Date();

    const startH = startObj.getHours().toString().padStart(2, '0');
    const startM = startObj.getMinutes().toString().padStart(2, '0');
    const endH = endObj.getHours().toString().padStart(2, '0');
    const endM = endObj.getMinutes().toString().padStart(2, '0');

    const elapsedMinutes = Math.max(1, Math.round((endObj.getTime() - startObj.getTime()) / 60000));

    setPrefillFromShift({
      startTime: `${startH}:${startM}`,
      endTime: `${endH}:${endM}`,
      durationMinutes: elapsedMinutes,
      serviceType: activeShift.serviceType,
      incidentNumber: activeShift.incidentNumber,
      vehicle: activeShift.vehicle,
      notes: activeShift.notes,
    });

    setRecordToEdit(null);
    setRecordModalType('volunteer');
    setIsRecordModalOpen(true);

    // Reset active shift
    setActiveShift({
      isRunning: false,
      startTime: null,
      serviceType: 'Operação / Socorro',
    });
  };

  // Save / Update Volunteer Record
  const handleSaveVolunteer = (recordData: Omit<VolunteerServiceRecord, 'id' | 'createdAt'>, id?: string) => {
    if (id) {
      let updatedRec: VolunteerServiceRecord | undefined;
      setVolunteerRecords((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            updatedRec = { ...r, ...recordData };
            return updatedRec;
          }
          return r;
        })
      );
      if (updatedRec && isSupabaseConfigured()) {
        saveSupabaseVolunteerRecord(updatedRec).catch((err) => console.warn('Supabase volunteer update note:', err));
      }
    } else {
      const newRec: VolunteerServiceRecord = {
        id: `vol-${Date.now()}`,
        ...recordData,
        createdAt: Date.now(),
      };
      setVolunteerRecords((prev) => [newRec, ...prev]);
      if (isSupabaseConfigured()) {
        saveSupabaseVolunteerRecord(newRec).catch((err) => console.warn('Supabase volunteer insert note:', err));
      }
      triggerConfetti();
    }
  };

  // Save / Update Instruction Record
  const handleSaveInstruction = (recordData: Omit<InstructionRecord, 'id' | 'createdAt'>, id?: string) => {
    if (id) {
      let updatedRec: InstructionRecord | undefined;
      setInstructionRecords((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            updatedRec = { ...r, ...recordData };
            return updatedRec;
          }
          return r;
        })
      );
      if (updatedRec && isSupabaseConfigured()) {
        saveSupabaseInstructionRecord(updatedRec).catch((err) => console.warn('Supabase instruction update note:', err));
      }
    } else {
      const newRec: InstructionRecord = {
        id: `inst-${Date.now()}`,
        ...recordData,
        createdAt: Date.now(),
      };
      setInstructionRecords((prev) => [newRec, ...prev]);
      if (isSupabaseConfigured()) {
        saveSupabaseInstructionRecord(newRec).catch((err) => console.warn('Supabase instruction insert note:', err));
      }
      triggerConfetti();
    }
  };

  // Save / Update Gratification Record
  const handleSaveGratification = (recordData: Omit<GratificationRecord, 'id' | 'createdAt'>, id?: string) => {
    if (id) {
      let updatedRec: GratificationRecord | undefined;
      setGratificationRecords((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            updatedRec = { ...r, ...recordData };
            return updatedRec;
          }
          return r;
        })
      );
      if (updatedRec && isSupabaseConfigured()) {
        saveSupabaseGratification(updatedRec).catch((err) => console.warn('Supabase gratification update note:', err));
      }
    } else {
      const newRec: GratificationRecord = {
        id: `grat-${Date.now()}`,
        ...recordData,
        createdAt: Date.now(),
      };
      setGratificationRecords((prev) => [newRec, ...prev]);
      if (isSupabaseConfigured()) {
        saveSupabaseGratification(newRec).catch((err) => console.warn('Supabase gratification insert note:', err));
      }
      triggerConfetti();
    }
  };

  // Delete handlers
  const handleDeleteVolunteer = (id: string) => {
    setVolunteerRecords((prev) => prev.filter((r) => r.id !== id));
    if (isSupabaseConfigured()) {
      deleteSupabaseVolunteerRecord(id).catch((err) => console.warn('Supabase volunteer delete note:', err));
    }
  };

  const handleDeleteInstruction = (id: string) => {
    setInstructionRecords((prev) => prev.filter((r) => r.id !== id));
    if (isSupabaseConfigured()) {
      deleteSupabaseInstructionRecord(id).catch((err) => console.warn('Supabase instruction delete note:', err));
    }
  };

  const handleDeleteGratification = (id: string) => {
    setGratificationRecords((prev) => prev.filter((r) => r.id !== id));
    if (isSupabaseConfigured()) {
      deleteSupabaseGratification(id).catch((err) => console.warn('Supabase gratification delete note:', err));
    }
  };

  const handleToggleGratificationStatus = (id: string) => {
    let updatedRec: GratificationRecord | undefined;
    setGratificationRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const newStatus = r.paidStatus === 'Recebido' ? 'Pendente' : 'Recebido';
          updatedRec = {
            ...r,
            paidStatus: newStatus,
            paymentDate: newStatus === 'Recebido' ? new Date().toISOString().split('T')[0] : undefined,
          };
          return updatedRec;
        }
        return r;
      })
    );
    if (updatedRec && isSupabaseConfigured()) {
      saveSupabaseGratification(updatedRec).catch((err) => console.warn('Supabase gratification status note:', err));
    }
  };

  const handleValidateAllPendingGratifications = () => {
    const updatedList = gratificationRecords.map((r) =>
      r.paidStatus === 'Pendente'
        ? {
            ...r,
            paidStatus: 'Recebido' as const,
            paymentDate: new Date().toISOString().split('T')[0],
          }
        : r
    );
    setGratificationRecords(updatedList);
    if (isSupabaseConfigured() && updatedList.length > 0) {
      saveSupabaseGratificationsBulk(updatedList).catch((err) => console.warn('Supabase bulk validate gratifications note:', err));
    }
  };

  // Calendar Task Handlers
  const handleAddCalendarTask = (taskData: Omit<CalendarTask, 'id' | 'createdAt'>) => {
    const newTask: CalendarTask = {
      id: `task-${Date.now()}`,
      ...taskData,
      createdAt: Date.now(),
    };
    setCalendarTasks((prev) => [newTask, ...prev]);
    if (isSupabaseConfigured()) {
      saveSupabaseCalendarTask(newTask).catch((err) => console.warn('Supabase calendar task insert note:', err));
    }
  };

  const handleToggleCalendarTask = (taskId: string) => {
    let updatedTask: CalendarTask | undefined;
    setCalendarTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          updatedTask = { ...t, completed: !t.completed };
          return updatedTask;
        }
        return t;
      })
    );
    if (updatedTask && isSupabaseConfigured()) {
      saveSupabaseCalendarTask(updatedTask).catch((err) => console.warn('Supabase calendar task update note:', err));
    }
  };

  const handleDeleteCalendarTask = (taskId: string) => {
    setCalendarTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (isSupabaseConfigured()) {
      deleteSupabaseCalendarTask(taskId).catch((err) => console.warn('Supabase calendar task delete note:', err));
    }
  };

  // Restore All Data
  const handleRestoreAllData = (data: {
    volunteerRecords: VolunteerServiceRecord[];
    instructionRecords: InstructionRecord[];
    gratificationRecords: GratificationRecord[];
    profile: UserProfile;
  }) => {
    setVolunteerRecords(data.volunteerRecords);
    setInstructionRecords(data.instructionRecords);
    setGratificationRecords(data.gratificationRecords);
    setProfile(data.profile);
    if (isSupabaseConfigured()) {
      syncAllDataWithSupabase({
        volunteerRecords: data.volunteerRecords,
        instructionRecords: data.instructionRecords,
        gratificationRecords: data.gratificationRecords,
        calendarTasks,
        profile: data.profile,
        accounts: getSavedAccounts(),
      }).catch((err) => console.warn('Supabase restore sync note:', err));
    }
  };

  // Clear All Data
  const handleClearAllData = () => {
    setVolunteerRecords([]);
    setInstructionRecords([]);
    setGratificationRecords([]);
  };

  // Open Quick Add Modal
  const handleOpenQuickAdd = (type: ModalRecordType = 'volunteer') => {
    setRecordToEdit(null);
    setPrefillFromShift(null);
    setRecordModalType(type);
    setIsRecordModalOpen(true);
  };

  // Edit triggers
  const handleEditVolunteer = (record: VolunteerServiceRecord) => {
    setPrefillFromShift(null);
    setRecordToEdit(record);
    setRecordModalType('volunteer');
    setIsRecordModalOpen(true);
  };

  const handleEditInstruction = (record: InstructionRecord) => {
    setPrefillFromShift(null);
    setRecordToEdit(record);
    setRecordModalType('instruction');
    setIsRecordModalOpen(true);
  };

  const handleEditGratification = (record: GratificationRecord) => {
    setPrefillFromShift(null);
    setRecordToEdit(record);
    setRecordModalType('gratification');
    setIsRecordModalOpen(true);
  };

  const handleLogout = async () => {
    await logoutFirefighter();
    setIsAuthenticated(false);
    const guest = createGuestProfile();
    setProfile(guest);
    setActiveTab('dashboard');
  };

  // If not logged in, render the secure authentication gate page
  if (!isAuthenticated) {
    return (
      <AuthScreen
        onAuthenticated={(authProfile) => {
          setProfile(authProfile);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#08070A] text-zinc-100 flex flex-col lg:flex-row font-sans selection:bg-orange-900/50 selection:text-white w-full overflow-x-hidden">
      {/* PIN Lock Screen if locked */}
      {isLocked && (
        <PinLockModal
          isOpen={isLocked}
          profile={profile}
          onUnlock={() => setIsLocked(false)}
          onUpdateProfile={(updated) => setProfile(updated)}
          onLogout={handleLogout}
          onOpenAuthModal={() => {
            setIsLocked(false);
            setIsAuthModalOpen(true);
          }}
        />
      )}

      {/* Main Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        activeShift={activeShift}
        onOpenQuickAdd={() => handleOpenQuickAdd('volunteer')}
        onOpenGoogleAuth={() => setIsGoogleAuthOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenSupabaseConnect={() => setIsSupabaseModalOpen(true)}
        onSyncSupabase={handleManualSupabaseSync}
        isSyncingSupabase={isSyncingSupabase}
        onLockApp={() => setIsLocked(true)}
        onLogout={handleLogout}
        shiftDurationStr={shiftDurationStr}
      />

      {/* Main Content Area (offset by sidebar on desktop, padding for mobile bottom bar) */}
      <div className="flex-1 flex flex-col min-w-0 w-full lg:pl-64 pb-24 lg:pb-8">
        {/* Floating Supabase Cloud Sync Notification Banner */}
        <AnimatePresence>
          {(isSyncingSupabase || syncToastMessage) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="sticky top-14 lg:top-4 z-30 mx-auto px-4 py-1.5 rounded-full bg-[#10191F]/95 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2 shadow-lg backdrop-blur-md"
            >
              {isSyncingSupabase ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  <span>A sincronizar com base de dados Supabase...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{syncToastMessage}</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="w-full"
            >
              {/* Tab 1: Dashboard / Início */}
              {activeTab === 'dashboard' && (
                <DashboardView
                  volunteerRecords={volunteerRecords}
                  instructionRecords={instructionRecords}
                  gratificationRecords={gratificationRecords}
                  profile={profile}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                  onOpenNewRecord={(type) => handleOpenQuickAdd(type)}
                  onOpenReports={() => setIsReportsModalOpen(true)}
                  setActiveTab={setActiveTab}
                  onToggleGratificationStatus={handleToggleGratificationStatus}
                />
              )}

              {/* Tab 2: Registos (Combined All Records) */}
              {activeTab === 'records' && (
                <div className="space-y-6">
                  <ActiveShiftWidget
                    activeShift={activeShift}
                    shiftDurationStr={shiftDurationStr}
                    onStartShift={handleStartShift}
                    onStopShift={handleStopShift}
                  />
                  <RecordsListView
                    volunteerRecords={volunteerRecords}
                    instructionRecords={instructionRecords}
                    gratificationRecords={gratificationRecords}
                    profile={profile}
                    onAddNewRecord={(type) => handleOpenQuickAdd(type)}
                    onEditVolunteer={handleEditVolunteer}
                    onEditInstruction={handleEditInstruction}
                    onEditGratification={handleEditGratification}
                    onDeleteVolunteer={handleDeleteVolunteer}
                    onDeleteInstruction={handleDeleteInstruction}
                    onDeleteGratification={handleDeleteGratification}
                    onToggleGratificationStatus={handleToggleGratificationStatus}
                    onOpenReports={() => setIsReportsModalOpen(true)}
                  />
                </div>
              )}

              {/* Tab 3: Calendário */}
              {activeTab === 'calendar' && (
                <CalendarView
                  volunteerRecords={volunteerRecords}
                  instructionRecords={instructionRecords}
                  gratificationRecords={gratificationRecords}
                  calendarTasks={calendarTasks}
                  onAddTask={handleAddCalendarTask}
                  onToggleTask={handleToggleCalendarTask}
                  onDeleteTask={handleDeleteCalendarTask}
                  profile={profile}
                  onAddNewRecord={(type) => handleOpenQuickAdd(type)}
                  onSelectRecord={(r) => {
                    if ('serviceType' in r) handleEditVolunteer(r as VolunteerServiceRecord);
                    else if ('topic' in r) handleEditInstruction(r as InstructionRecord);
                    else handleEditGratification(r as GratificationRecord);
                  }}
                  onToggleGratificationStatus={handleToggleGratificationStatus}
                />
              )}

              {/* Tab 4: Voluntariado */}
              {activeTab === 'volunteer' && (
                <VolunteerHoursView
                  records={volunteerRecords}
                  profile={profile}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                  onAddNew={() => handleOpenQuickAdd('volunteer')}
                  onEdit={handleEditVolunteer}
                  onDelete={handleDeleteVolunteer}
                />
              )}

              {/* Tab 5: Instrução */}
              {activeTab === 'instruction' && (
                <InstructionHoursView
                  records={instructionRecords}
                  profile={profile}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                  onAddNew={() => handleOpenQuickAdd('instruction')}
                  onEdit={handleEditInstruction}
                  onDelete={handleDeleteInstruction}
                />
              )}

              {/* Tab 6: Gratificações */}
              {activeTab === 'gratifications' && (
                <GratificationsView
                  records={gratificationRecords}
                  profile={profile}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                  onAddNew={() => handleOpenQuickAdd('gratification')}
                  onEdit={handleEditGratification}
                  onDelete={handleDeleteGratification}
                  onToggleStatus={handleToggleGratificationStatus}
                  onValidateAllPending={handleValidateAllPendingGratifications}
                />
              )}

              {/* Tab 7: Estatísticas */}
              {activeTab === 'stats' && (
                <StatsView
                  volunteerRecords={volunteerRecords}
                  instructionRecords={instructionRecords}
                  gratificationRecords={gratificationRecords}
                  profile={profile}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                  onOpenSupabaseConnect={() => setIsSupabaseModalOpen(true)}
                />
              )}

              {/* Tab 8: Relatórios / Exportar */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <ExportReportsModal
                    isOpen={true}
                    onClose={() => setActiveTab('dashboard')}
                    volunteerRecords={volunteerRecords}
                    instructionRecords={instructionRecords}
                    gratificationRecords={gratificationRecords}
                    profile={profile}
                    initialYear={selectedYear}
                    initialMonth={selectedMonth}
                  />
                </div>
              )}

              {/* Tab 9: Definições & Perfil */}
              {activeTab === 'settings' && (
                <ProfileSettingsView
                  profile={profile}
                  onUpdateProfile={setProfile}
                  onOpenGoogleAuth={() => setIsGoogleAuthOpen(true)}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                  onOpenSupabaseConnect={() => setIsSupabaseModalOpen(true)}
                  onLogout={handleLogout}
                  volunteerRecords={volunteerRecords}
                  instructionRecords={instructionRecords}
                  gratificationRecords={gratificationRecords}
                  onRestoreAllData={handleRestoreAllData}
                  onClearAllData={handleClearAllData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Mobile/Tablet Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => handleOpenQuickAdd('volunteer')}
        activeShift={activeShift}
      />

      {/* Firefighter Authentication Modal (Email e Palavra-passe) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentProfile={profile}
        onLogout={handleLogout}
        onProfileUpdated={(updatedProfile) => {
          setProfile(updatedProfile);
          setIsAuthenticated(true);
          // If PIN is enabled and hash exists, prompt or refresh lock state
          if (updatedProfile.pinEnabled && updatedProfile.pinHash) {
            setIsLocked(false);
          }
        }}
      />

      {/* Supabase Database Connection Modal */}
      <SupabaseConnectModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnectionChanged={() => {
          // Trigger re-render to update connection badges
          setProfile({ ...profile });
        }}
      />

      {/* Google Account Authentication & Synchronization Modal */}
      <GoogleAuthModal
        isOpen={isGoogleAuthOpen}
        onClose={() => setIsGoogleAuthOpen(false)}
        profile={profile}
        currentAccount={profile.googleUser}
        onUpdateGoogleUser={(user) => {
          setProfile((prev) => ({
            ...prev,
            googleUser: user,
            autoEmailAddress: user ? user.email : prev.autoEmailAddress,
          }));
        }}
      />

      {/* Record Create/Edit Modal */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setRecordToEdit(null);
          setPrefillFromShift(null);
        }}
        initialType={recordModalType}
        recordToEdit={recordToEdit}
        prefillFromActiveShift={prefillFromShift}
        onSaveVolunteer={handleSaveVolunteer}
        onSaveInstruction={handleSaveInstruction}
        onSaveGratification={handleSaveGratification}
      />

      {/* Reports Modal (when triggered from buttons) */}
      {isReportsModalOpen && (
        <ExportReportsModal
          isOpen={isReportsModalOpen}
          onClose={() => setIsReportsModalOpen(false)}
          volunteerRecords={volunteerRecords}
          instructionRecords={instructionRecords}
          gratificationRecords={gratificationRecords}
          profile={profile}
          initialYear={selectedYear}
          initialMonth={selectedMonth}
        />
      )}
    </div>
  );
}


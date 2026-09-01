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
import { isUserAuthenticated, logoutFirefighter, createGuestProfile } from './services/authService';

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

  // Ensure Dark Mode is enabled
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

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

  // Save changes to localStorage
  useEffect(() => {
    saveProfile(profile);
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
      setVolunteerRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...recordData } : r))
      );
    } else {
      const newRec: VolunteerServiceRecord = {
        id: `vol-${Date.now()}`,
        ...recordData,
        createdAt: Date.now(),
      };
      setVolunteerRecords((prev) => [newRec, ...prev]);
      triggerConfetti();
    }
  };

  // Save / Update Instruction Record
  const handleSaveInstruction = (recordData: Omit<InstructionRecord, 'id' | 'createdAt'>, id?: string) => {
    if (id) {
      setInstructionRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...recordData } : r))
      );
    } else {
      const newRec: InstructionRecord = {
        id: `inst-${Date.now()}`,
        ...recordData,
        createdAt: Date.now(),
      };
      setInstructionRecords((prev) => [newRec, ...prev]);
      triggerConfetti();
    }
  };

  // Save / Update Gratification Record
  const handleSaveGratification = (recordData: Omit<GratificationRecord, 'id' | 'createdAt'>, id?: string) => {
    if (id) {
      setGratificationRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...recordData } : r))
      );
    } else {
      const newRec: GratificationRecord = {
        id: `grat-${Date.now()}`,
        ...recordData,
        createdAt: Date.now(),
      };
      setGratificationRecords((prev) => [newRec, ...prev]);
      triggerConfetti();
    }
  };

  // Delete handlers
  const handleDeleteVolunteer = (id: string) => {
    setVolunteerRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeleteInstruction = (id: string) => {
    setInstructionRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeleteGratification = (id: string) => {
    setGratificationRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleToggleGratificationStatus = (id: string) => {
    setGratificationRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const newStatus = r.paidStatus === 'Recebido' ? 'Pendente' : 'Recebido';
          return {
            ...r,
            paidStatus: newStatus,
            paymentDate: newStatus === 'Recebido' ? new Date().toISOString().split('T')[0] : undefined,
          };
        }
        return r;
      })
    );
  };

  const handleValidateAllPendingGratifications = () => {
    setGratificationRecords((prev) =>
      prev.map((r) =>
        r.paidStatus === 'Pendente'
          ? {
              ...r,
              paidStatus: 'Recebido',
              paymentDate: new Date().toISOString().split('T')[0],
            }
          : r
      )
    );
  };

  // Calendar Task Handlers
  const handleAddCalendarTask = (taskData: Omit<CalendarTask, 'id' | 'createdAt'>) => {
    const newTask: CalendarTask = {
      id: `task-${Date.now()}`,
      ...taskData,
      createdAt: Date.now(),
    };
    setCalendarTasks((prev) => [newTask, ...prev]);
  };

  const handleToggleCalendarTask = (taskId: string) => {
    setCalendarTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteCalendarTask = (taskId: string) => {
    setCalendarTasks((prev) => prev.filter((t) => t.id !== taskId));
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
        onLockApp={() => setIsLocked(true)}
        onLogout={handleLogout}
        shiftDurationStr={shiftDurationStr}
      />

      {/* Main Content Area (offset by sidebar on desktop, padding for mobile bottom bar) */}
      <div className="flex-1 flex flex-col min-w-0 w-full lg:pl-64 pb-24 lg:pb-8">
        <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          
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
              onLogout={handleLogout}
              volunteerRecords={volunteerRecords}
              instructionRecords={instructionRecords}
              gratificationRecords={gratificationRecords}
              onRestoreAllData={handleRestoreAllData}
              onClearAllData={handleClearAllData}
            />
          )}
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


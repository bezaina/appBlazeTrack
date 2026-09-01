import React, { useState, useRef } from 'react';
import { 
  User, 
  Shield, 
  Lock, 
  Database, 
  Upload, 
  Download, 
  RotateCcw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Award, 
  Clock, 
  Bell, 
  WifiOff, 
  ShieldCheck,
  Euro,
  Mail,
  Send,
  FileSpreadsheet,
  FileCode,
  FileCheck,
  KeyRound,
  UserPlus,
  Users,
  LogOut,
  UserX,
  Calendar,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { UserProfile, VolunteerServiceRecord, InstructionRecord, GratificationRecord } from '../types';
import { downloadJsonBackup, exportCsvReport, generatePdfReport } from '../utils/exportUtils';
import { sendReportEmail, EmailDispatchResult } from '../services/emailService';
import { initialVolunteerRecords, initialInstructionRecords, initialGratificationRecords, initialUserProfile, DEFAULT_GRATIFICATION_RATES } from '../utils/mockData';
import { 
  logoutFirefighter, 
  deleteFirefighterAccount, 
  createGuestProfile,
  getActiveAccount,
  accountToProfile,
  getSavedAccounts,
  updateActiveAccountFromProfile 
} from '../services/authService';
import { EmailServiceConfigModal } from './EmailServiceConfigModal';

interface ProfileSettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onOpenGoogleAuth: () => void;
  onOpenAuthModal?: () => void;
  onOpenSupabaseConnect?: () => void;
  onLogout?: () => void;
  volunteerRecords: VolunteerServiceRecord[];
  instructionRecords: InstructionRecord[];
  gratificationRecords: GratificationRecord[];
  onRestoreAllData: (data: {
    volunteerRecords: VolunteerServiceRecord[];
    instructionRecords: InstructionRecord[];
    gratificationRecords: GratificationRecord[];
    profile: UserProfile;
  }) => void;
  onClearAllData: () => void;
}

const RANKS = [
  'Estagiário',
  'Bombeiro de 3ª Classe',
  'Bombeiro de 2ª Classe',
  'Bombeiro de 1ª Classe',
  'Subchefe',
  'Chefe',
  'Adjunto de Comando',
  '2.º Comandante',
  'Comandante',
  'Quadro de Honra / Reserva',
];

const GRATIFICATION_RATE_KEYS = [
  'DECIR',
  'DECIR 1/2',
  'BAL',
  'Subida de Categoria',
  'Prevenção',
  'DIPIR',
  'Outra Gratificação',
];

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onOpenGoogleAuth,
  onOpenAuthModal,
  onOpenSupabaseConnect,
  onLogout,
  volunteerRecords,
  instructionRecords,
  gratificationRecords,
  onRestoreAllData,
  onClearAllData,
}) => {
  const [name, setName] = useState(profile.name);
  const [firefighterNumber, setFirefighterNumber] = useState(profile.firefighterNumber);
  const [corpsName, setCorpsName] = useState(profile.corpsName);
  const [rank, setRank] = useState(profile.rank);
  const [monthlyTargetHours, setMonthlyTargetHours] = useState(profile.monthlyTargetHours || 35);
  const [pinEnabled, setPinEnabled] = useState(profile.pinEnabled ?? false);
  const [pinCode, setPinCode] = useState(profile.pinHash || '');
  const [showReminder, setShowReminder] = useState(profile.showReminder ?? true);

  // Gratification rates state
  const [rates, setRates] = useState<Record<string, number>>(
    profile.gratificationRates || DEFAULT_GRATIFICATION_RATES
  );

  // Email report state
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(profile.autoEmailReportEnabled ?? true);
  const [emailAddress, setEmailAddress] = useState(profile.autoEmailAddress || 'JAGAMAAL@gmail.com');
  const [emailTime, setEmailTime] = useState(profile.autoEmailTime || '20:00');
  const [emailReportPeriod, setEmailReportPeriod] = useState<'monthly' | 'annual'>(profile.autoEmailReportPeriod || 'monthly');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentResult, setEmailSentResult] = useState<EmailDispatchResult | null>(null);
  const [isEmailConfigModalOpen, setIsEmailConfigModalOpen] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteProfile, setConfirmDeleteProfile] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await logoutFirefighter();
    setConfirmLogout(false);
    if (onLogout) {
      onLogout();
    } else {
      const guest = createGuestProfile();
      onUpdateProfile(guest);
      setName(guest.name);
      setFirefighterNumber(guest.firefighterNumber);
      setCorpsName(guest.corpsName);
      setRank(guest.rank);
      setFeedbackMessage({ type: 'success', text: 'Sessão terminada.' });
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  const handleDeleteProfile = async () => {
    const targetId = profile.accountId || profile.firefighterNumber;
    const res = await deleteFirefighterAccount(targetId);
    setConfirmDeleteProfile(false);
    
    if (onLogout) {
      onLogout();
    } else {
      if (res.remainingAccounts.length > 0) {
        const nextAcc = res.remainingAccounts[0];
        const nextProf = accountToProfile(nextAcc);
        onUpdateProfile(nextProf);
        setName(nextProf.name);
        setFirefighterNumber(nextProf.firefighterNumber);
        setCorpsName(nextProf.corpsName);
        setRank(nextProf.rank);
      } else {
        const guest = createGuestProfile();
        onUpdateProfile(guest);
        setName(guest.name);
        setFirefighterNumber(guest.firefighterNumber);
        setCorpsName(guest.corpsName);
        setRank(guest.rank);
      }
      setFeedbackMessage({ 
        type: 'success', 
        text: 'O seu perfil e conta foram eliminados com sucesso.' 
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const handleRateChange = (key: string, value: string) => {
    const num = parseFloat(value) || 0;
    setRates((prev) => ({
      ...prev,
      [key]: num,
    }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (pinEnabled && (!pinCode || pinCode.length !== 4 || !/^\d{4}$/.test(pinCode))) {
      setFeedbackMessage({ type: 'error', text: 'O PIN de segurança deve ter exatamente 4 dígitos numéricos.' });
      return;
    }

    const pinChanged = profile.pinHash !== pinCode;

    const updated: UserProfile = {
      ...profile,
      name: name.trim(),
      firefighterNumber: firefighterNumber.trim(),
      corpsName: corpsName.trim(),
      rank,
      monthlyTargetHours: Number(monthlyTargetHours) || 35,
      pinEnabled,
      pinHash: pinCode,
      showReminder,
      gratificationRates: rates,
      autoEmailReportEnabled: autoEmailEnabled,
      autoEmailAddress: emailAddress.trim(),
      autoEmailTime: emailTime,
      autoEmailReportPeriod: emailReportPeriod,
    };

    onUpdateProfile(updated);
    updateActiveAccountFromProfile(updated);

    if (pinEnabled && pinChanged) {
      setFeedbackMessage({ 
        type: 'success', 
        text: 'Novo PIN de 4 dígitos guardado com sucesso! O PIN padrão foi imediatamente desativado.' 
      });
    } else {
      setFeedbackMessage({ 
        type: 'success', 
        text: 'Perfil, tabela de gratificações e definições de segurança guardadas com sucesso.' 
      });
    }
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleSendEmailReportNow = async () => {
    if (!emailAddress.trim() || !emailAddress.includes('@')) {
      setFeedbackMessage({ type: 'error', text: 'Por favor, indique um endereço de email válido.' });
      return;
    }

    setIsSendingEmail(true);
    setEmailSentResult(null);

    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const result = await sendReportEmail(
        volunteerRecords,
        instructionRecords,
        gratificationRecords,
        profile,
        {
          to: emailAddress.trim(),
          reportType: emailReportPeriod,
          selectedYear: currentYear,
          selectedMonth: currentMonth,
          category: 'all',
          includePdfAttachment: true,
        }
      );

      setEmailSentResult(result);
      setFeedbackMessage({
        type: 'success',
        text: result.message || `Relatório (${emailReportPeriod === 'annual' ? 'Anual' : 'Mensal'}) enviado com sucesso para ${emailAddress}.`,
      });
      setTimeout(() => setFeedbackMessage(null), 6000);
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Erro ao processar envio de email.',
      });
      setTimeout(() => setFeedbackMessage(null), 5000);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDownloadBackup = () => {
    downloadJsonBackup({
      volunteerRecords,
      instructionRecords,
      gratificationRecords,
      profile,
    });
    setFeedbackMessage({ type: 'success', text: 'Ficheiro de backup JSON transferido para o seu dispositivo.' });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (!parsed.volunteerRecords && !parsed.instructionRecords && !parsed.gratificationRecords) {
          throw new Error('Formato de ficheiro inválido');
        }

        onRestoreAllData({
          volunteerRecords: parsed.volunteerRecords || [],
          instructionRecords: parsed.instructionRecords || [],
          gratificationRecords: parsed.gratificationRecords || [],
          profile: parsed.profile || profile,
        });

        if (parsed.profile) {
          setName(parsed.profile.name || name);
          setFirefighterNumber(parsed.profile.firefighterNumber || firefighterNumber);
          setCorpsName(parsed.profile.corpsName || corpsName);
          setRank(parsed.profile.rank || rank);
          if (parsed.profile.gratificationRates) {
            setRates(parsed.profile.gratificationRates);
          }
          if (parsed.profile.autoEmailAddress) {
            setEmailAddress(parsed.profile.autoEmailAddress);
          }
        }

        setFeedbackMessage({ type: 'success', text: 'Dados restaurados com sucesso a partir do backup.' });
      } catch (err) {
        setFeedbackMessage({ type: 'error', text: 'Erro ao ler ficheiro de backup. Certifique-se de que é um ficheiro JSON válido.' });
      }
      setTimeout(() => setFeedbackMessage(null), 4000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadDemoData = () => {
    onRestoreAllData({
      volunteerRecords: initialVolunteerRecords,
      instructionRecords: initialInstructionRecords,
      gratificationRecords: initialGratificationRecords,
      profile: initialUserProfile,
    });
    setName(initialUserProfile.name);
    setFirefighterNumber(initialUserProfile.firefighterNumber);
    setCorpsName(initialUserProfile.corpsName);
    setRank(initialUserProfile.rank);
    setRates(initialUserProfile.gratificationRates || DEFAULT_GRATIFICATION_RATES);
    setEmailAddress(initialUserProfile.autoEmailAddress || 'JAGAMAAL@gmail.com');
    setFeedbackMessage({ type: 'success', text: 'Dados de demonstração carregados com sucesso.' });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[#121216] rounded-2xl p-5 border border-[#1F1F25] shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#181820] border border-[#242430] text-zinc-200 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
              Perfil do Bombeiro & Definições
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Dados operacionais, tabela de valores de gratificação, relatórios automáticos e segurança.
            </p>
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-center space-x-2 border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
              : 'bg-red-950/60 text-red-300 border-red-800/60'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Section -1: Firefighter Account & Multi-login System */}
      <div className="bg-[#121216] rounded-2xl p-5 sm:p-6 border border-[#262035] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#201A2C] pb-3">
          <h3 className="font-bold text-base text-zinc-100 flex items-center space-x-2.5">
            <KeyRound className="w-5 h-5 text-orange-400" />
            <span>Sistema de Acesso & Identificação Operacional</span>
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-orange-950/80 border border-orange-800/60 text-orange-300 text-xs font-bold font-mono">
            Nº {profile.firefighterNumber || 'BV'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#181322] border border-[#2B203C] rounded-xl">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-red-950/60">
              {profile.name ? profile.name.charAt(0) : 'B'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-white text-base block">
                  {profile.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-orange-300 text-[11px] font-mono font-bold">
                  {profile.rank}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {profile.corpsName} • Login por Nº Mecanográfico, PIN, Utilizador ou Email
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!confirmLogout ? (
              <button
                type="button"
                onClick={() => setConfirmLogout(true)}
                className="px-3.5 py-2.5 bg-[#201A2C] hover:bg-[#2A223B] border border-[#352B49] text-zinc-300 hover:text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-zinc-400" />
                <span>Sair da Conta</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 bg-[#241B33] border border-orange-700/60 p-1 rounded-xl">
                <span className="text-[11px] text-orange-300 font-bold px-1.5">Sair?</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmLogout(false)}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Não
                </button>
              </div>
            )}

            {onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl text-xs font-bold shadow-md shadow-red-950/50 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Autenticação / Conta</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section 0: Google Account Status & Cloud Sync */}
      <div className="bg-[#121216] rounded-2xl p-5 sm:p-6 border border-[#1F1F25] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#1F1F25] pb-3">
          <h3 className="font-bold text-base text-zinc-100 flex items-center space-x-2.5">
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Conta Google & Sincronização</span>
          </h3>
          {profile.googleUser ? (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-bold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Conectado</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-semibold">
              Não autenticado
            </span>
          )}
        </div>

        {profile.googleUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#181520] border border-[#2B2338] rounded-xl">
            <div className="flex items-center space-x-3.5">
              {profile.googleUser.picture ? (
                <img
                  src={profile.googleUser.picture}
                  alt={profile.googleUser.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-orange-500/60"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                  {profile.googleUser.name.charAt(0)}
                </div>
              )}
              <div>
                <span className="font-extrabold text-white text-sm sm:text-base block">
                  {profile.googleUser.name}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {profile.googleUser.email}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenGoogleAuth}
              className="px-4 py-2 bg-[#221C2E] hover:bg-[#2C243B] border border-[#342B46] text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Gerir Conta Google
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#181520] border border-[#2B2338] rounded-xl">
            <div>
              <span className="font-bold text-sm text-white block">
                Inicie sessão com a sua conta Google
              </span>
              <p className="text-xs text-zinc-400 mt-0.5">
                Permite sincronizar escalas com o Google Calendar e receber resumos diários no seu Gmail.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenGoogleAuth}
              className="px-5 py-2.5 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl text-xs font-bold shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer shrink-0"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Login com Google</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: Identification */}
        <div className="bg-[#121216] rounded-2xl p-5 sm:p-6 border border-[#1F1F25] shadow-xs space-y-4">
          <h3 className="font-bold text-base text-zinc-100 border-b border-[#1F1F25] pb-3 flex items-center space-x-2">
            <Award className="w-4 h-4 text-red-500" />
            <span>Dados de Identificação Operacional</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nome do Bombeiro(a) *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Gonçalo Silva"
                className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                N.º Mecanográfico / N.º Bombeiro *
              </label>
              <input
                type="text"
                required
                value={firefighterNumber}
                onChange={(e) => setFirefighterNumber(e.target.value)}
                placeholder="Ex: BV-1428"
                className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-red-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Quartel / Corpo de Bombeiros *
              </label>
              <input
                type="text"
                required
                value={corpsName}
                onChange={(e) => setCorpsName(e.target.value)}
                placeholder="Ex: Bombeiros Voluntários"
                className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Posto / Categoria no Quadro Ativo *
              </label>
              <select
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none font-medium cursor-pointer"
              >
                {RANKS.map((r) => (
                  <option key={r} value={r} className="bg-[#18181F] text-zinc-200">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Meta de Voluntariado Mensal (Horas)</span>
              </label>
              <input
                type="number"
                min="5"
                max="200"
                value={monthlyTargetHours}
                onChange={(e) => setMonthlyTargetHours(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none font-mono"
              />
            </div>

            <div className="flex items-center space-x-3 pt-4 sm:pt-6">
              <input
                type="checkbox"
                id="showReminderToggle"
                checked={showReminder}
                onChange={(e) => setShowReminder(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded bg-[#18181F] border-[#282834] focus:ring-red-500 cursor-pointer"
              />
              <label htmlFor="showReminderToggle" className="text-xs font-medium text-zinc-300 cursor-pointer">
                Exibir lembretes de gratificações pendentes no Dashboard
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Gratification Rates Configuration (€) */}
        <div className="bg-[#121216] rounded-2xl p-5 sm:p-6 border border-[#1F1F25] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F1F25] pb-3">
            <h3 className="font-bold text-base text-zinc-100 flex items-center space-x-2">
              <Euro className="w-4 h-4 text-emerald-400" />
              <span>Configuração dos Valores das Gratificações (€)</span>
            </h3>
            <span className="text-xs text-zinc-400">Preenchimento automático ao criar registo</span>
          </div>

          <p className="text-xs text-zinc-400">
            Defina o valor base por diária ou serviço para cada modalidade (ex: DECIR: 84€, DECIR 1/2: 42€, BAL: 65€).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {GRATIFICATION_RATE_KEYS.map((gType) => (
              <div key={gType} className="p-3 bg-[#181820] rounded-xl border border-[#242430] space-y-1">
                <label className="block text-xs font-bold text-zinc-200 truncate">
                  {gType}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={rates[gType] !== undefined ? rates[gType] : (DEFAULT_GRATIFICATION_RATES[gType] || 0)}
                    onChange={(e) => handleRateChange(gType, e.target.value)}
                    className="w-full pl-3 pr-7 py-1.5 text-sm bg-[#14141A] border border-[#282834] rounded-lg text-zinc-100 font-mono font-bold outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs font-bold text-zinc-500">€</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Automated Email Reports Settings (20:00 Daily) */}
        <div className="bg-[#121216] rounded-2xl p-5 sm:p-6 border border-[#1F1F25] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F1F25] pb-3">
            <h3 className="font-bold text-base text-zinc-100 flex items-center space-x-2">
              <Mail className="w-4 h-4 text-orange-500" />
              <span>Relatório Automático & Envio por Email</span>
            </h3>
            <span className="text-xs text-zinc-400">PDF, CSV & Resumo Oficial</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#181820] rounded-xl border border-[#242430]">
            <div>
              <span className="font-semibold text-sm text-zinc-100 block">
                Ativar Envio Automático de Relatórios
              </span>
              <span className="text-xs text-zinc-400">
                Compilação periódica com horas de socorro, instrução e gratificações enviadas para o seu email.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoEmailEnabled}
                onChange={(e) => setAutoEmailEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#242430] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {autoEmailEnabled && (
            <div className="space-y-3 p-3.5 bg-[#181820] rounded-xl border border-[#242430]">
              {/* Type of Report: Mensal vs Anual */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-orange-400" />
                  <span>Tipo de Relatório a Enviar</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailReportPeriod('monthly')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      emailReportPeriod === 'monthly'
                        ? 'border-orange-500 bg-orange-950/70 text-orange-300 shadow-xs'
                        : 'border-[#282834] bg-[#14141A] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Relatório Mensal (Mês Atual)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailReportPeriod('annual')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      emailReportPeriod === 'annual'
                        ? 'border-orange-500 bg-orange-950/70 text-orange-300 shadow-xs'
                        : 'border-[#282834] bg-[#14141A] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Relatório Anual (Ano Completo)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-orange-400" />
                    <span>Email de Destino</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="exemplo@gmail.com"
                    className="w-full px-3 py-2 text-sm bg-[#14141A] border border-[#282834] rounded-xl text-zinc-100 focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Hora de Envio Diário</span>
                  </label>
                  <input
                    type="time"
                    value={emailTime}
                    onChange={(e) => setEmailTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#14141A] border border-[#282834] rounded-xl text-zinc-100 focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                  />
                </div>
              </div>

              {emailSentResult && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800/50 rounded-xl space-y-2 text-xs text-emerald-200">
                  <div className="flex items-center space-x-2 font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{emailSentResult.message}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {emailSentResult.gmailComposeUrl && (
                      <a
                        href={emailSentResult.gmailComposeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1 px-2.5 bg-[#14141A] hover:bg-[#202028] border border-emerald-700/50 rounded-lg text-emerald-300 text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Abrir no Gmail Web</span>
                      </a>
                    )}
                    {emailSentResult.pdfBlobUrl && (
                      <a
                        href={emailSentResult.pdfBlobUrl}
                        download={`Relatorio_Bombeiro_${profile.firefighterNumber}.pdf`}
                        className="py-1 px-2.5 bg-[#14141A] hover:bg-[#202028] border border-emerald-700/50 rounded-lg text-zinc-300 text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>Descarregar PDF Anexo</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#242430]">
                <div className="flex items-center space-x-2 text-xs text-zinc-400">
                  <span className="flex items-center space-x-1 text-orange-400"><FileSpreadsheet className="w-3.5 h-3.5" /><span>CSV</span></span>
                  <span>•</span>
                  <span className="flex items-center space-x-1 text-red-400"><FileCheck className="w-3.5 h-3.5" /><span>PDF</span></span>
                  <span>•</span>
                  <span className="flex items-center space-x-1 text-emerald-400"><FileCode className="w-3.5 h-3.5" /><span>JSON</span></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEmailConfigModalOpen(true)}
                    className="px-3 py-2 bg-[#20202C] hover:bg-[#2A2A3A] border border-[#34344A] text-zinc-200 hover:text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-orange-400" />
                    <span>Configurar & Testar SMTP</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendEmailReportNow}
                    disabled={isSendingEmail}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>A Enviar Relatório...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Relatório ({emailReportPeriod === 'annual' ? 'Anual' : 'Mensal'}) Agora</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick SMTP Diagnostics Notice */}
              <div className="p-3 bg-[#161622] rounded-xl border border-[#262638] flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-zinc-300">
                    <strong>Serviço SMTP Supabase:</strong> Pronto para envio de verificações, recuperação de PIN e redefinição de palavra-passe.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmailConfigModalOpen(true)}
                  className="text-orange-400 hover:text-orange-300 font-bold underline text-xs cursor-pointer shrink-0 ml-2"
                >
                  Abrir Diagnóstico
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Security & PIN Settings */}
        <div className="bg-[#121216] rounded-2xl p-5 sm:p-6 border border-[#1F1F25] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F1F25] pb-3">
            <h3 className="font-bold text-base text-zinc-100 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <span>Proteção de Dados & Código PIN</span>
            </h3>
            <span className="text-xs text-zinc-400">Proteção de acesso</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#181820] rounded-xl border border-[#242430]">
            <div>
              <span className="font-semibold text-sm text-zinc-100 block">
                Bloqueio de Ecrã com Código PIN
              </span>
              <span className="text-xs text-zinc-400">
                Por definição não existe PIN. Ao ativar esta função, define o seu PIN de 4 dígitos para proteger o acesso.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pinEnabled}
                onChange={(e) => setPinEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#242430] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          {pinEnabled && (
            <div className="p-4 bg-red-950/20 rounded-xl border border-red-900/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-200">
                    Definir Código PIN (4 dígitos numéricos)
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Introduza o código de 4 dígitos a solicitar ao entrar na aplicação.
                  </span>
                </div>
                {pinCode && pinCode.length === 4 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 w-fit">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    PIN Definido ({pinCode.length}/4)
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="password"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Ex: 5678"
                  className="w-36 px-3 py-2.5 text-center text-xl font-mono font-bold tracking-widest bg-[#18181F] border border-[#282834] focus:border-red-500 rounded-xl text-zinc-100 outline-none transition-colors"
                />
                <span className="text-xs text-zinc-400 font-mono">
                  {pinCode.length}/4 dígitos
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
                      setPinCode(randomPin);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#20202A] hover:bg-[#282836] border border-[#303040] text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Gerar Aleatório
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 bg-[#14141A] p-2.5 rounded-lg border border-[#22222E]">
                • <strong className="text-zinc-200">Segurança:</strong> O PIN só pode ser alterado ou recuperado mediante autorização por email com código temporário enviado para o seu endereço registado.
              </p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Guardar Todas as Definições
          </button>
        </div>
      </form>

      {/* Section 5: Supabase Cloud Database Integration & Migrations (Only visible for Administrator accounts) */}
      {profile.role === 'admin' && (
        <div className="bg-[#121216] rounded-2xl p-5 sm:p-6 border border-[#1F1F25] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F1F25] pb-3">
            <h3 className="font-bold text-base text-zinc-100 flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Integração Supabase & Migrações PostgreSQL</span>
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 font-bold uppercase tracking-wider">
              Área de Administrador
            </span>
          </div>

          <p className="text-xs text-zinc-400">
            O BLAZETRACK inclui o ficheiro de migração pronto a executar no editor SQL do seu projeto Supabase (<code className="text-emerald-300 font-mono">/supabase/migrations/20260831000000_create_blazetrack_schema.sql</code>), com tabelas estruturadas, restrições e políticas de segurança RLS (Row Level Security).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-[#181820] rounded-xl border border-[#242430] space-y-2">
              <span className="font-bold text-zinc-200 block text-xs flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tabelas Criadas na Migração</span>
              </span>
              <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                <li><strong className="text-zinc-200">user_profiles:</strong> Dados e metas</li>
                <li><strong className="text-zinc-200">volunteer_services:</strong> Ocorrências</li>
                <li><strong className="text-zinc-200">instruction_records:</strong> Instrução ENB</li>
                <li><strong className="text-zinc-200">gratification_records:</strong> DECIR/BAL</li>
                <li><strong className="text-zinc-200">calendar_tasks:</strong> Escalas e turnos</li>
              </ul>
            </div>

            <div className="p-3.5 bg-[#181820] rounded-xl border border-[#242430] flex flex-col justify-between space-y-2">
              <div>
                <span className="font-bold text-zinc-200 block text-xs flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ligação Rápida via Interface</span>
                </span>
                <p className="text-zinc-400 mt-1">
                  Conecte a sua base de dados Supabase diretamente introduzindo o URL e a chave anon no modal de conexão.
                </p>
              </div>
              {onOpenSupabaseConnect && (
                <button
                  type="button"
                  onClick={onOpenSupabaseConnect}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Configurar Conexão Supabase</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Offline Mode & Storage Info */}

      <div className="bg-[#121216] rounded-2xl p-5 sm:p-6 border border-[#1F1F25] shadow-xs space-y-4">
        <h3 className="font-bold text-base text-zinc-100 flex items-center space-x-2 border-b border-[#1F1F25] pb-3">
          <Database className="w-4 h-4 text-zinc-400" />
          <span>Cópia de Segurança & Gestão de Dados</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="p-4 rounded-xl border border-[#242430] hover:border-zinc-700 bg-[#181820] hover:bg-[#1E1E26] text-left transition-colors cursor-pointer flex items-center space-x-3"
          >
            <div className="w-10 h-10 rounded-xl bg-red-950/70 border border-red-800/60 text-red-400 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-zinc-100 block">
                Fazer Cópia de Segurança (Backup)
              </span>
              <span className="text-xs text-zinc-400">
                Descarrega um ficheiro JSON com todos os serviços, formações e recibos.
              </span>
            </div>
          </button>

          <label className="p-4 rounded-xl border border-[#242430] hover:border-zinc-700 bg-[#181820] hover:bg-[#1E1E26] text-left transition-colors cursor-pointer flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950/70 border border-blue-800/60 text-blue-400 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-zinc-100 block">
                Restaurar Dados de Ficheiro
              </span>
              <span className="text-xs text-zinc-400">
                Carregue um ficheiro de backup previamente exportado.
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#1F1F25]">
          <button
            type="button"
            onClick={handleLoadDemoData}
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 flex items-center space-x-1.5 cursor-pointer py-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repor Dados de Exemplo / Demonstração</span>
          </button>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center space-x-1 cursor-pointer py-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Todos os Dados</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-red-400 font-semibold">Tem a certeza?</span>
              <button
                onClick={() => {
                  onClearAllData();
                  setConfirmClear(false);
                  setFeedbackMessage({ type: 'success', text: 'Todos os registos foram eliminados.' });
                }}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Sim, Limpar
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone: Account & Profile Deletion */}
      <div className="bg-[#140F18] rounded-2xl p-5 sm:p-6 border border-red-950/80 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-red-300 flex items-center space-x-2 border-b border-red-950/60 pb-3">
          <UserX className="w-4 h-4 text-red-400" />
          <span>Zona de Perigo • Gestão e Eliminação de Perfil</span>
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#1B111A] border border-red-900/40 rounded-xl">
          <div>
            <span className="font-bold text-sm text-red-200 block">
              Eliminar Perfil e Conta de Bombeiro ({profile.name})
            </span>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Remove a sua conta de bombeiro ({profile.rank}, Nº {profile.firefighterNumber}) do dispositivo local e da base de dados Supabase na nuvem.
            </p>
          </div>

          {!confirmDeleteProfile ? (
            <button
              type="button"
              onClick={() => setConfirmDeleteProfile(true)}
              className="px-4 py-2.5 bg-red-950/80 hover:bg-red-900/90 border border-red-800/80 text-red-300 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-2 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Apagar Este Perfil</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 p-2 bg-red-950 border border-red-700 rounded-xl">
              <span className="text-xs text-red-300 font-bold">Apagar perfil?</span>
              <button
                type="button"
                onClick={handleDeleteProfile}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-black cursor-pointer shadow-md"
              >
                Sim, Apagar Definitivamente
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteProfile(false)}
                className="px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Offline & Architecture Badge */}
      <div className="p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-2xl flex items-center space-x-3 text-xs text-emerald-300">
        <WifiOff className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <strong className="font-semibold text-emerald-200">Modo 100% Offline & Privacidade Total:</strong> Todos os seus registos são guardados localmente no seu dispositivo. Não são enviados dados confidenciais de ocorrências ou gratificações para servidores externos sem o seu consentimento.
        </div>
      </div>

      {/* Email & SMTP Configuration & Testing Modal */}
      <EmailServiceConfigModal
        isOpen={isEmailConfigModalOpen}
        onClose={() => setIsEmailConfigModalOpen(false)}
        profile={profile}
      />
    </div>
  );
};

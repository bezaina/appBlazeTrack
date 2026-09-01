import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  LogOut, 
  Calendar, 
  Mail, 
  Cloud, 
  ShieldCheck, 
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { UserProfile, GoogleUserAccount } from '../types';
import { signInWithGoogleAccount, signOutGoogle } from '../services/googleAuth';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile;
  currentAccount?: GoogleUserAccount | null;
  onUpdateGoogleUser?: (user: GoogleUserAccount | null) => void;
  onAccountChange?: (user: GoogleUserAccount | null) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentAccount,
  onUpdateGoogleUser,
  onAccountChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentGoogleUser = profile?.googleUser ?? currentAccount ?? null;

  const handleUpdate = (user: GoogleUserAccount | null) => {
    if (onUpdateGoogleUser) onUpdateGoogleUser(user);
    if (onAccountChange) onAccountChange(user);
  };

  // Real Google Sign-In with official popup
  const handleRealGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { account } = await signInWithGoogleAccount();
      handleUpdate(account);
      setFeedback(`Sessão iniciada com sucesso na Conta Google (${account.email})!`);
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Falha na autenticação Google:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setErrorMessage('A janela de autenticação Google foi fechada antes de concluir.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Pedido de autenticação cancelado.');
      } else if (error.code === 'auth/popup-blocked') {
        setErrorMessage('O navegador bloqueou a janela pop-up do Google. Por favor autorize pop-ups para este site.');
      } else {
        setErrorMessage(error.message || 'Ocorreu um erro ao comunicar com a Google. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signOutGoogle();
      handleUpdate(null);
      setFeedback('Sessão Google terminada com sucesso.');
      setTimeout(() => {
        setFeedback(null);
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao terminar sessão:', error);
      handleUpdate(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111015] border border-[#24202C] rounded-2xl p-5 sm:p-7 w-full max-w-lg shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Glow accent */}
        <div 
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-32 opacity-25 blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #ea580c 0%, #4285F4 60%, transparent 80%)'
          }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1E1A26] pb-4 relative z-10">
          <div className="flex items-center space-x-3">
            {/* Google G Logo */}
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md p-2 shrink-0">
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Conta Google Real
              </h3>
              <p className="text-xs text-zinc-400">
                Autenticação Google com sincronização de Agenda e Relatórios
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1C1824] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="p-3.5 bg-emerald-950/70 border border-emerald-800/70 rounded-xl text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-red-950/70 border border-red-800/70 rounded-xl text-xs text-red-300 flex items-center space-x-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content View: Signed In vs Signed Out */}
        {currentGoogleUser ? (
          /* Signed-in View */
          <div className="space-y-5">
            {/* Active Account Card */}
            <div className="p-4 bg-[#181420] border border-[#2B2338] rounded-2xl flex items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center space-x-3.5 min-w-0">
                {currentGoogleUser.picture ? (
                  <img
                    src={currentGoogleUser.picture}
                    alt={currentGoogleUser.name}
                    className="w-12 h-12 rounded-full border-2 border-emerald-500/80 object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {currentGoogleUser.name.charAt(0)}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-white text-sm sm:text-base truncate">
                      {currentGoogleUser.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      Autenticado
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400 truncate block font-mono">
                    {currentGoogleUser.email}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Sessão</span>
                <span className="text-xs text-emerald-400 font-semibold">Google OAuth</span>
              </div>
            </div>

            {/* Synchronized Services Checklist */}
            <div className="bg-[#14111B] border border-[#201C28] rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Permissões e Serviços Ativos
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 bg-[#1B1724] border border-[#272134] rounded-xl flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-zinc-200">Google Calendar</span>
                </div>

                <div className="p-2.5 bg-[#1B1724] border border-[#272134] rounded-xl flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-zinc-200">Perfil & Email</span>
                </div>

                <div className="p-2.5 bg-[#1B1724] border border-[#272134] rounded-xl flex items-center space-x-2">
                  <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-zinc-200">Sincronização</span>
                </div>
              </div>
            </div>

            {/* Actions: Reconnect / Sign Out / Close */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1E1A26]">
              <button
                type="button"
                onClick={handleRealGoogleSignIn}
                disabled={isLoading}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-[#181420] hover:bg-[#221D2E] border border-[#282236] transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Reautenticar / Mudar Conta</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/60 border border-red-900/40 transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Desconectar</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 transition-all cursor-pointer shadow-md"
                >
                  Concluído
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Signed-out / Sign In View with official Google Button */
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h4 className="text-base sm:text-lg font-extrabold text-white">
                Iniciar Sessão com a Conta Google
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
                Conecte a sua conta Google real para sincronizar automaticamente as suas escalas, turnos de voluntariado e instruções operacionais na Google Agenda.
              </p>
            </div>

            {/* Official Google Sign-In Button */}
            <div className="flex flex-col items-center justify-center pt-2 pb-2">
              <button
                type="button"
                onClick={handleRealGoogleSignIn}
                disabled={isLoading}
                className="w-full sm:w-auto min-w-[280px] px-6 py-3.5 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-900 font-bold text-sm rounded-2xl shadow-xl flex items-center justify-center space-x-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
                    <span>A ligar à Google...</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Iniciar Sessão com a Google</span>
                  </>
                )}
              </button>
            </div>

            {/* Scope highlights */}
            <div className="bg-[#15121E] border border-[#231E30] rounded-xl p-3.5 space-y-2 text-xs text-zinc-400">
              <div className="flex items-center space-x-2 text-zinc-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Permissões Solicitadas:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-400 pl-1">
                <li>Aceder ao seu Perfil e Email Google para identificação no BLAZETRACK</li>
                <li>Criar e atualizar eventos no Google Calendar para as suas escalas operacionais</li>
              </ul>
            </div>

            {/* Privacy note */}
            <div className="flex items-center space-x-2 text-[11px] text-zinc-500 pt-2 border-t border-[#1E1A26]">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Privacidade garantida: Os seus registos de piquetes e ocorrências permanecem estritamente sob o seu controlo.</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};


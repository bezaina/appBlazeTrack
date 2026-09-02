import React, { useState } from 'react';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  Award, 
  BookOpen, 
  ArrowRight, 
  ChevronRight 
} from 'lucide-react';
import { UserProfile } from '../types';
import { BlazeTrackLogo } from './BlazeTrackLogo';
import { signInWithGoogleAccount } from '../services/googleAuth';
import { loginWithGoogle, getSavedAccounts, accountToProfile } from '../services/authService';

interface AuthScreenProps {
  onAuthenticated: (profile: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Saved accounts for 1-click firefighter switch
  const savedAccounts = getSavedAccounts();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { account: googleUser } = await signInWithGoogleAccount();
      const loginRes = await loginWithGoogle(googleUser);
      
      if (loginRes.success && loginRes.account) {
        const profile = accountToProfile(loginRes.account);
        // Ensure googleUser is preserved in profile
        profile.googleUser = googleUser;
        
        setSuccessMessage(`Bem-vindo(a), ${googleUser.name}! Sessão iniciada com sucesso.`);
        setTimeout(() => {
          onAuthenticated(profile);
        }, 600);
      } else {
        setErrorMessage('Não foi possível sincronizar o perfil com a conta Google.');
      }
    } catch (error: any) {
      console.error('Falha na autenticação Google:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setErrorMessage('A janela de autenticação Google foi fechada antes de concluir.');
      } else if (error.code === 'auth/popup-blocked') {
        setErrorMessage('O navegador bloqueou o pop-up do Google. Por favor permita pop-ups nesta página.');
      } else {
        setErrorMessage(error.message || 'Erro ao iniciar sessão com a Conta Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAccountLogin = async (acc: typeof savedAccounts[0]) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const profile = accountToProfile(acc);
      setSuccessMessage(`A iniciar sessão no perfil de ${acc.name}...`);
      setTimeout(() => {
        onAuthenticated(profile);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao aceder ao perfil.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B090E] text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-red-500 selection:text-white">
      {/* Dynamic Background Glows */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 opacity-25 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #ea580c 0%, #dc2626 50%, transparent 75%)' }}
      />
      <div 
        className="absolute -bottom-32 -right-32 w-96 h-96 opacity-25 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #4285F4 0%, #2563eb 50%, transparent 75%)' }}
      />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Branding & Logo Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-4 bg-[#171222] border border-[#2B213A] rounded-3xl shadow-xl shadow-red-950/40">
            <BlazeTrackLogo 
              subtitle="Gestão Operacional de Voluntariado, Instrução e Gratificações" 
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-[#120E1A] border border-[#251C33] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
          {/* Header Title */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-white">
              Acesso com Conta Google
            </h2>
            <p className="text-xs text-zinc-400">
              Autenticação simplificada e envio direto de relatórios via Gmail API
            </p>
          </div>

          {/* Status Alerts */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/80 rounded-2xl text-xs text-emerald-200 flex items-start space-x-2.5 shadow-md animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-red-950/80 border border-red-800/80 rounded-2xl text-xs text-red-200 flex items-center space-x-2.5 shadow-md animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Main Google Sign-In Action */}
          <div className="space-y-4 pt-1">
            <button
              type="button"
              id="google-signin-main-btn"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 px-5 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-900 font-bold text-sm rounded-2xl shadow-xl flex items-center justify-center space-x-3 transition-all cursor-pointer border border-zinc-200 group disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-800" />
                  <span className="text-zinc-800">A contactar o Google...</span>
                </>
              ) : (
                <>
                  {/* Google SVG G Icon */}
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
                  <span className="text-zinc-900 tracking-tight">Entrar com Google</span>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            {/* Google Features Checklist */}
            <div className="p-3.5 bg-[#171222] border border-[#271E36] rounded-2xl space-y-2 text-xs text-zinc-400">
              <div className="flex items-center space-x-2 text-zinc-300 font-semibold text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Integração Nativa Google Workspace</span>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-[11px] text-zinc-400">
                <li>Sem necessidade de memorizar palavras-passe adicionais</li>
                <li>Envio direto de relatórios PDF oficiais através da API do Gmail</li>
                <li>Sincronização de escalas com o Google Calendar</li>
              </ul>
            </div>
          </div>

          {/* Quick profile switcher if accounts exist */}
          {savedAccounts.length > 0 && (
            <div className="pt-3 border-t border-[#231A30] space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                <span>Perfis recentes guardados:</span>
                <span className="text-[10px] text-zinc-500">{savedAccounts.length} disponíveis</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {savedAccounts.slice(0, 3).map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickAccountLogin(acc)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between p-2.5 bg-[#181324] hover:bg-[#201830] active:bg-[#271E3A] border border-[#291F3C] rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-300">
                        {acc.firefighterNumber ? acc.firefighterNumber.slice(-2) : 'BV'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-200 group-hover:text-white">
                          {acc.name}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {acc.rank} • N.º {acc.firefighterNumber}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Features Preview */}
          <div className="pt-4 border-t border-[#231A30] grid grid-cols-3 gap-2 text-center text-[10px] text-zinc-400">
            <div className="p-2 bg-[#171222] rounded-xl border border-[#271E36]">
              <Clock className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <span>Horas de Serviço</span>
            </div>
            <div className="p-2 bg-[#171222] rounded-xl border border-[#271E36]">
              <BookOpen className="w-4 h-4 text-red-400 mx-auto mb-1" />
              <span>Instruções</span>
            </div>
            <div className="p-2 bg-[#171222] rounded-xl border border-[#271E36]">
              <Award className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <span>Gratificações</span>
            </div>
          </div>
        </div>

        {/* Security Note Footer */}
        <div className="flex items-center justify-center space-x-2 text-xs text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Acesso Seguro via Google OAuth 2.0 & Supabase Cloud</span>
        </div>
      </div>
    </div>
  );
};

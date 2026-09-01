import React, { useState, useEffect } from 'react';
import { 
  X, 
  Flame, 
  Mail, 
  Lock, 
  User,
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  LogOut,
  Sparkles,
  MailCheck,
  RefreshCw
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  loginWithEmailPassword, 
  registerWithEmailPassword,
  loginWithGoogle,
  accountToProfile,
  logoutFirefighter,
  createGuestProfile,
  confirmAccountEmail,
  resendConfirmationEmail
} from '../services/authService';
import { signInWithGoogleAccount } from '../services/googleAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onProfileUpdated: (newProfile: UserProfile) => void;
  onLogout?: () => void;
}

type AuthMode = 'login' | 'signup' | 'confirm-email';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onProfileUpdated,
  onLogout,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [sentToEmail, setSentToEmail] = useState('');

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { account: googleUser } = await signInWithGoogleAccount();
      const res = await loginWithGoogle(googleUser);
      if (res.success && res.account) {
        const profile = accountToProfile(res.account, currentProfile);
        profile.googleUser = googleUser;
        onProfileUpdated(profile);
        setSuccessMessage(`Sessão Google iniciada! Bem-vindo(a), ${googleUser.name}.`);
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('A janela de autenticação Google foi fechada.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        setErrorMessage(err.message || 'Não foi possível autenticar com o Google.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setPassword('');
      if (currentProfile.autoEmailAddress) {
        setEmail(currentProfile.autoEmailAddress);
      }
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === 'login') {
        const res = await loginWithEmailPassword(email, password);
        if (res.success && res.account) {
          const newProf = accountToProfile(res.account, currentProfile);
          onProfileUpdated(newProf);
          setSuccessMessage(`Sessão iniciada com sucesso! Bem-vindo(a), ${res.account.name}.`);
          setTimeout(() => {
            onClose();
          }, 1200);
        } else if (res.needsEmailConfirmation) {
          setSentToEmail(res.email || email);
          setMode('confirm-email');
          setErrorMessage(res.error || 'Por favor confirme o seu email antes de iniciar sessão.');
        } else {
          setErrorMessage(res.error || 'Credenciais inválidas. Verifique o email e palavra-passe.');
        }
      } else if (mode === 'signup') {
        const res = await registerWithEmailPassword({
          email,
          password,
          name: name || undefined,
        });

        if (res.success && res.account) {
          setSentToEmail(email.trim().toLowerCase());
          setMode('confirm-email');
          setSuccessMessage(
            `Conta criada com sucesso! Enviámos um código de confirmação de 6 dígitos para ${email}. Introduza o código para ativar a conta.`
          );
        } else {
          setErrorMessage(res.error || 'Não foi possível criar a conta. Tente novamente.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = sentToEmail || email;
    if (!confirmationCode || confirmationCode.length < 6) {
      setErrorMessage('Por favor introduza o código de confirmação de 6 dígitos.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await confirmAccountEmail(targetEmail, confirmationCode.trim());
      if (res.success && res.account) {
        const newProf = accountToProfile(res.account, currentProfile);
        onProfileUpdated(newProf);
        setSuccessMessage(`Email confirmado e conta ativada com sucesso!`);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Código de confirmação incorreto.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao confirmar email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const targetEmail = sentToEmail || email;
    if (!targetEmail) return;
    setIsResending(true);
    try {
      const res = await resendConfirmationEmail(targetEmail);
      if (res.success) {
        setSuccessMessage(res.message || 'Novo código enviado para o seu email.');
      } else {
        setErrorMessage(res.error || 'Erro ao reenviar.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao reenviar.');
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await logoutFirefighter();
    setIsLoading(false);
    setSuccessMessage('Sessão terminada com sucesso.');
    setTimeout(() => {
      onClose();
      if (onLogout) {
        onLogout();
      } else {
        const guest = createGuestProfile();
        onProfileUpdated(guest);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#121016] border border-[#2A2436] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#221D2D] flex items-center justify-between bg-gradient-to-r from-[#181324] to-[#120F1A]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 via-orange-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-red-950/60 border border-red-500/30 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">
                Autenticação
              </h3>
              <p className="text-xs text-zinc-400">
                {mode === 'login' ? 'Inicie sessão na sua conta' : mode === 'signup' ? 'Crie uma nova conta com email' : 'Confirmação obrigatória de email'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1E182A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        {mode !== 'confirm-email' && (
          <div className="grid grid-cols-2 p-1.5 m-4 bg-[#181324] border border-[#2B233C] rounded-2xl">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(null); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Iniciar Sessão
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(null); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Criar Conta
            </button>
          </div>
        )}

        {/* Google Sign-in */}
        {mode !== 'confirm-email' && (
          <div className="px-6 pt-1">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
              id="modal-google-signin-btn"
              className="w-full py-2.5 px-4 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-900 font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 text-zinc-700 animate-spin" />
                  <span className="text-zinc-800">A contactar a Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="text-zinc-800">Entrar com a Conta Google</span>
                </>
              )}
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-[#261E34] w-full" />
              <span className="bg-[#121016] px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider shrink-0">
                ou com email
              </span>
              <div className="border-t border-[#261E34] w-full" />
            </div>
          </div>
        )}

        {/* Confirmation Code Form Body */}
        {mode === 'confirm-email' ? (
          <form onSubmit={handleConfirmCode} className="px-6 pb-6 pt-4 space-y-4">
            {successMessage && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/80 rounded-2xl text-xs text-emerald-200 flex items-center space-x-2.5 shadow-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 bg-red-950/80 border border-red-800/80 rounded-2xl text-xs text-red-200 flex items-center space-x-2.5 shadow-md">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            <div className="p-3 bg-[#171322] border border-[#2B223C] rounded-2xl text-xs space-y-1">
              <p className="font-bold text-amber-400 flex items-center space-x-1.5">
                <MailCheck className="w-4 h-4" />
                <span>Código de 6 Dígitos Enviado</span>
              </p>
              <p className="text-zinc-300 text-[11px]">
                Enviámos o código para <strong className="text-white">{sentToEmail || email}</strong>. Introduza-o abaixo para ativar a conta.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 text-center">
                Código de Confirmação
              </label>
              <input
                type="text"
                required
                autoFocus
                maxLength={6}
                placeholder="• • • • • •"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, ''))}
                className="w-full py-3 px-4 bg-[#171322] border-2 border-amber-500/40 focus:border-amber-400 rounded-xl text-amber-200 text-center font-mono text-lg font-black tracking-[0.3em] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || confirmationCode.length < 6}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A validar...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ativar Conta e Entrar</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-bold text-zinc-400 hover:text-amber-300 inline-flex items-center space-x-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                <span>Reenviar código</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Voltar ao Login
              </button>
            </div>
          </form>
        ) : (
          /* Regular Form Body */
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            {/* Alerts */}
            {successMessage && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/80 rounded-2xl text-xs text-emerald-200 flex items-center space-x-2.5 shadow-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 bg-red-950/80 border border-red-800/80 rounded-2xl text-xs text-red-200 flex items-center space-x-2.5 shadow-md">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Nome Completo (Opcional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: Gonçalo Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#171322] border border-[#2C243C] rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-zinc-500"
                  />
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#171322] border border-[#2C243C] rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-zinc-500 font-mono"
                />
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Palavra-passe
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : 'A sua palavra-passe'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#171322] border border-[#2C243C] rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-zinc-500"
                />
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/60 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A processar...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Entrar na Conta' : 'Criar Conta (Requer Confirmação)'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              {mode === 'login' ? (
                <p className="text-xs text-zinc-400">
                  Ainda não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setErrorMessage(null); }}
                    className="text-orange-400 hover:text-orange-300 font-bold hover:underline cursor-pointer"
                  >
                    Registar aqui
                  </button>
                </p>
              ) : (
                <p className="text-xs text-zinc-400">
                  Já tem uma conta registada?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setErrorMessage(null); }}
                    className="text-orange-400 hover:text-orange-300 font-bold hover:underline cursor-pointer"
                  >
                    Iniciar Sessão
                  </button>
                </p>
              )}
            </div>

            {/* Current Session Banner & Logout */}
            {currentProfile.autoEmailAddress && (
              <div className="pt-3 border-t border-[#221D2D] flex items-center justify-between text-xs text-zinc-400">
                <span className="truncate max-w-[200px]">
                  Sessão atual: <strong className="text-zinc-200">{currentProfile.autoEmailAddress}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="text-red-400 hover:text-red-300 font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  Clock,
  Award,
  BookOpen,
  KeyRound,
  ArrowLeft,
  Send,
  ExternalLink,
  MailCheck,
  RefreshCw
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  loginWithEmailPassword, 
  registerWithEmailPassword, 
  loginWithGoogle,
  accountToProfile,
  sendPasswordResetEmail,
  resetAccountPassword,
  confirmAccountEmail,
  resendConfirmationEmail
} from '../services/authService';
import { signInWithGoogleAccount } from '../services/googleAuth';

interface AuthScreenProps {
  onAuthenticated: (profile: UserProfile) => void;
}

type AuthMode = 'login' | 'signup' | 'confirm-email' | 'forgot-password';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email Confirmation states
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isResendingCode, setIsResendingCode] = useState(false);

  // Forgot password / Recovery states
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if URL has reset token or verify email parameter
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const resetToken = params.get('reset_token');
      const resetEmail = params.get('email');
      const verifyEmail = params.get('verify_email');
      const verifyCode = params.get('code');

      if (verifyEmail) {
        setMode('confirm-email');
        setSentToEmail(verifyEmail);
        setEmail(verifyEmail);
        if (verifyCode) {
          setConfirmationCode(verifyCode.replace(/\D/g, '').substring(0, 6));
        }
      } else if (resetToken) {
        setMode('forgot-password');
        setResetStep('verify');
        setResetCode(resetToken);
        if (resetEmail) {
          setEmail(resetEmail);
          setSentToEmail(resetEmail);
        }
      }
    } catch {}
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { account: googleUser } = await signInWithGoogleAccount();
      const res = await loginWithGoogle(googleUser);
      if (res.success && res.account) {
        const profile = accountToProfile(res.account);
        profile.googleUser = googleUser;
        setSuccessMessage(`Sessão Google iniciada! Bem-vindo(a), ${googleUser.name}.`);
        setTimeout(() => {
          onAuthenticated(profile);
        }, 800);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('A janela de autenticação Google foi fechada.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        setErrorMessage(err.message || 'Não foi possível iniciar sessão com o Google.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === 'login') {
        const res = await loginWithEmailPassword(email, password);
        if (res.success && res.account) {
          const profile = accountToProfile(res.account);
          setSuccessMessage(`Sessão iniciada com sucesso! A carregar os seus dados...`);
          setTimeout(() => {
            onAuthenticated(profile);
          }, 800);
        } else if (res.needsEmailConfirmation) {
          setSentToEmail(res.email || email);
          setMode('confirm-email');
          setErrorMessage(res.error || 'Por favor valide o seu email antes de iniciar sessão.');
        } else {
          setErrorMessage(res.error || 'Email ou palavra-passe incorretos.');
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
            `Conta criada com sucesso! Enviámos um código de ativação de 6 dígitos para ${email}. Introduza o código abaixo para ter acesso à app.`
          );
        } else {
          setErrorMessage(res.error || 'Erro ao criar conta. Tente novamente.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocorreu um erro ao processar o pedido.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = sentToEmail || email;
    if (!targetEmail) {
      setErrorMessage('Endereço de email não especificado.');
      return;
    }
    if (!confirmationCode || confirmationCode.trim().length < 6) {
      setErrorMessage('Por favor introduza o código de confirmação de 6 dígitos.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await confirmAccountEmail(targetEmail, confirmationCode.trim());
      if (res.success && res.account) {
        const profile = accountToProfile(res.account);
        setSuccessMessage(`Email confirmado e conta ativada com sucesso! Bem-vindo(a), ${res.account.name}.`);
        setTimeout(() => {
          onAuthenticated(profile);
        }, 1000);
      } else {
        setErrorMessage(res.error || 'Código incorreto. Verifique o código de 6 dígitos no seu email.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao verificar código de confirmação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const targetEmail = sentToEmail || email;
    if (!targetEmail) return;

    setIsResendingCode(true);
    setErrorMessage(null);
    try {
      const res = await resendConfirmationEmail(targetEmail);
      if (res.success) {
        setSuccessMessage(res.message || `Novo código enviado com sucesso para ${targetEmail}.`);
      } else {
        setErrorMessage(res.error || 'Não foi possível reenviar o código.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao reenviar email de confirmação.');
    } finally {
      setIsResendingCode(false);
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Por favor introduza o seu endereço de email válido.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await sendPasswordResetEmail(email.trim());
      if (res.success) {
        setSentToEmail(email.trim());
        setResetStep('verify');
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.error || 'Não foi possível enviar o email de recuperação. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao enviar email de recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setErrorMessage('Por favor introduza o código de 6 dígitos recebido por email.');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      setErrorMessage('A nova palavra-passe deve conter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await resetAccountPassword(sentToEmail || email, resetCode, newPassword);
      if (res.success) {
        setSuccessMessage(`${res.message} A iniciar sessão automaticamente...`);
        // Try direct login with new credentials
        setTimeout(async () => {
          const loginRes = await loginWithEmailPassword(sentToEmail || email, newPassword);
          if (loginRes.success && loginRes.account) {
            onAuthenticated(accountToProfile(loginRes.account));
          } else {
            setMode('login');
            setPassword('');
          }
        }, 1200);
      } else {
        setErrorMessage(res.message || 'Não foi possível redefinir a palavra-passe.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao redefinir a palavra-passe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B090E] text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-red-500 selection:text-white">
      {/* Background Ambience / Glow */}
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-red-600/15 via-orange-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[350px] bg-red-950/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-red-600 via-orange-600 to-amber-600 shadow-xl shadow-red-950/80 border border-red-500/30">
            <Flame className="w-9 h-9 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Portal do Bombeiro
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xs mx-auto">
              Registo de Horas de Voluntariado, Instrução e Gratificações
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-[#130F1A] border border-[#261E34] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-5">
          {/* Mode Switch Tabs or Header */}
          {mode === 'login' || mode === 'signup' ? (
            <div className="grid grid-cols-2 p-1.5 bg-[#1A1424] border border-[#2D233E] rounded-2xl">
              <button
                type="button"
                id="tab-login"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Iniciar Sessão
              </button>
              <button
                type="button"
                id="tab-signup"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Criar Nova Conta
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-2 border-b border-[#261E34]">
              <button
                type="button"
                id="back-to-login-btn"
                onClick={() => {
                  setMode('login');
                  setResetStep('request');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Início de Sessão</span>
              </button>
              <span className="text-xs font-black text-orange-400 uppercase tracking-wider">
                {mode === 'confirm-email' ? 'Ativação de Conta' : 'Recuperação'}
              </span>
            </div>
          )}

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

          {/* Confirm Email View */}
          {mode === 'confirm-email' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-[#171222] border border-[#2D2140] rounded-2xl space-y-2 text-xs">
                <div className="flex items-center space-x-2 font-bold text-amber-400">
                  <MailCheck className="w-4 h-4" />
                  <span>Confirmação Obrigatória de Email</span>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  Para aceder ao portal, enviámos um código de ativação de 6 dígitos para o endereço:
                </p>
                <div className="p-2 bg-[#100C18] border border-[#281E38] rounded-xl font-mono text-amber-300 text-xs font-bold text-center break-all">
                  {sentToEmail || email}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Verifique a sua caixa de entrada (ou pasta de spam) e introduza o código de 6 dígitos para validar o seu email.
                </p>
              </div>

              <form onSubmit={handleConfirmCodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 text-center">
                    Código de Confirmação (6 Dígitos)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      autoFocus
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={confirmationCode}
                      onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full py-3.5 px-4 bg-[#171222] border-2 border-amber-500/40 focus:border-amber-400 rounded-2xl text-amber-200 text-center font-mono text-xl font-black tracking-[0.4em] outline-none placeholder-zinc-600 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={isLoading || confirmationCode.length < 6}
                    id="submit-confirmation-code-btn"
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-red-500 active:from-amber-700 active:to-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-950/60 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>A validar código...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmar Email e Entrar</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={isResendingCode}
                      className="text-[11px] font-bold text-zinc-400 hover:text-amber-300 inline-flex items-center space-x-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isResendingCode ? 'animate-spin' : ''}`} />
                      <span>Reenviar código por email</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[11px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      Alterar email
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Regular Login / Signup View */}
          {(mode === 'login' || mode === 'signup') && (
            <>
              {/* Google Sign In Option */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                id="google-signin-btn"
                className="w-full py-3 px-4 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-900 font-bold text-xs rounded-2xl shadow-lg shadow-black/40 flex items-center justify-center space-x-3 transition-all cursor-pointer disabled:opacity-50 border border-zinc-200"
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

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-[#261E34] w-full" />
                <span className="bg-[#130F1A] px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider shrink-0">
                  ou com email e palavra-passe
                </span>
                <div className="border-t border-[#261E34] w-full" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: Gonçalo Silva"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[#171222] border border-[#2C223E] rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-zinc-500 transition-all"
                      />
                      <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Endereço de Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="bombeiro@exemplo.pt"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#171222] border border-[#2C223E] rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-zinc-500 font-mono transition-all"
                    />
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-zinc-300">
                      Palavra-passe
                    </label>
                    {mode === 'login' ? (
                      <button
                        type="button"
                        id="forgot-password-link"
                        onClick={() => {
                          setMode('forgot-password');
                          setResetStep('request');
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className="text-[11px] font-bold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
                      >
                        Recuperar palavra-passe por email
                      </button>
                    ) : (
                      <span className="text-[10px] text-zinc-500">Mínimo 6 caracteres</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder={mode === 'signup' ? 'Defina a sua palavra-passe' : 'A sua palavra-passe'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-3 bg-[#171222] border border-[#2C223E] rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-zinc-500 transition-all"
                    />
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300 cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div className="p-3 bg-[#171222] rounded-xl border border-[#271E36] text-[11px] text-zinc-400 space-y-1">
                    <p className="font-semibold text-zinc-300 flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-orange-400" />
                      <span>Confirmação de Registo por Email</span>
                    </p>
                    <p>Ao criar a conta, será enviado um link de confirmação para o seu email.</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  id="auth-submit-btn"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-orange-500 active:from-red-700 active:to-orange-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950/60 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 mt-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>A autenticar...</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Entrar no Sistema' : 'Criar Conta e Enviar Confirmação'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Forgot Password View */}
          {mode === 'forgot-password' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 bg-[#171222] border border-[#2A2038] rounded-2xl space-y-1 text-xs text-zinc-300">
                <div className="flex items-center space-x-2 font-bold text-orange-400">
                  <KeyRound className="w-4 h-4" />
                  <span>Recuperação de Palavra-passe por Email</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {resetStep === 'request'
                    ? 'Introduza o seu email associado à conta para receber o link e o código de recuperação.'
                    : `Introduza o código de 6 dígitos enviado para ${sentToEmail} e defina a sua nova palavra-passe.`}
                </p>
              </div>

              {resetStep === 'request' ? (
                <form onSubmit={handleSendResetEmail} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Endereço de Email da Conta
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="exemplo@bv.pt"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[#171222] border border-[#2C223E] rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-zinc-500 font-mono transition-all"
                      />
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    id="send-reset-email-btn"
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:from-orange-700 active:to-amber-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-950/60 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>A enviar email de recuperação...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar Link e Código de Recuperação</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyAndResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Código de 6 Dígitos (Recebido por Email)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="Ex: 123456"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-10 pr-4 py-3 bg-[#171222] border border-[#2C223E] rounded-xl text-white text-center tracking-widest font-mono text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-zinc-500 transition-all"
                      />
                      <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Nova Palavra-passe
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-3 bg-[#171222] border border-[#2C223E] rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-zinc-500 transition-all"
                      />
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300 cursor-pointer p-1"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setResetStep('request')}
                      className="py-3 px-3 bg-[#1B1426] hover:bg-[#231A32] text-zinc-400 hover:text-zinc-200 text-xs font-bold rounded-xl transition-all cursor-pointer border border-[#2B213B]"
                    >
                      Reenviar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      id="save-new-password-btn"
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>A guardar...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Guardar Nova Palavra-passe</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
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
          <span>Acesso Protegido • Supabase Cloud & Notificações por Email</span>
        </div>
      </div>
    </div>
  );
};

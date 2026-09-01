import React, { useState } from 'react';
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
  BookOpen
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  loginWithEmailPassword, 
  registerWithEmailPassword, 
  loginWithGoogle,
  accountToProfile 
} from '../services/authService';
import { signInWithGoogleAccount } from '../services/googleAuth';

interface AuthScreenProps {
  onAuthenticated: (profile: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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
        } else {
          setErrorMessage(res.error || 'Email ou palavra-passe incorretos.');
        }
      } else {
        const res = await registerWithEmailPassword({
          email,
          password,
          name: name || undefined,
        });

        if (res.success && res.account) {
          const profile = accountToProfile(res.account);
          setSuccessMessage(`Conta registada com sucesso no Supabase! A entrar no sistema...`);
          setTimeout(() => {
            onAuthenticated(profile);
          }, 1000);
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
          {/* Mode Switch Tabs */}
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

          {/* Status Alerts */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/80 rounded-2xl text-xs text-emerald-200 flex items-center space-x-2.5 shadow-md animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-red-950/80 border border-red-800/80 rounded-2xl text-xs text-red-200 flex items-center space-x-2.5 shadow-md animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

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
                {mode === 'signup' && (
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
                  <span>{mode === 'login' ? 'Entrar no Sistema' : 'Criar Conta e Entrar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

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
          <span>Acesso Protegido • Supabase Cloud Authentication</span>
        </div>
      </div>
    </div>
  );
};

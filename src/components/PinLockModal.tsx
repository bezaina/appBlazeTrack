import React, { useState, useEffect, useCallback } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Delete, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  KeyRound, 
  Mail, 
  ArrowLeft, 
  Key, 
  RefreshCw, 
  Loader2, 
  UserCheck, 
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  verifyAccountPasswordForRecovery, 
  sendPinRecoveryCode, 
  verifyPinRecoveryCode, 
  resetAndSaveNewPin 
} from '../services/authService';

interface PinLockModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onUnlock: () => void;
  onUpdateProfile?: (updated: UserProfile) => void;
  onLogout?: () => void;
  onOpenAuthModal?: () => void;
}

type ModalViewMode = 'pin' | 'verify-email' | 'set-new-pin';

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  profile,
  onUnlock,
  onUpdateProfile,
  onLogout,
  onOpenAuthModal,
}) => {
  // Modal View Modes
  const [viewMode, setViewMode] = useState<ModalViewMode>('pin');

  // Normal PIN Keypad State
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  // Email Code State
  const [emailCodeInput, setEmailCodeInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentInfo, setEmailSentInfo] = useState<{ maskedEmail: string; demoCode?: string } | null>(null);
  const [emailError, setEmailError] = useState('');

  // New PIN Definition State
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [newPinError, setNewPinError] = useState('');
  const [isSavingNewPin, setIsSavingNewPin] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Check if a PIN has been configured
  const configuredPin = profile.pinHash?.trim();
  const hasCustomPin = Boolean(configuredPin && configuredPin.length === 4 && /^\d{4}$/.test(configuredPin));

  // Determine accepted PIN: Strictly the configured PIN defined by the user
  const isPinValid = useCallback((input: string) => {
    if (configuredPin) {
      return input === configuredPin;
    }
    return false;
  }, [configuredPin]);

  const handleDigit = useCallback((digit: string) => {
    if (pinInput.length >= 4 || success) return;
    const newPin = pinInput + digit;
    setPinInput(newPin);
    setError(false);
    setErrorMessage('');

    if (newPin.length === 4) {
      if (isPinValid(newPin)) {
        setSuccess(true);
        setTimeout(() => {
          onUnlock();
          setPinInput('');
          setSuccess(false);
        }, 300);
      } else {
        setError(true);
        setErrorMessage('PIN incorreto. Digite o código PIN de 4 dígitos configurado na sua conta.');
        setTimeout(() => {
          setPinInput('');
        }, 900);
      }
    }
  }, [pinInput, success, isPinValid, onUnlock]);

  const handleDelete = useCallback(() => {
    if (success) return;
    setPinInput((prev) => prev.slice(0, -1));
    setError(false);
    setErrorMessage('');
  }, [success]);

  // Physical keyboard support for PIN entry
  useEffect(() => {
    if (!isOpen || viewMode !== 'pin') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, viewMode, handleDigit, handleDelete]);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setError(false);
      setErrorMessage('');
      setSuccess(false);
      setViewMode('pin');
      setEmailCodeInput('');
      setEmailError('');
      setNewPinInput('');
      setConfirmPinInput('');
      setNewPinError('');
      setResetSuccessMessage('');
    }
  }, [isOpen]);

  const handleSendEmailCode = async () => {
    setIsSendingEmail(true);
    setEmailError('');

    try {
      const res = await sendPinRecoveryCode(profile);
      if (res.success) {
        setEmailSentInfo({
          maskedEmail: res.destinationEmail,
          demoCode: res.code,
        });
      } else {
        setEmailError('Não foi possível gerar código de autorização por email.');
      }
    } catch {
      setEmailError('Erro ao contactar serviço de email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleVerifyEmailCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailCodeInput.trim()) {
      setEmailError('Por favor, introduza o código de 6 dígitos recebido por email.');
      return;
    }

    const res = verifyPinRecoveryCode(emailCodeInput);
    if (res.success) {
      setViewMode('set-new-pin');
    } else {
      setEmailError(res.message || 'Código de verificação inválido ou expirado.');
    }
  };

  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNewPin = newPinInput.replace(/\D/g, '').slice(0, 4);
    const cleanConfirmPin = confirmPinInput.replace(/\D/g, '').slice(0, 4);

    if (cleanNewPin.length !== 4) {
      setNewPinError('O novo PIN deve ter exatamente 4 dígitos numéricos.');
      return;
    }

    if (cleanNewPin !== cleanConfirmPin) {
      setNewPinError('A confirmação do PIN não coincide com o novo PIN.');
      return;
    }

    setIsSavingNewPin(true);
    setNewPinError('');

    try {
      const result = await resetAndSaveNewPin(profile, cleanNewPin);
      if (result.success) {
        if (onUpdateProfile) {
          onUpdateProfile(result.updatedProfile);
        }
        setResetSuccessMessage('PIN alterado com sucesso! A desbloquear aplicação...');
        setTimeout(() => {
          onUnlock();
        }, 1200);
      } else {
        setNewPinError(result.message || 'Não foi possível guardar o novo PIN.');
      }
    } catch {
      setNewPinError('Erro ao guardar novo PIN. Tente novamente.');
    } finally {
      setIsSavingNewPin(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0E]/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
      
      {/* 1. NORMAL PIN KEYPAD VIEW */}
      {viewMode === 'pin' && (
        <div className="max-w-xs w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg transition-all duration-300 ${
            success 
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 shadow-emerald-950/40'
              : error
              ? 'bg-red-950/60 text-red-500 border border-red-800/50 shadow-red-950/40'
              : 'bg-red-950/40 text-red-500 border border-red-800/50 shadow-red-950/30'
          }`}>
            {success ? (
              <CheckCircle2 className="w-8 h-8 animate-in zoom-in-75 duration-200" />
            ) : (
              <Lock className="w-8 h-8" />
            )}
          </div>

          <div>
            <h2 className="text-xl font-black text-zinc-100 tracking-tight">
              Registo de Bombeiro Protegido
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {profile.name} • {profile.firefighterNumber || 'Quartel'}
            </p>
          </div>

          {/* PIN Dots Indicator */}
          <div className="flex items-center justify-center space-x-4 py-2">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = index < pinInput.length;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-150 ${
                    success
                      ? 'bg-emerald-500 scale-110 shadow-sm shadow-emerald-500/50'
                      : error
                      ? 'bg-red-500 scale-110'
                      : isFilled
                      ? 'bg-red-500 scale-110 shadow-sm shadow-red-500/50'
                      : 'bg-[#181820] border border-[#242430]'
                  }`}
                />
              );
            })}
          </div>

          {errorMessage && (
            <div className="text-xs text-red-400 flex items-center justify-center space-x-1 animate-in fade-in slide-in-from-top-1 px-2 text-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Keypad 3x4 */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleDigit(num)}
                disabled={success}
                className="w-16 h-16 mx-auto rounded-2xl bg-[#14141A] border border-[#242430] text-zinc-100 font-mono text-2xl font-bold hover:bg-[#1E1E26] active:bg-red-600 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {num}
              </button>
            ))}

            {/* Empty Spacer */}
            <div className="w-16 h-16 mx-auto" />

            {/* 0 */}
            <button
              onClick={() => handleDigit('0')}
              disabled={success}
              className="w-16 h-16 mx-auto rounded-2xl bg-[#14141A] border border-[#242430] text-zinc-100 font-mono text-2xl font-bold hover:bg-[#1E1E26] active:bg-red-600 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              0
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={success}
              title="Apagar dígito"
              className="w-16 h-16 mx-auto rounded-2xl bg-[#14141A]/90 border border-[#242430] text-zinc-400 hover:text-zinc-100 hover:bg-[#1E1E26] active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>

          {/* Recovery by Email */}
          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={() => {
                setViewMode('verify-email');
                handleSendEmailCode();
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#181822] hover:bg-[#20202E] border border-[#282836] text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer shadow-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Alterar / Recuperar PIN por Email</span>
            </button>

            {onLogout && (
              <div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs text-zinc-400 hover:text-red-400 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Terminar Sessão</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. VERIFY BY EMAIL CODE */}
      {viewMode === 'verify-email' && (
        <div className="max-w-md w-full bg-[#121216] border border-[#1F1F25] rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-[#1F1F25] pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-orange-950/60 border border-orange-800/40 text-orange-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-100">
                  Alteração de PIN por Email
                </h3>
                <p className="text-xs text-zinc-400">
                  {emailSentInfo ? `Código enviado para ${emailSentInfo.maskedEmail}` : 'A enviar código de autorização...'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setViewMode('pin')}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1A1A22] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleVerifyEmailCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Código de Autorização de 6 Dígitos
              </label>
              <input
                type="text"
                maxLength={6}
                value={emailCodeInput}
                onChange={(e) => {
                  setEmailCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setEmailError('');
                }}
                placeholder="Ex: 849201"
                className="w-full px-4 py-3 text-center font-mono text-xl tracking-widest bg-[#181820] border border-[#282838] focus:border-orange-500 rounded-xl text-zinc-100 outline-none transition-colors"
                autoFocus
              />
              {emailError && (
                <p className="text-xs text-red-400 flex items-center space-x-1 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* Quick Demo Assist / Information Box */}
            {emailSentInfo && emailSentInfo.demoCode && (
              <div className="p-3 bg-orange-950/20 border border-orange-900/40 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between text-orange-300 font-semibold">
                  <span>Código de Autorização Gerado:</span>
                  <button
                    type="button"
                    onClick={() => setEmailCodeInput(emailSentInfo.demoCode || '')}
                    className="font-mono text-sm px-2 py-0.5 bg-orange-600/80 hover:bg-orange-600 text-white rounded cursor-pointer transition-colors"
                    title="Preencher automaticamente o código"
                  >
                    {emailSentInfo.demoCode} (Inserir)
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Por segurança, o PIN só pode ser alterado através da validação do email. O código expira em 15 minutos.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={handleSendEmailCode}
                disabled={isSendingEmail}
                className="text-orange-400 hover:text-orange-300 font-semibold flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSendingEmail ? 'animate-spin' : ''}`} />
                <span>Reenviar email</span>
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setViewMode('pin')}
                className="px-4 py-2.5 rounded-xl border border-[#282838] text-xs font-semibold text-zinc-300 hover:bg-[#1A1A24] transition-colors cursor-pointer"
              >
                Voltar
              </button>

              <button
                type="submit"
                disabled={emailCodeInput.length < 6}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Validar Código</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. SET NEW 4-DIGIT PIN VIEW */}
      {viewMode === 'set-new-pin' && (
        <div className="max-w-md w-full bg-[#121216] border border-[#1F1F25] rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center space-x-3 border-b border-[#1F1F25] pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-100">
                Definir Novo Código PIN
              </h3>
              <p className="text-xs text-zinc-400">
                Autorização de email validada com sucesso
              </p>
            </div>
          </div>

          {resetSuccessMessage ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-emerald-300">
                {resetSuccessMessage}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSaveNewPin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Novo PIN (4 dígitos)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPinInput}
                    onChange={(e) => {
                      setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                      setNewPinError('');
                    }}
                    placeholder="Ex: 5678"
                    className="w-full px-3 py-2.5 text-center font-mono text-xl tracking-widest bg-[#181820] border border-[#282838] focus:border-emerald-500 rounded-xl text-zinc-100 outline-none transition-colors"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Confirmar Novo PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPinInput}
                    onChange={(e) => {
                      setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                      setNewPinError('');
                    }}
                    placeholder="Repita o PIN"
                    className="w-full px-3 py-2.5 text-center font-mono text-xl tracking-widest bg-[#181820] border border-[#282838] focus:border-emerald-500 rounded-xl text-zinc-100 outline-none transition-colors"
                  />
                </div>
              </div>

              {newPinError && (
                <p className="text-xs text-red-400 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{newPinError}</span>
                </p>
              )}

              <p className="text-[11px] text-zinc-400 bg-[#16161E] p-2.5 rounded-xl border border-[#22222E]">
                • O novo PIN de 4 dígitos fica imediatamente em vigor e será solicitado para aceder à aplicação.
              </p>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingNewPin || newPinInput.length !== 4 || confirmPinInput.length !== 4}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  {isSavingNewPin ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>A guardar novo PIN...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Guardar Novo PIN e Desbloquear</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

    </div>
  );
};


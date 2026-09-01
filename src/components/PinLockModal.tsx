import React, { useState, useEffect, useCallback } from 'react';
import { Lock, ShieldCheck, Delete, Fingerprint, AlertCircle, CheckCircle2, Loader2, HelpCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { authenticateWithBiometrics } from '../services/biometricService';

interface PinLockModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onUnlock: () => void;
  onResetPin?: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  profile,
  onUnlock,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [isScanningBiometrics, setIsScanningBiometrics] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Determine accepted PINs:
  // 1. Explicitly configured PIN in profile (if set)
  // 2. Default PINs: '1234', '0000', '1428'
  const isPinValid = useCallback((input: string) => {
    const configuredPin = profile.pinHash?.trim();
    const defaultPins = ['1234', '0000', '1428'];
    
    if (configuredPin && configuredPin.length >= 4) {
      if (input === configuredPin) return true;
    }
    
    // Always allow default PIN 1234 or 0000
    if (defaultPins.includes(input)) return true;

    // Also check firefighter number if 4 digits
    const numOnly = profile.firefighterNumber?.replace(/\D/g, '');
    if (numOnly && numOnly.length === 4 && input === numOnly) return true;

    return false;
  }, [profile.pinHash, profile.firefighterNumber]);

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
        setErrorMessage('PIN incorreto. Tente "1234" ou o seu PIN configurado.');
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

  // Physical keyboard support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDigit, handleDelete]);

  if (!isOpen) return null;

  const handleBiometricClick = async () => {
    setIsScanningBiometrics(true);
    setError(false);
    setErrorMessage('');

    try {
      const res = await authenticateWithBiometrics(profile.username || profile.name);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onUnlock();
          setPinInput('');
          setSuccess(false);
        }, 300);
      } else {
        setError(true);
        setErrorMessage(res.message || 'Verificação biométrica não autorizada. Introduza o PIN.');
      }
    } catch (err: any) {
      setError(true);
      setErrorMessage('Erro ao ler biometria. Digite o código PIN.');
    } finally {
      setIsScanningBiometrics(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0E]/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
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
          ) : isScanningBiometrics ? (
            <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
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

        {isScanningBiometrics && (
          <div className="text-xs text-orange-300 flex items-center justify-center space-x-1.5 animate-pulse">
            <Fingerprint className="w-4 h-4" />
            <span>Aguardando leitura biométrica no dispositivo...</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              disabled={isScanningBiometrics || success}
              className="w-16 h-16 mx-auto rounded-2xl bg-[#14141A] border border-[#242430] text-zinc-100 font-mono text-2xl font-bold hover:bg-[#1E1E26] active:bg-red-600 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              {num}
            </button>
          ))}

          {/* Biometric Button */}
          <button
            onClick={handleBiometricClick}
            disabled={isScanningBiometrics || success}
            title="Desbloquear com Biometria (Touch ID / Face ID / Sensor de Impressão Digital)"
            className="w-16 h-16 mx-auto rounded-2xl bg-[#14141A]/90 border border-[#242430] text-zinc-400 hover:text-orange-400 hover:border-orange-500/40 hover:bg-[#1E1E26] active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer disabled:opacity-50"
          >
            {isScanningBiometrics ? (
              <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
            ) : (
              <Fingerprint className="w-6 h-6 text-orange-400/90" />
            )}
            <span className="text-[9px] font-semibold mt-0.5 text-zinc-400">Digital</span>
          </button>

          {/* 0 */}
          <button
            onClick={() => handleDigit('0')}
            disabled={isScanningBiometrics || success}
            className="w-16 h-16 mx-auto rounded-2xl bg-[#14141A] border border-[#242430] text-zinc-100 font-mono text-2xl font-bold hover:bg-[#1E1E26] active:bg-red-600 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            0
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={isScanningBiometrics || success}
            title="Apagar dígito"
            className="w-16 h-16 mx-auto rounded-2xl bg-[#14141A]/90 border border-[#242430] text-zinc-400 hover:text-zinc-100 hover:bg-[#1E1E26] active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* PIN Helper & Default note */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center justify-center space-x-1 mx-auto cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>PIN padrão: <strong className="text-zinc-300 font-bold">1234</strong></span>
          </button>

          {showHint && (
            <div className="mt-2 p-2.5 bg-[#14141A] rounded-xl border border-[#242430] text-[11px] text-zinc-400 text-left space-y-1 animate-in fade-in duration-150">
              <p>• O PIN predefinido do sistema é <strong className="text-zinc-200">1234</strong>.</p>
              <p>• Pode alterar o seu PIN a qualquer momento no menu <strong>Definições da Conta</strong>.</p>
              <p>• Pode também premir os números do teclado do seu computador.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

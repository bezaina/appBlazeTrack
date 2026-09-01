import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Unplug,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  setCustomSupabaseConfig, 
  disconnectSupabase, 
  reconnectDefaultSupabase,
  isSupabaseConfigured,
  testSupabaseConnection,
  SUPABASE_PROJECT_NAME,
  SUPABASE_PROJECT_ID
} from '../services/supabase';

interface SupabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChanged?: (isConnected: boolean) => void;
}

export const SupabaseConnectModal: React.FC<SupabaseConnectModalProps> = ({
  isOpen,
  onClose,
  onConnectionChanged,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setSupabaseUrl(config.url);
      setSupabaseKey(config.key);
      setIsConnected(isSupabaseConfigured());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResetToDefaultProject = () => {
    reconnectDefaultSupabase();
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseKey(config.key);
    setIsConnected(true);
    setTestResult({
      success: true,
      message: `Restaurado para o projeto ${SUPABASE_PROJECT_NAME} (ID: ${SUPABASE_PROJECT_ID}).`,
    });
    if (onConnectionChanged) onConnectionChanged(true);
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = supabaseUrl.trim();
    const cleanKey = supabaseKey.trim();

    if (!cleanUrl || !cleanKey) {
      setTestResult({
        success: false,
        message: 'Por favor preencha o Project URL e a Chave anon/public do Supabase.',
      });
      return;
    }

    if (!cleanUrl.startsWith('https://')) {
      setTestResult({
        success: false,
        message: 'O Project URL deve começar por https:// (ex: https://xyzcompany.supabase.co)',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      setCustomSupabaseConfig(cleanUrl, cleanKey);
      const res = await testSupabaseConnection(cleanUrl, cleanKey);

      if (!res.success) {
        throw new Error(res.message || 'Falha ao validar ligação com o Supabase.');
      }

      setTestResult({
        success: true,
        message: res.message || 'Base de dados Supabase conectada e sincronizada com sucesso!',
      });

      setIsConnected(true);
      if (onConnectionChanged) onConnectionChanged(true);
      
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Erro ao ligar ao Supabase. Verifique o URL e a chave anon.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectSupabase();
    setSupabaseUrl('');
    setSupabaseKey('');
    setIsConnected(false);
    setTestResult({
      success: false,
      message: 'Base de dados desconectada. A aplicação utilizará o armazenamento local.',
    });
    if (onConnectionChanged) onConnectionChanged(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#111015] border border-[#272138] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#201A2C] flex items-center justify-between bg-gradient-to-r from-[#171322] to-[#120F1C]">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60 border border-emerald-500/30 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Conexão Supabase DB
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border ${
                  isConnected 
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-400' 
                    : 'bg-amber-950/80 border-amber-800 text-amber-300'
                }`}>
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {SUPABASE_PROJECT_NAME} (ID: <span className="font-mono text-emerald-400">{SUPABASE_PROJECT_ID}</span>)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1E1928] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleTestAndSave} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Status Message */}
          {testResult && (
            <div className={`p-3.5 rounded-2xl text-xs flex items-center space-x-2.5 shadow-md border ${
              testResult.success 
                ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-200' 
                : 'bg-red-950/80 border-red-800/80 text-red-200'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <span className="font-medium">{testResult.message}</span>
            </div>
          )}

          {/* Connected Project Info Box */}
          <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-emerald-300 font-bold">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Base de Dados Principal Configurada</span>
              </span>
              <button
                type="button"
                onClick={handleResetToDefaultProject}
                className="text-[11px] text-zinc-400 hover:text-emerald-300 flex items-center space-x-1 underline cursor-pointer"
                title="Repor credenciais oficiais do projeto jagamaal@gmail.com"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar Padrão</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-400">
              Todos os registos (Voluntariado, Instrução, Gratificações, Tarefas e Perfil) são guardados de forma persistente e em tempo real.
            </p>
          </div>

          {/* Inputs */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1.5 flex items-center justify-between">
                <span>Project URL (Supabase URL) <span className="text-red-400">*</span></span>
                <span className="text-[10px] text-zinc-500 font-mono">https://{SUPABASE_PROJECT_ID}.supabase.co</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://seu-projeto.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#161220] border border-[#282038] rounded-xl text-white text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500 placeholder-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1.5 flex items-center justify-between">
                <span>API Anon / Public Key <span className="text-red-400">*</span></span>
                <span className="text-[10px] text-zinc-500 font-mono">sb_publishable_...</span>
              </label>
              <input
                type="password"
                required
                placeholder="sb_publishable_..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#161220] border border-[#282038] rounded-xl text-white text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500 placeholder-zinc-600"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center space-x-3">
            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="py-3 px-4 bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 text-red-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0"
              >
                <Unplug className="w-4 h-4" />
                <span>Desconectar</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isTesting}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A testar ligação...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isConnected ? 'Guardar & Testar' : 'Conectar Base de Dados'}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

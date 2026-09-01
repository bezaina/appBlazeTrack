import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Key, 
  Lock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Server, 
  Zap, 
  HelpCircle, 
  ExternalLink, 
  Sliders, 
  X,
  FileText,
  Activity
} from 'lucide-react';
import { 
  SmtpConfig, 
  SmtpTestResult, 
  getSavedSmtpConfig, 
  saveSmtpConfig, 
  testSmtpConnection, 
  sendPinRecoveryEmail,
  getServerEmailStatus,
  ServerEmailStatus
} from '../services/emailService';
import { 
  triggerSupabasePasswordReset, 
  triggerSupabaseEmailVerification 
} from '../services/authService';
import { isSupabaseConfigured } from '../services/supabase';
import { UserProfile } from '../types';

interface EmailServiceConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

const PROVIDER_PRESETS: Record<string, { name: string; host: string; port: number; secure: boolean; userHint: string; passHint: string }> = {
  supabase_smtp: {
    name: 'Supabase SMTP / Auth',
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    userHint: 'resend ou o seu utilizador SMTP configurado no Supabase',
    passHint: 'Chave de API / Palavra-passe SMTP',
  },
  resend: {
    name: 'Resend (Recomendado para Supabase)',
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    userHint: 'resend',
    passHint: 're_123456789... (Resend API Key)',
  },
  brevo: {
    name: 'Brevo (Sendinblue)',
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    userHint: 'seu-email@dominio.com',
    passHint: 'Chave SMTP Brevo',
  },
  sendgrid: {
    name: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    userHint: 'apikey',
    passHint: 'SG.xxxxxxxxxxxx',
  },
  gmail: {
    name: 'Gmail SMTP',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    userHint: 'seu-email@gmail.com',
    passHint: 'Palavra-passe de Aplicação de 16 caracteres da Google',
  },
  custom: {
    name: 'Servidor Personalizado / Quartel',
    host: '',
    port: 587,
    secure: false,
    userHint: 'utilizador@dominio.pt',
    passHint: 'Palavra-passe',
  },
};

export const EmailServiceConfigModal: React.FC<EmailServiceConfigModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('supabase_smtp');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(587);
  const [secure, setSecure] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [from, setFrom] = useState('noreply@blazetrack.bv.pt');
  const [testRecipient, setTestRecipient] = useState('');
  
  const [isTesting, setIsTesting] = useState(false);
  const [testTypeRunning, setTestTypeRunning] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerEmailStatus | null>(null);
  const [testResult, setTestResult] = useState<SmtpTestResult | null>(null);
  const [activeTab, setActiveTab] = useState<'testing' | 'settings' | 'guide'>('testing');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing configuration on open
  useEffect(() => {
    if (isOpen) {
      const saved = getSavedSmtpConfig();
      if (saved) {
        setHost(saved.host || '');
        setPort(saved.port || 587);
        setSecure(saved.secure || saved.port === 465);
        setUser(saved.user || '');
        setPass(saved.pass || '');
        setFrom(saved.from || 'noreply@blazetrack.bv.pt');
        if (saved.provider) setSelectedProvider(saved.provider);
      } else {
        // Preset default
        const preset = PROVIDER_PRESETS.supabase_smtp;
        setHost(preset.host);
        setPort(preset.port);
        setSecure(preset.secure);
        setUser('resend');
      }

      setTestRecipient(profile.autoEmailAddress || 'JAGAMAAL@gmail.com');
      fetchServerStatus();
    }
  }, [isOpen, profile]);

  const fetchServerStatus = async () => {
    const status = await getServerEmailStatus();
    setServerStatus(status);
  };

  if (!isOpen) return null;

  const handleProviderSelect = (key: string) => {
    setSelectedProvider(key);
    const preset = PROVIDER_PRESETS[key];
    if (preset) {
      if (preset.host) setHost(preset.host);
      setPort(preset.port);
      setSecure(preset.secure);
      if (key === 'resend') setUser('resend');
      else if (key === 'sendgrid') setUser('apikey');
      else if (key === 'gmail' && profile.autoEmailAddress?.includes('@gmail.com')) {
        setUser(profile.autoEmailAddress);
      }
    }
  };

  const handleSaveSettings = () => {
    const config: SmtpConfig = {
      host: host.trim(),
      port: Number(port),
      secure: secure || port === 465,
      user: user.trim(),
      pass: pass.trim(),
      from: from.trim() || 'noreply@blazetrack.bv.pt',
      provider: selectedProvider as any,
    };

    saveSmtpConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Test 1: Direct SMTP handshake & test email
  const handleRunSmtpTest = async () => {
    setIsTesting(true);
    setTestTypeRunning('smtp');
    setTestResult(null);

    const config: Partial<SmtpConfig> = {
      host: host.trim(),
      port: Number(port),
      secure: secure || port === 465,
      user: user.trim(),
      pass: pass.trim(),
      from: from.trim(),
    };

    const result = await testSmtpConnection(config, testRecipient.trim(), true);
    setTestResult(result);
    setIsTesting(false);
    setTestTypeRunning(null);
    fetchServerStatus();
  };

  // Test 2: Test PIN Recovery Email Template
  const handleTestPinRecovery = async () => {
    setIsTesting(true);
    setTestTypeRunning('pin');
    setTestResult(null);

    const mockPin = Math.floor(100000 + Math.random() * 900000).toString();
    const result = await sendPinRecoveryEmail(
      testRecipient.trim(),
      mockPin,
      profile.name || 'Bombeiro',
      profile.firefighterNumber || '0000'
    );

    setTestResult({
      success: result.success,
      message: result.message,
      messageId: result.messageId,
      destinationEmail: testRecipient.trim(),
      logs: [
        `[1/3] A gerar código PIN de teste: ${mockPin}`,
        `[2/3] A estruturar template oficial com tema de emergência e instruções...`,
        result.success 
          ? `[3/3] Código de recuperação enviado com sucesso para ${testRecipient.trim()}!`
          : `[3/3] Falha no envio: ${result.message}`,
      ],
    });

    setIsTesting(false);
    setTestTypeRunning(null);
  };

  // Test 3: Supabase Auth Password Reset Email
  const handleTestSupabasePasswordReset = async () => {
    setIsTesting(true);
    setTestTypeRunning('password_reset');
    setTestResult(null);

    const result = await triggerSupabasePasswordReset(testRecipient.trim());

    setTestResult({
      success: result.success,
      message: result.message,
      destinationEmail: testRecipient.trim(),
      logs: [
        `[1/3] A inicializar cliente Supabase Auth...`,
        `[2/3] A solicitar reset de palavra-passe para o endpoint do Supabase Auth...`,
        result.success
          ? `[3/3] Pedido aceite pelo Supabase! O email com o link de recuperação foi enviado através do SMTP configurado no Supabase.`
          : `[3/3] Erro do Supabase: ${result.error || result.message}`,
      ],
      error: result.error,
    });

    setIsTesting(false);
    setTestTypeRunning(null);
  };

  // Test 4: Supabase Verification / Confirmation OTP Email
  const handleTestSupabaseVerification = async () => {
    setIsTesting(true);
    setTestTypeRunning('verification');
    setTestResult(null);

    const result = await triggerSupabaseEmailVerification(testRecipient.trim());

    setTestResult({
      success: result.success,
      message: result.message,
      destinationEmail: testRecipient.trim(),
      logs: [
        `[1/3] A contactar o serviço de confirmação de conta do Supabase...`,
        `[2/3] A gerar token de verificação e link seguro de confirmação...`,
        result.success
          ? `[3/3] Email de verificação enviado pelo Supabase para ${testRecipient.trim()}!`
          : `[3/3] Erro do Supabase: ${result.error || result.message}`,
      ],
      error: result.error,
    });

    setIsTesting(false);
    setTestTypeRunning(null);
  };

  const isCloudConnected = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121218] border border-[#262634] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#20202c] flex items-center justify-between bg-[#171722]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-600/20 text-red-500 border border-red-500/30 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Serviços de Email & Supabase SMTP
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {serverStatus?.isConfigured ? 'SMTP Ativo' : 'Pronto a Testar'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Verifique o envio de emails, recuperação de PIN e reset de palavra-passe da sua conta
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-[#222230] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-[#20202c] bg-[#14141d] flex space-x-2">
          <button
            onClick={() => setActiveTab('testing')}
            className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'testing'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Testes & Diagnóstico ao Vivo</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Credenciais SMTP Personalizadas</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'guide'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Guia do Supabase Dashboard</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">

          {/* TAB 1: TESTING & DIAGNOSTICS */}
          {activeTab === 'testing' && (
            <div className="space-y-6">
              
              {/* Recipient Input Card */}
              <div className="bg-[#181824] border border-[#28283a] rounded-xl p-4 space-y-3">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Destinatário de Teste (Email do Bombeiro)</span>
                  <span className="text-[11px] text-zinc-400 font-normal">
                    Email onde irá receber as confirmações
                  </span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="ex: JAGAMAAL@gmail.com"
                    className="w-full bg-[#101016] border border-[#303044] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* Test 1: Handshake & Direct Email */}
                <div className="bg-[#181824] border border-[#28283a] hover:border-red-500/50 transition-colors rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                      <div className="p-1.5 bg-red-500/20 text-red-400 rounded-lg">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span>1. Testar Conexão SMTP</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Executa handshake TLS/SSL com o servidor e envia um email com template oficial dos bombeiros.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isTesting}
                    onClick={handleRunSmtpTest}
                    className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-red-600/20"
                  >
                    {isTesting && testTypeRunning === 'smtp' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>A Testar Conexão...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Disparar Teste SMTP</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Test 2: PIN Recovery Email */}
                <div className="bg-[#181824] border border-[#28283a] hover:border-amber-500/50 transition-colors rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                      <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                        <Lock className="w-4 h-4" />
                      </div>
                      <span>2. Testar Recuperação de PIN</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Envia um código de verificação de 6 dígitos formatado para desbloquear o PIN no ecrã de bloqueio.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isTesting}
                    onClick={handleTestPinRecovery}
                    className="w-full py-2.5 px-3 bg-[#242436] hover:bg-[#2f2f46] text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isTesting && testTypeRunning === 'pin' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>A Enviar Código PIN...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Enviar Código de PIN</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Test 3: Supabase Password Reset Email */}
                <div className="bg-[#181824] border border-[#28283a] hover:border-emerald-500/50 transition-colors rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                      <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                        <Key className="w-4 h-4" />
                      </div>
                      <span>3. Reset de Palavra-passe Supabase</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Dispara o fluxo oficial do Supabase Auth para redefinição segura de palavra-passe da conta.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isTesting}
                    onClick={handleTestSupabasePasswordReset}
                    className="w-full py-2.5 px-3 bg-[#242436] hover:bg-[#2f2f46] text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isTesting && testTypeRunning === 'password_reset' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>A Solicitar ao Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5" />
                        <span>Disparar Reset Supabase</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Test 4: Supabase Verification OTP */}
                <div className="bg-[#181824] border border-[#28283a] hover:border-blue-500/50 transition-colors rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                      <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span>4. Confirmação / OTP Supabase</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Envia o email de ativação de conta ou código OTP para autenticar sem palavra-passe.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isTesting}
                    onClick={handleTestSupabaseVerification}
                    className="w-full py-2.5 px-3 bg-[#242436] hover:bg-[#2f2f46] text-blue-300 hover:text-blue-200 border border-blue-500/30 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isTesting && testTypeRunning === 'verification' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>A Enviar Verificação...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Disparar OTP Supabase</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Real-time Diagnostic Log Console */}
              {testResult && (
                <div className={`p-4 rounded-xl border ${
                  testResult.success 
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' 
                    : 'bg-red-950/20 border-red-500/30 text-red-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2 font-semibold text-sm">
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                    <span>{testResult.message}</span>
                    {testResult.latencyMs && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-zinc-300">
                        {testResult.latencyMs}ms
                      </span>
                    )}
                  </div>

                  {testResult.logs && testResult.logs.length > 0 && (
                    <div className="bg-[#0c0d12] rounded-lg p-3 mt-3 border border-[#20202c] font-mono text-[11px] space-y-1 text-zinc-300">
                      <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                        Registo de Diagnóstico:
                      </div>
                      {testResult.logs.map((log, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <span className="text-zinc-600 select-none">&gt;</span>
                          <span className={log.includes('Sucesso') || log.includes('OK') ? 'text-emerald-400 font-semibold' : log.includes('Erro') || log.includes('Falha') ? 'text-red-400 font-semibold' : ''}>
                            {log}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: CREDENTIALS SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              
              {/* Presets Row */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">
                  Selecione um Provedor / Configuração Rápida
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(PROVIDER_PRESETS).map(([key, item]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleProviderSelect(key)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-colors cursor-pointer ${
                        selectedProvider === key
                          ? 'bg-red-600/10 border-red-500 text-white shadow-sm'
                          : 'bg-[#161622] border-[#262638] text-zinc-400 hover:text-zinc-200 hover:bg-[#1c1c2b]'
                      }`}
                    >
                      <div className="font-semibold text-[11px] text-zinc-200">{item.name}</div>
                      <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {item.host ? `${item.host}:${item.port}` : 'Personalizado'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Host */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Servidor SMTP (Host)
                  </label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="ex: smtp.resend.com ou smtp.gmail.com"
                    className="w-full bg-[#101016] border border-[#2c2c3c] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                {/* Port & Secure */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Porta
                    </label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setPort(val);
                        if (val === 465) setSecure(true);
                        if (val === 587) setSecure(false);
                      }}
                      className="w-full bg-[#101016] border border-[#2c2c3c] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Segurança
                    </label>
                    <button
                      type="button"
                      onClick={() => setSecure(!secure)}
                      className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        secure
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-[#181824] border-[#2c2c3c] text-zinc-300'
                      }`}
                    >
                      {secure ? 'SSL/TLS (465)' : 'STARTTLS (587)'}
                    </button>
                  </div>
                </div>

                {/* User */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Utilizador / API Key
                  </label>
                  <input
                    type="text"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="resend, apikey ou email@dominio.com"
                    className="w-full bg-[#101016] border border-[#2c2c3c] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                {/* Pass */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Palavra-passe / Token
                  </label>
                  <input
                    type="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-[#101016] border border-[#2c2c3c] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                {/* From Email */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300">
                    Endereço de Remetente (From)
                  </label>
                  <input
                    type="text"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    placeholder="Blazetrack BV <noreply@blazetrack.bv.pt>"
                    className="w-full bg-[#101016] border border-[#2c2c3c] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

              </div>

              {/* Save Button */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  {saveSuccess && (
                    <span className="text-xs text-emerald-400 flex items-center space-x-1 font-semibold animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Definições guardadas com sucesso!</span>
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-red-600/20"
                  >
                    Guardar Configurações
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: SUPABASE DASHBOARD GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-zinc-300">
              <div className="bg-[#181824] border border-[#28283a] rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Server className="w-4 h-4 text-red-400" />
                  <span>Como Configurar o SMTP no Painel do Supabase</span>
                </h3>
                
                <ol className="space-y-2.5 list-decimal list-inside text-zinc-300 leading-relaxed">
                  <li>
                    Aceda ao seu projeto em{' '}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="text-red-400 underline font-semibold inline-flex items-center space-x-1"
                    >
                      <span>supabase.com/dashboard</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </li>
                  <li>
                    No menu lateral esquerdo, clique em <strong className="text-white">Project Settings</strong> (ícone de engrenagem) e selecione <strong className="text-white">Authentication</strong>.
                  </li>
                  <li>
                    Desça até à secção <strong className="text-white">SMTP Settings</strong> e ative o botão <strong className="text-emerald-400">"Enable Custom SMTP"</strong>.
                  </li>
                  <li>
                    Preencha os campos com o seu fornecedor de correio (ex: <em>Resend, Brevo, SendGrid, Gmail</em>):
                    <div className="bg-[#101016] p-3 rounded-lg border border-[#262634] my-2 font-mono text-[11px] space-y-1">
                      <div>Sender Email: <span className="text-red-400">onboarding@resend.dev</span> ou o seu domínio</div>
                      <div>Sender Name: <span className="text-zinc-200">Blazetrack BV - Bombeiros</span></div>
                      <div>Host: <span className="text-zinc-200">smtp.resend.com</span></div>
                      <div>Port Number: <span className="text-zinc-200">465</span> (ou 587)</div>
                      <div>User: <span className="text-zinc-200">resend</span></div>
                      <div>Password: <span className="text-zinc-200">re_xxxxxxxxxxxx</span></div>
                    </div>
                  </li>
                  <li>
                    Clique em <strong className="text-white">Save</strong> no fundo da página do Supabase.
                  </li>
                </ol>
              </div>

              <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl text-blue-300 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" />
                <div>
                  <strong>Dica de Segurança:</strong> Ao ativar o Custom SMTP no Supabase, a limitação de 3 emails por hora da versão gratuita deixa de existir, permitindo que todos os bombeiros do quartel recebam confirmações e relatórios instantaneamente.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#20202c] bg-[#14141d] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>Supabase: {isCloudConnected ? 'Conectado' : 'Modo Local / Demo'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#222230] hover:bg-[#2c2c3c] text-white rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

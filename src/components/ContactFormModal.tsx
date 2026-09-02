import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  MessageSquare, 
  User, 
  AtSign, 
  FileText,
  Copy,
  Check,
  Code2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { 
  sendContactFormViaResend, 
  getSavedResendApiKey, 
  saveResendApiKey, 
  getSavedGasWebhookUrl, 
  saveGasWebhookUrl,
  ContactFormResult 
} from '../services/emailService';
import { UserProfile } from '../types';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const [nome, setNome] = useState(profile.name || '');
  const [emailUtilizador, setEmailUtilizador] = useState(profile.autoEmailAddress || profile.googleUser?.email || '');
  const [assunto, setAssunto] = useState(`Contacto Operacional - ${profile.name || 'Bombeiro'}`);
  const [mensagem, setMensagem] = useState('');
  
  const [resendKey, setResendKey] = useState('');
  const [gasUrl, setGasUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<ContactFormResult | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNome(profile.name || '');
      setEmailUtilizador(profile.autoEmailAddress || profile.googleUser?.email || '');
      setResendKey(getSavedResendApiKey());
      setGasUrl(getSavedGasWebhookUrl());
      setResult(null);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !emailUtilizador.trim() || !mensagem.trim()) {
      setResult({
        success: false,
        message: 'Por favor preencha todos os campos obrigatórios (Nome, Email e Mensagem).',
      });
      return;
    }

    setIsSending(true);
    setResult(null);

    if (resendKey.trim()) {
      saveResendApiKey(resendKey.trim());
    }
    if (gasUrl.trim()) {
      saveGasWebhookUrl(gasUrl.trim());
    }

    const res = await sendContactFormViaResend({
      nome: nome.trim(),
      emailUtilizador: emailUtilizador.trim(),
      mensagem: mensagem.trim(),
      assunto: assunto.trim(),
      apiKey: resendKey.trim() || undefined,
      gasWebhookUrl: gasUrl.trim() || undefined,
      from: 'Geral <geral@appblazetrack.com>',
      to: 'jagamaal@gmail.com',
    });

    setResult(res);
    setIsSending(false);

    if (res.success) {
      setMensagem('');
    }
  };

  const gasSnippet = `function enviarEmailPeloResend(nome, emailUtilizador, mensagem) {
  var apiKey = "${resendKey || 'SUA_API_KEY_DO_RESEND_AQUI'}";
  var url = "https://api.resend.com/emails";
  
  var payload = {
    "from": "Geral <geral@appblazetrack.com>",
    "to": ["jagamaal@gmail.com"],
    "subject": "Novo contacto de " + nome,
    "html": "<p><strong>Nome:</strong> " + nome + "</p>" +
            "<p><strong>Email:</strong> " + emailUtilizador + "</p>" +
            "<p><strong>Mensagem:</strong> " + mensagem + "</p>"
  };

  var options = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "Authorization": "Bearer " + apiKey
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var resultado = JSON.parse(response.getContentText());
    Logger.log("E-mail enviado com sucesso: " + JSON.stringify(resultado));
    return true;
  } catch (error) {
    Logger.log("Erro ao enviar e-mail: " + error.toString());
    return false;
  }
}

function doPost(e) {
  var data = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : e.parameter;
  var nome = data.nome || "Contacto";
  var email = data.emailUtilizador || data.email || "";
  var msg = data.mensagem || "";
  var ok = enviarEmailPeloResend(nome, email, msg);
  return ContentService.createTextOutput(JSON.stringify({ status: ok ? "success" : "error" })).setMimeType(ContentService.MimeType.JSON);
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(gasSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121218] border border-[#262634] rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#20202c] flex items-center justify-between bg-[#171722]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-600/20 text-red-500 border border-red-500/30 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Formulário de Contacto</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Resend & Spaceship
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Envio direto para <strong className="text-zinc-200">jagamaal@gmail.com</strong> através de <span className="text-red-400">geral@appblazetrack.com</span>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          
          {/* Result Alert */}
          {result && (
            <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
              result.success 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                : 'bg-red-950/30 border-red-500/40 text-red-200'
            }`}>
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <div className="font-bold text-sm">{result.message}</div>
                {result.provider && (
                  <div className="text-[11px] opacity-80">
                    Provedor: <span className="font-mono">{result.provider}</span> {result.messageId ? `• ID: ${result.messageId}` : ''}
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Nome */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>O seu Nome / Identificação *</span>
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Gonçalo Silva (BV-1428)"
                className="w-full bg-[#101016] border border-[#2c2c3c] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
                <AtSign className="w-3.5 h-3.5 text-zinc-400" />
                <span>Email de Contacto (Para Resposta) *</span>
              </label>
              <input
                type="email"
                required
                value={emailUtilizador}
                onChange={(e) => setEmailUtilizador(e.target.value)}
                placeholder="ex: seu-email@gmail.com"
                className="w-full bg-[#101016] border border-[#2c2c3c] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors font-mono"
              />
            </div>

            {/* Assunto */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span>Assunto</span>
              </label>
              <input
                type="text"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Assunto da mensagem"
                className="w-full bg-[#101016] border border-[#2c2c3c] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {/* Mensagem */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                <span>Mensagem / Pedido de Informação *</span>
              </label>
              <textarea
                required
                rows={4}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Escreva aqui a sua mensagem ou dúvida sobre o Blazetrack..."
                className="w-full bg-[#101016] border border-[#2c2c3c] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors custom-scrollbar"
              />
            </div>

            {/* Advanced Settings Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{showAdvanced ? 'Ocultar Opções de API & Google Apps Script' : 'Opções Avançadas de API & Google Apps Script'}</span>
              </button>
            </div>

            {showAdvanced && (
              <div className="p-4 bg-[#161622] rounded-xl border border-[#262638] space-y-4 text-xs animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300 block">
                    Resend API Key (re_...) [Opcional se configurado no servidor]
                  </label>
                  <input
                    type="password"
                    value={resendKey}
                    onChange={(e) => setResendKey(e.target.value)}
                    placeholder="re_xxxxxxxxxxxx"
                    className="w-full bg-[#101016] border border-[#2c2c3c] rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300 block">
                    URL do Google Apps Script Web App (Webhook doPost) [Opcional]
                  </label>
                  <input
                    type="url"
                    value={gasUrl}
                    onChange={(e) => setGasUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full bg-[#101016] border border-[#2c2c3c] rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-zinc-400">Código .gs com UrlFetchApp integrado no projeto</span>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="px-2.5 py-1 bg-[#20202e] hover:bg-[#2a2a3e] border border-[#34344e] rounded-lg text-zinc-200 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Código Copiado!' : 'Copiar Codigo.gs'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSending}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-950/60 flex items-center space-x-2 transition-all cursor-pointer"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>A Enviar Mensagem...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Mensagem via Resend</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#20202c] bg-[#14141d] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Domínio Spaceship: <strong className="text-zinc-200">appblazetrack.com</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#20202c] hover:bg-[#2c2c3c] text-zinc-200 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

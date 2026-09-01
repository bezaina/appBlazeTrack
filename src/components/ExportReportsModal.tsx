import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Calendar, 
  CheckCircle2, 
  Filter, 
  Printer, 
  Database,
  Clock,
  GraduationCap,
  Euro,
  Mail,
  Send,
  Loader2,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { 
  VolunteerServiceRecord, 
  InstructionRecord, 
  GratificationRecord, 
  UserProfile 
} from '../types';
import { 
  generatePdfReport, 
  exportCsvReport, 
  downloadJsonBackup, 
  ExportFilterParams,
  filterRecordsByPeriod
} from '../utils/exportUtils';
import { 
  formatMinutesToHoursAndMinutes, 
  formatCurrencyEUR, 
  MONTH_NAMES_PT,
  getTodayDateString 
} from '../utils/formatters';
import { sendReportEmail, EmailDispatchResult } from '../services/emailService';

interface ExportReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  volunteerRecords: VolunteerServiceRecord[];
  instructionRecords: InstructionRecord[];
  gratificationRecords: GratificationRecord[];
  profile: UserProfile;
  initialYear: number;
  initialMonth: number;
}

export const ExportReportsModal: React.FC<ExportReportsModalProps> = ({
  isOpen,
  onClose,
  volunteerRecords,
  instructionRecords,
  gratificationRecords,
  profile,
  initialYear,
  initialMonth,
}) => {
  const [activeTab, setActiveTab] = useState<'download' | 'email'>('email');
  const [category, setCategory] = useState<'all' | 'volunteer' | 'instruction' | 'gratifications'>('all');
  const [periodType, setPeriodType] = useState<'month' | 'year' | 'all' | 'custom'>('month');
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [startDate, setStartDate] = useState<string>(`${initialYear}-01-01`);
  const [endDate, setEndDate] = useState<string>(getTodayDateString());
  
  // Email sending state
  const [targetEmail, setTargetEmail] = useState<string>(
    profile.autoEmailAddress || profile.googleUser?.email || ''
  );
  const [includePdf, setIncludePdf] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<EmailDispatchResult | null>(null);
  const [emailError, setEmailError] = useState<string>('');

  const [exportSuccessNotice, setExportSuccessNotice] = useState('');

  if (!isOpen) return null;

  const filterParams: ExportFilterParams = {
    category,
    periodType,
    selectedYear,
    selectedMonth,
    startDate,
    endDate,
  };

  // Preview stats for the current filter
  const filteredVol = filterRecordsByPeriod<VolunteerServiceRecord>(volunteerRecords, filterParams);
  const filteredInst = filterRecordsByPeriod<InstructionRecord>(instructionRecords, filterParams);
  const filteredGrat = filterRecordsByPeriod<GratificationRecord>(gratificationRecords, filterParams);

  const previewVolMinutes = filteredVol.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const previewInstMinutes = filteredInst.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const previewGratEuros = filteredGrat.reduce((acc, r) => acc + (r.amount || 0), 0);

  const handleExportPdf = () => {
    generatePdfReport(volunteerRecords, instructionRecords, gratificationRecords, profile, filterParams);
    setExportSuccessNotice('Relatório PDF oficial gerado e descarregado com sucesso.');
    setTimeout(() => setExportSuccessNotice(''), 4000);
  };

  const handleExportCsv = () => {
    exportCsvReport(volunteerRecords, instructionRecords, gratificationRecords, profile, filterParams);
    setExportSuccessNotice('Ficheiro CSV gerado e descarregado com sucesso.');
    setTimeout(() => setExportSuccessNotice(''), 4000);
  };

  const handleBackupJson = () => {
    downloadJsonBackup({
      volunteerRecords,
      instructionRecords,
      gratificationRecords,
      profile,
    });
    setExportSuccessNotice('Backup completo JSON descarregado com sucesso.');
    setTimeout(() => setExportSuccessNotice(''), 4000);
  };

  const handleSendEmail = async () => {
    if (!targetEmail.trim() || !targetEmail.includes('@')) {
      setEmailError('Por favor, introduza um endereço de email válido.');
      return;
    }

    setIsSendingEmail(true);
    setEmailError('');
    setEmailResult(null);

    try {
      const result = await sendReportEmail(
        volunteerRecords,
        instructionRecords,
        gratificationRecords,
        profile,
        {
          to: targetEmail.trim(),
          reportType: periodType === 'year' ? 'annual' : periodType === 'month' ? 'monthly' : periodType,
          selectedYear,
          selectedMonth,
          startDate,
          endDate,
          category,
          includePdfAttachment: includePdf,
        }
      );

      setEmailResult(result);
    } catch (err: any) {
      setEmailError(err.message || 'Erro ao enviar relatório por email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const currentPeriodName = periodType === 'year' 
    ? `Ano Completo de ${selectedYear}` 
    : periodType === 'month' 
    ? `${MONTH_NAMES_PT[selectedMonth - 1]} de ${selectedYear}`
    : 'Período Personalizado';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#14141A] rounded-2xl max-w-xl w-full shadow-2xl border border-[#242430] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#242430] flex items-center justify-between bg-[#101014]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-950/70 border border-red-800/60 text-red-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-lg">
                Relatórios Operacionais & Envio
              </h3>
              <p className="text-xs text-zinc-400">
                Envie relatórios mensais e anuais por email ou descarregue documentos oficiais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector: Enviar por Email vs Descarregar Ficheiros */}
        <div className="flex border-b border-[#242430] bg-[#121216] px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`pb-2.5 px-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'email'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Enviar por Email (Mensal / Anual)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('download')}
            className={`pb-2.5 px-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'download'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Descarregar Ficheiros (PDF / CSV / JSON)</span>
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {exportSuccessNotice && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/50 rounded-xl text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{exportSuccessNotice}</span>
            </div>
          )}

          {/* 1. Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              1. Selecionar Conteúdo do Relatório
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setCategory('all')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  category === 'all'
                    ? 'border-red-600 bg-red-950/70 text-red-300 shadow-xs'
                    : 'border-[#242430] bg-[#181820] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span>Relatório Geral</span>
                <span className="text-[10px] opacity-75">(Tudo incluído)</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('volunteer')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  category === 'volunteer'
                    ? 'border-red-600 bg-red-950/70 text-red-300 shadow-xs'
                    : 'border-[#242430] bg-[#181820] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span>Só Voluntariado</span>
                <span className="text-[10px] opacity-75">({filteredVol.length} serviços)</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('instruction')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  category === 'instruction'
                    ? 'border-blue-600 bg-blue-950/70 text-blue-300 shadow-xs'
                    : 'border-[#242430] bg-[#181820] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span>Só Instrução</span>
                <span className="text-[10px] opacity-75">({filteredInst.length} formações)</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('gratifications')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  category === 'gratifications'
                    ? 'border-emerald-600 bg-emerald-950/70 text-emerald-300 shadow-xs'
                    : 'border-[#242430] bg-[#181820] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span>Gratificações</span>
                <span className="text-[10px] opacity-75">({filteredGrat.length} recibos)</span>
              </button>
            </div>
          </div>

          {/* 2. Period Selection (Mensal vs Anual vs Personalizado) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-300">
              2. Selecionar Período: <strong className="text-orange-400">Mensal ou Anual</strong>
            </label>
            <div className="flex bg-[#181820] p-1 rounded-xl text-xs font-semibold border border-[#242430]">
              <button
                type="button"
                onClick={() => setPeriodType('month')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  periodType === 'month'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Relatório Mensal</span>
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('year')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  periodType === 'year'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Relatório Anual</span>
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('custom')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  periodType === 'custom'
                    ? 'bg-[#242430] text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Personalizado
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('all')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  periodType === 'all'
                    ? 'bg-[#242430] text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Todo o Histórico
              </button>
            </div>

            {/* Sub-selectors depending on periodType */}
            {periodType === 'month' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Mês a Reportar</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-semibold bg-[#18181F] border border-[#282834] rounded-xl text-zinc-200 outline-none cursor-pointer focus:border-red-500"
                  >
                    {MONTH_NAMES_PT.map((m, idx) => (
                      <option key={m} value={idx + 1} className="bg-[#18181F] text-zinc-200">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Ano</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-semibold bg-[#18181F] border border-[#282834] rounded-xl text-zinc-200 outline-none cursor-pointer focus:border-red-500"
                  >
                    {[2024, 2025, 2026, 2027].map((yr) => (
                      <option key={yr} value={yr} className="bg-[#18181F] text-zinc-200">
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {periodType === 'year' && (
              <div className="pt-1">
                <label className="block text-[11px] text-zinc-400 mb-1">Ano Completo a Reportar</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold bg-[#18181F] border border-[#282834] rounded-xl text-zinc-200 outline-none cursor-pointer focus:border-red-500"
                >
                  {[2024, 2025, 2026, 2027].map((yr) => (
                    <option key={yr} value={yr} className="bg-[#18181F] text-zinc-200">
                      Ano Completo de {yr} (12 Meses)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {periodType === 'custom' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Data Início</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#18181F] border border-[#282834] rounded-xl text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#18181F] border border-[#282834] rounded-xl text-zinc-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Live Preview Summary Box */}
          <div className="bg-[#181820] p-4 rounded-xl border border-[#242430]">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Resumo dos Registos a Incluir
              </h4>
              <span className="text-[11px] font-semibold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded-md border border-orange-800/40">
                {currentPeriodName}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#14141A] p-2.5 rounded-xl border border-[#242430]">
                <span className="text-[10px] text-zinc-400 block">Horas Volunt.</span>
                <span className="font-mono font-bold text-xs sm:text-sm text-red-400">
                  {formatMinutesToHoursAndMinutes(previewVolMinutes)}
                </span>
                <span className="text-[9px] text-zinc-500 block">{filteredVol.length} serviços</span>
              </div>
              <div className="bg-[#14141A] p-2.5 rounded-xl border border-[#242430]">
                <span className="text-[10px] text-zinc-400 block">Horas Instrução</span>
                <span className="font-mono font-bold text-xs sm:text-sm text-blue-400">
                  {formatMinutesToHoursAndMinutes(previewInstMinutes)}
                </span>
                <span className="text-[9px] text-zinc-500 block">{filteredInst.length} formações</span>
              </div>
              <div className="bg-[#14141A] p-2.5 rounded-xl border border-[#242430]">
                <span className="text-[10px] text-zinc-400 block">Gratificações</span>
                <span className="font-mono font-bold text-xs sm:text-sm text-emerald-400">
                  {formatCurrencyEUR(previewGratEuros)}
                </span>
                <span className="text-[9px] text-zinc-500 block">{filteredGrat.length} recibos</span>
              </div>
            </div>
          </div>

          {/* TAB 1: EMAIL SENDING */}
          {activeTab === 'email' && (
            <div className="space-y-3 pt-1 border-t border-[#242430]">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Email de Destino (Comando / Secretaria / Próprio)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="exemplo@bombeiros.pt ou o seu email"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  id="include-pdf-check"
                  checked={includePdf}
                  onChange={(e) => setIncludePdf(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 bg-[#18181F] border-[#282834]"
                />
                <label htmlFor="include-pdf-check" className="cursor-pointer">
                  Anexar ficheiro PDF oficial
                </label>
              </div>

              {emailError && (
                <div className="p-3 bg-red-950/60 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}

              {emailResult && (
                <div className="p-3.5 bg-emerald-950/70 border border-emerald-800/60 rounded-xl space-y-2 text-xs text-emerald-200">
                  <div className="flex items-center space-x-2 font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{emailResult.message}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {emailResult.gmailComposeUrl && (
                      <a
                        href={emailResult.gmailComposeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-3 bg-[#181820] hover:bg-[#242430] border border-emerald-700/60 rounded-lg text-emerald-300 font-semibold text-[11px] flex items-center space-x-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Abrir no Gmail Web</span>
                      </a>
                    )}
                    {emailResult.mailtoUrl && (
                      <a
                        href={emailResult.mailtoUrl}
                        className="py-1.5 px-3 bg-[#181820] hover:bg-[#242430] border border-emerald-700/60 rounded-lg text-zinc-300 font-semibold text-[11px] flex items-center space-x-1.5 transition-colors"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Cliente de Email Padrão</span>
                      </a>
                    )}
                    {emailResult.pdfBlobUrl && (
                      <a
                        href={emailResult.pdfBlobUrl}
                        download={`Relatorio_${profile.firefighterNumber}_${periodType}.pdf`}
                        className="py-1.5 px-3 bg-[#181820] hover:bg-[#242430] border border-emerald-700/60 rounded-lg text-zinc-300 font-semibold text-[11px] flex items-center space-x-1.5 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>Descarregar PDF</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              <button
                id="send-email-report-action-btn"
                type="button"
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>A compilar e enviar relatório por email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Relatório ({periodType === 'year' ? 'Anual' : 'Mensal'}) por Email</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: DIRECT DOWNLOADS */}
          {activeTab === 'download' && (
            <div className="space-y-2 pt-1 border-t border-[#242430]">
              <button
                id="export-pdf-official-btn"
                onClick={handleExportPdf}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-sm shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Gerar e Descarregar Relatório PDF Oficial ({periodType === 'year' ? 'Anual' : 'Mensal'})</span>
              </button>

              <button
                id="export-csv-spreadsheet-btn"
                onClick={handleExportCsv}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1E1E26] hover:bg-[#282834] text-zinc-200 border border-[#282834] font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Tabela CSV (Excel / Folhas de Cálculo)</span>
              </button>

              <button
                id="export-json-backup-btn"
                onClick={handleBackupJson}
                className="w-full py-2 px-4 text-xs text-zinc-400 hover:text-zinc-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Descarregar Cópia de Segurança Completa (.JSON)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

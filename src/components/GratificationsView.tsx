import React, { useState, useMemo } from 'react';
import { 
  Euro, 
  Plus, 
  Search, 
  Download, 
  FileText, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertTriangle,
  Receipt,
  TrendingUp,
  Tag
} from 'lucide-react';
import { GratificationRecord, GratificationType, UserProfile } from '../types';
import { 
  formatCurrencyEUR, 
  formatDatePt, 
  MONTH_NAMES_PT 
} from '../utils/formatters';
import { exportCsvReport, generatePdfReport } from '../utils/exportUtils';

interface GratificationsViewProps {
  records: GratificationRecord[];
  profile: UserProfile;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  onAddNew: () => void;
  onEdit: (record: GratificationRecord) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onValidateAllPending?: () => void;
}

const GRATIFICATION_TYPES: GratificationType[] = [
  'BAL',
  'Subida de Categoria',
  'DECIR',
  'DECIR 1/2',
  'Prevenção',
  'DIPIR',
  'Outra Gratificação',
];

export const GratificationsView: React.FC<GratificationsViewProps> = ({
  records,
  profile,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  onAddNew,
  onEdit,
  onDelete,
  onToggleStatus,
  onValidateAllPending,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Recebido' | 'Pendente'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const [y, m] = r.date.split('-').map(Number);

      if (filterPeriod === 'month' && (y !== selectedYear || m !== selectedMonth)) {
        return false;
      }
      if (filterPeriod === 'year' && y !== selectedYear) {
        return false;
      }

      if (filterStatus !== 'all' && r.paidStatus !== filterStatus) {
        return false;
      }

      if (filterType !== 'all' && r.type !== filterType) {
        return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchType = r.type.toLowerCase().includes(query);
        const matchRec = (r.receiptNumber || '').toLowerCase().includes(query);
        const matchNotes = (r.notes || '').toLowerCase().includes(query);
        if (!matchType && !matchRec && !matchNotes) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, selectedYear, selectedMonth, filterPeriod, filterStatus, filterType, searchTerm]);

  // Overall and filtered pending counts
  const allPendingRecords = useMemo(() => records.filter((r) => r.paidStatus === 'Pendente'), [records]);
  const filteredPendingRecords = useMemo(() => filteredRecords.filter((r) => r.paidStatus === 'Pendente'), [filteredRecords]);
  const allReceivedRecords = useMemo(() => records.filter((r) => r.paidStatus === 'Recebido'), [records]);

  // Financial aggregates
  const totalAmount = useMemo(() => {
    return filteredRecords.reduce((acc, r) => acc + (r.amount || 0), 0);
  }, [filteredRecords]);

  const receivedAmount = useMemo(() => {
    return filteredRecords.filter((r) => r.paidStatus === 'Recebido').reduce((acc, r) => acc + (r.amount || 0), 0);
  }, [filteredRecords]);

  const pendingAmount = useMemo(() => {
    return filteredRecords.filter((r) => r.paidStatus === 'Pendente').reduce((acc, r) => acc + (r.amount || 0), 0);
  }, [filteredRecords]);

  const totalAllPendingAmount = useMemo(() => {
    return allPendingRecords.reduce((acc, r) => acc + (r.amount || 0), 0);
  }, [allPendingRecords]);

  const handleExportCsv = () => {
    exportCsvReport([], [], records, profile, {
      category: 'gratifications',
      periodType: filterPeriod,
      selectedYear,
      selectedMonth,
    });
  };

  const handleExportPdf = () => {
    generatePdfReport([], [], records, profile, {
      category: 'gratifications',
      periodType: filterPeriod,
      selectedYear,
      selectedMonth,
    });
  };

  return (
    <div className="space-y-6">
      {/* Financial Header Banner */}
      <div className="bg-[#121216] rounded-2xl p-5 border border-[#1F1F25] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                <Euro className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
                Gratificações e Compensações (€)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Controlo de diárias do DECIR, serviços remunerados e validação direta de pagamentos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 text-xs font-semibold bg-[#18181F] hover:bg-[#22222C] border border-[#282834] text-zinc-300 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="px-3.5 py-2 text-xs font-semibold bg-[#18181F] hover:bg-[#22222C] border border-[#282834] text-zinc-300 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Extrato Fiscal PDF</span>
            </button>
            <button
              id="add-gratification-record-btn"
              onClick={onAddNew}
              className="px-4 py-2 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Gratificação</span>
            </button>
          </div>
        </div>

        {/* Financial Stat Cards */}
        <div className="mt-5 pt-4 border-t border-[#1C1C24] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#16161D] border border-[#22222D] p-3 rounded-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">Total no Período</span>
            <span className="font-mono font-bold text-lg sm:text-xl text-emerald-400">
              {formatCurrencyEUR(totalAmount)}
            </span>
          </div>
          <div className="bg-[#16161D] border border-[#22222D] p-3 rounded-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">Já Recebido</span>
            <span className="font-mono font-bold text-lg sm:text-xl text-zinc-100">
              {formatCurrencyEUR(receivedAmount)}
            </span>
          </div>
          <div className="bg-[#16161D] border border-[#22222D] p-3 rounded-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">Pendente de Pagamento</span>
            <span className="font-mono font-bold text-lg sm:text-xl text-amber-400">
              {formatCurrencyEUR(pendingAmount)}
            </span>
          </div>
          <div className="bg-[#16161D] border border-[#22222D] p-3 rounded-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">Período Selecionado</span>
            <span className="font-semibold text-xs sm:text-sm text-zinc-200 truncate block mt-1">
              {filterPeriod === 'month'
                ? `${MONTH_NAMES_PT[selectedMonth - 1]} ${selectedYear}`
                : filterPeriod === 'year'
                ? `Ano ${selectedYear}`
                : 'Todas as Gratificações'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Pending Payments Action Bar */}
      {allPendingRecords.length > 0 && (
        <div className="bg-gradient-to-r from-[#201808] to-[#171A12] border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-sm sm:text-base text-amber-200">
                  {allPendingRecords.length} {allPendingRecords.length === 1 ? 'Gratificação Pendente' : 'Gratificações Pendentes'} de Pagamento
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-900/60 border border-amber-700/60 text-amber-300 font-mono font-bold text-xs">
                  {formatCurrencyEUR(totalAllPendingAmount)}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pode validar o pagamento individualmente em cada cartão com 1 clique ou validar tudo de uma vez.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {filterStatus !== 'Pendente' && (
              <button
                type="button"
                onClick={() => setFilterStatus('Pendente')}
                className="px-3 py-2 bg-[#221E14] hover:bg-[#2F291B] border border-amber-800/60 text-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Ver Pendentes
              </button>
            )}
            {onValidateAllPending && (
              <button
                type="button"
                onClick={onValidateAllPending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                title="Marcar todas as gratificações pendentes como recebidas"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Validar Todos os Pagamentos</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-[#121216] rounded-2xl p-4 border border-[#1F1F25] shadow-xs space-y-3">
        {/* Quick Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-[#1C1C24]">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-[#22222E] text-white border border-[#343446]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todas ({records.length})
          </button>
          <button
            onClick={() => setFilterStatus('Pendente')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              filterStatus === 'Pendente'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pendentes de Pagamento ({allPendingRecords.length})</span>
            {allPendingRecords.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setFilterStatus('Recebido')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              filterStatus === 'Recebido'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Recebidos / Pagos ({allReceivedRecords.length})</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Period Mode Toggle */}
          <div className="flex bg-[#181820] p-1 rounded-xl border border-[#242430]">
            <button
              onClick={() => setFilterPeriod('month')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterPeriod === 'month'
                  ? 'bg-[#282836] text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setFilterPeriod('year')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterPeriod === 'year'
                  ? 'bg-[#282836] text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Ano
            </button>
            <button
              onClick={() => setFilterPeriod('all')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterPeriod === 'all'
                  ? 'bg-[#282836] text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Tudo
            </button>
          </div>

          {/* Month & Year pickers */}
          <div className="flex space-x-2">
            {filterPeriod === 'month' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="flex-1 px-3 py-1.5 text-xs font-semibold bg-[#18181F] border border-[#282834] rounded-xl text-zinc-200 outline-none cursor-pointer"
              >
                {MONTH_NAMES_PT.map((m, idx) => (
                  <option key={m} value={idx + 1} className="bg-[#18181F] text-zinc-200">
                    {m}
                  </option>
                ))}
              </select>
            )}

            {filterPeriod !== 'all' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-24 px-3 py-1.5 text-xs font-semibold bg-[#18181F] border border-[#282834] rounded-xl text-zinc-200 outline-none cursor-pointer font-mono"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr} className="bg-[#18181F] text-zinc-200">
                    {yr}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-[#18181F] border border-[#282834] rounded-xl text-zinc-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#18181F] text-zinc-200">Todos os Tipos</option>
              {GRATIFICATION_TYPES.map((t) => (
                <option key={t} value={t} className="bg-[#18181F] text-zinc-200">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar recibo, tipo, notas..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-[#18181F] border border-[#282834] rounded-xl text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Gratifications List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-[#121216] border border-dashed border-[#242430] rounded-2xl p-10 text-center">
          <Euro className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-200 text-base">
            Nenhuma gratificação encontrada
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Não existem compensações ou diárias registadas com os filtros selecionados.
          </p>
          <button
            onClick={onAddNew}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registar Gratificação</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => {
            const isReceived = record.paidStatus === 'Recebido';
            return (
              <div
                key={record.id}
                className={`bg-[#121216] border rounded-2xl p-4 sm:p-5 shadow-xs transition-all ${
                  isReceived
                    ? 'border-[#1F1F25] hover:border-emerald-500/40'
                    : 'border-amber-900/40 bg-gradient-to-r from-[#171413] to-[#121216] hover:border-amber-500/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isReceived
                          ? 'bg-emerald-950/60 border border-emerald-800/40 text-emerald-400'
                          : 'bg-amber-950/70 border border-amber-800/50 text-amber-400'
                      }`}
                    >
                      <Euro className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-zinc-100 text-sm sm:text-base">
                          {record.type}
                        </span>
                        
                        {/* 1-Click Status Badge */}
                        <button
                          onClick={() => onToggleStatus(record.id)}
                          title="Clique para alternar estado de pagamento"
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                            isReceived
                              ? 'bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/70'
                              : 'bg-amber-950/80 border border-amber-800/60 text-amber-300 hover:bg-amber-900/70'
                          }`}
                        >
                          {isReceived ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5 text-amber-400" />}
                          <span>{isReceived ? 'Pago' : 'Pendente de Pagamento'}</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1.5">
                        <span className="flex items-center space-x-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Data do Serviço: {formatDatePt(record.date, { shortMonth: true })}</span>
                        </span>
                        {record.receiptNumber && (
                          <>
                            <span>•</span>
                            <span className="flex items-center space-x-1 font-mono text-zinc-300">
                              <Receipt className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Recibo: {record.receiptNumber}</span>
                            </span>
                          </>
                        )}
                        {record.paymentDate && isReceived && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400/90 font-medium">
                              Pago em: {formatDatePt(record.paymentDate, { shortMonth: true })}
                            </span>
                          </>
                        )}
                      </div>

                      {record.notes && (
                        <p className="text-xs text-zinc-300 mt-2 bg-[#171720] p-2.5 rounded-xl border border-[#22222E]">
                          {record.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Amount & Fast Action Area */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-[#1C1C24] gap-3 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Valor Líquido</span>
                      <span className="font-mono font-black text-xl sm:text-2xl text-emerald-400">
                        {formatCurrencyEUR(record.amount)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Prominent 1-Click Validate Payment Button */}
                      {!isReceived ? (
                        <button
                          onClick={() => onToggleStatus(record.id)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white text-xs font-black rounded-xl flex items-center space-x-1.5 shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                          title="Validar pagamento com 1 clique"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Validar Pagamento</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleStatus(record.id)}
                          title="Clique para reverter para pendente"
                          className="px-2.5 py-1 bg-[#181820] hover:bg-[#22222C] border border-[#2A2A38] text-zinc-400 hover:text-amber-300 rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3 h-3 text-amber-500/80" />
                          <span>Reverter</span>
                        </button>
                      )}

                      <button
                        onClick={() => onEdit(record)}
                        title="Editar detalhes"
                        className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-[#1C1C26] transition-colors cursor-pointer border border-transparent hover:border-[#2C2C38]"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(record.id)}
                        title="Eliminar gratificação"
                        className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/60 transition-colors cursor-pointer border border-transparent hover:border-red-900/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#14141A] rounded-2xl max-w-sm w-full p-5 border border-[#242430] shadow-xl">
            <div className="flex items-center space-x-3 text-red-500 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-zinc-100 text-base">Eliminar Gratificação?</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Tem a certeza de que pretende remover este registo de gratificação? Os totais financeiros serão atualizados.
            </p>
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26] rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer"
              >
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

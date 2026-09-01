import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  SlidersHorizontal, 
  Flame, 
  GraduationCap, 
  Euro, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  Filter, 
  Download, 
  Calendar, 
  CheckCircle2, 
  Check 
} from 'lucide-react';
import { 
  VolunteerServiceRecord, 
  InstructionRecord, 
  GratificationRecord, 
  UserProfile, 
  OperationType,
  InstructionTopic,
  GratificationType
} from '../types';
import { formatMinutesToHoursAndMinutes, formatCurrencyEUR, formatDatePt, MONTH_NAMES_PT } from '../utils/formatters';

interface RecordsListViewProps {
  volunteerRecords: VolunteerServiceRecord[];
  instructionRecords: InstructionRecord[];
  gratificationRecords: GratificationRecord[];
  profile: UserProfile;
  onAddNewRecord: (type: 'volunteer' | 'instruction' | 'gratification') => void;
  onEditVolunteer: (record: VolunteerServiceRecord) => void;
  onEditInstruction: (record: InstructionRecord) => void;
  onEditGratification: (record: GratificationRecord) => void;
  onDeleteVolunteer: (id: string) => void;
  onDeleteInstruction: (id: string) => void;
  onDeleteGratification: (id: string) => void;
  onToggleGratificationStatus?: (id: string) => void;
  onOpenReports: () => void;
}

const OPERATION_TYPES: OperationType[] = [
  'Piquete/Socorro',
  'Incêndio Rural',
  'Incêndio Urbano',
  'Acidente',
  'Outro Serviço',
];

const INSTRUCTION_TOPICS: InstructionTopic[] = [
  'Combate a Incêndios Florestais (CIF)',
  'Combate a Incêndios Urbanos e Industriais (CIUI)',
  'Salvamento e Desencarceramento (SD)',
  'Suporte Básico de Vida / TAT',
  'Técnicas de Socorrismo e Emergência Pré-Hospitalar',
  'Matérias Perigosas (HazMat)',
  'Condução Fora de Estrada / TT e Operação de Viaturas',
  'Comunicações e SIRESP',
  'Salvamento em Grande Ângulo / Resgate',
  'Organização do Serviço de Incêndios / Liderança',
  'Outro Tema',
];

const GRATIFICATION_TYPES: GratificationType[] = [
  'BAL',
  'Subida de Categoria',
  'DECIR',
  'DECIR 1/2',
  'Prevenção',
  'DIPIR',
  'Outra Gratificação',
];

export const RecordsListView: React.FC<RecordsListViewProps> = ({
  volunteerRecords,
  instructionRecords,
  gratificationRecords,
  profile,
  onAddNewRecord,
  onEditVolunteer,
  onEditInstruction,
  onEditGratification,
  onDeleteVolunteer,
  onDeleteInstruction,
  onDeleteGratification,
  onToggleGratificationStatus,
  onOpenReports,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'volunteer' | 'instruction' | 'gratification'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or '1'-'12'
  const [selectedYear, setSelectedYear] = useState<string>('2026'); // 'all' or '2024'...'2027'
  const [selectedOperation, setSelectedOperation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleTabChange = (type: 'all' | 'volunteer' | 'instruction' | 'gratification') => {
    setFilterType(type);
    setSelectedOperation('all');
  };

  // Unified items
  const allItems = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'volunteer' | 'instruction' | 'gratification';
      date: string;
      title: string;
      subtitle: string;
      metric: string;
      operationType?: string;
      rawObj: VolunteerServiceRecord | InstructionRecord | GratificationRecord;
      timestamp: number;
    }> = [];

    volunteerRecords.forEach((r) => {
      list.push({
        id: r.id,
        type: 'volunteer',
        date: r.date,
        title: r.serviceType,
        operationType: r.serviceType,
        subtitle: `${r.startTime} - ${r.endTime}${r.vehicle ? ` • ${r.vehicle}` : ''}${r.incidentNumber ? ` • Ocorr. ${r.incidentNumber}` : ''}`,
        metric: formatMinutesToHoursAndMinutes(r.durationMinutes),
        rawObj: r,
        timestamp: new Date(r.date).getTime() || 0,
      });
    });

    instructionRecords.forEach((r) => {
      list.push({
        id: r.id,
        type: 'instruction',
        date: r.date,
        title: r.topic,
        operationType: r.topic,
        subtitle: `${r.instructor ? `Formador: ${r.instructor}` : ''}${r.entity ? ` • ${r.entity}` : ''}`,
        metric: formatMinutesToHoursAndMinutes(r.durationMinutes),
        rawObj: r,
        timestamp: new Date(r.date).getTime() || 0,
      });
    });

    gratificationRecords.forEach((r) => {
      list.push({
        id: r.id,
        type: 'gratification',
        date: r.date,
        title: r.type,
        operationType: r.type,
        subtitle: `Estado: ${r.paidStatus}${r.receiptNumber ? ` • Recibo: ${r.receiptNumber}` : ''}`,
        metric: formatCurrencyEUR(r.amount),
        rawObj: r,
        timestamp: new Date(r.date).getTime() || 0,
      });
    });

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [volunteerRecords, instructionRecords, gratificationRecords]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) return false;

      const [y, m] = item.date.split('-').map(Number);

      // Month filter
      if (selectedMonth !== 'all' && m !== Number(selectedMonth)) {
        return false;
      }

      // Year filter
      if (selectedYear !== 'all' && y !== Number(selectedYear)) {
        return false;
      }

      // Operation / Gratification Type / Topic filter
      if (selectedOperation !== 'all') {
        if (item.operationType !== selectedOperation) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.date.includes(q)
        );
      }

      return true;
    });
  }, [allItems, filterType, selectedMonth, selectedYear, selectedOperation, searchQuery]);

  const handleDelete = (item: { id: string; type: 'volunteer' | 'instruction' | 'gratification' }) => {
    if (item.type === 'volunteer') onDeleteVolunteer(item.id);
    else if (item.type === 'instruction') onDeleteInstruction(item.id);
    else if (item.type === 'gratification') onDeleteGratification(item.id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-[#121216] border border-[#1F1F25] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <SlidersHorizontal className="w-6 h-6 text-orange-500" />
            <span>Todos os Registos Operacionais</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Pesquise, filtre por mês, ano e tipo de operação.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenReports}
            className="px-3 py-2 bg-[#181820] hover:bg-[#22222E] border border-[#2A2A38] text-zinc-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-orange-500" />
            <span>Exportar</span>
          </button>

          <button
            onClick={() => {
              if (filterType === 'gratification') onAddNewRecord('gratification');
              else if (filterType === 'instruction') onAddNewRecord('instruction');
              else onAddNewRecord('volunteer');
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {filterType === 'gratification' 
                ? 'Nova Gratificação' 
                : filterType === 'instruction' 
                ? 'Nova Instrução' 
                : 'Novo Registo'}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Month/Operation Filters Bar */}
      <div className="bg-[#121216] border border-[#1F1F25] rounded-2xl p-4 space-y-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#181820] p-1.5 rounded-xl border border-[#242430]">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#2A1810] text-amber-300 border border-amber-900/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos ({allItems.length})
          </button>

          <button
            onClick={() => handleTabChange('volunteer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              filterType === 'volunteer'
                ? 'bg-orange-950/70 text-orange-300 border border-orange-800/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Voluntariado ({volunteerRecords.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('instruction')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              filterType === 'instruction'
                ? 'bg-yellow-950/70 text-yellow-300 border border-yellow-800/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Instrução ({instructionRecords.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('gratification')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              filterType === 'gratification'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Euro className="w-3.5 h-3.5" />
            <span>Gratificações ({gratificationRecords.length})</span>
          </button>
        </div>

        {/* Dropdown Filters: Month, Year, Operation/Gratification Type, Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* Month Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Filtrar por Mês
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-[#18181F] border border-[#282834] rounded-xl text-zinc-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#18181F] text-zinc-200">Todos os Meses</option>
              {MONTH_NAMES_PT.map((m, idx) => (
                <option key={m} value={idx + 1} className="bg-[#18181F] text-zinc-200">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Ano
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-[#18181F] border border-[#282834] rounded-xl text-zinc-200 outline-none cursor-pointer font-mono"
            >
              <option value="all" className="bg-[#18181F] text-zinc-200">Todos os Anos</option>
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr} className="bg-[#18181F] text-zinc-200">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Operation / Gratification Type / Instruction Topic Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              {filterType === 'gratification'
                ? 'Tipo de Gratificação'
                : filterType === 'instruction'
                ? 'Tema da Formação'
                : filterType === 'volunteer'
                ? 'Tipo de Operação'
                : 'Tipo / Modalidade'}
            </label>
            <select
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-[#18181F] border border-[#282834] rounded-xl text-zinc-200 outline-none cursor-pointer"
            >
              {filterType === 'gratification' ? (
                <>
                  <option value="all" className="bg-[#18181F] text-zinc-200">Todos os Tipos de Gratificação</option>
                  {GRATIFICATION_TYPES.map((gt) => (
                    <option key={gt} value={gt} className="bg-[#18181F] text-zinc-200">
                      {gt}
                    </option>
                  ))}
                </>
              ) : filterType === 'volunteer' ? (
                <>
                  <option value="all" className="bg-[#18181F] text-zinc-200">Todas as Operações</option>
                  {OPERATION_TYPES.map((op) => (
                    <option key={op} value={op} className="bg-[#18181F] text-zinc-200">
                      {op}
                    </option>
                  ))}
                </>
              ) : filterType === 'instruction' ? (
                <>
                  <option value="all" className="bg-[#18181F] text-zinc-200">Todos os Temas de Instrução</option>
                  {INSTRUCTION_TOPICS.map((t) => (
                    <option key={t} value={t} className="bg-[#18181F] text-zinc-200">
                      {t}
                    </option>
                  ))}
                </>
              ) : (
                <>
                  <option value="all" className="bg-[#18181F] text-zinc-200">Todos os Tipos / Modalidades</option>
                  <optgroup label="Gratificações">
                    {GRATIFICATION_TYPES.map((gt) => (
                      <option key={`grat-${gt}`} value={gt} className="bg-[#18181F] text-zinc-200">
                        {gt}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Operações de Voluntariado">
                    {OPERATION_TYPES.map((op) => (
                      <option key={`vol-${op}`} value={op} className="bg-[#18181F] text-zinc-200">
                        {op}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Temas de Instrução">
                    {INSTRUCTION_TOPICS.map((t) => (
                      <option key={`inst-${t}`} value={t} className="bg-[#18181F] text-zinc-200">
                        {t}
                      </option>
                    ))}
                  </optgroup>
                </>
              )}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Pesquisa
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#18181F] border border-[#282834] rounded-xl text-xs text-white placeholder-zinc-500 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Records Table / Cards */}
      <div className="bg-[#121216] border border-[#1F1F25] rounded-2xl overflow-hidden shadow-sm">
        <AnimatePresence mode="wait" initial={false}>
          {filteredItems.length === 0 ? (
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="py-12 text-center space-y-2"
            >
              <Filter className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">
                Nenhum registo encontrado com os filtros atuais.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key={`list-${filterType}-${selectedYear}-${selectedMonth}-${selectedOperation}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="divide-y divide-[#1C1C24]"
            >
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-4.5 flex items-center justify-between gap-4 hover:bg-[#16161D] transition-colors"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        item.type === 'volunteer'
                          ? 'bg-orange-950/60 border-orange-800/40 text-orange-400'
                          : item.type === 'instruction'
                          ? 'bg-yellow-950/60 border-yellow-800/40 text-yellow-400'
                          : 'bg-emerald-950/60 border-emerald-800/40 text-emerald-400'
                      }`}
                    >
                      {item.type === 'volunteer' && <Flame className="w-4 h-4" />}
                      {item.type === 'instruction' && <GraduationCap className="w-4 h-4" />}
                      {item.type === 'gratification' && <Euro className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                          {formatDatePt(item.date)}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            item.type === 'volunteer'
                              ? 'bg-orange-950/60 text-orange-400 border border-orange-900/50'
                              : item.type === 'instruction'
                              ? 'bg-yellow-950/60 text-yellow-400 border border-yellow-900/50'
                              : 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50'
                          }`}
                        >
                          {item.type === 'volunteer' ? 'Voluntariado' : item.type === 'instruction' ? 'Instrução' : 'Gratificação'}
                        </span>

                        {/* Quick Gratification Status Badge */}
                        {item.type === 'gratification' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onToggleGratificationStatus) onToggleGratificationStatus(item.id);
                            }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 cursor-pointer transition-all ${
                              (item.rawObj as GratificationRecord).paidStatus === 'Recebido'
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/70'
                                : 'bg-amber-950/80 text-amber-300 border border-amber-800/60 hover:bg-amber-900/70'
                            }`}
                            title="Clique para alternar estado de pagamento"
                          >
                            {(item.rawObj as GratificationRecord).paidStatus === 'Recebido' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Pago</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Pendente</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white truncate mt-0.5">
                        {item.title}
                      </h3>

                      <p className="text-xs text-zinc-400 truncate max-w-sm sm:max-w-md mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right: Metric & Action Buttons */}
                  <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                    <span className="text-sm sm:text-base font-mono font-bold text-zinc-100">
                      {item.metric}
                    </span>

                    {/* 1-Click Validate Button for Pending Gratifications */}
                    {item.type === 'gratification' && (item.rawObj as GratificationRecord).paidStatus === 'Pendente' && onToggleGratificationStatus && (
                      <button
                        type="button"
                        onClick={() => onToggleGratificationStatus(item.id)}
                        className="hidden sm:flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                        title="Validar pagamento deste registo"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Validar</span>
                      </button>
                    )}

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          if (item.type === 'volunteer') onEditVolunteer(item.rawObj as VolunteerServiceRecord);
                          else if (item.type === 'instruction') onEditInstruction(item.rawObj as InstructionRecord);
                          else if (item.type === 'gratification') onEditGratification(item.rawObj as GratificationRecord);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#20202A] transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {deleteConfirmId === item.id ? (
                        <div className="flex items-center space-x-1 animate-in fade-in duration-150">
                          <button
                            onClick={() => handleDelete(item)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Eliminar
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Trash2, 
  Edit3, 
  MapPin, 
  Truck, 
  ShieldAlert, 
  Calendar,
  AlertTriangle,
  ChevronDown,
  Moon,
  Flame
} from 'lucide-react';
import { VolunteerServiceRecord, OperationType, UserProfile } from '../types';
import { 
  formatMinutesToHoursAndMinutes, 
  formatDatePt, 
  MONTH_NAMES_PT 
} from '../utils/formatters';
import { exportCsvReport, generatePdfReport } from '../utils/exportUtils';

interface VolunteerHoursViewProps {
  records: VolunteerServiceRecord[];
  profile: UserProfile;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  onAddNew: () => void;
  onEdit: (record: VolunteerServiceRecord) => void;
  onDelete: (id: string) => void;
}

const OPERATION_TYPES: OperationType[] = [
  'Piquete/Socorro',
  'Incêndio Rural',
  'Incêndio Urbano',
  'Acidente',
  'Outro Serviço',
];

export const VolunteerHoursView: React.FC<VolunteerHoursViewProps> = ({
  records,
  profile,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  onAddNew,
  onEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const [y, m] = r.date.split('-').map(Number);

      // Period filter
      if (filterPeriod === 'month' && (y !== selectedYear || m !== selectedMonth)) {
        return false;
      }
      if (filterPeriod === 'year' && y !== selectedYear) {
        return false;
      }

      // Type filter
      if (filterType !== 'all' && r.serviceType !== filterType) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchNotes = (r.notes || '').toLowerCase().includes(query);
        const matchInc = (r.incidentNumber || '').toLowerCase().includes(query);
        const matchVeh = (r.vehicle || '').toLowerCase().includes(query);
        const matchLoc = (r.location || '').toLowerCase().includes(query);
        const matchType = r.serviceType.toLowerCase().includes(query);
        if (!matchNotes && !matchInc && !matchVeh && !matchLoc && !matchType) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, selectedYear, selectedMonth, filterPeriod, filterType, searchTerm]);

  // Aggregate stats
  const totalMinutes = useMemo(() => {
    return filteredRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  }, [filteredRecords]);

  // Night and Weekend calculations for active filtered period
  const nightRecords = useMemo(() => {
    return filteredRecords.filter((r) => {
      const startHour = parseInt(r.startTime.split(':')[0] || '0', 10);
      const endHour = parseInt(r.endTime.split(':')[0] || '0', 10);
      return startHour >= 20 || startHour < 8 || endHour < startHour || (r.serviceType && r.serviceType.toLowerCase().includes('noite'));
    });
  }, [filteredRecords]);
  const nightMinutes = nightRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);

  const weekendRecords = useMemo(() => {
    return filteredRecords.filter((r) => {
      const dt = new Date(r.date);
      const day = dt.getDay();
      return day === 0 || day === 6;
    });
  }, [filteredRecords]);
  const weekendMinutes = weekendRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);

  const handleExportCsv = () => {
    exportCsvReport(records, [], [], profile, {
      category: 'volunteer',
      periodType: filterPeriod,
      selectedYear,
      selectedMonth,
    });
  };

  const handleExportPdf = () => {
    generatePdfReport(records, [], [], profile, {
      category: 'volunteer',
      periodType: filterPeriod,
      selectedYear,
      selectedMonth,
    });
  };

  return (
    <div className="space-y-6">
      {/* View Header & Metric Banner */}
      <div className="bg-[#121216] rounded-2xl p-5 border border-[#1F1F25] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-red-950/60 border border-red-800/50 text-red-400">
                <Clock className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
                Horas de Voluntariado
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Registo de turnos, operações de socorro, piquetes, manobras e reuniões de serviço.
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
              <FileText className="w-3.5 h-3.5 text-red-500" />
              <span>Folha PDF</span>
            </button>
            <button
              id="add-volunteer-record-btn"
              onClick={onAddNew}
              className="px-4 py-2 text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Serviço</span>
            </button>
          </div>
        </div>

        {/* Summary Counter */}
        <div className="mt-5 pt-4 border-t border-[#1C1C24] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="bg-[#16161D] border border-[#22222D] p-3 rounded-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">Total Horas</span>
            <span className="font-mono font-bold text-lg sm:text-xl text-red-400">
              {formatMinutesToHoursAndMinutes(totalMinutes)}
            </span>
          </div>
          <div className="bg-[#16161D] border border-[#22222D] p-3 rounded-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">N.º de Serviços</span>
            <span className="font-mono font-bold text-lg sm:text-xl text-zinc-100">
              {filteredRecords.length}
            </span>
          </div>
          <div className="bg-[#16161D] border border-[#22222D] p-3 rounded-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400 flex items-center space-x-1">
              <Moon className="w-3.5 h-3.5" />
              <span>Noites</span>
            </span>
            <span className="font-mono font-bold text-lg sm:text-xl text-sky-300">
              {formatMinutesToHoursAndMinutes(nightMinutes)}
            </span>
            <span className="text-[10px] text-zinc-500 block">
              {nightRecords.length} serviços
            </span>
          </div>
          <div className="bg-[#16161D] border border-[#22222D] p-3 rounded-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Fins-de-Semana</span>
            </span>
            <span className="font-mono font-bold text-lg sm:text-xl text-purple-300">
              {formatMinutesToHoursAndMinutes(weekendMinutes)}
            </span>
            <span className="text-[10px] text-zinc-500 block">
              {weekendRecords.length} serviços
            </span>
          </div>
          <div className="bg-[#16161D] border border-[#22222D] p-3 rounded-xl col-span-2 sm:col-span-4 lg:col-span-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">Período Ativo</span>
            <span className="font-semibold text-xs sm:text-sm text-zinc-200 truncate block mt-1">
              {filterPeriod === 'month'
                ? `${MONTH_NAMES_PT[selectedMonth - 1]} ${selectedYear}`
                : filterPeriod === 'year'
                ? `Ano ${selectedYear}`
                : 'Todos os Anos'}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#121216] rounded-2xl p-4 border border-[#1F1F25] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

          {/* Operation Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-[#18181F] border border-[#282834] rounded-xl text-zinc-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#18181F] text-zinc-200">Todos os Tipos de Operação</option>
              {OPERATION_TYPES.map((t) => (
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
              placeholder="Pesquisar notas, viatura, n.º..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-[#18181F] border border-[#282834] rounded-xl text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Records List / Table */}
      {filteredRecords.length === 0 ? (
        <div className="bg-[#121216] border border-dashed border-[#242430] rounded-2xl p-10 text-center">
          <Clock className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-200 text-base">
            Nenhum serviço de voluntariado encontrado
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Não existem registos de voluntariado com os filtros selecionados.
          </p>
          <button
            onClick={onAddNew}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registar Primeiro Serviço</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-[#121216] border border-[#1F1F25] rounded-xl p-4 shadow-xs hover:border-[#2C2C38] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/40 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-zinc-100 text-sm sm:text-base">
                        {record.serviceType}
                      </span>
                      {record.incidentNumber && (
                        <span className="px-2 py-0.5 bg-[#181820] border border-[#262632] text-zinc-300 rounded text-xs font-mono">
                          Ocorr. {record.incidentNumber}
                        </span>
                      )}
                      {record.vehicle && (
                        <span className="px-2 py-0.5 bg-red-950/60 border border-red-800/40 text-red-300 rounded text-xs font-semibold flex items-center space-x-1">
                          <Truck className="w-3 h-3" />
                          <span>{record.vehicle}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                      <span className="flex items-center space-x-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{formatDatePt(record.date, { showDayOfWeek: true })}</span>
                      </span>
                      <span>•</span>
                      <span className="font-mono font-medium text-zinc-300">
                        {record.startTime} às {record.endTime}
                      </span>
                      {record.location && (
                        <>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{record.location}</span>
                          </span>
                        </>
                      )}
                    </div>

                    {record.notes && (
                      <p className="text-xs text-zinc-300 mt-2 bg-[#171720] p-2 rounded-lg border border-[#22222E]">
                        {record.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Duration Badge & Action Buttons */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#1C1C24] gap-2 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Duração</span>
                    <span className="font-mono font-black text-base sm:text-lg text-zinc-100">
                      {formatMinutesToHoursAndMinutes(record.durationMinutes)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEdit(record)}
                      title="Editar serviço"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-[#1C1C26] transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(record.id)}
                      title="Eliminar serviço"
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/60 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#14141A] rounded-2xl max-w-sm w-full p-5 border border-[#242430] shadow-xl">
            <div className="flex items-center space-x-3 text-red-500 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-zinc-100 text-base">Eliminar Registo?</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Tem a certeza de que pretende remover este serviço de voluntariado? Esta ação não pode ser revertida.
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

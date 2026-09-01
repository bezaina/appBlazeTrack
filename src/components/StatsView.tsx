import React, { useMemo } from 'react';
import { 
  PieChart as PieChartIcon, 
  Flame, 
  GraduationCap, 
  Euro, 
  TrendingUp, 
  Award, 
  Target, 
  ShieldCheck,
  Moon,
  Calendar,
  Database,
  Unplug,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { VolunteerServiceRecord, InstructionRecord, GratificationRecord, UserProfile } from '../types';
import { MONTH_SHORT_PT, formatCurrencyEUR, formatMinutesToHoursAndMinutes } from '../utils/formatters';
import { isSupabaseConfigured } from '../services/supabase';

interface StatsViewProps {
  volunteerRecords: VolunteerServiceRecord[];
  instructionRecords: InstructionRecord[];
  gratificationRecords: GratificationRecord[];
  profile: UserProfile;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  onOpenSupabaseConnect?: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  volunteerRecords,
  instructionRecords,
  gratificationRecords,
  profile,
  selectedYear,
  setSelectedYear,
  onOpenSupabaseConnect,
}) => {
  const isDatabaseConnected = isSupabaseConfigured();

  // Aggregate data per month for the selected year
  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      monthIdx: i + 1,
      month: MONTH_SHORT_PT[i],
      volunteerHours: 0,
      instructionHours: 0,
      gratifications: 0,
    }));

    volunteerRecords.forEach((r) => {
      const [y, m] = r.date.split('-').map(Number);
      if (y === selectedYear && m >= 1 && m <= 12) {
        data[m - 1].volunteerHours += (r.durationMinutes || 0) / 60;
      }
    });

    instructionRecords.forEach((r) => {
      const [y, m] = r.date.split('-').map(Number);
      if (y === selectedYear && m >= 1 && m <= 12) {
        data[m - 1].instructionHours += (r.durationMinutes || 0) / 60;
      }
    });

    gratificationRecords.forEach((r) => {
      const [y, m] = r.date.split('-').map(Number);
      if (y === selectedYear && m >= 1 && m <= 12) {
        data[m - 1].gratifications += r.amount || 0;
      }
    });

    return data.map((d) => ({
      ...d,
      volunteerHours: Math.round(d.volunteerHours * 10) / 10,
      instructionHours: Math.round(d.instructionHours * 10) / 10,
      totalHours: Math.round((d.volunteerHours + d.instructionHours) * 10) / 10,
    }));
  }, [volunteerRecords, instructionRecords, gratificationRecords, selectedYear]);

  // Filtered records for the selected year
  const yearVolunteerRecords = useMemo(() => {
    return volunteerRecords.filter((r) => parseInt(r.date.split('-')[0], 10) === selectedYear);
  }, [volunteerRecords, selectedYear]);

  const yearInstructionRecords = useMemo(() => {
    return instructionRecords.filter((r) => parseInt(r.date.split('-')[0], 10) === selectedYear);
  }, [instructionRecords, selectedYear]);

  // Overall totals for selected year
  const totalVolMinutes = yearVolunteerRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const totalInstMinutes = yearInstructionRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);

  const totalGrat = gratificationRecords
    .filter((r) => parseInt(r.date.split('-')[0], 10) === selectedYear)
    .reduce((acc, r) => acc + (r.amount || 0), 0);

  const totalVolHours = Math.round(totalVolMinutes / 60);
  const totalInstHours = Math.round(totalInstMinutes / 60);
  const grandTotalHours = totalVolHours + totalInstHours;

  // NOITES: Calculate night service hours (services starting >= 20h, ending < 8h or crossing midnight)
  const nightRecords = useMemo(() => {
    return yearVolunteerRecords.filter((r) => {
      const startHour = parseInt(r.startTime.split(':')[0] || '0', 10);
      const endHour = parseInt(r.endTime.split(':')[0] || '0', 10);
      return startHour >= 20 || startHour < 8 || endHour < startHour || (r.serviceType && r.serviceType.toLowerCase().includes('noite'));
    });
  }, [yearVolunteerRecords]);

  const totalNightMinutes = nightRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const totalNightHours = Math.round(totalNightMinutes / 60);

  // FINS-DE-SEMANA: Calculate weekend service hours (Saturday=6 or Sunday=0)
  const weekendRecords = useMemo(() => {
    return yearVolunteerRecords.filter((r) => {
      const dt = new Date(r.date);
      const day = dt.getDay(); // 0 = Sunday, 6 = Saturday
      return day === 0 || day === 6;
    });
  }, [yearVolunteerRecords]);

  const totalWeekendMinutes = weekendRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const totalWeekendHours = Math.round(totalWeekendMinutes / 60);

  // Breakdown by Service Typology
  const typologyBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    yearVolunteerRecords.forEach((r) => {
      counts[r.serviceType] = (counts[r.serviceType] || 0) + (r.durationMinutes || 0);
    });

    return Object.entries(counts)
      .map(([name, minutes]) => ({
        name,
        hours: Math.round(minutes / 60),
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [yearVolunteerRecords]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Database Connection Banner ("A base de dados não está conectada, quero conectar") */}
      {!isDatabaseConnected ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-[#1C1626] to-[#14101A] border border-amber-600/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Unplug className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-extrabold text-white text-sm">
                  A base de dados não está conectada
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 text-[10px] font-bold border border-amber-800/80 font-mono">
                  Local / Offline
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Ligue a sua base de dados PostgreSQL / Supabase para sincronizar todas as suas horas, noites e fins-de-semana na nuvem.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSupabaseConnect}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/60 flex items-center justify-center space-x-2 transition-all cursor-pointer shrink-0"
          >
            <Database className="w-4 h-4" />
            <span>Quero conectar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">
              Base de dados conectada e estatísticas sincronizadas na nuvem.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenSupabaseConnect}
            className="text-[11px] text-emerald-400 hover:underline font-bold"
          >
            Gerir Ligação
          </button>
        </div>
      )}

      {/* 4 Sleek Primary Metric Cards (Voluntariado, Instrução, Noites, Fins-de-Semana) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. VOLUNTARIADO */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121118] border border-[#242032] shadow-xs flex flex-col justify-between space-y-3">
          <div className="w-9 h-9 rounded-full bg-orange-950/70 border border-orange-800/50 flex items-center justify-center text-orange-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 block mb-1">
              VOLUNTARIADO
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {totalVolHours} h
            </div>
            <span className="text-xs text-zinc-400 block mt-1">
              {yearVolunteerRecords.length} registos
            </span>
          </div>
        </div>

        {/* 2. INSTRUÇÃO */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121118] border border-[#242032] shadow-xs flex flex-col justify-between space-y-3">
          <div className="w-9 h-9 rounded-full bg-amber-950/70 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 block mb-1">
              INSTRUÇÃO
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {totalInstHours} h
            </div>
            <span className="text-xs text-zinc-400 block mt-1">
              {yearInstructionRecords.length} registos
            </span>
          </div>
        </div>

        {/* 3. NOITES */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121118] border border-[#242032] shadow-xs flex flex-col justify-between space-y-3">
          <div className="w-9 h-9 rounded-full bg-sky-950/70 border border-sky-800/50 flex items-center justify-center text-sky-400">
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 block mb-1">
              NOITES
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {totalNightHours} h
            </div>
            <span className="text-xs text-zinc-400 block mt-1">
              {nightRecords.length} serviços
            </span>
          </div>
        </div>

        {/* 4. FINS-DE-SEMANA */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121118] border border-[#242032] shadow-xs flex flex-col justify-between space-y-3">
          <div className="w-9 h-9 rounded-full bg-purple-950/70 border border-purple-800/50 flex items-center justify-center text-purple-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 block mb-1">
              FINS-DE-SEMANA
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {totalWeekendHours} h
            </div>
            <span className="text-xs text-zinc-400 block mt-1">
              {weekendRecords.length} serviços
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-[#121216] border border-[#1F1F25] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <PieChartIcon className="w-6 h-6 text-orange-500" />
            <span>Estatísticas & Análise Anual</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Evolução temporal, distribuição de tipologias e cumprimento de metas.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-[#181820] border border-[#262632] rounded-xl p-1">
          {[2024, 2025, 2026].map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedYear === yr
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Goal Targets Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121216] border border-[#1F1F25] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Meta Voluntariado
            </span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {totalVolHours} <span className="text-sm font-sans font-bold text-zinc-400">horas</span>
          </div>
          <div className="text-xs text-emerald-400 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Meta de 160h ({Math.round((totalVolHours / 160) * 100)}%)</span>
          </div>
        </div>

        <div className="bg-[#121216] border border-[#1F1F25] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Meta Instrução
            </span>
            <GraduationCap className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {totalInstHours} <span className="text-sm font-sans font-bold text-zinc-400">horas</span>
          </div>
          <div className="text-xs text-emerald-400 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Meta de 40h ({Math.round((totalInstHours / 40) * 100)}%)</span>
          </div>
        </div>

        <div className="bg-[#121216] border border-[#1F1F25] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Total Gratificações
            </span>
            <Euro className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {formatCurrencyEUR(totalGrat)}
          </div>
          <div className="text-xs text-zinc-400">
            Total liquidado e pendente em {selectedYear}
          </div>
        </div>
      </div>

      {/* Chart: Monthly Hours Evolution */}
      <div className="bg-[#121216] border border-[#1F1F25] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white">
              Evolução Mensal de Horas ({selectedYear})
            </h3>
            <p className="text-xs text-zinc-400">
              Distribuição de horas de serviço e horas de formação por mês.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-bold">
            <span className="flex items-center space-x-1 text-orange-400">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>Voluntariado</span>
            </span>
            <span className="flex items-center space-x-1 text-yellow-400">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span>Instrução</span>
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" stroke="#71717A" fontSize={11} />
              <YAxis stroke="#71717A" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#181820',
                  borderColor: '#2B2B38',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="volunteerHours" fill="#F97316" radius={[4, 4, 0, 0]} name="Voluntariado (h)" />
              <Bar dataKey="instructionHours" fill="#FACC15" radius={[4, 4, 0, 0]} name="Instrução (h)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Typology Breakdown */}
      <div className="bg-[#121216] border border-[#1F1F25] rounded-2xl p-5 space-y-4">
        <h3 className="text-base font-black text-white">
          Distribuição por Tipologia de Serviço
        </h3>

        <div className="space-y-3">
          {typologyBreakdown.map((t, idx) => {
            const percent = totalVolHours > 0 ? Math.round((t.hours / totalVolHours) * 100) : 0;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-300">{t.name}</span>
                  <span className="text-zinc-400 font-mono">{t.hours}h ({percent}%)</span>
                </div>
                <div className="h-2 rounded-full bg-[#1C1C24] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

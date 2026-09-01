import React, { useMemo } from 'react';
import { 
  Flame, 
  GraduationCap, 
  Euro, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  Calendar,
  Sparkles,
  AlertCircle,
  Plus,
  Moon
} from 'lucide-react';
import { 
  VolunteerServiceRecord, 
  InstructionRecord, 
  GratificationRecord, 
  UserProfile, 
  ActiveTab 
} from '../types';
import { 
  formatCurrencyEUR, 
  formatDatePt, 
  MONTH_NAMES_PT, 
  MONTH_SHORT_PT 
} from '../utils/formatters';

interface DashboardViewProps {
  volunteerRecords: VolunteerServiceRecord[];
  instructionRecords: InstructionRecord[];
  gratificationRecords: GratificationRecord[];
  profile: UserProfile;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  onOpenNewRecord: (type: 'volunteer' | 'instruction' | 'gratification') => void;
  onOpenReports: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  onToggleGratificationStatus?: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  volunteerRecords,
  instructionRecords,
  gratificationRecords,
  profile,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  onOpenNewRecord,
  onOpenReports,
  setActiveTab,
  onToggleGratificationStatus,
}) => {
  // Year filtered totals
  const yearVolRecords = useMemo(() => {
    return volunteerRecords.filter((r) => parseInt(r.date.split('-')[0], 10) === selectedYear);
  }, [volunteerRecords, selectedYear]);

  const yearInstRecords = useMemo(() => {
    return instructionRecords.filter((r) => parseInt(r.date.split('-')[0], 10) === selectedYear);
  }, [instructionRecords, selectedYear]);

  const yearGratRecords = useMemo(() => {
    return gratificationRecords.filter((r) => parseInt(r.date.split('-')[0], 10) === selectedYear);
  }, [gratificationRecords, selectedYear]);

  // Night and Weekend calculations for the selected year
  const yearNightRecords = useMemo(() => {
    return yearVolRecords.filter((r) => {
      const startHour = parseInt(r.startTime.split(':')[0] || '0', 10);
      const endHour = parseInt(r.endTime.split(':')[0] || '0', 10);
      return startHour >= 20 || startHour < 8 || endHour < startHour || (r.serviceType && r.serviceType.toLowerCase().includes('noite'));
    });
  }, [yearVolRecords]);
  const yearNightHours = Math.round(yearNightRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0) / 60);

  const yearWeekendRecords = useMemo(() => {
    return yearVolRecords.filter((r) => {
      const dt = new Date(r.date);
      const day = dt.getDay();
      return day === 0 || day === 6;
    });
  }, [yearVolRecords]);
  const yearWeekendHours = Math.round(yearWeekendRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0) / 60);

  // Pending gratifications
  const pendingGratifications = useMemo(() => {
    return gratificationRecords.filter((r) => r.paidStatus === 'Pendente');
  }, [gratificationRecords]);

  const totalPendingAmount = useMemo(() => {
    return pendingGratifications.reduce((acc, r) => acc + (r.amount || 0), 0);
  }, [pendingGratifications]);

  // Totals for year
  const yearVolMinutes = yearVolRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const yearInstMinutes = yearInstRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const yearVolHours = Math.round(yearVolMinutes / 60);
  const yearInstHours = Math.round(yearInstMinutes / 60);

  // Month filtered records (for current selected month)
  const monthVolRecords = useMemo(() => {
    return volunteerRecords.filter((r) => {
      const [y, m] = r.date.split('-').map(Number);
      return y === selectedYear && m === selectedMonth;
    });
  }, [volunteerRecords, selectedYear, selectedMonth]);

  const monthInstRecords = useMemo(() => {
    return instructionRecords.filter((r) => {
      const [y, m] = r.date.split('-').map(Number);
      return y === selectedYear && m === selectedMonth;
    });
  }, [instructionRecords, selectedYear, selectedMonth]);

  const monthGratRecords = useMemo(() => {
    return gratificationRecords.filter((r) => {
      const [y, m] = r.date.split('-').map(Number);
      return y === selectedYear && m === selectedMonth;
    });
  }, [gratificationRecords, selectedYear, selectedMonth]);

  const monthVolMinutes = monthVolRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const monthInstMinutes = monthInstRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const monthVolHours = Math.round(monthVolMinutes / 60);
  const monthInstHours = Math.round(monthInstMinutes / 60);
  const monthGratTotal = monthGratRecords.reduce((acc, r) => acc + (r.amount || 0), 0);

  // Mandatory Annual Goals for Portuguese Volunteer Firefighters:
  // Standard mandatory annual volunteer service minimum: 160 hours
  // Standard mandatory annual instruction / training minimum: 40 hours
  const MANDATORY_VOLUNTEER_GOAL = 160;
  const MANDATORY_INSTRUCTION_GOAL = 40;

  const volGoalPercent = Math.min(100, Math.round((yearVolHours / MANDATORY_VOLUNTEER_GOAL) * 100));
  const instGoalPercent = Math.min(100, Math.round((yearInstHours / MANDATORY_INSTRUCTION_GOAL) * 100));

  // Circular gauge dimensions
  const circleRadius = 56;
  const circumference = 2 * Math.PI * circleRadius;
  const volDashOffset = circumference - (Math.min(100, volGoalPercent) / 100) * circumference;
  const instDashOffset = circumference - (Math.min(100, instGoalPercent) / 100) * circumference;

  // Recent Activity Items across all types formatted for display
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      dateStr: string;
      categoryTag: string;
      categoryColor: 'orange' | 'amber' | 'emerald';
      title: string;
      subtitle: string;
      durationOrAmount: string;
      iconType: 'instruction' | 'volunteer' | 'gratification';
      timestamp: number;
      paidStatus?: 'Pendente' | 'Recebido';
    }> = [];

    volunteerRecords.forEach((r) => {
      const [y, m, d] = r.date.split('-').map(Number);
      const monthShort = MONTH_SHORT_PT[m - 1]?.toUpperCase() || 'AGO';
      const formattedDate = `${d} ${monthShort} ${y}`;

      list.push({
        id: r.id,
        dateStr: formattedDate,
        categoryTag: 'VOLUNTARIADO',
        categoryColor: 'orange',
        title: r.serviceType,
        subtitle: `${r.vehicle ? `${r.vehicle}` : ''}${r.incidentNumber ? ` • Ocorr. ${r.incidentNumber}` : ''}${r.notes ? ` • ${r.notes}` : ''}`,
        durationOrAmount: `${Math.round(r.durationMinutes / 60)} HRS`,
        iconType: 'volunteer',
        timestamp: new Date(r.date).getTime() || 0,
      });
    });

    instructionRecords.forEach((r) => {
      const [y, m, d] = r.date.split('-').map(Number);
      const monthShort = MONTH_SHORT_PT[m - 1]?.toUpperCase() || 'AGO';
      const formattedDate = `${d} ${monthShort} ${y}`;

      list.push({
        id: r.id,
        dateStr: formattedDate,
        categoryTag: 'INSTRUÇÃO',
        categoryColor: 'amber',
        title: r.topic,
        subtitle: `${r.instructor ? `Formador: ${r.instructor}` : ''}${r.entity ? `, ${r.entity}` : ''}`,
        durationOrAmount: `${Math.round(r.durationMinutes / 60)} HRS`,
        iconType: 'instruction',
        timestamp: new Date(r.date).getTime() || 0,
      });
    });

    gratificationRecords.forEach((r) => {
      const [y, m, d] = r.date.split('-').map(Number);
      const monthShort = MONTH_SHORT_PT[m - 1]?.toUpperCase() || 'AGO';
      const formattedDate = `${d} ${monthShort} ${y}`;

      list.push({
        id: r.id,
        dateStr: formattedDate,
        categoryTag: 'GRATIFICAÇÃO',
        categoryColor: 'emerald',
        title: r.type,
        subtitle: `Estado: ${r.paidStatus === 'Pendente' ? 'Pendente de Pagamento' : 'Pago'}${r.receiptNumber ? ` • Recibo: ${r.receiptNumber}` : ''}`,
        durationOrAmount: `${r.amount.toFixed(2).replace('.', ',')} €`,
        iconType: 'gratification',
        timestamp: new Date(r.date).getTime() || 0,
        paidStatus: r.paidStatus,
      });
    });

    return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 6);
  }, [volunteerRecords, instructionRecords, gratificationRecords]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] text-zinc-100 pb-12">
      {/* Dramatic Ember / Spotlight Background Effects */}
      <div 
        className="pointer-events-none absolute inset-0 overflow-hidden" 
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(217, 119, 6, 0.25) 0%, rgba(180, 83, 9, 0.12) 30%, rgba(10, 9, 13, 0) 70%),
            linear-gradient(180deg, rgba(20, 14, 22, 0.4) 0%, rgba(9, 8, 12, 1) 45%)
          `
        }}
      >
        {/* Subtle ember sunburst rays effect */}
        <div 
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] sm:w-[1100px] h-[550px] opacity-35 blur-[70px] pointer-events-none"
          style={{
            background: 'conic-gradient(from 180deg at 50% 0%, #d97706 0deg, #ea580c 45deg, #09080c 90deg, #09080c 270deg, #ea580c 315deg, #d97706 360deg)'
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8 sm:space-y-10 pt-2 sm:pt-4">
        
        {/* Top Centered Brand Header */}
        <div className="text-center space-y-1 pt-2 sm:pt-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-wider font-sans bg-clip-text text-transparent bg-gradient-to-b from-amber-300 via-orange-500 to-amber-600 drop-shadow-[0_4px_24px_rgba(234,88,12,0.45)]">
            BLAZETRACK
          </h1>
          <p className="text-xs sm:text-sm font-bold tracking-[0.3em] text-amber-200/70 uppercase">
            BOMBEIRO VOLUNTÁRIO
          </p>
        </div>

        {/* Annual Mandatory Goals Gauges Section ("METAS ANUAIS OBRIGATÓRIAS") */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="flex items-center justify-center gap-4 sm:gap-10 md:gap-16">
            
            {/* VOLUNTARIADO Radial Gauge */}
            <div className="flex flex-col items-center text-center space-y-1.5 sm:space-y-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                VOLUNTARIADO
              </span>

              <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                  {/* Background Track Ring */}
                  <circle
                    cx="70"
                    cy="70"
                    r={circleRadius}
                    className="stroke-[#1C1622]"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {/* Progress Glow Ring */}
                  <circle
                    cx="70"
                    cy="70"
                    r={circleRadius}
                    className="stroke-orange-500 transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={volDashOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.7))',
                    }}
                  />
                </svg>

                {/* Inner Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
                    {yearVolHours}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-zinc-400 tracking-wider mt-0.5">
                    HRS
                  </span>
                </div>
              </div>

              <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">
                {volGoalPercent}% de {MANDATORY_VOLUNTEER_GOAL}h
              </span>
            </div>

            {/* INSTRUÇÃO Radial Gauge */}
            <div className="flex flex-col items-center text-center space-y-1.5 sm:space-y-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                INSTRUÇÃO
              </span>

              <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                  {/* Background Track Ring */}
                  <circle
                    cx="70"
                    cy="70"
                    r={circleRadius}
                    className="stroke-[#1C1622]"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {/* Progress Glow Ring */}
                  <circle
                    cx="70"
                    cy="70"
                    r={circleRadius}
                    className="stroke-yellow-400 transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={instDashOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.75))',
                    }}
                  />
                </svg>

                {/* Inner Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
                    {yearInstHours}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-zinc-400 tracking-wider mt-0.5">
                    HRS
                  </span>
                </div>
              </div>

              <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">
                {instGoalPercent}% de {MANDATORY_INSTRUCTION_GOAL}h
              </span>
            </div>

          </div>

          <span className="text-[11px] font-bold tracking-[0.25em] text-zinc-500 uppercase pt-1">
            METAS ANUAIS OBRIGATÓRIAS
          </span>
        </div>

        {/* 4 Translucent Dark Cards (Voluntariado, Instrução, Noites, Fins-de-Semana) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: Voluntariado */}
          <div 
            onClick={() => setActiveTab('volunteer')}
            className="bg-[#18141F]/80 hover:bg-[#201B2B]/90 backdrop-blur-md border border-[#2B2338] hover:border-orange-500/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 transition-all cursor-pointer shadow-lg shadow-black/40 group"
          >
            <div className="w-9 h-9 rounded-full bg-[#2A1D28] border border-orange-900/40 text-orange-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4 fill-orange-500/20" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                VOLUNTARIADO
              </span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {yearVolHours} h
                </span>
              </div>
              <span className="text-xs text-zinc-400 block mt-0.5">
                {yearVolRecords.length} registos
              </span>
            </div>
          </div>

          {/* Card 2: Instrução */}
          <div 
            onClick={() => setActiveTab('instruction')}
            className="bg-[#18141F]/80 hover:bg-[#201B2B]/90 backdrop-blur-md border border-[#2B2338] hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 transition-all cursor-pointer shadow-lg shadow-black/40 group"
          >
            <div className="w-9 h-9 rounded-full bg-[#2B261D] border border-amber-900/40 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                INSTRUÇÃO
              </span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {yearInstHours} h
                </span>
              </div>
              <span className="text-xs text-zinc-400 block mt-0.5">
                {yearInstRecords.length} registos
              </span>
            </div>
          </div>

          {/* Card 3: Noites */}
          <div 
            onClick={() => setActiveTab('stats')}
            className="bg-[#18141F]/80 hover:bg-[#201B2B]/90 backdrop-blur-md border border-[#2B2338] hover:border-sky-500/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 transition-all cursor-pointer shadow-lg shadow-black/40 group"
          >
            <div className="w-9 h-9 rounded-full bg-sky-950/70 border border-sky-900/40 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                NOITES
              </span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {yearNightHours} h
                </span>
              </div>
              <span className="text-xs text-zinc-400 block mt-0.5">
                {yearNightRecords.length} serviços
              </span>
            </div>
          </div>

          {/* Card 4: Fins-de-Semana */}
          <div 
            onClick={() => setActiveTab('stats')}
            className="bg-[#18141F]/80 hover:bg-[#201B2B]/90 backdrop-blur-md border border-[#2B2338] hover:border-purple-500/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 transition-all cursor-pointer shadow-lg shadow-black/40 group"
          >
            <div className="w-9 h-9 rounded-full bg-purple-950/70 border border-purple-900/40 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                FINS-DE-SEMANA
              </span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {yearWeekendHours} h
                </span>
              </div>
              <span className="text-xs text-zinc-400 block mt-0.5">
                {yearWeekendRecords.length} serviços
              </span>
            </div>
          </div>

        </div>

        {/* Goal Met Status Banners (Two Green Border Boxes with Checkmarks) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          
          <div className="bg-[#0A1A14]/70 border border-[#164E35] rounded-2xl p-4 flex items-center space-x-3.5 shadow-sm">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-emerald-200 block">
                Voluntariado — meta cumprida
              </span>
              <span className="text-xs text-emerald-400/80">
                {yearVolHours}h de {MANDATORY_VOLUNTEER_GOAL}h anuais.
              </span>
            </div>
          </div>

          <div className="bg-[#0A1A14]/70 border border-[#164E35] rounded-2xl p-4 flex items-center space-x-3.5 shadow-sm">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-emerald-200 block">
                Instrução — meta cumprida
              </span>
              <span className="text-xs text-emerald-400/80">
                {yearInstHours}h de {MANDATORY_INSTRUCTION_GOAL}h anuais.
              </span>
            </div>
          </div>

        </div>

        {/* Pending Gratifications Warning / Quick Validation Bar */}
        {pendingGratifications.length > 0 && (
          <div className="bg-gradient-to-r from-[#241A0B] to-[#161811] border border-amber-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-sm sm:text-base text-amber-200">
                    {pendingGratifications.length} {pendingGratifications.length === 1 ? 'Gratificação Pendente' : 'Gratificações Pendentes'} de Pagamento
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-900/70 border border-amber-700/60 text-amber-300 font-mono font-bold text-xs">
                    {formatCurrencyEUR(totalPendingAmount)}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tens diárias / serviços com pagamento pendente de confirmação.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('gratifications')}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-md transition-all cursor-pointer hover:scale-[1.02] shrink-0"
            >
              <span>Ver e Validar Pagamentos</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Recent Activity Section ("ATIVIDADE RECENTE") with High Contrast White Cards */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-lg sm:text-xl text-white uppercase tracking-wider">
              ATIVIDADE RECENTE
            </h2>
            <button
              onClick={() => setActiveTab('records')}
              className="text-xs font-bold text-amber-400/90 hover:text-amber-300 transition-colors cursor-pointer"
            >
              Ver tudo
            </button>
          </div>

          {/* Cards List: High-contrast white cards as shown in reference design */}
          <div className="space-y-3">
            {recentActivities.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.iconType === 'gratification') setActiveTab('gratifications');
                  else setActiveTab('records');
                }}
                className="bg-white hover:bg-zinc-50 transition-all rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-md shadow-black/25 cursor-pointer group"
              >
                {/* Left: Icon and Details */}
                <div className="flex items-center space-x-3.5 sm:space-x-4 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    item.iconType === 'instruction' 
                      ? 'bg-amber-100/90 text-amber-700' 
                      : item.iconType === 'volunteer'
                      ? 'bg-orange-100/90 text-orange-700'
                      : 'bg-emerald-100/90 text-emerald-700'
                  }`}>
                    {item.iconType === 'instruction' && <GraduationCap className="w-5 h-5" />}
                    {item.iconType === 'volunteer' && <Flame className="w-5 h-5 fill-orange-500/30" />}
                    {item.iconType === 'gratification' && <Euro className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                        {item.dateStr}
                      </span>
                      <span className="text-[11px] font-black text-orange-600 uppercase tracking-wider">
                        {item.categoryTag}
                      </span>

                      {item.iconType === 'gratification' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.paidStatus === 'Pendente' 
                            ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {item.paidStatus === 'Pendente' ? 'Pendente' : 'Pago'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 truncate mt-0.5 group-hover:text-orange-600 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-zinc-500 truncate max-w-sm sm:max-w-md mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                {/* Right: Big Bold Duration / Amount + Fast Validate Button */}
                <div className="flex items-center space-x-3 shrink-0">
                  {item.iconType === 'gratification' && item.paidStatus === 'Pendente' && onToggleGratificationStatus && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleGratificationStatus(item.id);
                      }}
                      className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105"
                      title="Validar pagamento com 1 clique"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Validar</span>
                    </button>
                  )}

                  <div className="text-right">
                    <span className="text-base sm:text-lg font-black text-zinc-900 font-sans tracking-tight">
                      {item.durationOrAmount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  GraduationCap, 
  Euro, 
  Clock, 
  Plus,
  MapPin,
  Truck,
  CheckCircle2,
  Circle,
  Trash2,
  ExternalLink,
  Download,
  Share2,
  CalendarCheck,
  Tag,
  AlertCircle,
  Smartphone,
  Globe
} from 'lucide-react';
import { VolunteerServiceRecord, InstructionRecord, GratificationRecord, UserProfile, CalendarTask } from '../types';
import { MONTH_NAMES_PT, formatMinutesToHoursAndMinutes, formatDatePt } from '../utils/formatters';

interface CalendarViewProps {
  volunteerRecords: VolunteerServiceRecord[];
  instructionRecords: InstructionRecord[];
  gratificationRecords: GratificationRecord[];
  calendarTasks?: CalendarTask[];
  onAddTask?: (task: Omit<CalendarTask, 'id' | 'createdAt'>) => void;
  onToggleTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  profile: UserProfile;
  onAddNewRecord: (type: 'volunteer' | 'instruction' | 'gratification') => void;
  onSelectRecord: (record: VolunteerServiceRecord | InstructionRecord | GratificationRecord) => void;
  onToggleGratificationStatus?: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  volunteerRecords,
  instructionRecords,
  gratificationRecords,
  calendarTasks = [],
  onAddTask,
  onToggleTask,
  onDeleteTask,
  profile,
  onAddNewRecord,
  onSelectRecord,
  onToggleGratificationStatus,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // August 2026 default
  const [selectedDay, setSelectedDay] = useState<string>('2026-08-30');

  // Task Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDate, setTaskDate] = useState(selectedDay);
  const [taskTime, setTaskTime] = useState('09:00');
  const [taskCategory, setTaskCategory] = useState<'service' | 'training' | 'maintenance' | 'meeting' | 'duty' | 'other'>('duty');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskNotes, setTaskNotes] = useState('');

  // Sync Notification state
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const todayMonth = () => setCurrentDate(new Date(2026, 7, 1));

  // Days in month calculation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first

  // Map records and tasks by date 'YYYY-MM-DD'
  const recordsByDate = useMemo(() => {
    const map: Record<string, { 
      vol: VolunteerServiceRecord[]; 
      inst: InstructionRecord[]; 
      grat: GratificationRecord[];
      tasks: CalendarTask[];
    }> = {};

    volunteerRecords.forEach((r) => {
      if (!map[r.date]) map[r.date] = { vol: [], inst: [], grat: [], tasks: [] };
      map[r.date].vol.push(r);
    });

    instructionRecords.forEach((r) => {
      if (!map[r.date]) map[r.date] = { vol: [], inst: [], grat: [], tasks: [] };
      map[r.date].inst.push(r);
    });

    gratificationRecords.forEach((r) => {
      if (!map[r.date]) map[r.date] = { vol: [], inst: [], grat: [], tasks: [] };
      map[r.date].grat.push(r);
    });

    calendarTasks.forEach((t) => {
      if (!map[t.date]) map[t.date] = { vol: [], inst: [], grat: [], tasks: [] };
      map[t.date].tasks.push(t);
    });

    return map;
  }, [volunteerRecords, instructionRecords, gratificationRecords, calendarTasks]);

  const selectedDayData = recordsByDate[selectedDay] || { vol: [], inst: [], grat: [], tasks: [] };
  const totalDayRecords = selectedDayData.vol.length + selectedDayData.inst.length + selectedDayData.grat.length + selectedDayData.tasks.length;

  const handleOpenNewTask = (dateToUse?: string) => {
    setTaskDate(dateToUse || selectedDay);
    setTaskTitle('');
    setTaskTime('09:00');
    setTaskCategory('duty');
    setTaskPriority('medium');
    setTaskNotes('');
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !onAddTask) return;

    onAddTask({
      title: taskTitle.trim(),
      date: taskDate,
      time: taskTime,
      category: taskCategory,
      priority: taskPriority,
      notes: taskNotes.trim() || undefined,
      completed: false,
      syncToGoogle: true,
      syncToIos: true,
    });

    setIsTaskModalOpen(false);
    setSyncFeedback('Tarefa / Escala adicionada com sucesso ao calendário!');
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  // Google Calendar direct URL generator for an item
  const openGoogleCalendarEvent = (title: string, date: string, time: string, details: string) => {
    const startIso = `${date.replace(/-/g, '')}T${time.replace(/:/g, '')}00`;
    // default 2 hour duration
    const endIso = `${date.replace(/-/g, '')}T${(parseInt(time.slice(0, 2)) + 2).toString().padStart(2, '0')}${time.slice(3, 5)}00`;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startIso}/${endIso}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(profile.corpsName || 'Corpo de Bombeiros')}`;
    window.open(url, '_blank');
  };

  // Apple / iOS .ICS Calendar exporter
  const handleExportIcs = () => {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Blazetrack BV//Calendario Bombeiro Voluntario//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Blazetrack - ' + (profile.name || 'Bombeiro'),
      'X-WR-TIMEZONE:Europe/Lisbon',
    ];

    // Export volunteer shifts
    volunteerRecords.forEach((r) => {
      const dtStart = `${r.date.replace(/-/g, '')}T${r.startTime.replace(/:/g, '')}00`;
      const dtEnd = `${r.date.replace(/-/g, '')}T${r.endTime.replace(/:/g, '')}00`;
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:vol-${r.id}@blazetrack.pt`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:[BV] ${r.serviceType}`,
        `DESCRIPTION:Turno de Voluntariado\\nDuração: ${Math.round(r.durationMinutes / 60)}h\\nNotas: ${r.notes || 'N/A'}`,
        `LOCATION:${r.location || profile.corpsName || 'Quartel'}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    // Export instructions
    instructionRecords.forEach((r) => {
      const dtStart = `${r.date.replace(/-/g, '')}T090000`;
      const dtEnd = `${r.date.replace(/-/g, '')}T130000`;
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:inst-${r.id}@blazetrack.pt`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:[Formação] ${r.topic}`,
        `DESCRIPTION:Instrução Bombeiro\\nFormador: ${r.instructor || 'N/A'}\\nEntidade: ${r.entity || 'N/A'}`,
        `LOCATION:${profile.corpsName || 'Quartel'}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    // Export calendar tasks
    calendarTasks.forEach((t) => {
      const tTime = t.time || '09:00';
      const dtStart = `${t.date.replace(/-/g, '')}T${tTime.replace(/:/g, '')}00`;
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:task-${t.id}@blazetrack.pt`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${dtStart}`,
        `SUMMARY:[Escala] ${t.title}`,
        `DESCRIPTION:Categoria: ${t.category}\\nPrioridade: ${t.priority}\\n${t.notes || ''}`,
        `LOCATION:${profile.corpsName || 'Quartel'}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blazetrack_calendario_${profile.firefighterNumber || 'bombeiro'}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSyncFeedback('Ficheiro de Calendário .ics descarregado! Abra para sincronizar diretamente com o Apple Calendar no iPhone/Mac ou Google Calendar.');
    setTimeout(() => setSyncFeedback(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Header & Synchronization Toolbar */}
      <div className="bg-[#121216] rounded-2xl p-5 border border-[#1F1F25] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-orange-950/60 border border-orange-800/50 text-orange-400">
                <CalendarIcon className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Calendário Operacional & Escalas
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Organize escalas de piquete, formações, tarefas e sincronize com Google Agenda e Apple Calendar (iOS).
            </p>
          </div>

          {/* Sync Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenNewTask()}
              className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Tarefa / Escala</span>
            </button>

            <button
              onClick={() => openGoogleCalendarEvent('Piquete / Serviço BV', selectedDay, '08:00', 'Serviço de Bombeiros Voluntários agendado pelo Blazetrack.')}
              className="px-3 py-2 bg-[#181820] hover:bg-[#22222E] border border-[#2A2A38] text-zinc-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
              title="Adicionar evento selecionado ao Google Calendar"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Sincronizar Google</span>
            </button>

            <button
              onClick={handleExportIcs}
              className="px-3 py-2 bg-[#181820] hover:bg-[#22222E] border border-[#2A2A38] text-zinc-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
              title="Exportar ficheiro .ics compatível com iOS Calendar, iPhone, iPad e macOS"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sincronizar iOS (.ics)</span>
            </button>
          </div>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Main Grid: Calendar on Left, Selected Day Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Box */}
        <div className="lg:col-span-2 bg-[#121216] border border-[#1F1F25] rounded-2xl p-5 shadow-xs space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                Vista Mensal
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white">
                {MONTH_NAMES_PT[month]} <span className="font-mono text-zinc-400">{year}</span>
              </h3>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={todayMonth}
                className="px-2.5 py-1 text-xs font-bold text-zinc-300 hover:text-white bg-[#1A1A22] border border-[#282834] rounded-lg cursor-pointer"
              >
                Hoje
              </button>
              <button
                onClick={prevMonth}
                className="p-1.5 text-zinc-300 hover:text-white bg-[#1A1A22] border border-[#282834] rounded-lg cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 text-zinc-300 hover:text-white bg-[#1A1A22] border border-[#282834] rounded-lg cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-zinc-500 uppercase">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {/* Empty slots for month start offset */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="min-h-[56px] sm:min-h-[70px] rounded-xl bg-[#0D0D11]/40 border border-transparent"
              />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
              const dayData = recordsByDate[dateKey] || { vol: [], inst: [], grat: [], tasks: [] };

              const isSelected = selectedDay === dateKey;
              const hasVol = dayData.vol.length > 0;
              const hasInst = dayData.inst.length > 0;
              const hasGrat = dayData.grat.length > 0;
              const hasTasks = dayData.tasks.length > 0;

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDay(dateKey)}
                  className={`min-h-[56px] sm:min-h-[70px] rounded-xl p-1.5 sm:p-2 flex flex-col justify-between text-left transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-[#261A14] border-orange-500 shadow-md shadow-orange-950/40 text-orange-200'
                      : 'bg-[#16161D] hover:bg-[#1C1C24] border-[#22222D] text-zinc-300'
                  }`}
                >
                  <span className={`text-xs font-extrabold font-mono ${isSelected ? 'text-orange-400' : 'text-zinc-400'}`}>
                    {dayNum}
                  </span>

                  {/* Indicator Pills */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {hasVol && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 shadow-xs shadow-orange-500/50" title="Voluntariado" />
                    )}
                    {hasInst && (
                      <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-xs shadow-yellow-400/50" title="Instrução" />
                    )}
                    {hasGrat && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" title="Gratificação" />
                    )}
                    {hasTasks && (
                      <span className="w-2 h-2 rounded-full bg-purple-400 shadow-xs shadow-purple-400/50" title="Tarefa/Escala" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#1F1F25] text-[11px] text-zinc-400">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>Voluntariado</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span>Instrução</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Gratificação</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span>Tarefa / Escala</span>
            </span>
          </div>
        </div>

        {/* Selected Day Activity & Task List */}
        <div className="bg-[#121216] border border-[#1F1F25] rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="border-b border-[#1F1F25] pb-3 mb-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Dia Selecionado
                </span>
                <h3 className="text-base sm:text-lg font-black text-white font-mono mt-0.5">
                  {formatDatePt(selectedDay)}
                </h3>
              </div>
              <button
                onClick={() => handleOpenNewTask(selectedDay)}
                className="px-2.5 py-1 bg-[#1E1E28] hover:bg-[#282836] border border-[#2D2D3E] text-zinc-200 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-purple-400" />
                <span>+ Tarefa</span>
              </button>
            </div>

            {totalDayRecords === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">
                  Nenhum serviço, formação ou tarefa registada para este dia.
                </p>
                <button
                  onClick={() => onAddNewRecord('volunteer')}
                  className="text-xs font-bold text-orange-400 hover:text-orange-300 underline pt-1 cursor-pointer"
                >
                  Adicionar registo agora
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
                {/* Calendar Tasks / Shifts */}
                {selectedDayData.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-[#1B1824] hover:bg-[#221E2E] border border-purple-900/40 rounded-xl transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onToggleTask && onToggleTask(task.id)}
                          className="text-purple-400 hover:text-purple-300 cursor-pointer"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-purple-400" />
                          )}
                        </button>
                        <span className={`text-xs font-bold ${task.completed ? 'line-through text-zinc-500' : 'text-purple-200'}`}>
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openGoogleCalendarEvent(task.title, task.date, task.time || '09:00', task.notes || 'Escala Blazetrack')}
                          className="p-1 text-zinc-400 hover:text-blue-400 cursor-pointer"
                          title="Enviar para Google Calendar"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        {onDeleteTask && (
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                            title="Eliminar Tarefa"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>{task.time ? `Hora: ${task.time}` : 'Dia Inteiro'}</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 text-[10px] uppercase font-bold">
                        {task.category}
                      </span>
                    </div>

                    {task.notes && (
                      <p className="text-[11px] text-zinc-400 italic">
                        {task.notes}
                      </p>
                    )}
                  </div>
                ))}

                {/* Volunteer Records */}
                {selectedDayData.vol.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onSelectRecord(r)}
                    className="p-3 bg-[#181820] hover:bg-[#1E1E28] border border-[#262632] rounded-xl transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-400 flex items-center space-x-1">
                        <Flame className="w-3 h-3" />
                        <span>{r.serviceType}</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-200">
                        {formatMinutesToHoursAndMinutes(r.durationMinutes)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {r.startTime} - {r.endTime} {r.vehicle ? `• ${r.vehicle}` : ''}
                    </p>
                  </div>
                ))}

                {/* Instruction Records */}
                {selectedDayData.inst.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onSelectRecord(r)}
                    className="p-3 bg-[#181820] hover:bg-[#1E1E28] border border-[#262632] rounded-xl transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-yellow-400 flex items-center space-x-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[140px]">{r.topic}</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-200">
                        {formatMinutesToHoursAndMinutes(r.durationMinutes)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {r.instructor ? `Formador: ${r.instructor}` : 'Instrução'}
                    </p>
                  </div>
                ))}

                {/* Gratification Records */}
                {selectedDayData.grat.map((r) => {
                  const isReceived = r.paidStatus === 'Recebido';
                  return (
                    <div
                      key={r.id}
                      onClick={() => onSelectRecord(r)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                        isReceived
                          ? 'bg-[#181820] hover:bg-[#1E1E28] border-[#262632]'
                          : 'bg-[#1D170F] hover:bg-[#261E14] border-amber-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                          <Euro className="w-3 h-3" />
                          <span className="truncate max-w-[140px]">{r.type}</span>
                        </span>
                        <span className="text-xs font-mono font-black text-emerald-300">
                          {r.amount.toFixed(2)} €
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                              isReceived
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                            }`}
                          >
                            {isReceived ? (
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
                          </span>
                          {r.receiptNumber && (
                            <span className="text-[10px] text-zinc-500 font-mono">
                              #{r.receiptNumber}
                            </span>
                          )}
                        </div>

                        {onToggleGratificationStatus && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleGratificationStatus(r.id);
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                              !isReceived
                                ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-xs'
                                : 'bg-[#22222E] hover:bg-[#2C2C3C] text-zinc-400 hover:text-zinc-200'
                            }`}
                            title={!isReceived ? 'Validar pagamento' : 'Reverter para pendente'}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{!isReceived ? 'Validar' : 'Alterar'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#1F1F25] flex justify-between">
            <button
              onClick={() => onAddNewRecord('volunteer')}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 cursor-pointer"
            >
              + Serviço
            </button>
            <button
              onClick={() => onAddNewRecord('instruction')}
              className="text-xs font-bold text-yellow-400 hover:text-yellow-300 cursor-pointer"
            >
              + Formação
            </button>
            <button
              onClick={() => onAddNewRecord('gratification')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              + Gratificação
            </button>
          </div>
        </div>

      </div>

      {/* Task / Shift Creation Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#121216] border border-[#262632] rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F1F25] pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <CalendarCheck className="w-4 h-4 text-purple-400" />
                <span>Nova Tarefa / Escala de Serviço</span>
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-zinc-500 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Título da Tarefa / Escala *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ex: Piquete Noturno 20h-08h / Revisão VSAT"
                  className="w-full px-3 py-2 text-xs bg-[#18181F] border border-[#282834] rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#18181F] border border-[#282834] rounded-xl text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Hora Início
                  </label>
                  <input
                    type="time"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#18181F] border border-[#282834] rounded-xl text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-[#18181F] border border-[#282834] rounded-xl text-white outline-none cursor-pointer"
                  >
                    <option value="duty">Escala / Piquete</option>
                    <option value="service">Serviço Geral</option>
                    <option value="training">Treino / Manobras</option>
                    <option value="maintenance">Manutenção Material</option>
                    <option value="meeting">Reunião</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-[#18181F] border border-[#282834] rounded-xl text-white outline-none cursor-pointer"
                  >
                    <option value="low">Normal</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta / Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Observações / Detalhes
                </label>
                <textarea
                  rows={2}
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  placeholder="Instruções adicionais, viatura destacada..."
                  className="w-full px-3 py-1.5 text-xs bg-[#18181F] border border-[#282834] rounded-xl text-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1F1F25]">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  Guardar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

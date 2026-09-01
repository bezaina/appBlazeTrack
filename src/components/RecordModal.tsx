import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Clock, 
  GraduationCap, 
  Euro, 
  Calendar, 
  MapPin, 
  Truck, 
  FileText, 
  User, 
  Building2, 
  Award, 
  Calculator,
  CheckCircle2,
  AlertCircle,
  MoveHorizontal
} from 'lucide-react';
import { 
  VolunteerServiceRecord, 
  InstructionRecord, 
  GratificationRecord, 
  OperationType, 
  InstructionTopic, 
  GratificationType 
} from '../types';
import { 
  calculateDurationMinutes, 
  formatMinutesToHoursAndMinutes, 
  getTodayDateString, 
  getCurrentTimeString 
} from '../utils/formatters';

export type ModalRecordType = 'volunteer' | 'instruction' | 'gratification';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: ModalRecordType;
  recordToEdit?: VolunteerServiceRecord | InstructionRecord | GratificationRecord | null;
  onSaveVolunteer: (record: Omit<VolunteerServiceRecord, 'id' | 'createdAt'>, id?: string) => void;
  onSaveInstruction: (record: Omit<InstructionRecord, 'id' | 'createdAt'>, id?: string) => void;
  onSaveGratification: (record: Omit<GratificationRecord, 'id' | 'createdAt'>, id?: string) => void;
  gratificationRates?: Record<string, number>;
  prefillFromActiveShift?: {
    startTime: string;
    endTime: string;
    durationMinutes: number;
    serviceType: OperationType;
    incidentNumber?: string;
    vehicle?: string;
    notes?: string;
  } | null;
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

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  initialType = 'volunteer',
  recordToEdit,
  onSaveVolunteer,
  onSaveInstruction,
  onSaveGratification,
  gratificationRates,
  prefillFromActiveShift,
}) => {
  const [recordType, setRecordType] = useState<ModalRecordType>(initialType);

  // Common fields
  const [date, setDate] = useState(getTodayDateString());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [durationMinutes, setDurationMinutes] = useState(480);
  const [manualDurationMode, setManualDurationMode] = useState(false);
  const [notes, setNotes] = useState('');

  // Volunteer specific (Tipo de Operação)
  const [serviceType, setServiceType] = useState<OperationType>('Piquete/Socorro');
  const [incidentNumber, setIncidentNumber] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [location, setLocation] = useState('');

  // Instruction specific
  const [topic, setTopic] = useState<string>('Combate a Incêndios Florestais (CIF)');
  const [customTopic, setCustomTopic] = useState('');
  const [instructor, setInstructor] = useState('');
  const [entity, setEntity] = useState('Corpo de Bombeiros');
  const [certificateRef, setCertificateRef] = useState('');

  // Gratification specific
  const [gratType, setGratType] = useState<string>('DECIR');
  const [amount, setAmount] = useState<string>('84.00');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paidStatus, setPaidStatus] = useState<'Pendente' | 'Recebido'>('Pendente');
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());

  // Error feedback
  const [errorMessage, setErrorMessage] = useState('');

  // Helper to get default rate for a gratification type
  const getRateForType = (type: string): string => {
    if (gratificationRates && gratificationRates[type] !== undefined) {
      return Number(gratificationRates[type]).toFixed(2);
    }
    const defaultRates: Record<string, number> = {
      'DECIR': 84.00,
      'DECIR 1/2': 42.00,
      'BAL': 65.00,
      'Subida de Categoria': 120.00,
      'Prevenção': 50.00,
      'DIPIR': 75.00,
      'Outra Gratificação': 50.00,
    };
    return (defaultRates[type] ?? 84.00).toFixed(2);
  };

  // Synchronize when opening or editing
  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage('');

    if (prefillFromActiveShift) {
      setRecordType('volunteer');
      setDate(getTodayDateString());
      setStartTime(prefillFromActiveShift.startTime);
      setEndTime(prefillFromActiveShift.endTime);
      setDurationMinutes(prefillFromActiveShift.durationMinutes);
      setServiceType(prefillFromActiveShift.serviceType);
      setIncidentNumber(prefillFromActiveShift.incidentNumber || '');
      setVehicle(prefillFromActiveShift.vehicle || '');
      setNotes(prefillFromActiveShift.notes || '');
      setManualDurationMode(false);
      return;
    }

    if (recordToEdit) {
      if ('serviceType' in recordToEdit) {
        setRecordType('volunteer');
        const r = recordToEdit as VolunteerServiceRecord;
        setDate(r.date);
        setStartTime(r.startTime);
        setEndTime(r.endTime);
        setDurationMinutes(r.durationMinutes);
        setServiceType(r.serviceType);
        setIncidentNumber(r.incidentNumber || '');
        setVehicle(r.vehicle || '');
        setLocation(r.location || '');
        setNotes(r.notes || '');
        setManualDurationMode(false);
      } else if ('topic' in recordToEdit) {
        setRecordType('instruction');
        const r = recordToEdit as InstructionRecord;
        setDate(r.date);
        setStartTime(r.startTime);
        setEndTime(r.endTime);
        setDurationMinutes(r.durationMinutes);
        if (INSTRUCTION_TOPICS.includes(r.topic as InstructionTopic)) {
          setTopic(r.topic);
          setCustomTopic('');
        } else {
          setTopic('Outro Tema');
          setCustomTopic(r.topic);
        }
        setInstructor(r.instructor || '');
        setEntity(r.entity || 'Corpo de Bombeiros');
        setLocation(r.location || '');
        setCertificateRef(r.certificateRef || '');
        setNotes(r.notes || '');
        setManualDurationMode(false);
      } else if ('type' in recordToEdit) {
        setRecordType('gratification');
        const r = recordToEdit as GratificationRecord;
        setDate(r.date);
        setGratType(r.type);
        setAmount(r.amount.toFixed(2));
        setReceiptNumber(r.receiptNumber || '');
        setPaidStatus(r.paidStatus);
        setPaymentDate(r.paymentDate || getTodayDateString());
        setNotes(r.notes || '');
      }
    } else {
      // Clean defaults for new record
      setRecordType(initialType);
      setDate(getTodayDateString());
      setStartTime('09:00');
      setEndTime('13:00');
      setDurationMinutes(240);
      setServiceType('Piquete/Socorro');
      setNotes('');
      setIncidentNumber('');
      setVehicle('');
      setLocation('');
      setTopic('Combate a Incêndios Florestais (CIF)');
      setCustomTopic('');
      setInstructor('');
      setCertificateRef('');
      setReceiptNumber('');
      setGratType('DECIR');
      setAmount(getRateForType('DECIR'));
      setPaidStatus('Pendente');
      setPaymentDate(getTodayDateString());
      setManualDurationMode(false);
    }
  }, [isOpen, recordToEdit, initialType, prefillFromActiveShift]);

  // Recalculate duration automatically whenever start or end time changes (unless manual)
  useEffect(() => {
    if (!manualDurationMode && startTime && endTime) {
      const calculated = calculateDurationMinutes(startTime, endTime);
      setDurationMinutes(calculated);
    }
  }, [startTime, endTime, manualDurationMode]);

  // When gratification type changes in creation mode, update amount to default rate
  const handleGratTypeChange = (newType: string) => {
    setGratType(newType);
    if (!recordToEdit) {
      setAmount(getRateForType(newType));
    }
  };

  if (!isOpen) return null;

  const handleDurationHoursChange = (hrs: number, mins: number) => {
    const total = Math.max(0, hrs * 60 + mins);
    setDurationMinutes(total);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!date) {
      setErrorMessage('Por favor, indique a data do registo.');
      return;
    }

    if (recordType === 'volunteer') {
      if (durationMinutes <= 0) {
        setErrorMessage('A duração do serviço deve ser superior a zero minutos.');
        return;
      }
      onSaveVolunteer(
        {
          date,
          startTime,
          endTime,
          durationMinutes,
          serviceType,
          incidentNumber: incidentNumber.trim() || undefined,
          vehicle: vehicle.trim() || undefined,
          location: location.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        recordToEdit ? recordToEdit.id : undefined
      );
    } else if (recordType === 'instruction') {
      if (durationMinutes <= 0) {
        setErrorMessage('A duração da instrução deve ser superior a zero minutos.');
        return;
      }
      const finalTopic = topic === 'Outro Tema' && customTopic.trim() ? customTopic.trim() : topic;
      onSaveInstruction(
        {
          date,
          startTime,
          endTime,
          durationMinutes,
          topic: finalTopic,
          instructor: instructor.trim() || undefined,
          entity: entity.trim() || undefined,
          location: location.trim() || undefined,
          notes: notes.trim() || undefined,
          certificateRef: certificateRef.trim() || undefined,
        },
        recordToEdit ? recordToEdit.id : undefined
      );
    } else if (recordType === 'gratification') {
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        setErrorMessage('Por favor, indique um valor numérico válido para a gratificação.');
        return;
      }
      onSaveGratification(
        {
          date,
          type: gratType,
          amount: parsedAmount,
          receiptNumber: receiptNumber.trim() || undefined,
          paidStatus,
          paymentDate: paidStatus === 'Recebido' ? paymentDate : undefined,
          notes: notes.trim() || undefined,
        },
        recordToEdit ? recordToEdit.id : undefined
      );
    }

    onClose();
  };

  const RECORD_TABS: ModalRecordType[] = ['volunteer', 'instruction', 'gratification'];
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null || isEditing) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Detect intentional horizontal swipe (horizontal movement exceeds vertical movement significantly)
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      const currentIndex = RECORD_TABS.indexOf(recordType);
      if (deltaX < 0 && currentIndex < RECORD_TABS.length - 1) {
        // Swiped Left -> Move to Next Tab
        const nextType = RECORD_TABS[currentIndex + 1];
        setRecordType(nextType);
        if (nextType === 'gratification' && !amount) {
          setAmount(getRateForType(gratType));
        }
      } else if (deltaX > 0 && currentIndex > 0) {
        // Swiped Right -> Move to Previous Tab
        const prevType = RECORD_TABS[currentIndex - 1];
        setRecordType(prevType);
        if (prevType === 'gratification' && !amount) {
          setAmount(getRateForType(gratType));
        }
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  const isEditing = !!recordToEdit;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overscroll-y-contain"
      style={{ overscrollBehaviorY: 'contain' }}
    >
      <div 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="bg-[#14141A] rounded-2xl max-w-xl w-full shadow-2xl border border-[#242430] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] overscroll-y-contain"
        style={{ overscrollBehaviorY: 'contain' }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#242430] flex items-center justify-between bg-[#101014] shrink-0">
          <div>
            <h3 className="font-bold text-zinc-100 text-lg">
              {isEditing ? 'Editar Registo' : 'Novo Registo Operacional'}
            </h3>
            <p className="text-xs text-zinc-400">
              {isEditing ? 'Atualize as informações do registo selecionado' : 'Registo de operação, instrução ou gratificação'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Mobile Swipe Indicator (only when creating new) */}
        {!isEditing && (
          <div className="bg-[#181820] border-b border-[#242430] shrink-0">
            <div className="p-2.5 flex space-x-1.5">
              <button
                type="button"
                onClick={() => setRecordType('volunteer')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  recordType === 'volunteer'
                    ? 'bg-red-950/70 border border-red-800/60 text-red-300 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1F1F2A]'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Voluntariado</span>
              </button>
              <button
                type="button"
                onClick={() => setRecordType('instruction')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  recordType === 'instruction'
                    ? 'bg-blue-950/70 border border-blue-800/60 text-blue-300 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1F1F2A]'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Instrução</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecordType('gratification');
                  if (!amount) setAmount(getRateForType(gratType));
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  recordType === 'gratification'
                    ? 'bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1F1F2A]'
                }`}
              >
                <Euro className="w-4 h-4" />
                <span>Gratificação</span>
              </button>
            </div>

            {/* Mobile Horizontal Navigation Indicator */}
            <div className="sm:hidden px-3 pb-1.5 flex items-center justify-between text-[10px] text-zinc-500 font-medium">
              <span className="flex items-center space-x-1">
                <MoveHorizontal className="w-3 h-3 text-orange-400 animate-pulse" />
                <span>Deslize horizontalmente para mudar de tipo</span>
              </span>
              <div className="flex space-x-1">
                {RECORD_TABS.map((tab) => (
                  <span 
                    key={tab} 
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      recordType === tab ? 'bg-orange-500 w-3' : 'bg-zinc-700'
                    }`} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1 overscroll-y-contain">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/50 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Data da Operação / Evento *</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          {/* FOR VOLUNTEER AND INSTRUCTION: Time inputs with auto duration calculation */}
          {(recordType === 'volunteer' || recordType === 'instruction') && (
            <div className="space-y-3 bg-[#181820] p-3.5 rounded-xl border border-[#242430]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Hora Início *</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Hora Fim *</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Live automatic duration indicator */}
              <div className="flex items-center justify-between bg-[#14141A] px-3 py-2 rounded-xl border border-[#242430]">
                <div className="flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-zinc-400">Duração Calculada:</span>
                  <span className="font-mono font-bold text-sm text-zinc-100">
                    {formatMinutesToHoursAndMinutes(durationMinutes)}
                  </span>
                  <span className="text-xs text-zinc-500">({durationMinutes} min)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setManualDurationMode(!manualDurationMode)}
                  className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                >
                  {manualDurationMode ? 'Usar Cálculo Auto' : 'Ajuste Manual'}
                </button>
              </div>

              {manualDurationMode && (
                <div className="pt-2 border-t border-[#242430] flex items-center space-x-3">
                  <span className="text-xs font-medium text-zinc-400">Ajuste manual:</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={Math.floor(durationMinutes / 60)}
                      onChange={(e) => handleDurationHoursChange(parseInt(e.target.value || '0', 10), durationMinutes % 60)}
                      className="w-16 px-2 py-1 text-sm bg-[#18181F] border border-[#282834] rounded-lg text-center text-zinc-100 font-mono"
                    />
                    <span className="text-xs text-zinc-400">horas</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      step="5"
                      value={durationMinutes % 60}
                      onChange={(e) => handleDurationHoursChange(Math.floor(durationMinutes / 60), parseInt(e.target.value || '0', 10))}
                      className="w-16 px-2 py-1 text-sm bg-[#18181F] border border-[#282834] rounded-lg text-center text-zinc-100 font-mono"
                    />
                    <span className="text-xs text-zinc-400">min</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VOLUNTEER SPECIFIC FIELDS (Tipo de Operação ONLY) */}
          {recordType === 'volunteer' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Tipo de Operação *
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as OperationType)}
                  className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none font-medium cursor-pointer"
                >
                  {OPERATION_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-[#18181F] text-zinc-200">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    <span>N.º de Ocorrência (opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={incidentNumber}
                    onChange={(e) => setIncidentNumber(e.target.value)}
                    placeholder="Ex: 2026/0412"
                    className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1.5">
                    <Truck className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Viatura Utilizada (opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    placeholder="Ex: VFCI 01, ABSC 02"
                    className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Local / Teatro de Operações (opcional)</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Serra de Sintra, Quartel, EN 247"
                  className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            </>
          )}

          {/* INSTRUCTION SPECIFIC FIELDS */}
          {recordType === 'instruction' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Tema / Módulo da Instrução *
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none font-medium cursor-pointer"
                >
                  {INSTRUCTION_TOPICS.map((t) => (
                    <option key={t} value={t} className="bg-[#18181F] text-zinc-200">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {topic === 'Outro Tema' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Especifique o Tema da Formação *
                  </label>
                  <input
                    type="text"
                    required
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Ex: Técnicas Avançadas de Busca Térmica"
                    className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Formador / Instrutor (opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    placeholder="Ex: Chefe X"
                    className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Entidade Formadora (opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={entity}
                    onChange={(e) => setEntity(e.target.value)}
                    placeholder="Ex: Escola Nacional de Bombeiros, Corpo de Bombeiros"
                    className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Local da Formação (opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Sala de Instrução, Centro de Treinos"
                    className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1.5">
                    <Award className="w-3.5 h-3.5 text-zinc-500" />
                    <span>N.º Certificado / Ref. (opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={certificateRef}
                    onChange={(e) => setCertificateRef(e.target.value)}
                    placeholder="Ex: ENB-2026/891"
                    className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* GRATIFICATION SPECIFIC FIELDS */}
          {recordType === 'gratification' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Tipo de Gratificação / Compensação *
                </label>
                <select
                  value={gratType}
                  onChange={(e) => handleGratTypeChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none font-medium cursor-pointer"
                >
                  {GRATIFICATION_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-[#18181F] text-zinc-200">
                      {t} {gratificationRates && gratificationRates[t] ? `(${gratificationRates[t]}€)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1.5">
                    <Euro className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Valor (€ Euros) *</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-3 pr-8 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-zinc-500">€</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Valor predefinido para {gratType}: {getRateForType(gratType)}€ (pode ajustar livremente).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Estado do Pagamento *
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-[#14141B] p-1 rounded-xl border border-[#242430]">
                    <button
                      type="button"
                      onClick={() => setPaidStatus('Pendente')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                        paidStatus === 'Pendente'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60 shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pendente</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaidStatus('Recebido')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                        paidStatus === 'Recebido'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Recebido / Pago</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {paidStatus === 'Pendente' ? 'Por definição, fica pendente até confirmação de pagamento.' : 'Confirmado como pago / transferido.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    <span>N.º de Recibo / Folha (opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="Ex: DECIR-2026/08"
                    className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {paidStatus === 'Recebido' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Data de Pagamento</span>
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Observations */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Observações / Notas Adicionais (opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva detalhes operacionais, manobras efetuadas ou referências úteis..."
              className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-red-500 outline-none resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-[#242430] flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E26] rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="save-record-submit-btn"
              type="submit"
              className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5 ${
                recordType === 'volunteer'
                  ? 'bg-red-600 hover:bg-red-500 active:bg-red-700'
                  : recordType === 'instruction'
                  ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Guardar Alterações' : 'Registar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

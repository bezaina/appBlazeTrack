import React, { useState } from 'react';
import { Play, Square, Radio, Clock, ShieldAlert, Truck, FileText } from 'lucide-react';
import { ActiveShiftTimer, OperationType } from '../types';

interface ActiveShiftWidgetProps {
  activeShift: ActiveShiftTimer;
  shiftDurationStr: string;
  onStartShift: (serviceType: OperationType, incidentNumber?: string, vehicle?: string, notes?: string) => void;
  onStopShift: () => void;
}

const OPERATION_TYPES: OperationType[] = [
  'Piquete/Socorro',
  'Incêndio Rural',
  'Incêndio Urbano',
  'Acidente',
  'Outro Serviço',
];

export const ActiveShiftWidget: React.FC<ActiveShiftWidgetProps> = ({
  activeShift,
  shiftDurationStr,
  onStartShift,
  onStopShift,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [selectedType, setSelectedType] = useState<OperationType>('Piquete/Socorro');
  const [incidentNumber, setIncidentNumber] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [notes, setNotes] = useState('');

  const handleStart = () => {
    onStartShift(selectedType, incidentNumber, vehicle, notes);
    setShowConfig(false);
    setIncidentNumber('');
    setVehicle('');
    setNotes('');
  };

  if (activeShift.isRunning) {
    return (
      <div className="bg-gradient-to-r from-red-950/90 via-[#181114] to-[#121216] border border-red-500/30 text-white rounded-2xl p-4 sm:p-5 shadow-xl shadow-red-950/30 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center animate-pulse shadow-inner">
              <Radio className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <h3 className="font-extrabold text-lg text-white tracking-tight">Serviço em Curso (Ativo)</h3>
              </div>
              <p className="text-zinc-200 text-sm font-medium">
                {activeShift.serviceType} {activeShift.vehicle ? `• Viatura: ${activeShift.vehicle}` : ''} {activeShift.incidentNumber ? `• Ocorr.: ${activeShift.incidentNumber}` : ''}
              </p>
              <p className="text-zinc-400 text-xs mt-0.5">
                Iniciado às {activeShift.startTime ? new Date(activeShift.startTime).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block">Tempo Decorrido</span>
              <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{shiftDurationStr}</span>
            </div>
            <button
              id="stop-active-shift-btn"
              onClick={onStopShift}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-950/50 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Concluir Serviço</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121216] border border-[#1F1F25] rounded-2xl p-4 sm:p-5 shadow-xs mb-6 transition-all">
      {!showConfig ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/50 border border-red-800/30 text-red-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-sm sm:text-base">
                Iniciar Turno ou Ocorrência em Tempo Real
              </h3>
              <p className="text-xs text-zinc-400">
                Inicie o temporizador ao entrar em serviço para calcular automaticamente a duração exata.
              </p>
            </div>
          </div>
          <button
            id="open-start-shift-panel-btn"
            onClick={() => setShowConfig(true)}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-md shadow-red-950/40"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Entrar em Serviço</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F1F25] pb-2">
            <h4 className="font-bold text-zinc-100 text-sm flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>Iniciar Novo Turno Operacional</span>
            </h4>
            <button
              onClick={() => setShowConfig(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Tipo de Serviço *
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as OperationType)}
                className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none cursor-pointer"
              >
                {OPERATION_TYPES.map((type) => (
                  <option key={type} value={type} className="bg-[#18181F] text-zinc-100">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Viatura (opcional)
              </label>
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="Ex: VFCI 02, ABSC 01"
                className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                N.º Ocorrência (opcional)
              </label>
              <input
                type="text"
                value={incidentNumber}
                onChange={(e) => setIncidentNumber(e.target.value)}
                placeholder="Ex: 2026/0912"
                className="w-full px-3 py-2 text-sm bg-[#18181F] border border-[#282834] rounded-xl text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              onClick={() => setShowConfig(false)}
              className="px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#18181F] rounded-xl cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              id="confirm-start-shift-btn"
              onClick={handleStart}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-md shadow-red-950/40 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Iniciar Contagem Agora</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

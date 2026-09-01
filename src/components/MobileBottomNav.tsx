import React from 'react';
import { 
  Home, 
  SlidersHorizontal, 
  Calendar, 
  Euro, 
  PieChart, 
  Plus,
  Radio
} from 'lucide-react';
import { ActiveTab, ActiveShiftTimer } from '../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickAdd: () => void;
  activeShift: ActiveShiftTimer;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
  activeShift,
}) => {
  const isTabActive = (tab: ActiveTab) => {
    if (activeTab === tab) return true;
    if (tab === 'records' && (activeTab === 'volunteer' || activeTab === 'instruction')) return true;
    return false;
  };

  return (
    <nav 
      aria-label="Navegação móvel inferior"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0C0A0F]/95 backdrop-blur-lg border-t border-[#1F1A28] px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.7)]"
    >
      <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-around">
        {/* Tab 1: Início */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
            isTabActive('dashboard')
              ? 'text-orange-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight whitespace-nowrap">Início</span>
        </button>

        {/* Tab 2: Registos */}
        <button
          onClick={() => setActiveTab('records')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl relative transition-all cursor-pointer ${
            isTabActive('records')
              ? 'text-orange-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <SlidersHorizontal className="w-5 h-5 mb-0.5" />
            {activeShift.isRunning && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#0C0A0F] animate-ping" />
            )}
          </div>
          <span className="text-[10px] tracking-tight whitespace-nowrap">Registos</span>
        </button>

        {/* Center Prominent Quick Add Button */}
        <div className="flex-1 flex items-center justify-center px-1">
          <button
            id="mobile-quick-add-btn"
            onClick={onOpenQuickAdd}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-950/80 active:scale-95 transition-transform cursor-pointer -mt-4 border-2 border-[#1F1A28]"
            title="Adicionar Novo Registo"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab 3: Calendário */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
            isTabActive('calendar')
              ? 'text-orange-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight whitespace-nowrap">Agenda</span>
        </button>

        {/* Tab 4: Gratificações */}
        <button
          onClick={() => setActiveTab('gratifications')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
            isTabActive('gratifications')
              ? 'text-orange-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Euro className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight whitespace-nowrap">Gratif.</span>
        </button>

        {/* Tab 5: Estatísticas (On tablet / larger mobile) */}
        <button
          onClick={() => setActiveTab('stats')}
          className={`hidden sm:flex flex-1 flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
            isTabActive('stats')
              ? 'text-orange-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <PieChart className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight whitespace-nowrap">Estat.</span>
        </button>
      </div>
    </nav>
  );
};

import React from 'react';
import { 
  Flame, 
  Clock, 
  GraduationCap, 
  Euro, 
  FileText, 
  Settings, 
  Lock, 
  Moon, 
  Sun, 
  Plus, 
  ShieldCheck, 
  Radio,
  User,
  KeyRound,
  LogOut
} from 'lucide-react';
import { ActiveTab, UserProfile, ActiveShiftTimer } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  profile: UserProfile;
  activeShift: ActiveShiftTimer;
  onOpenQuickAdd: () => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  onLockApp: () => void;
  shiftDurationStr: string;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  activeShift,
  onOpenQuickAdd,
  onToggleTheme,
  isDarkMode,
  onLockApp,
  shiftDurationStr,
  onOpenAuthModal,
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Resumo', icon: Flame },
    { id: 'volunteer' as ActiveTab, label: 'Voluntariado', icon: Clock },
    { id: 'instruction' as ActiveTab, label: 'Instrução', icon: GraduationCap },
    { id: 'gratifications' as ActiveTab, label: 'Gratificações', icon: Euro },
    { id: 'reports' as ActiveTab, label: 'Relatórios', icon: FileText },
    { id: 'settings' as ActiveTab, label: 'Configurações', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0E0E12]/95 backdrop-blur-md border-b border-[#1F1F24] transition-colors shadow-sm">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Firefighter info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-lg shadow-red-950/50 border border-red-500/20">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-zinc-100 text-base sm:text-lg tracking-tight">
                  Bombeiro Voluntário
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-950/60 text-red-300 border border-red-800/50 font-mono">
                  {profile.firefighterNumber || 'BV'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate max-w-[200px] sm:max-w-xs">
                {profile.name} • {profile.corpsName}
              </p>
            </div>
          </div>

          {/* Active Shift Indicator & Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {activeShift.isRunning && (
              <div 
                onClick={() => setActiveTab('volunteer')}
                className="cursor-pointer flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 text-xs font-medium animate-pulse hover:border-emerald-600 transition-colors"
                title="Turno ativo em progresso. Clique para gerir."
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Em Turno:</span>
                <span className="font-mono font-bold">{shiftDurationStr}</span>
              </div>
            )}

            {/* Quick Add Button */}
            <button
              id="quick-add-record-btn"
              onClick={onOpenQuickAdd}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-semibold shadow-md shadow-red-950/50 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Registo</span>
            </button>

            {/* Firefighter Account / Login Switcher Button */}
            <button
              id="auth-account-btn"
              onClick={onOpenAuthModal}
              title="Autenticação (Email e Palavra-passe)"
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-[#171322] hover:bg-[#201A30] border border-[#2D253E] hover:border-orange-500/50 text-zinc-200 transition-all cursor-pointer shadow-xs"
            >
              {profile.googleUser?.picture ? (
                <img 
                  src={profile.googleUser.picture} 
                  alt={profile.name} 
                  className="w-6 h-6 rounded-full object-cover border border-orange-500/50" 
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center text-[10px] font-black">
                  {profile.name ? profile.name.charAt(0) : 'B'}
                </div>
              )}
              <div className="hidden lg:flex flex-col text-left leading-none">
                <span className="text-[11px] font-bold text-zinc-100 truncate max-w-[90px]">
                  {profile.name.split(' ')[0]}
                </span>
                <span className="text-[9px] text-orange-400 font-mono">
                  Nº {profile.firefighterNumber || 'BV'}
                </span>
              </div>
              <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* Lock App (if PIN configured) */}
            {profile.pinEnabled && (
              <button
                onClick={onLockApp}
                title="Bloquear aplicação com PIN"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1A1A20] border border-transparent hover:border-[#2A2A32] transition-colors cursor-pointer"
              >
                <Lock className="w-5 h-5" />
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              title={isDarkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1A1A20] border border-transparent hover:border-[#2A2A32] transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-zinc-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 border-t border-[#1C1C22]">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#18181F] text-white font-semibold border border-[#2B2B36] shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#141418]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-500' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

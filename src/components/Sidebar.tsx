import React, { useState } from 'react';
import { 
  Home, 
  SlidersHorizontal, 
  Calendar, 
  Euro, 
  PieChart, 
  Download, 
  Settings, 
  User, 
  Flame, 
  Plus, 
  Lock,
  Menu,
  X,
  Radio,
  LogIn,
  CheckCircle2,
  KeyRound,
  Users,
  LogOut
} from 'lucide-react';
import { ActiveTab, UserProfile, ActiveShiftTimer } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  profile: UserProfile;
  activeShift: ActiveShiftTimer;
  onOpenQuickAdd: () => void;
  onOpenGoogleAuth: () => void;
  onOpenAuthModal?: () => void;
  onLockApp: () => void;
  onLogout?: () => void;
  shiftDurationStr: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  activeShift,
  onOpenQuickAdd,
  onOpenGoogleAuth,
  onOpenAuthModal,
  onLockApp,
  onLogout,
  shiftDurationStr,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const mainNavItems = [
    { id: 'dashboard' as ActiveTab, label: 'Início', icon: Home },
    { id: 'records' as ActiveTab, label: 'Registos', icon: SlidersHorizontal },
    { id: 'calendar' as ActiveTab, label: 'Calendário', icon: Calendar },
    { id: 'gratifications' as ActiveTab, label: 'Gratif.', icon: Euro },
    { id: 'stats' as ActiveTab, label: 'Estat.', icon: PieChart },
    { id: 'reports' as ActiveTab, label: 'Exportar', icon: Download },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  const googleUser = profile.googleUser;

  return (
    <>
      {/* Mobile / Tablet Top Header */}
      <header className="lg:hidden sticky top-0 z-40 w-full bg-[#0c0a0e]/95 backdrop-blur-md border-b border-[#1c1822] px-3 sm:px-5 py-2.5 flex items-center justify-between shadow-md shrink-0">
        <div 
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center space-x-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md shadow-orange-950/50">
            <Flame className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <span className="font-black text-base sm:text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-300">
              BLAZETRACK
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Active Shift indicator pill */}
          {activeShift.isRunning && (
            <div 
              onClick={() => handleNavClick('records')}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-bold animate-pulse cursor-pointer"
              title="Turno ativo em curso"
            >
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>{shiftDurationStr}</span>
            </div>
          )}

          {/* Google Account Button in Mobile Header */}
          {googleUser ? (
            <button
              onClick={onOpenGoogleAuth}
              className="p-1 rounded-full border border-orange-500/50 hover:border-orange-400 transition-colors cursor-pointer"
              title={`Conta Google: ${googleUser.email}`}
            >
              {googleUser.picture ? (
                <img
                  src={googleUser.picture}
                  alt={googleUser.name}
                  className="w-7 h-7 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold text-xs flex items-center justify-center">
                  {googleUser.name.charAt(0)}
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={onOpenGoogleAuth}
              className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-900 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span className="hidden sm:inline">Google</span>
            </button>
          )}

          {/* Mobile Drawer Toggle */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl text-zinc-300 bg-[#16131c] border border-[#262030] hover:text-white cursor-pointer"
            aria-label="Abrir menu de navegação"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile / Tablet Overlay Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#09080C] border-r border-[#1B1822] flex flex-col justify-between p-4 transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Section: Logo & CTA */}
        <div className="space-y-5">
          {/* Brand Logo & Close for Mobile */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-red-600 p-0.5 shadow-lg shadow-orange-950/60 flex items-center justify-center">
                <div className="w-full h-full bg-[#110D16] rounded-[14px] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                </div>
              </div>
              <div>
                <span className="font-black text-xl tracking-wider text-orange-500 block leading-tight font-sans">
                  BLAZETRACK
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                  {profile.rank || 'Bombeiro Voluntário'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* "+ Novo registo" Action Button */}
          <div>
            <button
              id="sidebar-new-record-btn"
              onClick={() => {
                onOpenQuickAdd();
                setIsMobileOpen(false);
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-orange-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-orange-950/60 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo registo</span>
            </button>
          </div>

          {/* Active Shift Indicator if running */}
          {activeShift.isRunning && (
            <div 
              onClick={() => handleNavClick('records')}
              className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl cursor-pointer hover:bg-emerald-950/80 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Turno em Curso</span>
                </span>
                <Radio className="w-3.5 h-3.5" />
              </div>
              <div className="font-mono text-base font-bold text-emerald-200">
                {shiftDurationStr}
              </div>
            </div>
          )}

          {/* Nav Items */}
          <nav className="space-y-1 pt-1" aria-label="Navegação lateral">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || 
                (item.id === 'records' && (activeTab === 'volunteer' || activeTab === 'instruction'));

              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#2A1810] text-amber-300 border border-amber-900/50 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#16131C]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Firefighter Account & Google & Definições */}
        <div className="pt-3 border-t border-[#1B1822] space-y-2">
          
          {/* Firefighter Profile Switcher / Login Card */}
          <div 
            onClick={() => {
              if (onOpenAuthModal) onOpenAuthModal();
              setIsMobileOpen(false);
            }}
            className="p-2.5 bg-[#14101A] border border-[#261E30] hover:border-orange-500/40 rounded-xl flex items-center justify-between cursor-pointer transition-all group shadow-xs"
            title="Iniciar Sessão / Trocar de Bombeiro (Nº Mecanográfico, PIN, Utilizador ou Google)"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              {profile.googleUser?.picture ? (
                <img 
                  src={profile.googleUser.picture} 
                  alt={profile.name} 
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-orange-500/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {profile.name ? profile.name.charAt(0) : 'B'}
                </div>
              )}
              <div className="min-w-0">
                <span className="text-xs font-bold text-zinc-100 truncate block group-hover:text-orange-400 transition-colors">
                  {profile.name}
                </span>
                <span className="text-[10px] text-orange-400 truncate block font-mono">
                  Nº {profile.firefighterNumber || 'BV'} • {profile.rank}
                </span>
              </div>
            </div>

            <KeyRound className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-400 transition-colors shrink-0" />
          </div>

          <button
            id="sidebar-nav-settings"
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#2A1810] text-amber-300 border border-amber-900/50'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#16131C]'
            }`}
          >
            <Settings className="w-4 h-4 text-zinc-400" />
            <span>Definições</span>
          </button>

          {profile.pinEnabled ? (
            <button
              onClick={() => {
                onLockApp();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-[#16131C] transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4 text-red-400" />
              <span>Bloquear PIN</span>
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('settings')}
              className="w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-[#16131C] transition-all cursor-pointer"
            >
              <User className="w-4 h-4 text-zinc-400" />
              <span>Conta ({profile.firefighterNumber || 'Perfil'})</span>
            </button>
          )}
          {onLogout && (
            <button
              onClick={() => {
                onLogout();
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center space-x-3.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-red-300 hover:bg-red-950/30 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-zinc-500 hover:text-red-400" />
              <span>Sair da Conta</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};


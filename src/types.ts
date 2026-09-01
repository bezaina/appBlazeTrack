export type OperationType =
  | 'Piquete/Socorro'
  | 'Incêndio Rural'
  | 'Incêndio Urbano'
  | 'Acidente'
  | 'Outro Serviço';

// Alias for backward compatibility if referenced
export type ServiceType = OperationType;

export type InstructionTopic =
  | 'Combate a Incêndios Florestais (CIF)'
  | 'Combate a Incêndios Urbanos e Industriais (CIUI)'
  | 'Salvamento e Desencarceramento (SD)'
  | 'Suporte Básico de Vida / TAT'
  | 'Técnicas de Socorrismo e Emergência Pré-Hospitalar'
  | 'Matérias Perigosas (HazMat)'
  | 'Condução Fora de Estrada / TT e Operação de Viaturas'
  | 'Comunicações e SIRESP'
  | 'Salvamento em Grande Ângulo / Resgate'
  | 'Organização do Serviço de Incêndios / Liderança'
  | 'Outro Tema';

export type GratificationType =
  | 'BAL'
  | 'Subida de Categoria'
  | 'DECIR'
  | 'DECIR 1/2'
  | 'Prevenção'
  | 'DIPIR'
  | 'Outra Gratificação';

export interface VolunteerServiceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number; // total in minutes
  serviceType: OperationType; // Tipo de Operação
  incidentNumber?: string; // Número de ocorrência (ex: 2026/0412)
  vehicle?: string; // Ex: VFCI 01, ABSC 02, VLCI 03
  location?: string; // Local / Teatro de operações
  notes?: string;
  createdAt: number;
}

export interface InstructionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number; // total in minutes
  topic: InstructionTopic | string;
  instructor?: string; // Nome do formador (Ex: Chefe X)
  entity?: string; // Ex: ENB (Escola Nacional de Bombeiros), Corpo de Bombeiros, CDOS/ANEPC
  location?: string; // Ex: Sala de Formação, Parque de Manobras, Pista TT
  notes?: string;
  certificateRef?: string;
  createdAt: number;
}

export interface GratificationRecord {
  id: string;
  date: string; // YYYY-MM-DD
  type: GratificationType | string;
  amount: number; // em Euros (€)
  receiptNumber?: string; // Número do recibo / Folha de pagamento
  paidStatus: 'Pendente' | 'Recebido';
  paymentDate?: string;
  notes?: string;
  serviceRefId?: string; // Vinculação opcional a um serviço
  createdAt: number;
}

export interface CalendarTask {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: 'Piquete / Turno' | 'Tarefa Operacional' | 'Formação' | 'Escala de Serviço' | 'Lembrete' | 'Outro';
  priority: 'Alta' | 'Média' | 'Baixa';
  completed: boolean;
  location?: string;
  notes?: string;
  createdAt: number;
}

export interface ActiveShiftTimer {
  isRunning: boolean;
  startTime: string | null; // ISO timestamp
  serviceType: OperationType;
  incidentNumber?: string;
  vehicle?: string;
  notes?: string;
}

export interface GoogleUserAccount {
  email: string;
  name: string;
  picture?: string;
  id: string;
  connectedAt: string;
  provider: 'google';
  emailVerified: boolean;
}

export interface FirefighterAccount {
  id: string;
  firefighterNumber: string; // Número mecanográfico (Ex: 4218)
  username: string; // Nome de utilizador (Ex: bombeiro4218 ou goncalo.silva)
  name: string; // Nome completo operacional
  corpsName: string; // Corpo de Bombeiros
  rank: string; // Categoria / Posto
  pinCode?: string; // Código PIN numérico de 4 a 6 dígitos
  password?: string; // Palavra-passe
  email?: string; // Email de contacto ou Gmail
  monthlyTargetHours?: number;
  avatarUrl?: string;
  role?: 'bombeiro' | 'graduado' | 'oficial' | 'comando' | 'admin';
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserProfile {
  id?: string;
  accountId?: string;
  username?: string;
  name: string;
  firefighterNumber: string; // Número mecânico / Número de bombeiro
  corpsName: string; // Ex: Bombeiros Voluntários
  rank: string; // Ex: Bombeiro de 2ª Classe, Bombeiro de 3ª, Subchefe, etc.
  monthlyTargetHours: number; // Ex: 35 horas
  pinEnabled: boolean;
  pinHash?: string; // 4-digit PIN stored
  theme: 'light' | 'dark' | 'system';
  showReminder: boolean;
  // Google Authentication
  googleUser?: GoogleUserAccount | null;
  // Gratification rate definitions
  gratificationRates?: Record<string, number>;
  // Automated Report Email
  autoEmailReportEnabled?: boolean;
  autoEmailAddress?: string;
  autoEmailTime?: string; // '20:00'
  autoEmailReportPeriod?: 'monthly' | 'annual'; // 'monthly' | 'annual'
  role?: 'bombeiro' | 'graduado' | 'oficial' | 'comando' | 'admin';
}

export type ActiveTab = 
  | 'dashboard' 
  | 'records' 
  | 'calendar' 
  | 'volunteer' 
  | 'instruction' 
  | 'gratifications' 
  | 'stats' 
  | 'reports' 
  | 'settings';


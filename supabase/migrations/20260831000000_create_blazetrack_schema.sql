-- ==============================================================================
-- BLAZETRACK - MIGRATION ESQUEMA DE BASE DE DADOS POSTGRESQL / SUPABASE
-- Sistema de Gestão Operacional e Controlo de Horas para Bombeiros Voluntários
-- ==============================================================================

-- 0. TABELA DE CONTAS E UTILIZADORES DE BOMBEIROS (firefighter_accounts)
-- Permite login flexível por Nº de Bombeiro (Mecanográfico), Username, Email, PIN ou Palavra-passe
CREATE TABLE IF NOT EXISTS public.firefighter_accounts (
  id TEXT PRIMARY KEY,
  firefighter_number TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  corps_name TEXT NOT NULL DEFAULT 'Bombeiros Voluntários',
  rank TEXT NOT NULL DEFAULT 'Bombeiro de 3ª Classe',
  pin_code TEXT,
  password TEXT,
  email TEXT,
  monthly_target_hours NUMERIC NOT NULL DEFAULT 35,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'bombeiro' CHECK (role IN ('bombeiro', 'graduado', 'oficial', 'comando', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. TABELA DE PERFIL DE BOMBEIRO (user_profiles)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY DEFAULT 'primary_firefighter_profile',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT REFERENCES public.firefighter_accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Gonçalo Silva',
  firefighter_number TEXT NOT NULL DEFAULT '4218',
  corps_name TEXT NOT NULL DEFAULT 'Bombeiros Voluntários',
  rank TEXT NOT NULL DEFAULT 'Bombeiro de 2ª Classe',
  monthly_target_hours NUMERIC NOT NULL DEFAULT 35,
  pin_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  pin_hash TEXT,
  theme TEXT NOT NULL DEFAULT 'dark',
  show_reminder BOOLEAN NOT NULL DEFAULT TRUE,
  gratification_rates JSONB DEFAULT '{"BAL": 25, "Subida de Categoria": 30, "DECIR": 67.5, "DECIR 1/2": 33.75, "Prevenção": 20, "DIPIR": 30, "Outra Gratificação": 25}'::jsonb,
  auto_email_report_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  auto_email_address TEXT,
  auto_email_time TEXT DEFAULT '20:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABELA DE HORAS DE VOLUNTARIADO E SERVIÇOS OPERACIONAIS (volunteer_services)
CREATE TABLE IF NOT EXISTS public.volunteer_services (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
  service_type TEXT NOT NULL,
  incident_number TEXT,
  vehicle TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA DE INSTRUÇÃO E FORMAÇÃO DE BOMBEIROS (instruction_records)
CREATE TABLE IF NOT EXISTS public.instruction_records (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
  topic TEXT NOT NULL,
  instructor TEXT,
  entity TEXT,
  location TEXT,
  notes TEXT,
  certificate_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA DE GRATIFICAÇÕES E SUBSÍDIOS (gratification_records)
CREATE TABLE IF NOT EXISTS public.gratification_records (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  receipt_number TEXT,
  paid_status TEXT NOT NULL CHECK (paid_status IN ('Pendente', 'Recebido')),
  payment_date DATE,
  notes TEXT,
  service_ref_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABELA DE CALENDÁRIO OPERACIONAL E ESCALAS (calendar_tasks)
CREATE TABLE IF NOT EXISTS public.calendar_tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  type TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Alta', 'Média', 'Baixa')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ÍNDICES DE DESEMPENHO E CONSULTA
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_firefighter_accounts_number ON public.firefighter_accounts(firefighter_number);
CREATE INDEX IF NOT EXISTS idx_firefighter_accounts_username ON public.firefighter_accounts(username);
CREATE INDEX IF NOT EXISTS idx_volunteer_services_date ON public.volunteer_services(date DESC);
CREATE INDEX IF NOT EXISTS idx_instruction_records_date ON public.instruction_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_gratification_records_date ON public.gratification_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_gratification_records_status ON public.gratification_records(paid_status);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_date ON public.calendar_tasks(date ASC);

-- ==============================================================================
-- SEGURANÇA E POLÍTICAS RLS (Row Level Security)
-- ==============================================================================
ALTER TABLE public.firefighter_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instruction_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gratification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_tasks ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Total para utilizadores autenticados ou chave anon de demonstração
CREATE POLICY "Permitir acesso completo a contas de bombeiros" 
  ON public.firefighter_accounts FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acesso completo a perfis" 
  ON public.user_profiles FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acesso completo a serviços de voluntariado" 
  ON public.volunteer_services FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acesso completo a registos de instrução" 
  ON public.instruction_records FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acesso completo a gratificações" 
  ON public.gratification_records FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acesso completo a tarefas de calendário" 
  ON public.calendar_tasks FOR ALL 
  USING (true) WITH CHECK (true);

import { 
  VolunteerServiceRecord, 
  InstructionRecord, 
  GratificationRecord, 
  CalendarTask, 
  UserProfile,
  FirefighterAccount 
} from '../types';

export const SUPABASE_PROJECT_ID = 'ildysfsxyxexqgwygqhm';
export const SUPABASE_PROJECT_NAME = "jagamaal@gmail.com's Project";
export const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_wNcML1d87K_A8r0nX5kw1Q_HZ8Aw_LL';

const CUSTOM_URL_KEY = 'blazetrack_supabase_url_custom';
const CUSTOM_ANON_KEY = 'blazetrack_supabase_anon_key_custom';

export const getSupabaseConfig = (): { url: string; key: string } => {
  const customUrl = localStorage.getItem(CUSTOM_URL_KEY);
  const customKey = localStorage.getItem(CUSTOM_ANON_KEY);

  // If user explicitly disconnected
  if (customUrl === '__disconnected__') {
    return { url: '', key: '' };
  }

  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

  return {
    url: customUrl || envUrl || DEFAULT_SUPABASE_URL,
    key: customKey || envKey || DEFAULT_SUPABASE_ANON_KEY,
  };
};

export const setCustomSupabaseConfig = (url: string, key: string): void => {
  localStorage.setItem(CUSTOM_URL_KEY, url);
  localStorage.setItem(CUSTOM_ANON_KEY, key);
};

export const disconnectSupabase = (): void => {
  localStorage.setItem(CUSTOM_URL_KEY, '__disconnected__');
  localStorage.setItem(CUSTOM_ANON_KEY, '__disconnected__');
};

export const reconnectDefaultSupabase = (): void => {
  localStorage.removeItem(CUSTOM_URL_KEY);
  localStorage.removeItem(CUSTOM_ANON_KEY);
};

/**
 * Returns whether Supabase credentials have been configured
 */
export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
};

/**
 * Helper to build headers for server proxy requests
 */
const getApiHeaders = (): Record<string, string> => {
  const config = getSupabaseConfig();
  return {
    'Content-Type': 'application/json',
    'x-supabase-url': config.url,
    'x-supabase-key': config.key,
  };
};

/**
 * Legacy stub for backward compatibility with components that might inspect getSupabase()
 */
export const getSupabase = (): any => {
  if (!isSupabaseConfigured()) return null;
  return { isServerProxy: true };
};

// ==========================================
// VOLUNTEER RECORDS
// ==========================================

export const fetchSupabaseVolunteerRecords = async (): Promise<VolunteerServiceRecord[] | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const res = await fetch('/api/supabase/volunteer', {
      headers: getApiHeaders(),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on fetching volunteer records:', result.error);
      return null;
    }
    return result.data || [];
  } catch (error) {
    console.error('Error fetching volunteer records via API:', error);
    return null;
  }
};

export const saveSupabaseVolunteerRecord = async (record: VolunteerServiceRecord): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  try {
    const res = await fetch('/api/supabase/volunteer', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(record),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on saving volunteer record:', result.error);
    }
  } catch (error) {
    console.error('Error saving volunteer record via API:', error);
  }
};

export const saveSupabaseVolunteerRecordsBulk = async (records: VolunteerServiceRecord[]): Promise<void> => {
  if (!isSupabaseConfigured() || records.length === 0) return;

  try {
    const res = await fetch('/api/supabase/volunteer/bulk', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ records }),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on bulk saving volunteer records:', result.error);
    }
  } catch (error) {
    console.error('Error bulk saving volunteer records via API:', error);
  }
};

export const deleteSupabaseVolunteerRecord = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  try {
    const res = await fetch(`/api/supabase/volunteer/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getApiHeaders(),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on deleting volunteer record:', result.error);
    }
  } catch (error) {
    console.error('Error deleting volunteer record via API:', error);
  }
};

// ==========================================
// INSTRUCTION RECORDS
// ==========================================

export const fetchSupabaseInstructionRecords = async (): Promise<InstructionRecord[] | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const res = await fetch('/api/supabase/instruction', {
      headers: getApiHeaders(),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on fetching instruction records:', result.error);
      return null;
    }
    return result.data || [];
  } catch (error) {
    console.error('Error fetching instruction records via API:', error);
    return null;
  }
};

export const saveSupabaseInstructionRecord = async (record: InstructionRecord): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  try {
    const res = await fetch('/api/supabase/instruction', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(record),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on saving instruction record:', result.error);
    }
  } catch (error) {
    console.error('Error saving instruction record via API:', error);
  }
};

export const saveSupabaseInstructionRecordsBulk = async (records: InstructionRecord[]): Promise<void> => {
  if (!isSupabaseConfigured() || records.length === 0) return;

  try {
    const res = await fetch('/api/supabase/instruction/bulk', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ records }),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on bulk saving instruction records:', result.error);
    }
  } catch (error) {
    console.error('Error bulk saving instruction records via API:', error);
  }
};

export const deleteSupabaseInstructionRecord = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  try {
    const res = await fetch(`/api/supabase/instruction/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getApiHeaders(),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on deleting instruction record:', result.error);
    }
  } catch (error) {
    console.error('Error deleting instruction record via API:', error);
  }
};

// ==========================================
// GRATIFICATION RECORDS
// ==========================================

export const fetchSupabaseGratifications = async (): Promise<GratificationRecord[] | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const res = await fetch('/api/supabase/gratification', {
      headers: getApiHeaders(),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on fetching gratifications:', result.error);
      return null;
    }
    return result.data || [];
  } catch (error) {
    console.error('Error fetching gratifications via API:', error);
    return null;
  }
};

export const saveSupabaseGratification = async (record: GratificationRecord): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  try {
    const res = await fetch('/api/supabase/gratification', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(record),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on saving gratification:', result.error);
    }
  } catch (error) {
    console.error('Error saving gratification via API:', error);
  }
};

export const saveSupabaseGratificationsBulk = async (records: GratificationRecord[]): Promise<void> => {
  if (!isSupabaseConfigured() || records.length === 0) return;

  try {
    const res = await fetch('/api/supabase/gratification/bulk', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ records }),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on bulk saving gratifications:', result.error);
    }
  } catch (error) {
    console.error('Error bulk saving gratifications via API:', error);
  }
};

export const deleteSupabaseGratification = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  try {
    const res = await fetch(`/api/supabase/gratification/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getApiHeaders(),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on deleting gratification:', result.error);
    }
  } catch (error) {
    console.error('Error deleting gratification via API:', error);
  }
};

// ==========================================
// CALENDAR TASKS
// ==========================================

export const fetchSupabaseCalendarTasks = async (): Promise<CalendarTask[] | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const res = await fetch('/api/supabase/calendar', {
      headers: getApiHeaders(),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on fetching calendar tasks:', result.error);
      return null;
    }
    return result.data || [];
  } catch (error) {
    console.error('Error fetching calendar tasks via API:', error);
    return null;
  }
};

export const saveSupabaseCalendarTask = async (task: CalendarTask): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  try {
    const res = await fetch('/api/supabase/calendar', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(task),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on saving calendar task:', result.error);
    }
  } catch (error) {
    console.error('Error saving calendar task via API:', error);
  }
};

export const saveSupabaseCalendarTasksBulk = async (tasks: CalendarTask[]): Promise<void> => {
  if (!isSupabaseConfigured() || tasks.length === 0) return;

  try {
    const res = await fetch('/api/supabase/calendar/bulk', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ tasks }),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on bulk saving calendar tasks:', result.error);
    }
  } catch (error) {
    console.error('Error bulk saving calendar tasks via API:', error);
  }
};

export const deleteSupabaseCalendarTask = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  try {
    const res = await fetch(`/api/supabase/calendar/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getApiHeaders(),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on deleting calendar task:', result.error);
    }
  } catch (error) {
    console.error('Error deleting calendar task via API:', error);
  }
};

// ==========================================
// USER PROFILE
// ==========================================

export const fetchSupabaseUserProfile = async (): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const res = await fetch('/api/supabase/profile', {
      headers: getApiHeaders(),
    });
    const result = await res.json();
    if (!result.success || !result.data) {
      return null;
    }
    return result.data;
  } catch (error) {
    console.error('Error fetching user profile via API:', error);
    return null;
  }
};

export const saveSupabaseUserProfile = async (profile: UserProfile): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  try {
    const res = await fetch('/api/supabase/profile', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(profile),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on saving user profile:', result.error);
    }
  } catch (error) {
    console.error('Error saving user profile via API:', error);
  }
};

// ==========================================
// FIREFIGHTER ACCOUNTS
// ==========================================

export const fetchSupabaseAccounts = async (): Promise<FirefighterAccount[] | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const res = await fetch('/api/supabase/accounts', {
      headers: getApiHeaders(),
    });
    const result = await res.json();
    if (!result.success || !result.data) {
      return null;
    }
    return result.data;
  } catch (error) {
    console.error('Error fetching accounts via API:', error);
    return null;
  }
};

export const saveSupabaseAccount = async (account: FirefighterAccount): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  try {
    const res = await fetch('/api/supabase/accounts', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(account),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on saving account to Supabase:', result.error);
    }
  } catch (error) {
    console.error('Error saving account via Supabase API:', error);
  }
};

export const deleteSupabaseAccount = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  try {
    const res = await fetch(`/api/supabase/accounts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getApiHeaders(),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on deleting account in Supabase:', result.error);
    }
  } catch (error) {
    console.error('Error deleting account via Supabase API:', error);
  }
};

export const saveSupabaseAccountsBulk = async (accounts: FirefighterAccount[]): Promise<void> => {
  if (!isSupabaseConfigured() || accounts.length === 0) return;

  try {
    const res = await fetch('/api/supabase/accounts/bulk', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ accounts }),
    });
    const result = await res.json();
    if (!result.success) {
      console.warn('Note on bulk saving accounts:', result.error);
    }
  } catch (error) {
    console.error('Error bulk saving accounts via API:', error);
  }
};

// ==========================================
// UNIFIED MASTER SYNC ALL DATA
// ==========================================

export interface MasterSyncResult {
  success: boolean;
  message: string;
  syncedCounts: {
    volunteer: number;
    instruction: number;
    gratifications: number;
    calendar: number;
    profile: boolean;
    accounts: number;
  };
  remoteData?: {
    volunteerRecords: VolunteerServiceRecord[];
    instructionRecords: InstructionRecord[];
    gratificationRecords: GratificationRecord[];
    calendarTasks: CalendarTask[];
    profile: UserProfile | null;
    accounts: FirefighterAccount[] | null;
  };
}

/**
 * Synchronizes all local data to Supabase and pulls remote updates.
 * Handled in a single unified round-trip through the server proxy!
 */
export const syncAllDataWithSupabase = async (localData: {
  volunteerRecords: VolunteerServiceRecord[];
  instructionRecords: InstructionRecord[];
  gratificationRecords: GratificationRecord[];
  calendarTasks: CalendarTask[];
  profile: UserProfile;
  accounts?: FirefighterAccount[];
}): Promise<MasterSyncResult> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase não está configurado.',
      syncedCounts: { volunteer: 0, instruction: 0, gratifications: 0, calendar: 0, profile: false, accounts: 0 }
    };
  }

  try {
    const res = await fetch('/api/supabase/sync', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(localData),
    });

    const result = await res.json();
    if (!result.success) {
      return {
        success: false,
        message: result.message || result.error || 'Erro na sincronização.',
        syncedCounts: { volunteer: 0, instruction: 0, gratifications: 0, calendar: 0, profile: false, accounts: 0 }
      };
    }

    return result;
  } catch (err: any) {
    console.error('Error during master sync with Supabase API:', err);
    return {
      success: false,
      message: err.message || 'Erro durante a sincronização com Supabase.',
      syncedCounts: { volunteer: 0, instruction: 0, gratifications: 0, calendar: 0, profile: false, accounts: 0 }
    };
  }
};

/**
 * Tests connection to Supabase via server proxy
 */
export const testSupabaseConnection = async (url?: string, key?: string): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch('/api/supabase/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, key }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Falha ao conectar com o Supabase via servidor.',
    };
  }
};

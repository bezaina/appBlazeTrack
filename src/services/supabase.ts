import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  VolunteerServiceRecord, 
  InstructionRecord, 
  GratificationRecord, 
  CalendarTask, 
  UserProfile 
} from '../types';

const CUSTOM_URL_KEY = 'blazetrack_supabase_url_custom';
const CUSTOM_ANON_KEY = 'blazetrack_supabase_anon_key_custom';

const DEFAULT_SUPABASE_URL = 'https://ildysfsxyxexqgwygqhm.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_wNcML1d87K_A8r0nX5kw1Q_HZ8Aw_LL';

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
  supabaseInstance = null; // reset cached client
};

export const disconnectSupabase = (): void => {
  localStorage.setItem(CUSTOM_URL_KEY, '__disconnected__');
  localStorage.setItem(CUSTOM_ANON_KEY, '__disconnected__');
  supabaseInstance = null;
};

let supabaseInstance: SupabaseClient | null = null;

/**
 * Returns whether Supabase credentials have been configured
 */
export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
};

/**
 * Lazily retrieves the Supabase Client
 */
export const getSupabase = (): SupabaseClient | null => {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
};

// ==========================================
// VOLUNTEER RECORDS
// ==========================================

export const fetchSupabaseVolunteerRecords = async (): Promise<VolunteerServiceRecord[] | null> => {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from('volunteer_services')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching volunteer records from Supabase:', error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    serviceType: row.service_type,
    incidentNumber: row.incident_number,
    vehicle: row.vehicle,
    location: row.location,
    notes: row.notes,
    createdAt: new Date(row.created_at).getTime(),
  }));
};

export const saveSupabaseVolunteerRecord = async (record: VolunteerServiceRecord): Promise<void> => {
  const client = getSupabase();
  if (!client) return;

  const { error } = await client.from('volunteer_services').upsert({
    id: record.id,
    date: record.date,
    start_time: record.startTime,
    end_time: record.endTime,
    duration_minutes: record.durationMinutes,
    service_type: record.serviceType,
    incident_number: record.incidentNumber,
    vehicle: record.vehicle,
    location: record.location,
    notes: record.notes,
    created_at: new Date(record.createdAt).toISOString(),
  });

  if (error) {
    console.error('Error saving volunteer record to Supabase:', error);
    throw error;
  }
};

export const deleteSupabaseVolunteerRecord = async (id: string): Promise<void> => {
  const client = getSupabase();
  if (!client) return;

  const { error } = await client.from('volunteer_services').delete().eq('id', id);
  if (error) {
    console.error('Error deleting volunteer record from Supabase:', error);
    throw error;
  }
};

// ==========================================
// INSTRUCTION RECORDS
// ==========================================

export const fetchSupabaseInstructionRecords = async (): Promise<InstructionRecord[] | null> => {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from('instruction_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching instruction records from Supabase:', error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    topic: row.topic,
    instructor: row.instructor,
    entity: row.entity,
    location: row.location,
    notes: row.notes,
    certificateRef: row.certificate_ref,
    createdAt: new Date(row.created_at).getTime(),
  }));
};

export const saveSupabaseInstructionRecord = async (record: InstructionRecord): Promise<void> => {
  const client = getSupabase();
  if (!client) return;

  const { error } = await client.from('instruction_records').upsert({
    id: record.id,
    date: record.date,
    start_time: record.startTime,
    end_time: record.endTime,
    duration_minutes: record.durationMinutes,
    topic: record.topic,
    instructor: record.instructor,
    entity: record.entity,
    location: record.location,
    notes: record.notes,
    certificate_ref: record.certificateRef,
    created_at: new Date(record.createdAt).toISOString(),
  });

  if (error) {
    console.error('Error saving instruction record to Supabase:', error);
    throw error;
  }
};

export const deleteSupabaseInstructionRecord = async (id: string): Promise<void> => {
  const client = getSupabase();
  if (!client) return;

  const { error } = await client.from('instruction_records').delete().eq('id', id);
  if (error) {
    console.error('Error deleting instruction record from Supabase:', error);
    throw error;
  }
};

// ==========================================
// GRATIFICATION RECORDS
// ==========================================

export const fetchSupabaseGratifications = async (): Promise<GratificationRecord[] | null> => {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from('gratification_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching gratifications from Supabase:', error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    date: row.date,
    type: row.type,
    amount: Number(row.amount),
    receiptNumber: row.receipt_number,
    paidStatus: row.paid_status,
    paymentDate: row.payment_date,
    notes: row.notes,
    serviceRefId: row.service_ref_id,
    createdAt: new Date(row.created_at).getTime(),
  }));
};

export const saveSupabaseGratification = async (record: GratificationRecord): Promise<void> => {
  const client = getSupabase();
  if (!client) return;

  const { error } = await client.from('gratification_records').upsert({
    id: record.id,
    date: record.date,
    type: record.type,
    amount: record.amount,
    receipt_number: record.receiptNumber,
    paid_status: record.paidStatus,
    payment_date: record.paymentDate,
    notes: record.notes,
    service_ref_id: record.serviceRefId,
    created_at: new Date(record.createdAt).toISOString(),
  });

  if (error) {
    console.error('Error saving gratification to Supabase:', error);
    throw error;
  }
};

export const deleteSupabaseGratification = async (id: string): Promise<void> => {
  const client = getSupabase();
  if (!client) return;

  const { error } = await client.from('gratification_records').delete().eq('id', id);
  if (error) {
    console.error('Error deleting gratification from Supabase:', error);
    throw error;
  }
};

// ==========================================
// CALENDAR TASKS
// ==========================================

export const fetchSupabaseCalendarTasks = async (): Promise<CalendarTask[] | null> => {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from('calendar_tasks')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching calendar tasks from Supabase:', error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    date: row.date,
    time: row.time,
    type: row.type,
    priority: row.priority,
    completed: row.completed,
    location: row.location,
    notes: row.notes,
    createdAt: new Date(row.created_at).getTime(),
  }));
};

export const saveSupabaseCalendarTask = async (task: CalendarTask): Promise<void> => {
  const client = getSupabase();
  if (!client) return;

  const { error } = await client.from('calendar_tasks').upsert({
    id: task.id,
    title: task.title,
    date: task.date,
    time: task.time,
    type: task.type,
    priority: task.priority,
    completed: task.completed,
    location: task.location,
    notes: task.notes,
    created_at: new Date(task.createdAt).toISOString(),
  });

  if (error) {
    console.error('Error saving calendar task to Supabase:', error);
    throw error;
  }
};

export const deleteSupabaseCalendarTask = async (id: string): Promise<void> => {
  const client = getSupabase();
  if (!client) return;

  const { error } = await client.from('calendar_tasks').delete().eq('id', id);
  if (error) {
    console.error('Error deleting calendar task from Supabase:', error);
    throw error;
  }
};

// ==========================================
// USER PROFILE
// ==========================================

export const fetchSupabaseUserProfile = async (): Promise<UserProfile | null> => {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from('user_profiles')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile from Supabase:', error);
    return null;
  }

  if (!data) return null;

  return {
    name: data.name,
    firefighterNumber: data.firefighter_number,
    corpsName: data.corps_name,
    rank: data.rank,
    monthlyTargetHours: data.monthly_target_hours,
    pinEnabled: data.pin_enabled,
    pinHash: data.pin_hash,
    theme: data.theme || 'dark',
    showReminder: data.show_reminder,
    gratificationRates: data.gratification_rates,
    autoEmailReportEnabled: data.auto_email_report_enabled,
    autoEmailAddress: data.auto_email_address,
    autoEmailTime: data.auto_email_time,
  };
};

export const saveSupabaseUserProfile = async (profile: UserProfile): Promise<void> => {
  const client = getSupabase();
  if (!client) return;

  const { error } = await client.from('user_profiles').upsert({
    id: 'primary_firefighter_profile',
    name: profile.name,
    firefighter_number: profile.firefighterNumber,
    corps_name: profile.corpsName,
    rank: profile.rank,
    monthly_target_hours: profile.monthlyTargetHours,
    pin_enabled: profile.pinEnabled,
    pin_hash: profile.pinHash,
    theme: profile.theme,
    show_reminder: profile.showReminder,
    gratification_rates: profile.gratificationRates,
    auto_email_report_enabled: profile.autoEmailReportEnabled,
    auto_email_address: profile.autoEmailAddress,
    auto_email_time: profile.autoEmailTime,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Error saving user profile to Supabase:', error);
    throw error;
  }
};

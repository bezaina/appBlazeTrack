import { Router, Request, Response } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const supabaseRouter = Router();

export const SUPABASE_PROJECT_ID = 'ildysfsxyxexqgwygqhm';
export const SUPABASE_PROJECT_NAME = "jagamaal@gmail.com's Project";
export const DEFAULT_SUPABASE_URL = process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const DEFAULT_SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_wNcML1d87K_A8r0nX5kw1Q_HZ8Aw_LL';

/**
 * Returns an instance of Supabase Client initialized on the Node.js server
 */
function getSupabaseClient(req: Request): SupabaseClient | null {
  const customUrl = req.headers['x-supabase-url'] as string | undefined;
  const customKey = req.headers['x-supabase-key'] as string | undefined;

  const url = (customUrl && customUrl !== '__disconnected__') ? customUrl : DEFAULT_SUPABASE_URL;
  const key = (customKey && customKey !== '__disconnected__') ? customKey : DEFAULT_SUPABASE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// 0. Test and status endpoint
supabaseRouter.get('/status', (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  res.json({
    configured: Boolean(client),
    projectId: SUPABASE_PROJECT_ID,
    projectName: SUPABASE_PROJECT_NAME,
    url: DEFAULT_SUPABASE_URL,
    timestamp: new Date().toISOString(),
  });
});

supabaseRouter.post('/test', async (req: Request, res: Response) => {
  const { url, key } = req.body;
  const targetUrl = url || DEFAULT_SUPABASE_URL;
  const targetKey = key || DEFAULT_SUPABASE_KEY;

  if (!targetUrl || !targetKey) {
    return res.status(400).json({
      success: false,
      message: 'URL ou Chave do Supabase em falta.',
    });
  }

  try {
    const client = createClient(targetUrl, targetKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Test a basic query on any table or schema check
    const { data, error } = await client
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet or other Postgres error, report informative message
      return res.json({
        success: true,
        message: `Conexão ao Supabase estabelecida! Nota: Tabela user_profiles (${error.message}).`,
        warning: error.message,
      });
    }

    return res.json({
      success: true,
      message: `Conexão ao projeto ${SUPABASE_PROJECT_NAME} validada com sucesso!`,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Falha ao conectar com o Supabase.',
    });
  }
});

// ==============================================================================
// 1. VOLUNTEER SERVICES
// ==============================================================================
supabaseRouter.get('/volunteer', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const { data, error } = await client
      .from('volunteer_services')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    const records = (data || []).map((row: any) => ({
      id: row.id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      durationMinutes: Number(row.duration_minutes),
      serviceType: row.service_type,
      incidentNumber: row.incident_number || undefined,
      vehicle: row.vehicle || undefined,
      location: row.location || undefined,
      notes: row.notes || undefined,
      createdAt: new Date(row.created_at).getTime(),
    }));

    res.json({ success: true, data: records });
  } catch (err: any) {
    console.error('[Supabase Server] Error fetching volunteer:', err);
    res.status(500).json({ success: false, error: err.message || 'Erro ao obter serviços de voluntariado' });
  }
});

supabaseRouter.post('/volunteer', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const record = req.body;
    const { error } = await client.from('volunteer_services').upsert({
      id: record.id,
      date: record.date,
      start_time: record.startTime,
      end_time: record.endTime,
      duration_minutes: record.durationMinutes,
      service_type: record.serviceType,
      incident_number: record.incidentNumber || null,
      vehicle: record.vehicle || null,
      location: record.location || null,
      notes: record.notes || null,
      created_at: record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    res.json({ success: true, message: 'Serviço guardado no Supabase' });
  } catch (err: any) {
    console.error('[Supabase Server] Error saving volunteer:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

supabaseRouter.post('/volunteer/bulk', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const records = req.body.records || req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    const rows = records.map((record: any) => ({
      id: record.id,
      date: record.date,
      start_time: record.startTime,
      end_time: record.endTime,
      duration_minutes: record.durationMinutes,
      service_type: record.serviceType,
      incident_number: record.incidentNumber || null,
      vehicle: record.vehicle || null,
      location: record.location || null,
      notes: record.notes || null,
      created_at: record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('volunteer_services').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    res.json({ success: true, count: rows.length });
  } catch (err: any) {
    console.error('[Supabase Server] Error bulk saving volunteer:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

supabaseRouter.delete('/volunteer/:id', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const { error } = await client.from('volunteer_services').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Serviço eliminado' });
  } catch (err: any) {
    console.error('[Supabase Server] Error deleting volunteer:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// 2. INSTRUCTION RECORDS
// ==============================================================================
supabaseRouter.get('/instruction', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const { data, error } = await client
      .from('instruction_records')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    const records = (data || []).map((row: any) => ({
      id: row.id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      durationMinutes: Number(row.duration_minutes),
      topic: row.topic,
      instructor: row.instructor || undefined,
      entity: row.entity || undefined,
      location: row.location || undefined,
      notes: row.notes || undefined,
      certificateRef: row.certificate_ref || undefined,
      createdAt: new Date(row.created_at).getTime(),
    }));

    res.json({ success: true, data: records });
  } catch (err: any) {
    console.error('[Supabase Server] Error fetching instruction:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

supabaseRouter.post('/instruction', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const record = req.body;
    const { error } = await client.from('instruction_records').upsert({
      id: record.id,
      date: record.date,
      start_time: record.startTime,
      end_time: record.endTime,
      duration_minutes: record.durationMinutes,
      topic: record.topic,
      instructor: record.instructor || null,
      entity: record.entity || null,
      location: record.location || null,
      notes: record.notes || null,
      certificate_ref: record.certificateRef || null,
      created_at: record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    res.json({ success: true, message: 'Instrução guardada' });
  } catch (err: any) {
    console.error('[Supabase Server] Error saving instruction:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

supabaseRouter.post('/instruction/bulk', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const records = req.body.records || req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    const rows = records.map((record: any) => ({
      id: record.id,
      date: record.date,
      start_time: record.startTime,
      end_time: record.endTime,
      duration_minutes: record.durationMinutes,
      topic: record.topic,
      instructor: record.instructor || null,
      entity: record.entity || null,
      location: record.location || null,
      notes: record.notes || null,
      certificate_ref: record.certificateRef || null,
      created_at: record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('instruction_records').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    res.json({ success: true, count: rows.length });
  } catch (err: any) {
    console.error('[Supabase Server] Error bulk saving instruction:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

supabaseRouter.delete('/instruction/:id', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const { error } = await client.from('instruction_records').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Instrução eliminada' });
  } catch (err: any) {
    console.error('[Supabase Server] Error deleting instruction:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// 3. GRATIFICATION RECORDS
// ==============================================================================
supabaseRouter.get('/gratification', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const { data, error } = await client
      .from('gratification_records')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    const records = (data || []).map((row: any) => ({
      id: row.id,
      date: row.date,
      type: row.type,
      amount: Number(row.amount),
      receiptNumber: row.receipt_number || undefined,
      paidStatus: row.paid_status,
      paymentDate: row.payment_date || undefined,
      notes: row.notes || undefined,
      serviceRefId: row.service_ref_id || undefined,
      createdAt: new Date(row.created_at).getTime(),
    }));

    res.json({ success: true, data: records });
  } catch (err: any) {
    console.error('[Supabase Server] Error fetching gratifications:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

supabaseRouter.post('/gratification', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const record = req.body;
    const { error } = await client.from('gratification_records').upsert({
      id: record.id,
      date: record.date,
      type: record.type,
      amount: record.amount,
      receipt_number: record.receiptNumber || null,
      paid_status: record.paidStatus,
      payment_date: record.paymentDate || null,
      notes: record.notes || null,
      service_ref_id: record.serviceRefId || null,
      created_at: record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    res.json({ success: true, message: 'Gratificação guardada' });
  } catch (err: any) {
    console.error('[Supabase Server] Error saving gratification:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

supabaseRouter.post('/gratification/bulk', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const records = req.body.records || req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    const rows = records.map((record: any) => ({
      id: record.id,
      date: record.date,
      type: record.type,
      amount: record.amount,
      receipt_number: record.receiptNumber || null,
      paid_status: record.paidStatus,
      payment_date: record.paymentDate || null,
      notes: record.notes || null,
      service_ref_id: record.serviceRefId || null,
      created_at: record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('gratification_records').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    res.json({ success: true, count: rows.length });
  } catch (err: any) {
    console.error('[Supabase Server] Error bulk saving gratifications:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

supabaseRouter.delete('/gratification/:id', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const { error } = await client.from('gratification_records').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Gratificação eliminada' });
  } catch (err: any) {
    console.error('[Supabase Server] Error deleting gratification:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// 4. CALENDAR TASKS
// ==============================================================================
supabaseRouter.get('/calendar', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const { data, error } = await client
      .from('calendar_tasks')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    const records = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      date: row.date,
      time: row.time || undefined,
      type: row.type,
      priority: row.priority,
      completed: Boolean(row.completed),
      location: row.location || undefined,
      notes: row.notes || undefined,
      createdAt: new Date(row.created_at).getTime(),
    }));

    res.json({ success: true, data: records });
  } catch (err: any) {
    console.error('[Supabase Server] Error fetching calendar tasks:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

supabaseRouter.post('/calendar', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const task = req.body;
    const { error } = await client.from('calendar_tasks').upsert({
      id: task.id,
      title: task.title,
      date: task.date,
      time: task.time || null,
      type: task.type,
      priority: task.priority,
      completed: task.completed,
      location: task.location || null,
      notes: task.notes || null,
      created_at: task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    res.json({ success: true, message: 'Tarefa de calendário guardada' });
  } catch (err: any) {
    console.error('[Supabase Server] Error saving calendar task:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

supabaseRouter.post('/calendar/bulk', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const tasks = req.body.tasks || req.body;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    const rows = tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      date: task.date,
      time: task.time || null,
      type: task.type,
      priority: task.priority,
      completed: task.completed,
      location: task.location || null,
      notes: task.notes || null,
      created_at: task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('calendar_tasks').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    res.json({ success: true, count: rows.length });
  } catch (err: any) {
    console.error('[Supabase Server] Error bulk saving calendar tasks:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

supabaseRouter.delete('/calendar/:id', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const { error } = await client.from('calendar_tasks').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Tarefa eliminada' });
  } catch (err: any) {
    console.error('[Supabase Server] Error deleting calendar task:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// 5. USER PROFILE
// ==============================================================================
supabaseRouter.get('/profile', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.json({ success: true, data: null });

    const profile = {
      accountId: data.account_id || undefined,
      name: data.name,
      firefighterNumber: data.firefighter_number,
      corpsName: data.corps_name,
      rank: data.rank,
      monthlyTargetHours: Number(data.monthly_target_hours) || 35,
      pinEnabled: Boolean(data.pin_enabled),
      pinHash: data.pin_hash || '',
      theme: data.theme || 'dark',
      showReminder: Boolean(data.show_reminder),
      gratificationRates: data.gratification_rates,
      autoEmailReportEnabled: Boolean(data.auto_email_report_enabled),
      autoEmailAddress: data.auto_email_address || '',
      autoEmailTime: data.auto_email_time || '20:00',
      autoEmailReportPeriod: 'monthly',
    };

    res.json({ success: true, data: profile });
  } catch (err: any) {
    console.error('[Supabase Server] Error fetching profile:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

supabaseRouter.post('/profile', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const profile = req.body;
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

    if (error) throw error;
    res.json({ success: true, message: 'Perfil guardado no Supabase' });
  } catch (err: any) {
    console.error('[Supabase Server] Error saving profile:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// 6. FIREFIGHTER ACCOUNTS
// ==============================================================================
supabaseRouter.get('/accounts', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const { data, error } = await client
      .from('firefighter_accounts')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const accounts = (data || []).map((row: any) => ({
      id: row.id,
      firefighterNumber: row.firefighter_number,
      username: row.username,
      name: row.name,
      corpsName: row.corps_name,
      rank: row.rank,
      pinCode: row.pin_code || '',
      password: row.password || '',
      email: row.email || '',
      monthlyTargetHours: Number(row.monthly_target_hours) || 35,
      avatarUrl: row.avatar_url || '',
      role: row.role || 'bombeiro',
      createdAt: row.created_at,
      lastLoginAt: row.updated_at,
    }));

    res.json({ success: true, data: accounts });
  } catch (err: any) {
    console.error('[Supabase Server] Error fetching accounts:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

supabaseRouter.post('/accounts', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const acc = req.body;
    const { error } = await client.from('firefighter_accounts').upsert({
      id: acc.id,
      firefighter_number: acc.firefighterNumber,
      username: acc.username,
      name: acc.name,
      corps_name: acc.corpsName,
      rank: acc.rank,
      pin_code: acc.pinCode || null,
      password: acc.password || null,
      email: acc.email || null,
      monthly_target_hours: acc.monthlyTargetHours,
      avatar_url: acc.avatarUrl || null,
      role: acc.role || 'bombeiro',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (error) throw error;
    res.json({ success: true, message: 'Conta guardada no Supabase' });
  } catch (err: any) {
    console.error('[Supabase Server] Error saving account:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

supabaseRouter.delete('/accounts/:id', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const { error } = await client.from('firefighter_accounts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Conta eliminada' });
  } catch (err: any) {
    console.error('[Supabase Server] Error deleting account:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

supabaseRouter.post('/accounts/bulk', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) return res.status(400).json({ success: false, error: 'Supabase não configurado' });

  try {
    const accounts = req.body.accounts || req.body;
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    const rows = accounts.map((acc: any) => ({
      id: acc.id,
      firefighter_number: acc.firefighterNumber,
      username: acc.username,
      name: acc.name,
      corps_name: acc.corpsName,
      rank: acc.rank,
      pin_code: acc.pinCode || null,
      password: acc.password || null,
      email: acc.email || null,
      monthly_target_hours: acc.monthlyTargetHours,
      avatar_url: acc.avatarUrl || null,
      role: acc.role,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('firefighter_accounts').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    res.json({ success: true, count: rows.length });
  } catch (err: any) {
    console.error('[Supabase Server] Error bulk saving accounts:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// 7. UNIFIED MASTER SYNC ALL DATA
// ==============================================================================
supabaseRouter.post('/sync', async (req: Request, res: Response) => {
  const client = getSupabaseClient(req);
  if (!client) {
    return res.status(400).json({
      success: false,
      message: 'Supabase não configurado.',
      syncedCounts: { volunteer: 0, instruction: 0, gratifications: 0, calendar: 0, profile: false, accounts: 0 }
    });
  }

  const { volunteerRecords = [], instructionRecords = [], gratificationRecords = [], calendarTasks = [], profile, accounts = [] } = req.body;

  try {
    // 1. Upload local data to Supabase
    const uploadPromises = [];

    if (volunteerRecords.length > 0) {
      const volRows = volunteerRecords.map((r: any) => ({
        id: r.id,
        date: r.date,
        start_time: r.startTime,
        end_time: r.endTime,
        duration_minutes: r.durationMinutes,
        service_type: r.serviceType,
        incident_number: r.incidentNumber || null,
        vehicle: r.vehicle || null,
        location: r.location || null,
        notes: r.notes || null,
        created_at: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      uploadPromises.push(client.from('volunteer_services').upsert(volRows, { onConflict: 'id' }));
    }

    if (instructionRecords.length > 0) {
      const instRows = instructionRecords.map((r: any) => ({
        id: r.id,
        date: r.date,
        start_time: r.startTime,
        end_time: r.endTime,
        duration_minutes: r.durationMinutes,
        topic: r.topic,
        instructor: r.instructor || null,
        entity: r.entity || null,
        location: r.location || null,
        notes: r.notes || null,
        certificate_ref: r.certificateRef || null,
        created_at: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      uploadPromises.push(client.from('instruction_records').upsert(instRows, { onConflict: 'id' }));
    }

    if (gratificationRecords.length > 0) {
      const gratRows = gratificationRecords.map((r: any) => ({
        id: r.id,
        date: r.date,
        type: r.type,
        amount: r.amount,
        receipt_number: r.receiptNumber || null,
        paid_status: r.paidStatus,
        payment_date: r.paymentDate || null,
        notes: r.notes || null,
        service_ref_id: r.serviceRefId || null,
        created_at: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      uploadPromises.push(client.from('gratification_records').upsert(gratRows, { onConflict: 'id' }));
    }

    if (calendarTasks.length > 0) {
      const taskRows = calendarTasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        date: t.date,
        time: t.time || null,
        type: t.type,
        priority: t.priority,
        completed: t.completed,
        location: t.location || null,
        notes: t.notes || null,
        created_at: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      uploadPromises.push(client.from('calendar_tasks').upsert(taskRows, { onConflict: 'id' }));
    }

    if (profile) {
      uploadPromises.push(client.from('user_profiles').upsert({
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
      }));
    }

    if (accounts.length > 0) {
      const accRows = accounts.map((acc: any) => ({
        id: acc.id,
        firefighter_number: acc.firefighterNumber,
        username: acc.username,
        name: acc.name,
        corps_name: acc.corpsName,
        rank: acc.rank,
        pin_code: acc.pinCode || null,
        password: acc.password || null,
        email: acc.email || null,
        monthly_target_hours: acc.monthlyTargetHours,
        avatar_url: acc.avatarUrl || null,
        role: acc.role,
        updated_at: new Date().toISOString(),
      }));
      uploadPromises.push(client.from('firefighter_accounts').upsert(accRows, { onConflict: 'id' }));
    }

    // Wait for uploads
    await Promise.allSettled(uploadPromises);

    // 2. Fetch fresh remote data
    const [volRes, instRes, gratRes, calRes, profRes, accRes] = await Promise.all([
      client.from('volunteer_services').select('*').order('date', { ascending: false }),
      client.from('instruction_records').select('*').order('date', { ascending: false }),
      client.from('gratification_records').select('*').order('date', { ascending: false }),
      client.from('calendar_tasks').select('*').order('date', { ascending: true }),
      client.from('user_profiles').select('*').limit(1).maybeSingle(),
      client.from('firefighter_accounts').select('*').order('created_at', { ascending: true }),
    ]);

    const remoteVolunteers = (volRes.data || []).map((row: any) => ({
      id: row.id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      durationMinutes: Number(row.duration_minutes),
      serviceType: row.service_type,
      incidentNumber: row.incident_number || undefined,
      vehicle: row.vehicle || undefined,
      location: row.location || undefined,
      notes: row.notes || undefined,
      createdAt: new Date(row.created_at).getTime(),
    }));

    const remoteInstructions = (instRes.data || []).map((row: any) => ({
      id: row.id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      durationMinutes: Number(row.duration_minutes),
      topic: row.topic,
      instructor: row.instructor || undefined,
      entity: row.entity || undefined,
      location: row.location || undefined,
      notes: row.notes || undefined,
      certificateRef: row.certificate_ref || undefined,
      createdAt: new Date(row.created_at).getTime(),
    }));

    const remoteGratifications = (gratRes.data || []).map((row: any) => ({
      id: row.id,
      date: row.date,
      type: row.type,
      amount: Number(row.amount),
      receiptNumber: row.receipt_number || undefined,
      paidStatus: row.paid_status,
      paymentDate: row.payment_date || undefined,
      notes: row.notes || undefined,
      serviceRefId: row.service_ref_id || undefined,
      createdAt: new Date(row.created_at).getTime(),
    }));

    const remoteCalendar = (calRes.data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      date: row.date,
      time: row.time || undefined,
      type: row.type,
      priority: row.priority,
      completed: Boolean(row.completed),
      location: row.location || undefined,
      notes: row.notes || undefined,
      createdAt: new Date(row.created_at).getTime(),
    }));

    const remoteProfile = profRes.data ? {
      accountId: profRes.data.account_id || undefined,
      name: profRes.data.name,
      firefighterNumber: profRes.data.firefighter_number,
      corpsName: profRes.data.corps_name,
      rank: profRes.data.rank,
      monthlyTargetHours: Number(profRes.data.monthly_target_hours) || 35,
      pinEnabled: Boolean(profRes.data.pin_enabled),
      pinHash: profRes.data.pin_hash || '',
      theme: profRes.data.theme || 'dark',
      showReminder: Boolean(profRes.data.show_reminder),
      gratificationRates: profRes.data.gratification_rates,
      autoEmailReportEnabled: Boolean(profRes.data.auto_email_report_enabled),
      autoEmailAddress: profRes.data.auto_email_address || '',
      autoEmailTime: profRes.data.auto_email_time || '20:00',
      autoEmailReportPeriod: 'monthly',
    } : null;

    const remoteAccounts = (accRes.data || []).map((row: any) => ({
      id: row.id,
      firefighterNumber: row.firefighter_number,
      username: row.username,
      name: row.name,
      corpsName: row.corps_name,
      rank: row.rank,
      pinCode: row.pin_code || '',
      password: row.password || '',
      email: row.email || '',
      monthlyTargetHours: Number(row.monthly_target_hours) || 35,
      avatarUrl: row.avatar_url || '',
      role: row.role || 'bombeiro',
      createdAt: row.created_at,
      lastLoginAt: row.updated_at,
    }));

    function mergeById<T extends { id: string }>(loc: T[], rem: T[]): T[] {
      const map = new Map<string, T>();
      for (const item of loc) map.set(item.id, item);
      for (const item of rem) map.set(item.id, item);
      return Array.from(map.values());
    }

    const mergedVolunteers = mergeById(volunteerRecords, remoteVolunteers);
    const mergedInstructions = mergeById(instructionRecords, remoteInstructions);
    const mergedGratifications = mergeById(gratificationRecords, remoteGratifications);
    const mergedCalendar = mergeById(calendarTasks, remoteCalendar);

    res.json({
      success: true,
      message: 'Sincronização com Supabase concluída com sucesso!',
      syncedCounts: {
        volunteer: mergedVolunteers.length,
        instruction: mergedInstructions.length,
        gratifications: mergedGratifications.length,
        calendar: mergedCalendar.length,
        profile: true,
        accounts: (remoteAccounts.length > 0 ? remoteAccounts : accounts).length,
      },
      remoteData: {
        volunteerRecords: mergedVolunteers,
        instructionRecords: mergedInstructions,
        gratificationRecords: mergedGratifications,
        calendarTasks: mergedCalendar,
        profile: remoteProfile || profile,
        accounts: remoteAccounts.length > 0 ? remoteAccounts : accounts,
      },
    });
  } catch (err: any) {
    console.error('[Supabase Server] Sync error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Erro durante sincronização com Supabase',
      syncedCounts: { volunteer: 0, instruction: 0, gratifications: 0, calendar: 0, profile: false, accounts: 0 }
    });
  }
});

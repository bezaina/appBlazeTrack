import { FirefighterAccount, UserProfile, GoogleUserAccount } from '../types';
import { getSupabase } from './supabase';
import { DEFAULT_GRATIFICATION_RATES } from '../utils/mockData';
import { signOutGoogle } from './googleAuth';

const ACCOUNTS_STORAGE_KEY = 'bv_firefighter_accounts_v2';
const ACTIVE_ACCOUNT_ID_KEY = 'bv_active_account_id_v2';

// Default initial pre-configured accounts
export const DEFAULT_ACCOUNTS: FirefighterAccount[] = [
  {
    id: 'bv-acc-1428',
    firefighterNumber: '1428',
    username: 'goncalo.silva',
    name: 'Gonçalo M. Silva',
    corpsName: 'Bombeiros Voluntários de Sintra',
    rank: 'Bombeiro de 2ª Classe',
    pinCode: '1428',
    password: 'password123',
    email: 'JAGAMAAL@gmail.com',
    monthlyTargetHours: 35,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    role: 'bombeiro',
    createdAt: '2026-01-15T08:00:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'bv-acc-2105',
    firefighterNumber: '2105',
    username: 'chefe.rodrigues',
    name: 'Carlos Rodrigues',
    corpsName: 'Bombeiros Voluntários de Lisboa',
    rank: 'Chefe de Serviço',
    pinCode: '2105',
    password: 'chefe2026',
    email: 'carlos.rodrigues@bv.pt',
    monthlyTargetHours: 40,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    role: 'graduado',
    createdAt: '2026-02-10T10:00:00Z',
    lastLoginAt: '2026-08-29T14:30:00Z',
  },
  {
    id: 'bv-acc-3310',
    firefighterNumber: '3310',
    username: 'ana.martins',
    name: 'Ana Filipa Martins',
    corpsName: 'Bombeiros Voluntários de Coimbra',
    rank: 'Bombeiro de 1ª Classe',
    pinCode: '3310',
    password: 'bombeira2026',
    email: 'ana.martins@bv.pt',
    monthlyTargetHours: 35,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    role: 'bombeiro',
    createdAt: '2026-03-01T09:00:00Z',
    lastLoginAt: '2026-08-28T18:00:00Z',
  }
];

/**
 * Loads all saved firefighter accounts from LocalStorage and synchronizes with Supabase
 */
export function getSavedAccounts(): FirefighterAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed: FirefighterAccount[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading saved accounts:', err);
  }
  // Initialize with defaults if empty
  saveAccounts(DEFAULT_ACCOUNTS);
  return DEFAULT_ACCOUNTS;
}

/**
 * Saves firefighter accounts to LocalStorage
 */
export function saveAccounts(accounts: FirefighterAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Error saving accounts:', err);
  }
}

/**
 * Checks if a user is currently authenticated
 */
export function isUserAuthenticated(): boolean {
  const activeId = localStorage.getItem(ACTIVE_ACCOUNT_ID_KEY);
  if (!activeId) return false;
  const accounts = getSavedAccounts();
  return accounts.some((a) => a.id === activeId);
}

/**
 * Returns the currently active account or null if logged out
 */
export function getActiveAccount(): FirefighterAccount | null {
  const accounts = getSavedAccounts();
  const activeId = localStorage.getItem(ACTIVE_ACCOUNT_ID_KEY);
  if (activeId) {
    const found = accounts.find((a) => a.id === activeId);
    if (found) return found;
  }
  return null;
}

/**
 * Sets the active account by ID
 */
export function setActiveAccountId(id: string): void {
  localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, id);
}

/**
 * Converts a FirefighterAccount into a UserProfile
 */
export function accountToProfile(account: FirefighterAccount, existingProfile?: UserProfile): UserProfile {
  return {
    ...existingProfile,
    accountId: account.id,
    username: account.username,
    name: account.name,
    firefighterNumber: account.firefighterNumber,
    corpsName: account.corpsName,
    rank: account.rank,
    monthlyTargetHours: account.monthlyTargetHours || 35,
    pinEnabled: Boolean(account.pinCode),
    pinHash: account.pinCode || '',
    theme: existingProfile?.theme || 'dark',
    showReminder: existingProfile?.showReminder ?? true,
    gratificationRates: existingProfile?.gratificationRates || DEFAULT_GRATIFICATION_RATES,
    autoEmailReportEnabled: Boolean(account.email),
    autoEmailAddress: account.email || existingProfile?.autoEmailAddress || '',
    autoEmailTime: existingProfile?.autoEmailTime || '20:00',
    autoEmailReportPeriod: existingProfile?.autoEmailReportPeriod || 'monthly',
    role: account.role || existingProfile?.role || 'bombeiro',
    googleUser: existingProfile?.googleUser || (account.id.startsWith('google-') || account.avatarUrl?.includes('googleusercontent') ? {
      id: account.id.replace('google-', ''),
      name: account.name,
      email: account.email || '',
      picture: account.avatarUrl,
      connectedAt: account.lastLoginAt || new Date().toISOString(),
      provider: 'google',
      emailVerified: true,
    } : null),
  };
}

/**
 * Authenticates directly with Email and Password using Supabase Auth
 * Falls back to local accounts if offline.
 */
export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<{ success: boolean; account?: FirefighterAccount; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanEmail) {
    return { success: false, error: 'Por favor introduza o seu endereço de email.' };
  }
  if (!cleanPassword) {
    return { success: false, error: 'Por favor introduza a sua palavra-passe.' };
  }

  const client = getSupabase();
  let supabaseAuthUser: any = null;

  // 1. Try Supabase Auth API
  if (client) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        console.warn('Supabase auth.signInWithPassword note:', error.message);
        // If error is invalid credentials from Supabase, pass the message if no local match
      } else if (data?.user) {
        supabaseAuthUser = data.user;
      }
    } catch (err: any) {
      console.warn('Supabase signIn error:', err);
    }
  }

  const accounts = getSavedAccounts();
  
  // Find local or cloud account
  let matched = accounts.find((a) => a.email?.toLowerCase() === cleanEmail);

  if (!matched && supabaseAuthUser) {
    const meta = supabaseAuthUser.user_metadata || {};
    matched = {
      id: supabaseAuthUser.id,
      firefighterNumber: meta.firefighter_number || cleanEmail.split('@')[0].replace(/[^0-9]/g, '') || '0000',
      username: meta.username || cleanEmail.split('@')[0],
      name: meta.name || cleanEmail.split('@')[0],
      corpsName: meta.corps_name || 'Bombeiros Voluntários',
      rank: meta.rank || 'Bombeiro de 3ª Classe',
      pinCode: meta.pin_code || '0000',
      password: cleanPassword,
      email: cleanEmail,
      monthlyTargetHours: meta.monthly_target_hours || 35,
      role: 'bombeiro',
      createdAt: supabaseAuthUser.created_at || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    saveAccounts([matched, ...accounts]);
  }

  if (matched) {
    // If local password exists and doesn't match and no supabase user was confirmed
    if (!supabaseAuthUser && matched.password && matched.password !== cleanPassword) {
      return { success: false, error: 'Palavra-passe incorreta.' };
    }

    matched.lastLoginAt = new Date().toISOString();
    matched.email = cleanEmail;
    matched.password = cleanPassword;
    saveAccounts(accounts);
    setActiveAccountId(matched.id);

    syncAccountToSupabase(matched).catch((err) => console.warn('Supabase sync skipped:', err));
    return { success: true, account: matched };
  }

  // 2. Query firefighter_accounts in DB if user existed without auth
  if (client) {
    try {
      const { data: dbAccount } = await client
        .from('firefighter_accounts')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (dbAccount && (dbAccount.password === cleanPassword || !dbAccount.password)) {
        const cloudAccount: FirefighterAccount = {
          id: dbAccount.id,
          firefighterNumber: dbAccount.firefighter_number || '0000',
          username: dbAccount.username || cleanEmail.split('@')[0],
          name: dbAccount.name || 'Bombeiro',
          corpsName: dbAccount.corps_name || 'Bombeiros Voluntários',
          rank: dbAccount.rank || 'Bombeiro de 3ª Classe',
          pinCode: dbAccount.pin_code || '0000',
          password: cleanPassword,
          email: cleanEmail,
          monthlyTargetHours: dbAccount.monthly_target_hours || 35,
          avatarUrl: dbAccount.avatar_url,
          role: dbAccount.role || 'bombeiro',
          createdAt: dbAccount.created_at || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        saveAccounts([cloudAccount, ...accounts.filter((a) => a.id !== cloudAccount.id)]);
        setActiveAccountId(cloudAccount.id);
        return { success: true, account: cloudAccount };
      }
    } catch (dbErr) {
      console.warn('DB search error:', dbErr);
    }
  }

  if (supabaseAuthUser) {
    // Registered in Supabase Auth, created on the fly
    const newAcc: FirefighterAccount = {
      id: supabaseAuthUser.id,
      firefighterNumber: '0000',
      username: cleanEmail.split('@')[0],
      name: cleanEmail.split('@')[0],
      corpsName: 'Bombeiros Voluntários',
      rank: 'Bombeiro de 3ª Classe',
      pinCode: '0000',
      password: cleanPassword,
      email: cleanEmail,
      monthlyTargetHours: 35,
      role: 'bombeiro',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    saveAccounts([newAcc, ...accounts]);
    setActiveAccountId(newAcc.id);
    return { success: true, account: newAcc };
  }

  return {
    success: false,
    error: 'Conta não encontrada ou credenciais inválidas. Verifique o email e palavra-passe ou registe-se.',
  };
}

/**
 * Registers with Email, Password and Name directly into Supabase Auth & Database
 */
export async function registerWithEmailPassword(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ success: boolean; account?: FirefighterAccount; error?: string }> {
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanPassword = data.password.trim();
  const cleanName = data.name?.trim() || cleanEmail.split('@')[0];

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Por favor introduza um endereço de email válido.' };
  }
  if (!cleanPassword || cleanPassword.length < 6) {
    return { success: false, error: 'A palavra-passe deve conter no mínimo 6 caracteres.' };
  }

  const accounts = getSavedAccounts();
  let supabaseAuthUserId: string | undefined = undefined;
  let supabaseAuthNote: string | undefined = undefined;

  // 1. Register directly in Supabase Auth (Authentication -> Users tab)
  const client = getSupabase();
  if (client) {
    try {
      const { data: authData, error: authError } = await client.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            name: cleanName,
            email: cleanEmail,
            role: 'bombeiro',
          },
        },
      });

      if (authError) {
        supabaseAuthNote = authError.message;
        console.warn('Supabase Auth error:', authError.message);
        // If already registered
        if (authError.message.toLowerCase().includes('already registered')) {
          return { success: false, error: 'Este email já se encontra registado. Por favor inicie sessão.' };
        }
      } else if (authData?.user) {
        supabaseAuthUserId = authData.user.id;
      }
    } catch (authErr: any) {
      supabaseAuthNote = authErr?.message;
      console.warn('Supabase Auth error:', authErr);
    }
  }

  const generatedId = supabaseAuthUserId || `bv-acc-${Date.now()}`;
  const newAccount: FirefighterAccount = {
    id: generatedId,
    firefighterNumber: '0000',
    username: cleanEmail.split('@')[0],
    name: cleanName,
    corpsName: 'Bombeiros Voluntários',
    rank: 'Bombeiro de 3ª Classe',
    pinCode: '0000',
    password: cleanPassword,
    email: cleanEmail,
    monthlyTargetHours: 35,
    role: 'bombeiro',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  const updated = [newAccount, ...accounts.filter((a) => a.email?.toLowerCase() !== cleanEmail)];
  saveAccounts(updated);
  setActiveAccountId(newAccount.id);

  // Sync with DB
  syncAccountToSupabase(newAccount).catch((err) => console.warn('Supabase sync warning:', err));

  return {
    success: true,
    account: newAccount,
    error: supabaseAuthNote && !supabaseAuthUserId ? `Aviso: ${supabaseAuthNote}` : undefined,
  };
}

/**
 * Synchronizes an account record into Supabase PostgreSQL
 */
export async function syncAccountToSupabase(account: FirefighterAccount): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  try {
    // Upsert into firefighter_accounts
    await client.from('firefighter_accounts').upsert({
      id: account.id,
      firefighter_number: account.firefighterNumber,
      username: account.username,
      name: account.name,
      corps_name: account.corpsName,
      rank: account.rank,
      pin_code: account.pinCode,
      password: account.password,
      email: account.email,
      monthly_target_hours: account.monthlyTargetHours,
      avatar_url: account.avatarUrl,
      role: account.role || 'bombeiro',
      updated_at: new Date().toISOString(),
    });

    // Also upsert primary user profile
    await client.from('user_profiles').upsert({
      id: account.id,
      account_id: account.id,
      name: account.name,
      firefighter_number: account.firefighterNumber,
      corps_name: account.corpsName,
      rank: account.rank,
      monthly_target_hours: account.monthlyTargetHours,
      pin_enabled: Boolean(account.pinCode),
      pin_hash: account.pinCode,
      theme: 'dark',
      show_reminder: true,
      auto_email_report_enabled: Boolean(account.email),
      auto_email_address: account.email,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error uploading account to Supabase:', err);
  }
}

/**
 * Removes an account from local storage and deletes it from Supabase cloud database
 */
export async function deleteFirefighterAccount(accountId: string): Promise<{ success: boolean; error?: string; remainingAccounts: FirefighterAccount[] }> {
  const accounts = getSavedAccounts().filter((a) => a.id !== accountId);
  saveAccounts(accounts);

  const activeId = localStorage.getItem(ACTIVE_ACCOUNT_ID_KEY);
  if (activeId === accountId) {
    if (accounts.length > 0) {
      setActiveAccountId(accounts[0].id);
    } else {
      localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
    }
  }

  // Delete from Supabase if connected
  const client = getSupabase();
  if (client) {
    try {
      await client.from('firefighter_accounts').delete().eq('id', accountId);
      await client.from('user_profiles').delete().eq('id', accountId);
    } catch (err: any) {
      console.warn('Could not delete remote account from Supabase:', err);
    }
  }

  return { success: true, remainingAccounts: accounts };
}

/**
 * Logs out the current firefighter account session
 */
export async function logoutFirefighter(): Promise<void> {
  localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
  const client = getSupabase();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (err) {
      console.warn('Supabase auth signOut error:', err);
    }
  }
  try {
    await signOutGoogle();
  } catch (err) {
    console.warn('Google signOut error:', err);
  }
}

/**
 * Authenticates or creates an account using a Google account
 */
export async function loginWithGoogle(
  googleAccount: GoogleUserAccount
): Promise<{ success: boolean; account: FirefighterAccount }> {
  const accounts = getSavedAccounts();
  const cleanEmail = googleAccount.email.trim().toLowerCase();
  
  let matched = accounts.find(
    (a) => a.email?.toLowerCase() === cleanEmail || a.id === `google-${googleAccount.id}` || a.id === googleAccount.id
  );

  if (matched) {
    matched.name = googleAccount.name || matched.name;
    matched.avatarUrl = googleAccount.picture || matched.avatarUrl;
    matched.lastLoginAt = new Date().toISOString();
    saveAccounts(accounts);
    setActiveAccountId(matched.id);
    syncAccountToSupabase(matched).catch((err) => console.warn('Supabase sync skipped:', err));
    return { success: true, account: matched };
  }

  const generatedNum = cleanEmail.split('@')[0].replace(/[^0-9]/g, '') || '0000';
  const newAccount: FirefighterAccount = {
    id: `google-${googleAccount.id}`,
    firefighterNumber: generatedNum,
    username: cleanEmail.split('@')[0],
    name: googleAccount.name || cleanEmail.split('@')[0],
    corpsName: 'Bombeiros Voluntários',
    rank: 'Bombeiro de 3ª Classe',
    pinCode: '0000',
    password: '',
    email: cleanEmail,
    monthlyTargetHours: 35,
    avatarUrl: googleAccount.picture,
    role: 'bombeiro',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  const updated = [newAccount, ...accounts];
  saveAccounts(updated);
  setActiveAccountId(newAccount.id);
  syncAccountToSupabase(newAccount).catch((err) => console.warn('Supabase sync skipped:', err));
  return { success: true, account: newAccount };
}

/**
 * Creates a blank/guest profile when logged out
 */
export function createGuestProfile(): UserProfile {
  return {
    accountId: undefined,
    name: 'Bombeiro Visitante',
    firefighterNumber: '0000',
    corpsName: 'Bombeiros Voluntários',
    rank: 'Estagiário / Cadete',
    monthlyTargetHours: 35,
    pinEnabled: false,
    pinHash: '',
    theme: 'dark',
    showReminder: true,
    gratificationRates: DEFAULT_GRATIFICATION_RATES,
    autoEmailReportEnabled: false,
    autoEmailAddress: '',
    autoEmailTime: '20:00',
    googleUser: null,
  };
}

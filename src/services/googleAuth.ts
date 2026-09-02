import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { GoogleUserAccount } from '../types';

declare global {
  interface Window {
    google?: any;
  }
}

// Configured Google OAuth Client ID from user / environment
export const GOOGLE_CLIENT_ID = 
  import.meta.env.VITE_GOOGLE_CLIENT_ID || 
  '504085964366-4pglboj95q9gvl0r9nd1t2hsi0rmf1j5.apps.googleusercontent.com';

// Initialize Firebase App singleton safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Scopes for Google Profile, Google Calendar, and native Gmail API sending
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send',
];

const provider = new GoogleAuthProvider();
GOOGLE_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory and localStorage access token cache for resilience
const GOOGLE_TOKEN_STORAGE_KEY = 'bv_google_access_token_v1';
let cachedAccessToken: string | null = (() => {
  try {
    return localStorage.getItem(GOOGLE_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
})();
let isSigningIn = false;

/**
 * Initializes the auth state listener on app load.
 */
export const initGoogleAuth = (
  onAuthSuccess?: (user: GoogleUserAccount, accessToken: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const account: GoogleUserAccount = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Utilizador Google',
        email: user.email || '',
        picture: user.photoURL || undefined,
        connectedAt: new Date().toISOString(),
        provider: 'google',
        emailVerified: user.emailVerified,
      };

      const token = cachedAccessToken || '';
      if (onAuthSuccess) onAuthSuccess(account, token);
    } else {
      cachedAccessToken = null;
      try {
        localStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY);
      } catch {}
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Performs Google Sign-In with popup using Google Identity Services (GSI) Token Client
 * with seamless fallback to Firebase Auth & GoogleAuthProvider
 */
export const signInWithGoogleAccount = async (): Promise<{
  account: GoogleUserAccount;
  accessToken: string;
}> => {
  if (isSigningIn) {
    throw new Error('Já existe um processo de autenticação Google a decorrer.');
  }

  isSigningIn = true;

  try {
    // 1. Try Google Identity Services (GSI) Token Client with the specific Client ID
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const tokenResult = await new Promise<{ accessToken: string }>((resolve, reject) => {
          try {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: GOOGLE_CLIENT_ID,
              scope: GOOGLE_SCOPES.join(' '),
              prompt: 'select_account',
              callback: (response: any) => {
                if (response.error) {
                  reject(new Error(response.error_description || response.error || 'Erro na autenticação Google.'));
                } else if (response.access_token) {
                  resolve({ accessToken: response.access_token });
                } else {
                  reject(new Error('Token de acesso Google não recebido.'));
                }
              },
              error_callback: (err: any) => {
                reject(new Error(err?.message || 'A janela de autenticação Google foi cancelada.'));
              },
            });

            tokenClient.requestAccessToken({ prompt: 'select_account' });
          } catch (initErr) {
            reject(initErr);
          }
        });

        const token = tokenResult.accessToken;
        cachedAccessToken = token;
        try {
          localStorage.setItem(GOOGLE_TOKEN_STORAGE_KEY, token);
        } catch {}

        // Fetch user profile from Google UserInfo endpoint with the access token
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (userInfoRes.ok) {
          const userData = await userInfoRes.json();
          const account: GoogleUserAccount = {
            id: userData.sub || userData.id || `google_${Date.now()}`,
            name: userData.name || userData.email?.split('@')[0] || 'Utilizador Google',
            email: userData.email || '',
            picture: userData.picture || undefined,
            connectedAt: new Date().toISOString(),
            provider: 'google',
            emailVerified: userData.email_verified,
          };

          return { account, accessToken: token };
        }
      } catch (gsiErr: any) {
        console.warn('GSI Token Client warning, falling back to Firebase Auth:', gsiErr?.message || gsiErr);
      }
    }

    // 2. Fallback: Firebase Auth with GoogleAuthProvider
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    const token = credential?.accessToken || '';
    if (token) {
      cachedAccessToken = token;
      try {
        localStorage.setItem(GOOGLE_TOKEN_STORAGE_KEY, token);
      } catch {}
    }

    const user = result.user;
    const account: GoogleUserAccount = {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Utilizador Google',
      email: user.email || '',
      picture: user.photoURL || undefined,
      connectedAt: new Date().toISOString(),
      provider: 'google',
      emailVerified: user.emailVerified,
    };

    return { account, accessToken: token };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Gets the current cached access token
 */
export const getGoogleAccessToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const saved = localStorage.getItem(GOOGLE_TOKEN_STORAGE_KEY);
    if (saved) {
      cachedAccessToken = saved;
      return saved;
    }
  } catch {}
  return null;
};

/**
 * Sets or updates the Google Access Token in cache
 */
export const setGoogleAccessToken = (token: string | null): void => {
  cachedAccessToken = token;
  try {
    if (token) {
      localStorage.setItem(GOOGLE_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY);
    }
  } catch {}
};

/**
 * Safe UTF-8 to Base64 encoder that handles non-ASCII characters without deprecated unescape()
 */
export function utf8ToBase64(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch {
    return btoa(unescape(encodeURIComponent(str)));
  }
}

/**
 * Sends an email natively through Google's official Gmail API using the authenticated user's access token
 */
export const sendNativeGmailEmail = async ({
  to,
  subject,
  html,
  text,
  attachments,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{ filename: string; content: string; contentType?: string }>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  let token = getGoogleAccessToken();
  
  if (!token) {
    // If token not in memory, try re-prompting/re-authenticating seamlessly or request login
    throw new Error('Necessita de iniciar sessão com a sua Conta Google para enviar emails através da API Gmail.');
  }

  // Construct MIME multipart message compliant with RFC 2822
  const boundary = `====BlazeTrack_${Date.now()}_${Math.random().toString(36).substring(2)}====`;
  const cleanTo = to.trim();
  const cleanSubject = `=?UTF-8?B?${utf8ToBase64(subject)}?=`;

  let emailLines: string[] = [
    `To: ${cleanTo}`,
    `Subject: ${cleanSubject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: multipart/alternative; boundary="alt_' + boundary + '"',
    '',
    `--alt_${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    utf8ToBase64(text || ''),
    '',
    `--alt_${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    utf8ToBase64(html || `<p>${text || ''}</p>`),
    '',
    `--alt_${boundary}--`,
  ];

  // Add Attachments (e.g. PDF reports)
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      const mimeType = att.contentType || 'application/octet-stream';
      // content can be base64 or raw
      let base64Data = att.content;
      if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
      }
      emailLines.push(
        `--${boundary}`,
        `Content-Type: ${mimeType}; name="${att.filename}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${att.filename}"`,
        '',
        base64Data,
        ''
      );
    }
  }

  emailLines.push(`--${boundary}--`);

  const rawMime = emailLines.join('\r\n');
  // Web-safe base64 encoding (replace + with -, / with _, remove trailing =)
  const rawBase64Url = utf8ToBase64(rawMime)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawBase64Url,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errMessage = errorData.error?.message || `Erro da API Gmail (Código HTTP: ${response.status})`;
    throw new Error(errMessage);
  }

  const result = await response.json();
  return {
    success: true,
    messageId: result.id,
  };
};

/**
 * Signs out of the Google session
 */
export const signOutGoogle = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn('Error signing out of Firebase Auth:', err);
  } finally {
    cachedAccessToken = null;
  }
};

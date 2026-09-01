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

// Initialize Firebase App singleton safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Scopes for Google Profile and Google Calendar
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar',
];

const provider = new GoogleAuthProvider();
GOOGLE_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory access token cache
let cachedAccessToken: string | null = null;
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

      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(account, cachedAccessToken);
      } else if (!isSigningIn) {
        // Firebase retains the user session across reloads
        if (onAuthSuccess) onAuthSuccess(account, '');
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Performs real Google Sign-In with popup using Firebase Auth & GoogleAuthProvider
 */
export const signInWithGoogleAccount = async (): Promise<{
  account: GoogleUserAccount;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    const token = credential?.accessToken || '';
    if (token) {
      cachedAccessToken = token;
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
 * Gets the current cached access token (in memory)
 */
export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
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

/**
 * Biometric authentication service using WebAuthn / PublicKeyCredential
 */

const BIOMETRIC_CREDENTIAL_KEY = 'bv_biometric_credential_id';

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return false;
    }
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (e) {
    return false;
  }
}

export async function registerBiometric(username: string): Promise<{ success: boolean; message?: string }> {
  try {
    if (!window.PublicKeyCredential) {
      return { success: false, message: 'Biometria não suportada neste dispositivo.' };
    }

    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) {
      return { success: false, message: 'Sensor de impressão digital / Face ID não disponível.' };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Blazetrack BV',
          id: window.location.hostname === 'localhost' ? 'localhost' : undefined,
        },
        user: {
          id: userId,
          name: username || 'bombeiro',
          displayName: username || 'Bombeiro Voluntário',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (credential && credential.id) {
      localStorage.setItem(BIOMETRIC_CREDENTIAL_KEY, credential.id);
      return { success: true };
    }

    return { success: false, message: 'Registo biométrico não concluído.' };
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      return { success: false, message: 'Autorização biométrica cancelada pelo utilizador.' };
    }
    return { success: false, message: err.message || 'Erro ao configurar biometria.' };
  }
}

export async function authenticateWithBiometrics(username?: string): Promise<{ success: boolean; message?: string }> {
  try {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return { 
        success: false, 
        message: 'Autenticação biométrica não suportada neste navegador. Utilize o seu PIN.' 
      };
    }

    const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!isAvailable) {
      return { 
        success: false, 
        message: 'Nenhum sensor biométrico (Touch ID / Face ID) detetado no dispositivo. Introduza o PIN.' 
      };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // Prompt the system biometric modal (Touch ID / Face ID / Windows Hello / Android Biometric)
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        rpId: window.location.hostname === 'localhost' ? 'localhost' : undefined,
      },
    });

    if (credential) {
      return { success: true };
    }

    return { success: false, message: 'Leitura biométrica inválida. Introduza o PIN.' };
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      return { 
        success: false, 
        message: 'Autenticação biométrica cancelada ou recusada. Por favor, digite o seu código PIN.' 
      };
    }
    if (err.name === 'InvalidStateError' || err.name === 'NotSupportedError') {
      return { 
        success: false, 
        message: 'Sensor biométrico não configurado no sistema operativo. Utilize o seu PIN.' 
      };
    }
    return { 
      success: false, 
      message: 'Não foi possível validar a biometria. Introduza o PIN de segurança.' 
    };
  }
}

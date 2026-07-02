import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const isDev = process.env['NODE_ENV'] !== 'production';

if (isDev) {
  process.env['FIREBASE_AUTH_EMULATOR_HOST'] = 'localhost:9099';
}

if (getApps().length === 0) {
  if (isDev) {
    initializeApp({ projectId: 'activeimob-74a7d' });
  } else {
    const serviceAccount = JSON.parse(
      process.env['FIREBASE_SERVICE_ACCOUNT_KEY'] as string,
    );
    initializeApp({ credential: cert(serviceAccount) });
  }
}

export const adminAuth = getAuth();

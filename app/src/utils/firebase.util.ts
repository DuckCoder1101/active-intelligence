import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyAmG--Jvn34KG2r0utbfKB52Il0NmMU0wU',
  authDomain: 'activeimob-74a7d.firebaseapp.com',
  projectId: 'activeimob-74a7d',
  storageBucket: 'activeimob-74a7d.firebasestorage.app',
  messagingSenderId: '608016838706',
  appId: '1:608016838706:web:9b042877def62028fe8c2b',
  measurementId: 'G-8XRF1FJCFK',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

if (import.meta.env['VITE_IS_DEV']) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

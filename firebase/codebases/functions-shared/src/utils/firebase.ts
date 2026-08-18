import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

if (getApps().length === 0) {
  initializeApp({
    storageBucket: "activeimob-74a7d.firebasestorage.app",
  });
}

export const auth = getAuth();
export const database = getFirestore();
export const bucket = getStorage().bucket();

database.settings({ ignoreUndefinedProperties: true });

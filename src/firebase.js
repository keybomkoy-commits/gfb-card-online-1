import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ============================================================================
// GFB CARD ONLINE - FIREBASE CONFIGURATION GUIDE
// ============================================================================
// วิธีการใส่คีย์ Firebase (เลือกทำได้ 2 วิธี):
//
// วิธีที่ 1: กรอกในไฟล์นี้โดยตรง (ง่ายที่สุดสำหรับรันภายในเครื่องตัวเอง)
// - แทนที่ค่าเริ่มต้นทางด้านขวามือของเครื่องหมาย || ด้วยคีย์จริงของคุณ เช่น "AIzaSyA..."
//
// วิธีที่ 2: กรอกผ่าน Environment Variables บน Vercel (แนะนำสำหรับอัปขึ้น GitHub/Vercel ป้องกันรหัสหลุด)
// - ไปที่ตั้งค่าของโปรเจกต์บน Vercel -> แท็บ "Environment Variables"
//   แล้วเพิ่มตัวแปร (Key) ชื่อด้านล่างนี้ลงไปพร้อมกรอกคีย์จริงในช่อง Value:
//   - VITE_FIREBASE_API_KEY
//   - VITE_FIREBASE_AUTH_DOMAIN
//   - VITE_FIREBASE_PROJECT_ID
//   - VITE_FIREBASE_STORAGE_BUCKET
//   - VITE_FIREBASE_MESSAGING_SENDER_ID
//   - VITE_FIREBASE_APP_ID
// ============================================================================

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyByN88MeX2yk64jHZt_D5wixNm-GXBKSwM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gfb-card-online-1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gfb-card-online-1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gfb-card-online-1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "209007009808",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:209007009808:web:671799f765b529d4586a95"
};

// Check if credentials are still placeholder templates
export const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";

let app;
let db;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (err) {
    console.error("Firebase initialization failed", err);
  }
}

export { db };
